import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Header } from "@/components/layout/header"
import { Card, CardContent } from "@/components/ui/card"
import { CalendarDays, MapPin } from "lucide-react"
import { TicketCard } from "./TicketCard"

export default async function MyTicketsPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  const tickets = await prisma.ticket.findMany({
    where: { userId },
    include: {
      event: {
        select: {
          title: true,
          startsAt: true,
          venueName: true,
          city: true,
        },
      },
      ticketTier: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      event: {
        startsAt: "asc",
      },
    },
  })

  type TicketWithRelations = typeof tickets[number]
  type EventGroup = { event: TicketWithRelations["event"]; tickets: TicketWithRelations[] }

  // Group tickets by event
  const ticketsByEvent: Record<string, EventGroup> = {}
  for (const ticket of tickets) {
    const eventId = ticket.eventId
    if (!ticketsByEvent[eventId]) {
      ticketsByEvent[eventId] = {
        event: ticket.event,
        tickets: [],
      }
    }
    ticketsByEvent[eventId].tickets.push(ticket)
  }

  const eventGroups = Object.values(ticketsByEvent)

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 pt-24">
        <h1 className="text-3xl font-bold mb-6">My Tickets</h1>

        {eventGroups.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                You don&apos;t have any tickets yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {eventGroups.map((group: EventGroup) => (
              <div key={group.tickets[0].eventId}>
                <div className="mb-4">
                  <h2 className="text-xl font-semibold">{group.event.title}</h2>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-4 w-4" />
                      {new Date(group.event.startsAt).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {group.event.venueName}, {group.event.city}
                    </span>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.tickets.map((ticket: TicketWithRelations) => (
                    <TicketCard
                      key={ticket.id}
                      ticket={{
                        id: ticket.id,
                        ticketNumber: ticket.ticketNumber,
                        status: ticket.status,
                        checkedInAt: ticket.checkedInAt,
                        ticketTier: ticket.ticketTier,
                      }}
                      event={{
                        title: group.event.title,
                        startsAt: group.event.startsAt,
                        venueName: group.event.venueName,
                        city: group.event.city,
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
