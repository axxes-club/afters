import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withApiAuth, apiError, type ApiContext } from "@/lib/api-middleware"

type RouteParams = { params: Promise<{ ticketId: string }> }

// GET /api/v1/tickets/[ticketId] - Get ticket details
async function getTicket(
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

  // Find the ticket by ID or ticket number
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
          slug: true,
          startsAt: true,
          venueName: true,
          city: true,
          organizerId: true,
        },
      },
      ticketTier: {
        select: {
          id: true,
          name: true,
          price: true,
          description: true,
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
      order: {
        select: {
          id: true,
          email: true,
          guestName: true,
          total: true,
          status: true,
          createdAt: true,
        },
      },
    },
  })

  if (!ticket) {
    return apiError("Ticket not found", 404)
  }

  // Verify the user owns this event or is a staff member
  if (ticket.event.organizerId !== profile.id) {
    const staffMember = await prisma.staffMember.findFirst({
      where: {
        userId: ctx.userId,
        organizerProfileId: ticket.event.organizerId,
        status: "ACTIVE",
      },
    })

    if (!staffMember) {
      return apiError("Not authorized to view this ticket", 403)
    }
  }

  return NextResponse.json({
    id: ticket.id,
    ticketNumber: ticket.ticketNumber,
    qrCodeUrl: ticket.qrCodeUrl,
    status: ticket.status.toLowerCase(),
    checkedInAt: ticket.checkedInAt,
    checkedInBy: ticket.checkedInBy,
    createdAt: ticket.createdAt,
    tier: ticket.ticketTier,
    holder: ticket.user ? {
      id: ticket.user.id,
      name: [ticket.user.firstName, ticket.user.lastName].filter(Boolean).join(" ") || null,
      email: ticket.user.email,
    } : null,
    event: ticket.event,
    order: ticket.order ? {
      id: ticket.order.id,
      buyerEmail: ticket.order.email,
      buyerName: ticket.order.guestName,
      total: ticket.order.total,
      status: ticket.order.status.toLowerCase(),
      createdAt: ticket.order.createdAt,
    } : null,
  })
}

export async function GET(req: NextRequest, routeParams: RouteParams) {
  const handler = withApiAuth(
    (r, ctx) => getTicket(r, ctx, routeParams),
    { requiredScopes: ["tickets:read"], allowSession: true }
  )
  return handler(req)
}
