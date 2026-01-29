import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { prisma } from "@/lib/prisma"
import { getEffectiveUserId } from "@/lib/auth-utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, CalendarDays, MapPin, Users, MoreHorizontal, Pencil, Eye, Ticket } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatCents } from "@/lib/stripe"

export default async function DashboardEventsPage() {
  const userId = await getEffectiveUserId()

  if (!userId) {
    redirect("/sign-in")
  }

  const organizerProfile = await prisma.organizerProfile.findUnique({
    where: { userId },
  })

  if (!organizerProfile) {
    redirect("/dashboard/onboarding")
  }

  const events = await prisma.event.findMany({
    where: { organizerId: organizerProfile.id },
    include: {
      ticketTiers: true,
      _count: {
        select: { tickets: true },
      },
    },
    orderBy: { startsAt: "desc" },
  })

  type EventType = (typeof events)[number]

  const getStatusBadge = (event: EventType) => {
    const now = new Date()
    if (event.status === "DRAFT") {
      return <Badge variant="secondary">Draft</Badge>
    }
    if (event.status === "CANCELLED") {
      return <Badge variant="destructive">Cancelled</Badge>
    }
    if (new Date(event.startsAt) < now) {
      return <Badge variant="outline">Past</Badge>
    }
    if (event.isPublished) {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Live</Badge>
    }
    return <Badge variant="secondary">Unpublished</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Events</h1>
          <p className="text-muted-foreground">
            Manage your events and track ticket sales
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/events/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Event
          </Link>
        </Button>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No events yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first event to start selling tickets
            </p>
            <Button asChild>
              <Link href="/dashboard/events/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Event
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {events.map((event) => {
            const totalCapacity = event.ticketTiers.reduce((sum, t) => sum + (t.quantity || 0), 0)
            const ticketsSold = event._count.tickets

            return (
              <Card key={event.id} className="overflow-hidden">
                <div className="flex">
                  {/* Event Image */}
                  <div className="relative w-32 h-32 shrink-0">
                    {event.flyerUrl ? (
                      <Image
                        src={event.flyerUrl}
                        alt={event.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <CalendarDays className="h-8 w-8 text-primary/40" />
                      </div>
                    )}
                  </div>

                  {/* Event Details */}
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{event.title}</h3>
                            {getStatusBadge(event)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <CalendarDays className="h-4 w-4" />
                              {new Date(event.startsAt).toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {event.venueName}
                            </span>
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/events/${event.id}`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/e/${organizerProfile.slug}-${event.slug}`} target="_blank">
                                <Eye className="mr-2 h-4 w-4" />
                                View Public Page
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/events/${event.id}/check-in`}>
                                <Ticket className="mr-2 h-4 w-4" />
                                Check-in
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 mt-3 text-sm">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {ticketsSold} / {totalCapacity || "∞"} sold
                        </span>
                      </div>
                      {event.ticketTiers.length > 0 && (
                        <div>
                          From{" "}
                          <span className="font-medium">
                            {formatCents(Math.min(...event.ticketTiers.map((t) => t.price)))}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
