import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Header } from "@/components/layout/header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { QRCodeSVG } from "qrcode.react"
import { CalendarDays, MapPin } from "lucide-react"

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
                    <Card key={ticket.id} className="overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="font-medium">{ticket.ticketTier.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {ticket.ticketNumber}
                            </p>
                          </div>
                          <Badge
                            variant={
                              ticket.status === "CHECKED_IN"
                                ? "secondary"
                                : ticket.status === "VALID"
                                ? "default"
                                : "destructive"
                            }
                          >
                            {ticket.status === "CHECKED_IN"
                              ? "Used"
                              : ticket.status === "VALID"
                              ? "Valid"
                              : ticket.status}
                          </Badge>
                        </div>

                        <div className="flex justify-center p-4 bg-white rounded-lg">
                          <QRCodeSVG
                            value={ticket.id}
                            size={150}
                            level="H"
                            includeMargin
                          />
                        </div>

                        {ticket.status === "CHECKED_IN" && ticket.checkedInAt && (
                          <p className="text-xs text-center text-muted-foreground mt-4">
                            Checked in at{" "}
                            {new Date(ticket.checkedInAt).toLocaleTimeString()}
                          </p>
                        )}
                      </CardContent>
                    </Card>
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
