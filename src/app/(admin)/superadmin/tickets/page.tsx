import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Ticket, QrCode, CheckCircle, XCircle, Clock } from "lucide-react"
import Link from "next/link"

async function getTickets() {
  return prisma.ticket.findMany({
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
          startsAt: true,
        }
      },
      ticketTier: {
        select: {
          name: true,
          price: true,
        }
      },
      order: {
        select: {
          id: true,
          status: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
}

async function getTicketStats() {
  const [total, checkedIn, pending] = await Promise.all([
    prisma.ticket.count(),
    prisma.ticket.count({ where: { status: 'CHECKED_IN' } }),
    prisma.ticket.count({ where: { status: 'VALID' } }),
  ])

  return { total, checkedIn, pending }
}

export default async function TicketsPage() {
  const [tickets, stats] = await Promise.all([getTickets(), getTicketStats()])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CHECKED_IN': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'VALID': return <Clock className="h-4 w-4 text-blue-500" />
      case 'CANCELLED': return <XCircle className="h-4 w-4 text-red-500" />
      case 'REFUNDED': return <XCircle className="h-4 w-4 text-yellow-500" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CHECKED_IN': return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'VALID': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      case 'CANCELLED': return 'bg-red-500/10 text-red-500 border-red-500/20'
      case 'REFUNDED': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 lg:pb-6">
      <div className="border-b border-white/10 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <Ticket className="w-6 h-6 text-[#ff1493]" />
          <h1 className="text-2xl font-mono font-bold tracking-tight text-white">TICKET CONTROL</h1>
        </div>
        <p className="text-white/40 font-mono text-sm">Monitor ticket distribution and check-in status.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
        <div className="border border-[#ff1493]/30 bg-[#ff1493]/5 p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <Ticket className="h-4 w-4 text-[#ff1493]" />
            <span className="text-[10px] font-mono text-white/40 tracking-widest">TOTAL</span>
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-[#ff1493]">{stats.total}</div>
        </div>
        <div className="border border-green-500/30 bg-green-500/5 p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <span className="text-[10px] font-mono text-white/40 tracking-widest">CHECKED IN</span>
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-green-400">{stats.checkedIn}</div>
        </div>
        <div className="col-span-2 sm:col-span-1 border border-blue-500/30 bg-blue-500/5 p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <Clock className="h-4 w-4 text-blue-400" />
            <span className="text-[10px] font-mono text-white/40 tracking-widest">VALID</span>
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-blue-400">{stats.pending}</div>
        </div>
      </div>

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Tickets</CardTitle>
          <CardDescription>Last 100 tickets issued</CardDescription>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tickets yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium">Ticket ID</th>
                    <th className="pb-3 font-medium">Holder</th>
                    <th className="pb-3 font-medium">Event</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Price</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Event Date</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="border-b last:border-0">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <QrCode className="h-4 w-4 text-muted-foreground" />
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {ticket.id.slice(0, 8)}...
                          </code>
                        </div>
                      </td>
                      <td className="py-3">
                        <div>
                          <p className="font-medium">
                            {ticket.user?.firstName} {ticket.user?.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">{ticket.user?.email}</p>
                        </div>
                      </td>
                      <td className="py-3">
                        <Link 
                          href={`/e/${ticket.event?.slug}`}
                          className="hover:text-[#ff1493] transition-colors"
                        >
                          {ticket.event?.title || 'Unknown Event'}
                        </Link>
                      </td>
                      <td className="py-3">
                        <Badge variant="outline">{ticket.ticketTier?.name}</Badge>
                      </td>
                      <td className="py-3 font-medium">
                        {ticket.ticketTier?.price ? formatCurrency(ticket.ticketTier.price) : 'Free'}
                      </td>
                      <td className="py-3">
                        <Badge variant="outline" className={`${getStatusColor(ticket.status)} flex items-center gap-1 w-fit`}>
                          {getStatusIcon(ticket.status)}
                          {ticket.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {ticket.event?.startsAt 
                          ? new Date(ticket.event.startsAt).toLocaleDateString()
                          : 'TBD'}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/orders/${ticket.order?.id}`}>
                              View Order
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
