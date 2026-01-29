import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Calendar, Building2, Ticket } from "lucide-react"

export default async function SuperadminOverview() {
  const [userCount, eventCount, orgCount, ticketCount] = await Promise.all([
    prisma.user.count(),
    prisma.event.count(),
    prisma.organizerProfile.count(),
    prisma.ticket.count(),
  ])

  const stats = [
    { title: "Total Users", value: userCount, icon: Users, color: "text-blue-500" },
    { title: "Total Events", value: eventCount, icon: Calendar, color: "text-[#ff1493]" },
    { title: "Organizations", value: orgCount, icon: Building2, color: "text-purple-500" },
    { title: "Tickets Sold", value: ticketCount, icon: Ticket, color: "text-orange-500" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Superadmin Overview</h1>
        <p className="text-muted-foreground">Welcome back, Boss. Here&apos;s the state of the Afters empire.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
          </CardHeader>
          <CardContent>
            {/* TODO: List recent users */}
            <p className="text-sm text-muted-foreground">User list coming soon...</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm font-medium">All systems operational (probably)</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
