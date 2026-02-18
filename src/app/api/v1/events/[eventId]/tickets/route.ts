import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withApiAuth, apiError, type ApiContext } from "@/lib/api-middleware"
import { Prisma } from "@prisma/client"

type RouteParams = { params: Promise<{ eventId: string }> }

// GET /api/v1/events/[eventId]/tickets - List tickets for an event
async function getTickets(
  req: NextRequest,
  ctx: ApiContext,
  routeParams: RouteParams
) {
  const { eventId } = await routeParams.params
  const { searchParams } = new URL(req.url)
  
  const status = searchParams.get("status") // valid, checked_in, cancelled
  const tierId = searchParams.get("tierId")
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200)
  const offset = parseInt(searchParams.get("offset") || "0")

  const profile = await prisma.organizerProfile.findUnique({
    where: { userId: ctx.userId },
  })

  if (!profile) {
    return apiError("Organizer profile not found", 404)
  }

  // Verify event ownership
  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      organizerId: profile.id,
    },
    select: { id: true, title: true },
  })

  if (!event) {
    return apiError("Event not found", 404)
  }

  // Build where clause
  const where: Prisma.TicketWhereInput = {
    eventId,
  }

  // Status filter - map to TicketStatus enum
  if (status === "valid") {
    where.status = "VALID"
  } else if (status === "checked_in") {
    where.status = "CHECKED_IN"
  } else if (status === "cancelled") {
    where.status = "CANCELLED"
  }

  // Tier filter
  if (tierId) {
    where.ticketTierId = tierId
  }

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      select: {
        id: true,
        ticketNumber: true,
        qrCodeUrl: true,
        status: true,
        checkedInAt: true,
        checkedInBy: true,
        createdAt: true,
        ticketTier: {
          select: {
            id: true,
            name: true,
            price: true,
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
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.ticket.count({ where }),
  ])

  // Format tickets for API response
  const formattedTickets = tickets.map((ticket) => ({
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
    order: ticket.order ? {
      id: ticket.order.id,
      buyerEmail: ticket.order.email,
      buyerName: ticket.order.guestName,
    } : null,
  }))

  return NextResponse.json({
    tickets: formattedTickets,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + tickets.length < total,
    },
  })
}

export async function GET(req: NextRequest, routeParams: RouteParams) {
  const handler = withApiAuth(
    (r, ctx) => getTickets(r, ctx, routeParams),
    { requiredScopes: ["tickets:read"], allowSession: true }
  )
  return handler(req)
}
