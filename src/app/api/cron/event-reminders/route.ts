import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { notifyEventReminder } from "@/lib/push"
import { sendEmail, generateEventReminderEmailHtml } from "@/lib/email"

// This endpoint should be called by a cron job every hour
// It sends reminders for events starting in 1 hour and 24 hours

export async function GET(req: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()

  // Find events starting in approximately 1 hour (55-65 minutes window)
  const oneHourEvents = await prisma.event.findMany({
    where: {
      startsAt: {
        gte: new Date(now.getTime() + 55 * 60 * 1000),
        lte: new Date(now.getTime() + 65 * 60 * 1000),
      },
      status: "PUBLISHED",
    },
    include: {
      organizer: {
        include: { user: true },
      },
    },
  })

  // Find events starting in approximately 24 hours (23.5-24.5 hours window)
  const twentyFourHourEvents = await prisma.event.findMany({
    where: {
      startsAt: {
        gte: new Date(now.getTime() + 23.5 * 60 * 60 * 1000),
        lte: new Date(now.getTime() + 24.5 * 60 * 60 * 1000),
      },
      status: "PUBLISHED",
    },
    include: {
      organizer: {
        include: { user: true },
      },
    },
  })

  const results = {
    oneHour: { sent: 0, failed: 0 },
    twentyFourHour: { sent: 0, failed: 0 },
  }

  // Send 1-hour reminders
  for (const event of oneHourEvents) {
    try {
      const prefs = await prisma.notificationPreference.findUnique({
        where: { userId: event.organizerId },
      })

      // Send push notification
      if (!prefs || prefs.pushEventReminders) {
        await notifyEventReminder(event.organizerId, event.title, 1)
      }

      // Send email notification
      if (!prefs || prefs.emailEventReminders) {
        const emailHtml = generateEventReminderEmailHtml({
          eventTitle: event.title,
          hoursUntilStart: 1,
          eventDate: event.startsAt.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          }),
          venueName: event.venueName,
        })

        await sendEmail({
          to: event.organizer.user.email,
          subject: `⏰ ${event.title} starts in 1 hour!`,
          html: emailHtml,
        })
      }

      results.oneHour.sent++
    } catch (error) {
      console.error(`Failed to send 1-hour reminder for event ${event.id}:`, error)
      results.oneHour.failed++
    }
  }

  // Send 24-hour reminders
  for (const event of twentyFourHourEvents) {
    try {
      const prefs = await prisma.notificationPreference.findUnique({
        where: { userId: event.organizerId },
      })

      // Send push notification
      if (!prefs || prefs.pushEventReminders) {
        await notifyEventReminder(event.organizerId, event.title, 24)
      }

      // Send email notification
      if (!prefs || prefs.emailEventReminders) {
        const emailHtml = generateEventReminderEmailHtml({
          eventTitle: event.title,
          hoursUntilStart: 24,
          eventDate: event.startsAt.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          }),
          venueName: event.venueName,
        })

        await sendEmail({
          to: event.organizer.user.email,
          subject: `📅 ${event.title} is tomorrow!`,
          html: emailHtml,
        })
      }

      results.twentyFourHour.sent++
    } catch (error) {
      console.error(`Failed to send 24-hour reminder for event ${event.id}:`, error)
      results.twentyFourHour.failed++
    }
  }

  return NextResponse.json({
    success: true,
    timestamp: now.toISOString(),
    results,
  })
}
