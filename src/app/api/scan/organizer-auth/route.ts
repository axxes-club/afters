import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import {
  createScannerToken,
  SCANNER_SESSION_COOKIE,
  getScannerCookieOptions,
} from "@/lib/scanner-auth"

// Get organizer's events for scanner selection
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ authenticated: false, events: [] })
    }

    const profile = await prisma.organizerProfile.findUnique({
      where: { userId },
      include: {
        events: {
          where: {
            // Only show events that haven't ended
            OR: [
              { endsAt: { gte: new Date() } },
              { endsAt: null, startsAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }, // Started within last 24h
            ],
          },
          orderBy: { startsAt: "asc" },
          select: {
            id: true,
            title: true,
            slug: true,
            startsAt: true,
            venueName: true,
            isPublished: true,
            _count: {
              select: { tickets: true },
            },
          },
        },
      },
    })

    if (!profile) {
      return NextResponse.json({ authenticated: true, isOrganizer: false, events: [] })
    }

    return NextResponse.json({
      authenticated: true,
      isOrganizer: true,
      organizerName: profile.displayName || "Organizer",
      events: profile.events.map((event) => ({
        id: event.id,
        title: event.title,
        slug: event.slug,
        startsAt: event.startsAt,
        venueName: event.venueName,
        isPublished: event.isPublished,
        ticketCount: event._count.tickets,
      })),
    })
  } catch (error) {
    console.error("Organizer auth check error:", error)
    return NextResponse.json({ authenticated: false, events: [] })
  }
}

// Create scanner session for organizer
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: "Not authenticated", valid: false },
        { status: 401 }
      )
    }

    const { eventId } = await req.json()
    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID required", valid: false },
        { status: 400 }
      )
    }

    // Verify organizer owns this event
    const profile = await prisma.organizerProfile.findUnique({
      where: { userId },
      include: {
        events: {
          where: { id: eventId },
          select: {
            id: true,
            title: true,
            hasGuestlist: true,
            _count: {
              select: { tickets: true },
            },
            tickets: {
              where: { checkedInAt: { not: null } },
              select: { id: true },
            },
          },
        },
      },
    })

    if (!profile || profile.events.length === 0) {
      return NextResponse.json(
        { error: "Event not found or access denied", valid: false },
        { status: 403 }
      )
    }

    const event = profile.events[0]

    // Create a scanner session using organizer's name
    // Use a special "organizer-" prefix for the scannerId to distinguish from staff scanners
    const scannerId = `organizer-${userId}`
    const scannerName = profile.displayName || "Organizer"

    const token = await createScannerToken(scannerId, eventId, scannerName)

    const response = NextResponse.json({
      valid: true,
      isOrganizer: true,
      scanner: {
        id: scannerId,
        name: scannerName,
        eventId: eventId,
        eventTitle: event.title,
        hasGuestlist: event.hasGuestlist,
      },
      stats: {
        scanned: event.tickets.length,
        total: event._count.tickets,
      },
    })

    response.cookies.set(SCANNER_SESSION_COOKIE, token, getScannerCookieOptions())

    return response
  } catch (error) {
    console.error("Organizer scanner auth error:", error)
    return NextResponse.json(
      { error: "Authentication failed", valid: false },
      { status: 500 }
    )
  }
}
