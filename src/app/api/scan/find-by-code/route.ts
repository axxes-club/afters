import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  createScannerToken,
  setScannerSessionCookie,
  checkRateLimit,
} from "@/lib/scanner-auth"

// Find scanner by code alone (without needing eventId)
export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json()

    if (!code || code.length !== 6) {
      return NextResponse.json(
        { error: "Please enter a 6-digit code", valid: false },
        { status: 400 }
      )
    }

    // Rate limiting by IP
    const ip = req.headers.get("x-forwarded-for") || "unknown"
    if (!checkRateLimit(`find-code-${ip}`, 10, 60000)) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later.", valid: false },
        { status: 429 }
      )
    }

    // Find all scanners with this code (should typically be just one)
    const scanners = await prisma.eventScanner.findMany({
      where: {
        code,
        isActive: true,
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
            startsAt: true,
            endsAt: true,
            isPublished: true,
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
      orderBy: {
        event: {
          startsAt: "desc",
        },
      },
    })

    if (scanners.length === 0) {
      return NextResponse.json(
        { error: "Invalid code", valid: false },
        { status: 401 }
      )
    }

    // If multiple scanners have this code, pick the one for the most recent upcoming/current event
    // Filter to only active (published) events first
    const activeScanner = scanners.find((s) => s.event.isPublished) || scanners[0]

    const token = await createScannerToken(
      activeScanner.id,
      activeScanner.eventId,
      activeScanner.name
    )
    await setScannerSessionCookie(token)

    return NextResponse.json({
      valid: true,
      scanner: {
        id: activeScanner.id,
        name: activeScanner.name,
        eventId: activeScanner.eventId,
        eventTitle: activeScanner.event.title,
        eventSlug: activeScanner.event.slug,
        hasGuestlist: activeScanner.event.hasGuestlist,
      },
      stats: {
        scanned: activeScanner.event.tickets.length,
        total: activeScanner.event._count.tickets,
      },
    })
  } catch (error) {
    console.error("Scanner code lookup error:", error)
    return NextResponse.json(
      { error: "Verification failed", valid: false },
      { status: 500 }
    )
  }
}
