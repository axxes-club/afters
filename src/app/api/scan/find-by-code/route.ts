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
        event: true,
      },
    })

    // Fetch ticket stats separately to avoid complex nested queries
    const scannersWithStats = await Promise.all(
      scanners.map(async (scanner) => {
        const [totalTickets, checkedInTickets] = await Promise.all([
          prisma.ticket.count({ where: { eventId: scanner.eventId } }),
          prisma.ticket.count({ where: { eventId: scanner.eventId, checkedInAt: { not: null } } }),
        ])
        return {
          ...scanner,
          stats: { total: totalTickets, scanned: checkedInTickets },
        }
      })
    )

    if (scannersWithStats.length === 0) {
      return NextResponse.json(
        { error: "Invalid code", valid: false },
        { status: 401 }
      )
    }

    // Sort by event start date (most recent first) and prefer published events
    const sortedScanners = scannersWithStats.sort((a, b) => {
      // Prefer published events
      if (a.event.isPublished && !b.event.isPublished) return -1
      if (!a.event.isPublished && b.event.isPublished) return 1
      // Then sort by start date descending
      return new Date(b.event.startsAt).getTime() - new Date(a.event.startsAt).getTime()
    })

    const activeScanner = sortedScanners[0]

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
      stats: activeScanner.stats,
    })
  } catch (error) {
    console.error("Scanner code lookup error:", error)
    // Log the actual error for debugging
    if (error instanceof Error) {
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }
    return NextResponse.json(
      { error: "Verification failed", valid: false },
      { status: 500 }
    )
  }
}
