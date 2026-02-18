import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

type EventWithDetails = Prisma.EventGetPayload<{
  include: { organizer: true; _count: { select: { tickets: true; orders: true } } }
}>
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, MapPin, ExternalLink, Ticket, Flag, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EventFlagButton } from "./EventFlagButton"

export default async function EventManagement({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; tab?: string }>
}) {
  const params = await searchParams
  const search = params.search || ""
  const tab = params.tab || "all"

  const [allEvents, flaggedEvents] = await Promise.all([
    prisma.event.findMany({
      where: {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { venueName: { contains: search, mode: "insensitive" } },
        ],
      },
      include: {
        organizer: true,
        _count: {
          select: { tickets: true, orders: true }
        }
      },
      orderBy: { startsAt: "desc" },
      take: 50,
    }),
    prisma.event.findMany({
      where: { isFlagged: true },
      include: {
        organizer: true,
        _count: {
          select: { tickets: true, orders: true }
        }
      },
      orderBy: { flaggedAt: "desc" },
    })
  ])

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 lg:pb-6">
      <div className="border-b border-white/10 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <CalendarDays className="w-6 h-6 text-[#ff1493]" />
          <h1 className="text-2xl font-mono font-bold tracking-tight text-white">EVENT MANAGEMENT</h1>
        </div>
        <p className="text-white/40 font-mono text-sm">Monitor and manage all events across the platform.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
        <div className="border border-[#ff1493]/30 bg-[#ff1493]/5 p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <CalendarDays className="h-4 w-4 text-[#ff1493]" />
            <span className="text-[10px] font-mono text-white/40 tracking-widest">TOTAL</span>
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-[#ff1493]">{allEvents.length}</div>
        </div>
        <div className={`border p-3 sm:p-4 ${flaggedEvents.length > 0 ? 'border-red-500/50 bg-red-500/10' : 'border-white/10 bg-white/[0.02]'}`}>
          <div className="flex items-center justify-between mb-2">
            <Flag className="h-4 w-4 text-red-500" />
            <span className="text-[10px] font-mono text-white/40 tracking-widest">FLAGGED</span>
          </div>
          <div className={`text-xl sm:text-2xl font-mono font-bold ${flaggedEvents.length > 0 ? 'text-red-500' : 'text-white/30'}`}>{flaggedEvents.length}</div>
        </div>
        <div className="col-span-2 sm:col-span-1 border border-green-500/30 bg-green-500/5 p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <Ticket className="h-4 w-4 text-green-400" />
            <span className="text-[10px] font-mono text-white/40 tracking-widest">LIVE</span>
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-green-400">
            {allEvents.filter(e => e.isPublished).length}
          </div>
        </div>
      </div>

      <Tabs defaultValue={tab}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <TabsList>
            <TabsTrigger value="all" asChild>
              <Link href="/superadmin/events?tab=all">All Events</Link>
            </TabsTrigger>
            <TabsTrigger value="flagged" asChild>
              <Link href="/superadmin/events?tab=flagged" className="flex items-center gap-1">
                <Flag className="h-3 w-3" />
                Flagged
                {flaggedEvents.length > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                    {flaggedEvents.length}
                  </Badge>
                )}
              </Link>
            </TabsTrigger>
          </TabsList>
          <form className="flex-1 sm:max-w-sm">
            <Input 
              name="search" 
              placeholder="Search events..." 
              defaultValue={search}
            />
          </form>
        </div>

        <TabsContent value="all" className="mt-4">
          <EventTable events={allEvents} />
        </TabsContent>

        <TabsContent value="flagged" className="mt-4">
          {flaggedEvents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Flag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No flagged events</p>
                <p className="text-muted-foreground text-sm">
                  Events you flag will appear here for review.
                </p>
              </CardContent>
            </Card>
          ) : (
            <EventTable events={flaggedEvents} showFlagReason />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function EventTable({ events, showFlagReason }: { events: EventWithDetails[]; showFlagReason?: boolean }) {
  return (
    <>
      {/* Mobile Cards */}
      <div className="space-y-3 lg:hidden">
        {events.map((event) => (
          <Card key={event.id} className={event.isFlagged ? "border-red-500/30" : ""}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium truncate">{event.title}</h3>
                    {event.isFlagged && <Flag className="h-4 w-4 text-red-500 shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    by {event.organizer.displayName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(event.startsAt).toLocaleDateString()} · {event.venueName}
                  </p>
                  {showFlagReason && event.flagReason && (
                    <p className="text-xs text-red-400 mt-2 flex items-start gap-1">
                      <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                      {event.flagReason}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={event.isPublished ? "default" : "secondary"} className="text-[10px]">
                      {event.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {event._count.tickets} tickets
                    </span>
                  </div>
                </div>
                <EventFlagButton 
                  eventId={event.id} 
                  isFlagged={event.isFlagged}
                  flagReason={event.flagReason}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop Table */}
      <Card className="hidden lg:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-4 text-left font-medium">Event</th>
                  <th className="p-4 text-left font-medium">Organizer</th>
                  <th className="p-4 text-left font-medium">Date & Venue</th>
                  <th className="p-4 text-left font-medium">Stats</th>
                  <th className="p-4 text-left font-medium">Status</th>
                  {showFlagReason && <th className="p-4 text-left font-medium">Flag Reason</th>}
                  <th className="p-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id} className={`border-b transition-colors hover:bg-muted/50 ${event.isFlagged ? "bg-red-500/5" : ""}`}>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {event.isFlagged && <Flag className="h-4 w-4 text-red-500 shrink-0" />}
                        <div>
                          <div className="font-medium">{event.title}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">{event.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-xs">
                        <div className="font-medium">{event.organizer.displayName}</div>
                        <div className="text-muted-foreground">@{event.organizer.slug}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-xs space-y-1">
                        <div className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {new Date(event.startsAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {event.venueName}, {event.city}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-xs space-y-1">
                        <div className="flex items-center gap-1">
                          <Ticket className="h-3 w-3" />
                          Tickets: {event._count.tickets}
                        </div>
                        <div className="text-muted-foreground">
                          Orders: {event._count.orders}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant={event.isPublished ? "default" : "secondary"} className="text-[10px] py-0 uppercase font-bold tracking-widest">
                        {event.status}
                      </Badge>
                    </td>
                    {showFlagReason && (
                      <td className="p-4">
                        <p className="text-xs text-red-400 max-w-[200px] line-clamp-2">
                          {event.flagReason || "-"}
                        </p>
                      </td>
                    )}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <EventFlagButton 
                          eventId={event.id} 
                          isFlagged={event.isFlagged}
                          flagReason={event.flagReason}
                        />
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/e/${event.organizer.slug}-${event.slug}`} target="_blank">
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
