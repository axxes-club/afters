import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Receipt, Search, Download, Eye, RefreshCcw } from "lucide-react"
import Link from "next/link"

async function getOrders() {
  return prisma.order.findMany({
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        }
      },
      event: {
        select: {
          id: true,
          title: true,
          slug: true,
        }
      },
      tickets: {
        select: {
          id: true,
          ticketTier: {
            select: { name: true, price: true }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
}

async function getOrderStats() {
  const [totalOrders, totalRevenue, todayOrders] = await Promise.all([
    prisma.order.count(),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { status: 'PAID' }
    }),
    prisma.order.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    })
  ])

  return {
    totalOrders,
    totalRevenue: totalRevenue._sum.total || 0,
    todayOrders
  }
}

export default async function OrdersPage() {
  const [orders, stats] = await Promise.all([getOrders(), getOrderStats()])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'PENDING': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      case 'REFUNDED': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      case 'CANCELLED': return 'bg-red-500/10 text-red-500 border-red-500/20'
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Receipt className="h-8 w-8 text-[#ff1493]" />
            Orders
          </h1>
          <p className="text-muted-foreground">Manage all ticket orders across the platform</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Orders</CardDescription>
            <CardTitle className="text-3xl">{stats.totalOrders}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Revenue</CardDescription>
            <CardTitle className="text-3xl text-green-500">{formatCurrency(stats.totalRevenue)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Orders Today</CardDescription>
            <CardTitle className="text-3xl">{stats.todayOrders}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Last 100 orders across all events</CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No orders yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium">Order ID</th>
                    <th className="pb-3 font-medium">Customer</th>
                    <th className="pb-3 font-medium">Event</th>
                    <th className="pb-3 font-medium">Tickets</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b last:border-0">
                      <td className="py-3">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {order.id.slice(0, 8)}...
                        </code>
                      </td>
                      <td className="py-3">
                        <div>
                          <p className="font-medium">
                            {order.user?.firstName} {order.user?.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">{order.user?.email}</p>
                        </div>
                      </td>
                      <td className="py-3">
                        <Link 
                          href={`/e/${order.event?.slug}`}
                          className="hover:text-[#ff1493] transition-colors"
                        >
                          {order.event?.title || 'Unknown Event'}
                        </Link>
                      </td>
                      <td className="py-3">
                        <Badge variant="outline">{order.tickets.length} ticket(s)</Badge>
                      </td>
                      <td className="py-3 font-medium">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="py-3">
                        <Badge variant="outline" className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" asChild>
                            <Link href={`/orders/${order.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
