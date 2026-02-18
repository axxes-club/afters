import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withApiAuth, apiError, type ApiContext } from "@/lib/api-middleware"

type RouteParams = { params: Promise<{ orderId: string }> }

// Helper to format user as holder
function formatHolder(user: { id: string; firstName: string | null; lastName: string | null; email: string } | null) {
  if (!user) return null
  return {
    id: user.id,
    name: [user.firstName, user.lastName].filter(Boolean).join(" ") || null,
    email: user.email,
  }
}

// GET /api/v1/orders/[orderId] - Get order details
async function getOrder(
  req: NextRequest,
  ctx: ApiContext,
  routeParams: RouteParams
) {
  const { orderId } = await routeParams.params

  const profile = await prisma.organizerProfile.findUnique({
    where: { userId: ctx.userId },
  })

  if (!profile) {
    return apiError("Organizer profile not found", 404)
  }

  const order = await prisma.order.findFirst({
    where: {
      OR: [
        { id: orderId },
        { orderNumber: orderId },
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
          organizerId: true,
        },
      },
      tickets: {
        select: {
          id: true,
          ticketNumber: true,
          qrCodeUrl: true,
          status: true,
          checkedInAt: true,
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
        },
      },
      items: {
        select: {
          id: true,
          quantity: true,
          unitPrice: true,
          ticketTier: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  })

  if (!order) {
    return apiError("Order not found", 404)
  }

  // Verify ownership
  if (order.event.organizerId !== profile.id) {
    return apiError("Not authorized to view this order", 403)
  }

  const formattedTickets = order.tickets.map((ticket) => ({
    id: ticket.id,
    ticketNumber: ticket.ticketNumber,
    qrCodeUrl: ticket.qrCodeUrl,
    status: ticket.status.toLowerCase(),
    checkedInAt: ticket.checkedInAt,
    tier: ticket.ticketTier,
    holder: formatHolder(ticket.user),
  }))

  return NextResponse.json({
    id: order.id,
    orderNumber: order.orderNumber,
    buyerEmail: order.email,
    buyerName: order.guestName,
    total: order.total,
    subtotal: order.subtotal,
    platformFee: order.platformFee,
    stripeFee: order.stripeFee,
    status: order.status.toLowerCase(),
    createdAt: order.createdAt,
    paidAt: order.paidAt,
    event: order.event,
    items: order.items,
    tickets: formattedTickets,
  })
}

export async function GET(req: NextRequest, routeParams: RouteParams) {
  const handler = withApiAuth(
    (r, ctx) => getOrder(r, ctx, routeParams),
    { requiredScopes: ["orders:read"], allowSession: true }
  )
  return handler(req)
}
