import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { ticketId, eventId } = await req.json()

    if (!ticketId) {
      return NextResponse.json({ message: "Ticket ID required" }, { status: 400 })
    }

    // Get ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        event: {
          include: {
            organizer: true,
          },
        },
        ticketTier: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    if (!ticket) {
      return NextResponse.json(
        { message: "Ticket not found", valid: false },
        { status: 404 }
      )
    }

    // Verify the scanner has access to this event
    const profile = await prisma.organizerProfile.findUnique({
      where: { userId },
    })

    // For now, only organizer can scan. Later: add door staff roles
    if (!profile || ticket.event.organizerId !== profile.id) {
      // Check if eventId matches (for direct link access)
      if (eventId && ticket.eventId !== eventId) {
        return NextResponse.json(
          { message: "Ticket is for a different event", valid: false },
          { status: 403 }
        )
      }
    }

    // Check ticket status
    if (ticket.status === "CHECKED_IN") {
      return NextResponse.json({
        message: "Already checked in",
        valid: false,
        ticket: {
          ticketNumber: ticket.ticketNumber,
          tierName: ticket.ticketTier.name,
          holderName: `${ticket.user.firstName || ""} ${ticket.user.lastName || ""}`.trim() || ticket.user.email,
          checkedInAt: ticket.checkedInAt,
        },
      })
    }

    if (ticket.status !== "VALID") {
      return NextResponse.json({
        message: `Ticket is ${ticket.status.toLowerCase()}`,
        valid: false,
        ticket: {
          ticketNumber: ticket.ticketNumber,
          tierName: ticket.ticketTier.name,
          status: ticket.status,
        },
      })
    }

    // Check in the ticket
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: "CHECKED_IN",
        checkedInAt: new Date(),
        checkedInBy: userId,
      },
    })

    return NextResponse.json({
      message: "Check-in successful!",
      valid: true,
      ticket: {
        ticketNumber: ticket.ticketNumber,
        tierName: ticket.ticketTier.name,
        holderName: `${ticket.user.firstName || ""} ${ticket.user.lastName || ""}`.trim() || ticket.user.email,
        checkedInAt: updatedTicket.checkedInAt,
      },
    })
  } catch (error) {
    console.error("Error checking in ticket:", error)
    return NextResponse.json(
      { message: "Check-in failed", valid: false },
      { status: 500 }
    )
  }
}
