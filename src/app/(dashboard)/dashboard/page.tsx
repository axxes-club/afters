import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { getEffectiveUserId } from "@/lib/auth-utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarDays, Plus, Ticket, DollarSign } from "lucide-react"

export default async function DashboardPage() {
  const userId = await getEffectiveUserId()

  if (!userId) {
    redirect("/sign-in")
  }

  // Check if user has an organizer profile
  const organizerProfile = await prisma.organizerProfile.findUnique({
    where: { userId },
    include: {
      events: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  })

  // If no organizer profile, redirect to onboarding
  if (!organizerProfile) {
    redirect("/dashboard/onboarding")
  }

  type EventType = typeof organizerProfile.events[number]

  // Get stats
  const totalEvents = await prisma.event.count({
    where: { organizerId: organizerProfile.id },
  })

  const totalTicketsSold = await prisma.ticket.count({
    where: {
      event: {
        organizerId: organizerProfile.id,
      },
    },
  })

  const totalRevenue = await prisma.order.aggregate({
    where: {
      event: {
        organizerId: organizerProfile.id,
      },
      status: "PAID",
    },
    _sum: {
      subtotal: true,
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {organizerProfile.displayName}</h1>
          <p className="text-muted-foreground">
            Here&apos;s what&apos;s happening with your events
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/events/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Event
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEvents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTicketsSold}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${((totalRevenue._sum.subtotal || 0) / 100).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stripe Connect Status */}
      {!organizerProfile.stripeChargesEnabled && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardHeader>
            <CardTitle className="text-yellow-800 dark:text-yellow-200">
              Complete Your Payout Setup
            </CardTitle>
            <CardDescription className="text-yellow-700 dark:text-yellow-300">
              You need to set up payouts before you can publish events and receive payments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/dashboard/settings/payouts">Set Up Payouts</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
          <CardDescription>Your latest created events</CardDescription>
        </CardHeader>
        <CardContent>
          {organizerProfile.events.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No events yet. Create your first event to get started!
            </p>
          ) : (
            <div className="space-y-4">
              {organizerProfile.events.map((event: EventType) => (
                <Link
                  key={event.id}
                  href={`/dashboard/events/${event.id}`}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted transition-colors"
                >
                  <div>
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.startsAt).toLocaleDateString()} at {event.venueName}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      event.status === "PUBLISHED"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {event.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
