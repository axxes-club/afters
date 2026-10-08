import { getUserId } from "@/lib/auth/session"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Default notification preferences
const defaultPreferences = {
  emailTicketSales: true,
  emailEventReminders: true,
  emailCheckInSummaries: false,
  emailProductUpdates: false,
  pushTicketSales: true,
  pushEventReminders: true,
  pushCheckInSummaries: false,
  pushProductUpdates: false,
}

export async function GET() {
  try {
    const userId = await getUserId()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find or create notification preferences
    let preferences = await prisma.notificationPreference.findUnique({
      where: { userId },
    })

    if (!preferences) {
      // Create default preferences
      preferences = await prisma.notificationPreference.create({
        data: {
          userId,
          ...defaultPreferences,
        },
      })
    }

    // Check if user has any push subscriptions
    const pushSubscriptionCount = await prisma.pushSubscription.count({
      where: { userId },
    })

    return NextResponse.json({
      ...preferences,
      hasPushSubscription: pushSubscriptionCount > 0,
    })
  } catch (error) {
    console.error("Error fetching notification preferences:", error)
    return NextResponse.json(
      { error: "Failed to fetch notification preferences" },
      { status: 500 }
    )
  }
}

export async function PUT(req: Request) {
  try {
    const userId = await getUserId()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      emailTicketSales,
      emailEventReminders,
      emailCheckInSummaries,
      emailProductUpdates,
      pushTicketSales,
      pushEventReminders,
      pushCheckInSummaries,
      pushProductUpdates,
    } = body

    // Validate boolean fields
    const booleanFields = {
      emailTicketSales,
      emailEventReminders,
      emailCheckInSummaries,
      emailProductUpdates,
      pushTicketSales,
      pushEventReminders,
      pushCheckInSummaries,
      pushProductUpdates,
    }

    for (const [key, value] of Object.entries(booleanFields)) {
      if (value !== undefined && typeof value !== "boolean") {
        return NextResponse.json(
          { error: `Invalid value for ${key}` },
          { status: 400 }
        )
      }
    }

    // Upsert preferences
    const preferences = await prisma.notificationPreference.upsert({
      where: { userId },
      create: {
        userId,
        ...defaultPreferences,
        ...Object.fromEntries(
          Object.entries(booleanFields).filter(([, v]) => v !== undefined)
        ),
      },
      update: Object.fromEntries(
        Object.entries(booleanFields).filter(([, v]) => v !== undefined)
      ),
    })

    // Check if user has any push subscriptions
    const pushSubscriptionCount = await prisma.pushSubscription.count({
      where: { userId },
    })

    return NextResponse.json({
      ...preferences,
      hasPushSubscription: pushSubscriptionCount > 0,
    })
  } catch (error) {
    console.error("Error updating notification preferences:", error)
    return NextResponse.json(
      { error: "Failed to update notification preferences" },
      { status: 500 }
    )
  }
}
