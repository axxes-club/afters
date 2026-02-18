import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withApiAuth, apiError, type ApiContext } from "@/lib/api-middleware"

type RouteParams = { params: Promise<{ ticketId: string }> }

// Helper to format user as holder
function formatHolder(user: { id: string; firstName: string | null; lastName: string | null; email: string } | null) {
  if (!user) return null
  return {
    id: user.id,
    name: [user.firstName, user.lastName].filter(Boolean).join(" ") || null,
    email: user.email,
  }
}

// POST /api/v1/tickets/[ticketId]/checkin - Check in a ticket
async function checkinTicket(
  req: NextRequest,
  ctx: ApiContext,
  routeParams: RouteParams
) {
  const { ticketId } = await routeParams.params

  const profile = await prisma.organizerProfile.findUnique({
    where: { userId: ctx.userId },
  })

  if (!profile) {
    return apiError("Organizer profile not found", 404)
  }

  // Find the ticket - could be by ID or ticket number
  const ticket = await prisma.ticket.findFirst({
    where: {
      OR: [
        { id: ticketId },
        { ticketNumber: ticketId },
      ],
    },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          organizerId: true,
          startsAt: true,
        },
      },
      ticketTier: {
        select: {
          id: true,
          name: true,
        },
      },
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  })

  if (!ticket) {
    return apiError("Ticket not found", 404)
  }

  // Verify the user owns this event or is a staff member for the event's organizer
  if (ticket.event.organizerId !== profile.id) {
    // Check if user is a staff member for this event's organizer
    const staffMember = await prisma.staffMember.findFirst({
      where: {
        userId: ctx.userId,
        organizerProfileId: ticket.event.organizerId,
        status: "ACTIVE",
      },
    })

    if (!staffMember) {
      return apiError("Not authorized to check in tickets for this event", 403)
    }
  }

  // Check if already checked in
  if (ticket.status === "CHECKED_IN") {
    return NextResponse.json({
      success: false,
      status: "already_checked_in",
      message: "Ticket has already been checked in",
      ticket: {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        checkedInAt: ticket.checkedInAt,
        checkedInBy: ticket.checkedInBy,
        tier: ticket.ticketTier,
        holder: formatHolder(ticket.user),
        event: ticket.event,
      },
    }, { status: 409 })
  }

  // Check if cancelled or refunded
  if (ticket.status === "CANCELLED" || ticket.status === "REFUNDED") {
    return NextResponse.json({
      success: false,
      status: ticket.status.toLowerCase(),
      message: `This ticket has been ${ticket.status.toLowerCase()}`,
      ticket: {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        status: ticket.status.toLowerCase(),
        tier: ticket.ticketTier,
        holder: formatHolder(ticket.user),
        event: ticket.event,
      },
    }, { status: 400 })
  }

  // Perform check-in
  const checkedInBy = ctx.authType === "api_key" ? "API" : ctx.userId
  
  const updatedTicket = await prisma.ticket.update({
    where: { id: ticket.id },
    data: {
      status: "CHECKED_IN",
      checkedInAt: new Date(),
      checkedInBy,
    },
    include: {
      ticketTier: {
        select: {
          id: true,
          name: true,
        },
      },
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      event: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  })

  // Note: ScanLog requires an EventScanner ID, so we skip logging for API-based check-ins
  // The check-in is recorded via the ticket's checkedInAt and checkedInBy fields

  return NextResponse.json({
    success: true,
    status: "checked_in",
    message: "Ticket checked in successfully",
    ticket: {
      id: updatedTicket.id,
      ticketNumber: updatedTicket.ticketNumber,
      checkedInAt: updatedTicket.checkedInAt,
      checkedInBy: updatedTicket.checkedInBy,
      tier: updatedTicket.ticketTier,
      holder: formatHolder(updatedTicket.user),
      event: updatedTicket.event,
    },
  })
}

// DELETE /api/v1/tickets/[ticketId]/checkin - Undo check-in
async function undoCheckin(
  req: NextRequest,
  ctx: ApiContext,
  routeParams: RouteParams
) {
  const { ticketId } = await routeParams.params

  const profile = await prisma.organizerProfile.findUnique({
    where: { userId: ctx.userId },
  })

  if (!profile) {
    return apiError("Organizer profile not found", 404)
  }

  const ticket = await prisma.ticket.findFirst({
    where: {
      OR: [
        { id: ticketId },
        { ticketNumber: ticketId },
      ],
    },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          organizerId: true,
        },
      },
    },
  })

  if (!ticket) {
    return apiError("Ticket not found", 404)
  }

  // Only organizers can undo check-ins (not scanners)
  if (ticket.event.organizerId !== profile.id) {
    return apiError("Not authorized to undo check-in", 403)
  }

  if (ticket.status !== "CHECKED_IN") {
    return apiError("Ticket is not checked in", 400)
  }

  const updatedTicket = await prisma.ticket.update({
    where: { id: ticket.id },
    data: {
      status: "VALID",
      checkedInAt: null,
      checkedInBy: null,
    },
    select: {
      id: true,
      ticketNumber: true,
      ticketTier: {
        select: {
          id: true,
          name: true,
        },
      },
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  })

  // Note: ScanLog requires an EventScanner ID, skipping for API-based undo

  return NextResponse.json({
    success: true,
    status: "check_in_removed",
    message: "Check-in has been undone",
    ticket: {
      id: updatedTicket.id,
      ticketNumber: updatedTicket.ticketNumber,
      tier: updatedTicket.ticketTier,
      holder: formatHolder(updatedTicket.user),
    },
  })
}

export async function POST(req: NextRequest, routeParams: RouteParams) {
  const handler = withApiAuth(
    (r, ctx) => checkinTicket(r, ctx, routeParams),
    { requiredScopes: ["tickets:checkin"], allowSession: true }
  )
  return handler(req)
}

export async function DELETE(req: NextRequest, routeParams: RouteParams) {
  const handler = withApiAuth(
    (r, ctx) => undoCheckin(r, ctx, routeParams),
    { requiredScopes: ["tickets:checkin"], allowSession: true }
  )
  return handler(req)
}
