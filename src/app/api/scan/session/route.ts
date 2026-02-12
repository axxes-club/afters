import { NextResponse } from "next/server"
import { getScannerSession, SCANNER_SESSION_COOKIE } from "@/lib/scanner-auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getScannerSession()
    if (!session) {
      return NextResponse.json({ authenticated: false })
    }

    // Get event details and stats
    const event = await prisma.event.findUnique({
      where: { id: session.eventId },
      select: {
        title: true,
        hasGuestlist: true,
        _count: {
          select: {
            tickets: true,
          }
        },
        tickets: {
          where: { checkedInAt: { not: null } },
          select: { id: true }
        }
      }
    })

    // Check if this is an organizer session (organizer scanner IDs start with "organizer-")
    const isOrganizer = session.scannerId.startsWith("organizer-")

    return NextResponse.json({
      authenticated: true,
      isOrganizer,
      scanner: {
        scannerId: session.scannerId,
        eventId: session.eventId,
        name: session.name,
        eventTitle: event?.title || "",
        hasGuestlist: event?.hasGuestlist || false,
      },
      stats: {
        scanned: event?.tickets.length || 0,
        total: event?._count.tickets || 0,
      }
    })
  } catch {
    return NextResponse.json({ authenticated: false })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.delete(SCANNER_SESSION_COOKIE)
  return response
}
