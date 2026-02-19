import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Resend } from "resend"
import { verifyTurnstileToken } from "@/components/Turnstile"
import { escapeHtml, safeColor } from "@/lib/security"
import { checkRsvpRateLimit } from "@/lib/rate-limit"

// Lazy initialization to avoid build-time errors when RESEND_API_KEY is not set
let resend: Resend | null = null
function getResendClient(): Resend {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY || '')
  }
  return resend
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params

    // Rate limit by IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown"
    if (!checkRsvpRateLimit(ip)) {
      return NextResponse.json(
        { message: "Too many requests. Please try again later." },
        { status: 429 }
      )
    }

    const { name, email, phone, plusOnes, message, turnstileToken } = await req.json()

    // Require and verify Turnstile token
    if (!turnstileToken) {
      return NextResponse.json(
        { message: "Verification required. Please complete the challenge." },
        { status: 400 }
      )
    }

    const isHuman = await verifyTurnstileToken(turnstileToken)
    if (!isHuman) {
      return NextResponse.json(
        { message: "Verification failed. Please try again." },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { message: "Name and email are required" },
        { status: 400 }
      )
    }

    // Get event with RSVP settings
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organizer: {
          select: {
            displayName: true,
          },
        },
      },
    })

    if (!event) {
      return NextResponse.json(
        { message: "Event not found" },
        { status: 404 }
      )
    }

    if (!event.isRsvpOnly) {
      return NextResponse.json(
        { message: "This event does not accept RSVPs" },
        { status: 400 }
      )
    }

    if (!event.isPublished) {
      return NextResponse.json(
        { message: "Event is not published" },
        { status: 400 }
      )
    }

    // Validate plus ones
    const requestedPlusOnes = plusOnes || 0
    if (requestedPlusOnes > 0 && !event.rsvpAllowPlusOnes) {
      return NextResponse.json(
        { message: "Plus ones are not allowed for this event" },
        { status: 400 }
      )
    }

    if (requestedPlusOnes > event.rsvpMaxPlusOnes) {
      return NextResponse.json(
        { message: `Maximum ${event.rsvpMaxPlusOnes} plus ones allowed` },
        { status: 400 }
      )
    }

    // Check capacity
    const totalGuests = 1 + requestedPlusOnes
    if (event.rsvpCapacity !== null) {
      const currentCount = event.rsvpCount
      if (currentCount + totalGuests > event.rsvpCapacity) {
        return NextResponse.json(
          { message: "Event is at capacity" },
          { status: 400 }
        )
      }
    }

    // Check for existing RSVP
    const existingRsvp = await prisma.rsvp.findUnique({
      where: {
        eventId_email: {
          eventId,
          email: email.toLowerCase(),
        },
      },
    })

    if (existingRsvp) {
      return NextResponse.json(
        { message: "You have already RSVPd to this event" },
        { status: 400 }
      )
    }

    // Create RSVP and update count in a transaction
    const rsvp = await prisma.$transaction(async (tx) => {
      const newRsvp = await tx.rsvp.create({
        data: {
          eventId,
          name,
          email: email.toLowerCase(),
          phone: phone || null,
          plusOnes: requestedPlusOnes,
          message: message || null,
          status: "CONFIRMED",
        },
      })

      // Update RSVP count
      await tx.event.update({
        where: { id: eventId },
        data: {
          rsvpCount: {
            increment: totalGuests,
          },
        },
      })

      return newRsvp
    })

    // Send confirmation email (non-blocking)
    const eventDate = new Date(event.startsAt)
    const dateStr = eventDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
    const timeStr = eventDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })

    // Escape all user-supplied content for email
    const safeTitle = escapeHtml(event.title)
    const safeVenue = escapeHtml(event.venueName)
    const safeCity = escapeHtml(event.city)
    const safeOrgName = escapeHtml(event.organizer.displayName)
    // Validate accent color - only allow valid hex colors
    const accentColor = safeColor(event.accentColor) || '#ff1493'

    getResendClient().emails.send({
      from: "Afters <noreply@afters.am>",
      to: email,
      subject: `RSVP Confirmed: ${safeTitle}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 40px;">
          <h1 style="font-size: 24px; margin-bottom: 8px;">You're on the list!</h1>
          <p style="color: #888; margin-bottom: 32px;">Your RSVP for ${safeTitle} has been confirmed.</p>

          <div style="background: #111; padding: 24px; border-left: 3px solid ${accentColor};">
            <h2 style="font-size: 20px; margin: 0 0 16px 0;">${safeTitle}</h2>
            <p style="color: #888; margin: 0 0 8px 0;">${escapeHtml(dateStr)} at ${escapeHtml(timeStr)}</p>
            <p style="color: #888; margin: 0;">${safeVenue}, ${safeCity}</p>
          </div>

          <div style="margin-top: 24px; padding: 16px; background: #111;">
            <p style="color: #888; margin: 0;">Guests: <strong style="color: #fff;">${totalGuests}</strong></p>
          </div>

          <p style="color: #666; margin-top: 32px; font-size: 12px;">
            Presented by ${safeOrgName} &bull; Powered by Afters
          </p>
        </div>
      `,
    }).catch(console.error)

    return NextResponse.json({
      id: rsvp.id,
      message: "RSVP confirmed",
    })
  } catch (error) {
    console.error("RSVP error:", error)
    return NextResponse.json(
      { message: "Failed to process RSVP" },
      { status: 500 }
    )
  }
}
