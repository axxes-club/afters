import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"
import { formatCents } from "@/lib/stripe"
import { CalendarDays, MapPin, ArrowRight } from "lucide-react"

export default async function HomePage() {
  // Get upcoming events
  const events = await prisma.event.findMany({
    where: {
      isPublished: true,
      status: "PUBLISHED",
      startsAt: {
        gte: new Date(),
      },
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
    take: 6,
  })

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-b from-background to-muted py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            The Night Starts Here
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Discover the best nightlife events, after-parties, and exclusive experiences in your city.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/events">
                Browse Events
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/dashboard">Host an Event</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Upcoming Events</h2>
            <Button variant="ghost" asChild>
              <Link href="/events">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No upcoming events yet. Be the first to host one!</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => {
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
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {event.city}
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
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-muted">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Host?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Create your event in minutes. Get instant payouts. Reach thousands of nightlife enthusiasts.
          </p>
          <Button size="lg" asChild>
            <Link href="/dashboard">Get Started Free</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Afters. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
