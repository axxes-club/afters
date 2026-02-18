import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withApiAuth, apiError, type ApiContext } from "@/lib/api-middleware"
import { Prisma } from "@prisma/client"

// GET /api/v1/orders - List orders for user's events
async function getOrders(req: NextRequest, ctx: ApiContext) {
  const { searchParams } = new URL(req.url)
  
  const eventId = searchParams.get("eventId")
  const status = searchParams.get("status") // PAID, PENDING, REFUNDED, etc.
  const search = searchParams.get("search")
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200)
  const offset = parseInt(searchParams.get("offset") || "0")

  const profile = await prisma.organizerProfile.findUnique({
    where: { userId: ctx.userId },
  })

  if (!profile) {
    return apiError("Organizer profile not found", 404)
  }

  // If filtering by specific event, verify ownership
  if (eventId) {
    const event = await prisma.event.findFirst({
      where: { id: eventId, organizerId: profile.id },
    })
    if (!event) {
      return apiError("Event not found", 404)
    }
  }

  // Build where clause
  const where: Prisma.OrderWhereInput = eventId
    ? { eventId }
    : { event: { organizerId: profile.id } }

  if (status) {
    where.status = status as Prisma.EnumOrderStatusFilter
  }

  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { guestName: { contains: search, mode: "insensitive" } },
    ]
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      select: {
        id: true,
        orderNumber: true,
        email: true,
        guestName: true,
        total: true,
        status: true,
        createdAt: true,
        paidAt: true,
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        _count: {
          select: { tickets: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.order.count({ where }),
  ])

  const formattedOrders = orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    buyerEmail: order.email,
    buyerName: order.guestName,
    total: order.total,
    status: order.status.toLowerCase(),
    ticketCount: order._count.tickets,
    event: order.event,
    createdAt: order.createdAt,
    paidAt: order.paidAt,
  }))

  return NextResponse.json({
    orders: formattedOrders,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + orders.length < total,
    },
  })
}

export const GET = withApiAuth(getOrders, {
  requiredScopes: ["orders:read"],
  allowSession: true,
})
