import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

// GET /api/events/[eventId]/analytics - Get event analytics
export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { eventId } = await params
    
    // Get organizer profile
    const profile = await prisma.organizerProfile.findUnique({
      where: { userId },
    })
    
    if (!profile) {
      return NextResponse.json({ error: "Organizer not found" }, { status: 404 })
    }

    // Verify event belongs to organizer
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        organizerId: profile.id,
      },
      include: {
        ticketTiers: true,
        _count: {
          select: {
            views: true,
            orders: true,
            tickets: true,
          },
        },
      },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Get time range from query params (default: last 30 days)
    const url = new URL(request.url)
    const days = parseInt(url.searchParams.get("days") || "30")
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get views over time (grouped by day)
    const viewsByDay = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
      SELECT DATE("createdAt") as date, COUNT(*) as count
      FROM "EventView"
      WHERE "eventId" = ${eventId}
        AND "createdAt" >= ${startDate}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `

    // Get orders over time (grouped by day)
    const ordersByDay = await prisma.$queryRaw<Array<{ date: Date; count: bigint; revenue: bigint }>>`
      SELECT DATE("paidAt") as date, COUNT(*) as count, SUM("subtotal") as revenue
      FROM "Order"
      WHERE "eventId" = ${eventId}
        AND "status" = 'PAID'
        AND "paidAt" >= ${startDate}
      GROUP BY DATE("paidAt")
      ORDER BY date ASC
    `

    // Get check-ins over time
    const checkInsByDay = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
      SELECT DATE("checkedInAt") as date, COUNT(*) as count
      FROM "Ticket"
      WHERE "eventId" = ${eventId}
        AND "status" = 'CHECKED_IN'
        AND "checkedInAt" >= ${startDate}
      GROUP BY DATE("checkedInAt")
      ORDER BY date ASC
    `

    // Calculate totals
    const totalViews = event._count.views
    const totalOrders = await prisma.order.count({
      where: { eventId, status: "PAID" },
    })
    const totalTicketsSold = event.ticketTiers.reduce((sum, t) => sum + t.quantitySold, 0)
    const totalCapacity = event.ticketTiers.reduce((sum, t) => sum + t.quantity, 0)
    const totalRevenue = await prisma.order.aggregate({
      where: { eventId, status: "PAID" },
      _sum: { subtotal: true },
    })
    const checkedInCount = await prisma.ticket.count({
      where: { eventId, status: "CHECKED_IN" },
    })

    // Calculate conversion rate (views -> purchases)
    const conversionRate = totalViews > 0 ? (totalOrders / totalViews) * 100 : 0

    // Get referrer breakdown
    const referrers = await prisma.eventView.groupBy({
      by: ["referrer"],
      where: {
        eventId,
        createdAt: { gte: startDate },
        referrer: { not: null },
      },
      _count: true,
      orderBy: { _count: { referrer: "desc" } },
      take: 10,
    })

    // Get ticket tier breakdown
    const tierBreakdown = event.ticketTiers.map((tier) => ({
      id: tier.id,
      name: tier.name,
      price: tier.price,
      sold: tier.quantitySold,
      available: tier.quantity - tier.quantitySold,
      percentSold: tier.quantity > 0 ? (tier.quantitySold / tier.quantity) * 100 : 0,
    }))

    return NextResponse.json({
      summary: {
        totalViews,
        totalOrders,
        totalTicketsSold,
        totalCapacity,
        totalRevenue: totalRevenue._sum.subtotal || 0,
        checkedInCount,
        conversionRate: Math.round(conversionRate * 100) / 100,
        checkInRate: totalTicketsSold > 0 ? Math.round((checkedInCount / totalTicketsSold) * 100 * 100) / 100 : 0,
      },
      viewsByDay: viewsByDay.map((v) => ({
        date: v.date.toISOString().split("T")[0],
        count: Number(v.count),
      })),
      ordersByDay: ordersByDay.map((o) => ({
        date: o.date.toISOString().split("T")[0],
        count: Number(o.count),
        revenue: Number(o.revenue),
      })),
      checkInsByDay: checkInsByDay.map((c) => ({
        date: c.date.toISOString().split("T")[0],
        count: Number(c.count),
      })),
      referrers: referrers.map((r) => ({
        referrer: r.referrer || "Direct",
        count: r._count,
      })),
      tierBreakdown,
    })
  } catch (error) {
    console.error("Analytics error:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
