import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { formatCents } from "@/lib/stripe"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { CalendarDays, MapPin } from "lucide-react"

const CITIES = [
  "All Cities",
  "New York",
  "Los Angeles",
  "Miami",
  "Las Vegas",
  "Chicago",
  "Atlanta",
]

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string }>
}) {
  const { city } = await searchParams
  const selectedCity = city && city !== "All Cities" ? city : null

  const events = await prisma.event.findMany({
    where: {
      isPublished: true,
      status: "PUBLISHED",
      startsAt: {
        gte: new Date(),
      },
      ...(selectedCity && { city: selectedCity }),
    },
    include: {
      organizer: {
        select: {
          displayName: true,
          slug: true,
        },
      },
      ticketTiers: {
        where: { isVisible: true },
        orderBy: { price: "asc" },
        take: 1,
      },
    },
    orderBy: { startsAt: "asc" },
  })

  type EventType = typeof events[number]

  return (
    <div className="min-h-screen">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Discover Events</h1>

        {/* City Filter */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {CITIES.map((c) => (
            <Button
              key={c}
              variant={
                (c === "All Cities" && !selectedCity) || c === selectedCity
                  ? "default"
                  : "outline"
              }
              size="sm"
              asChild
            >
              <Link href={c === "All Cities" ? "/events" : `/events?city=${c}`}>
                {c}
              </Link>
            </Button>
          ))}
        </div>

        {/* Events Grid */}
        {events.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No events found{selectedCity ? ` in ${selectedCity}` : ""}.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event: EventType) => {
              const lowestPrice = event.ticketTiers[0]?.price || 0

              return (
                <Link
                  key={event.id}
                  href={`/e/${event.organizer.slug}-${event.slug}`}
                  className="group block rounded-lg border bg-card overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {event.flyerUrl ? (
                    <img
                      src={event.flyerUrl}
                      alt={event.title}
                      className="w-full aspect-[4/3] object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-[4/3] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <CalendarDays className="h-12 w-12 text-primary/40" />
                    </div>
                  )}
                  <div className="p-4">
                    <p className="text-sm text-muted-foreground mb-1">
                      {event.organizer.displayName}
                    </p>
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                      {event.title}
                    </h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-4 w-4" />
                        {new Date(event.startsAt).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {event.venueName}
                      </span>
                    </div>
                    <p className="mt-3 font-medium">
                      From {formatCents(lowestPrice)}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
