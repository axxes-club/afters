import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  createScannerToken,
  setScannerSessionCookie,
  checkRateLimit,
} from "@/lib/scanner-auth"

export async function POST(req: NextRequest) {
  try {
    const { eventId, code } = await req.json()

    if (!eventId || !code) {
      return NextResponse.json(
        { error: "Event ID and code are required", valid: false },
        { status: 400 }
      )
    }

    // Rate limiting by IP
    const ip = req.headers.get("x-forwarded-for") || "unknown"
    if (!checkRateLimit(`verify-${ip}`, 10, 60000)) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later.", valid: false },
        { status: 429 }
      )
    }

    const scanner = await prisma.eventScanner.findUnique({
      where: {
        eventId_code: { eventId, code },
      },
      include: {
        event: {
          select: { 
            id: true, 
            title: true, 
            startsAt: true,
            hasGuestlist: true,
            _count: {
              select: { tickets: true }
            },
            tickets: {
              where: { checkedIn: true },
              select: { id: true }
            }
          },
        },
      },
    })

    if (!scanner) {
      return NextResponse.json(
        { error: "Invalid scanner code", valid: false },
        { status: 401 }
      )
    }

    if (!scanner.isActive) {
      return NextResponse.json(
        { error: "This scanner has been deactivated", valid: false },
        { status: 403 }
      )
    }

    const token = await createScannerToken(
      scanner.id,
      scanner.eventId,
      scanner.name
    )
    await setScannerSessionCookie(token)

    return NextResponse.json({
      valid: true,
      scanner: {
        id: scanner.id,
        name: scanner.name,
        eventId: scanner.eventId,
        eventTitle: scanner.event.title,
        hasGuestlist: scanner.event.hasGuestlist,
      },
      stats: {
        scanned: scanner.event.tickets.length,
        total: scanner.event._count.tickets,
      }
    })
  } catch (error) {
    console.error("Scanner verification error:", error)
    return NextResponse.json(
      { error: "Verification failed", valid: false },
      { status: 500 }
    )
  }
}
