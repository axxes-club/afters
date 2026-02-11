import { NextResponse } from "next/server"
import { getScannerSession, clearScannerSession } from "@/lib/scanner-auth"
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

    return NextResponse.json({
      authenticated: true,
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
  try {
    await clearScannerSession()
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: "Failed to clear session" },
      { status: 500 }
    )
  }
}
