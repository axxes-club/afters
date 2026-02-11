import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getScannerSession } from "@/lib/scanner-auth"
import { ScanResult } from "@prisma/client"

async function logScan(
  scannerId: string,
  eventId: string,
  ticketId: string | null,
  ticketNumber: string | null,
  result: ScanResult,
  message: string
) {
  await prisma.scanLog.create({
    data: { scannerId, eventId, ticketId, ticketNumber, result, message },
  })
}

export async function POST(req: NextRequest) {
  try {
    const session = await getScannerSession()
    if (!session) {
      return NextResponse.json(
        {
          error: "Scanner session expired. Please re-enter your code.",
          valid: false,
        },
        { status: 401 }
      )
    }

    // Verify scanner is still active
    const scanner = await prisma.eventScanner.findUnique({
      where: { id: session.scannerId },
    })

    if (!scanner || !scanner.isActive) {
      return NextResponse.json(
        { error: "Scanner has been deactivated", valid: false },
        { status: 403 }
      )
    }

    const { ticketId } = await req.json()

    if (!ticketId) {
      return NextResponse.json(
        { error: "Ticket ID required", valid: false },
        { status: 400 }
      )
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        event: true,
        ticketTier: true,
        order: {
          select: { guestName: true, email: true },
        },
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    })

    if (!ticket) {
      await logScan(
        session.scannerId,
        session.eventId,
        null,
        null,
        "INVALID_TICKET",
        "Ticket not found"
      )
      return NextResponse.json(
        { error: "Ticket not found", valid: false, result: "INVALID_TICKET" },
        { status: 404 }
      )
    }

    if (ticket.eventId !== session.eventId) {
      await logScan(
        session.scannerId,
        session.eventId,
        ticket.id,
        ticket.ticketNumber,
        "WRONG_EVENT",
        "Ticket is for a different event"
      )
      return NextResponse.json(
        {
          error: "This ticket is for a different event",
          valid: false,
          result: "WRONG_EVENT",
        },
        { status: 403 }
      )
    }

    // Determine holder name - guest name or user name
    const holderName = ticket.user
      ? (`${ticket.user.firstName || ""} ${ticket.user.lastName || ""}`.trim() || ticket.user.email)
      : (ticket.order?.guestName || ticket.order?.email || "Guest")

    if (ticket.status === "CHECKED_IN") {
      await logScan(
        session.scannerId,
        session.eventId,
        ticket.id,
        ticket.ticketNumber,
        "ALREADY_CHECKED_IN",
        `Already checked in at ${ticket.checkedInAt?.toISOString()}`
      )
      return NextResponse.json({
        error: "Already checked in",
        valid: false,
        result: "ALREADY_CHECKED_IN",
        ticket: {
          ticketNumber: ticket.ticketNumber,
          tierName: ticket.ticketTier.name,
          holderName,
          checkedInAt: ticket.checkedInAt,
        },
      })
    }

    if (ticket.status === "CANCELLED" || ticket.status === "REFUNDED") {
      await logScan(
        session.scannerId,
        session.eventId,
        ticket.id,
        ticket.ticketNumber,
        "CANCELLED_TICKET",
        `Ticket has been ${ticket.status.toLowerCase()}`
      )
      return NextResponse.json({
        error: `Ticket has been ${ticket.status.toLowerCase()}`,
        valid: false,
        result: "CANCELLED_TICKET",
      })
    }

    // Check in the ticket
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: "CHECKED_IN",
        checkedInAt: new Date(),
        checkedInBy: session.scannerId,
      },
    })

    await logScan(
      session.scannerId,
      session.eventId,
      ticket.id,
      ticket.ticketNumber,
      "SUCCESS",
      "Check-in successful"
    )

    return NextResponse.json({
      message: ticket.isTestTicket ? "⚠️ TEST TICKET - Check-in successful!" : "Check-in successful!",
      valid: true,
      result: "SUCCESS",
      ticket: {
        ticketNumber: ticket.ticketNumber,
        tierName: ticket.ticketTier.name,
        holderName,
        checkedInAt: updatedTicket.checkedInAt,
        isTestTicket: ticket.isTestTicket,
      },
    })
  } catch (error) {
    console.error("Check-in error:", error)
    return NextResponse.json(
      { error: "Check-in failed", valid: false },
      { status: 500 }
    )
  }
}
