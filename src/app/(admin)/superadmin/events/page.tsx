import { prisma } from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, MapPin, ExternalLink, Ticket } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function EventManagement({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const params = await searchParams
  const search = params.search || ""

  const events = await prisma.event.findMany({
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
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Event Management</h1>
          <p className="text-muted-foreground">Monitor and manage all events across the platform.</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <form className="flex-1 max-w-sm">
          <Input 
            name="search" 
            placeholder="Search events..." 
            defaultValue={search}
          />
        </form>
      </div>

      <Card>
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
                  <th className="p-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4">
                      <div className="font-medium">{event.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{event.slug}</div>
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
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/e/${event.organizer.slug}-${event.slug}`} target="_blank">
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
