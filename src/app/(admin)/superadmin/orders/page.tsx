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
    <div className="space-y-4 sm:space-y-6 pb-20 lg:pb-6">
      <div className="border-b border-white/10 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <Receipt className="w-6 h-6 text-[#ff1493]" />
          <h1 className="text-2xl font-mono font-bold tracking-tight text-white">ORDER MANAGEMENT</h1>
        </div>
        <p className="text-white/40 font-mono text-sm">Track revenue and manage all ticket orders.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
        <div className="border border-[#ff1493]/30 bg-[#ff1493]/5 p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <Receipt className="h-4 w-4 text-[#ff1493]" />
            <span className="text-[10px] font-mono text-white/40 tracking-widest">TOTAL</span>
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-[#ff1493]">{stats.totalOrders}</div>
        </div>
        <div className="border border-green-500/30 bg-green-500/5 p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <Receipt className="h-4 w-4 text-green-400" />
            <span className="text-[10px] font-mono text-white/40 tracking-widest">REVENUE</span>
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-green-400">{formatCurrency(stats.totalRevenue)}</div>
        </div>
        <div className="col-span-2 sm:col-span-1 border border-cyan-400/30 bg-cyan-400/5 p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <Receipt className="h-4 w-4 text-cyan-400" />
            <span className="text-[10px] font-mono text-white/40 tracking-widest">TODAY</span>
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-cyan-400">{stats.todayOrders}</div>
        </div>
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
