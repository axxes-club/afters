import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withApiAuth, apiError, type ApiContext } from "@/lib/api-middleware"

type RouteParams = { params: Promise<{ eventId: string }> }

// GET /api/v1/events/[eventId]/analytics - Get event analytics
async function getAnalytics(
  req: NextRequest,
  ctx: ApiContext,
  routeParams: RouteParams
) {
  const { eventId } = await routeParams.params

  const profile = await prisma.organizerProfile.findUnique({
    where: { userId: ctx.userId },
  })

  if (!profile) {
    return apiError("Organizer profile not found", 404)
  }

  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      organizerId: profile.id,
    },
    include: {
      ticketTiers: true,
      _count: {
        select: {
          tickets: true,
          orders: true,
          views: true,
          scanLogs: true,
          guestlistEntries: true,
          rsvps: true,
        },
      },
    },
  })

  if (!event) {
    return apiError("Event not found", 404)
  }

  // Calculate ticket stats
  const totalCapacity = event.ticketTiers.reduce((sum, t) => sum + t.quantity, 0)
  const totalSold = event.ticketTiers.reduce((sum, t) => sum + t.quantitySold, 0)
  const totalRevenue = event.ticketTiers.reduce((sum, t) => sum + t.quantitySold * t.price, 0)

  // Get check-in stats
  const checkedInCount = await prisma.ticket.count({
    where: {
      eventId,
      checkedInAt: { not: null },
    },
  })

  // Get sales by tier
  const tierStats = event.ticketTiers.map((tier) => ({
    id: tier.id,
    name: tier.name,
    price: tier.price,
    capacity: tier.quantity,
    sold: tier.quantitySold,
    available: tier.quantity - tier.quantitySold,
    revenue: tier.quantitySold * tier.price,
    percentSold: tier.quantity > 0 ? Math.round((tier.quantitySold / tier.quantity) * 100) : 0,
  }))

  // Get recent sales (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const recentOrders = await prisma.order.findMany({
    where: {
      eventId,
      createdAt: { gte: sevenDaysAgo },
      status: "PAID",
    },
    select: {
      createdAt: true,
      total: true,
    },
    orderBy: { createdAt: "asc" },
  })

  // Group sales by day
  const salesByDay: Record<string, { count: number; revenue: number }> = {}
  for (const order of recentOrders) {
    const day = order.createdAt.toISOString().split("T")[0]
    if (!salesByDay[day]) {
      salesByDay[day] = { count: 0, revenue: 0 }
    }
    salesByDay[day].count++
    salesByDay[day].revenue += order.total
  }

  return NextResponse.json({
    event: {
      id: event.id,
      title: event.title,
      startsAt: event.startsAt,
      status: event.status,
      isPublished: event.isPublished,
    },
    summary: {
      totalCapacity,
      totalTicketsSold: totalSold,
      ticketsAvailable: totalCapacity - totalSold,
      percentSold: totalCapacity > 0 ? Math.round((totalSold / totalCapacity) * 100) : 0,
      totalRevenue,
      totalRevenueCents: totalRevenue, // For backwards compatibility
      checkedInCount,
      percentCheckedIn: totalSold > 0 ? Math.round((checkedInCount / totalSold) * 100) : 0,
      totalOrders: event._count.orders,
      totalPageViews: event._count.views,
      totalGuestlistEntries: event._count.guestlistEntries,
      totalRsvps: event._count.rsvps,
    },
    tiers: tierStats,
    salesByDay: Object.entries(salesByDay).map(([date, data]) => ({
      date,
      orders: data.count,
      revenue: data.revenue,
    })),
  })
}

export async function GET(req: NextRequest, routeParams: RouteParams) {
  const handler = withApiAuth(
    (r, ctx) => getAnalytics(r, ctx, routeParams),
    { requiredScopes: ["analytics:read"], allowSession: true }
  )
  return handler(req)
}
