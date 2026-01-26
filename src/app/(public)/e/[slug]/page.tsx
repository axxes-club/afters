import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { prisma } from "@/lib/prisma"
import { formatCents } from "@/lib/stripe"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/layout/header"
import { CalendarDays, MapPin, Clock, Users } from "lucide-react"

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: combinedSlug } = await params

  // URL format is {organizer-slug}-{event-slug}
  // Find the organizer by trying different split points
  let event = null
  
  // First try: find by exact event slug (in case someone uses just the event slug)
  event = await prisma.event.findFirst({
    where: {
      isPublished: true,
      slug: combinedSlug,
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
        orderBy: { sortOrder: "asc" },
      },
    },
  })

  // Second try: parse combined slug (organizer-slug + event-slug)
  if (!event) {
    // Try to find by matching organizer slug prefix
    const organizers = await prisma.organizerProfile.findMany({
      select: { slug: true },
    })
    
    for (const org of organizers) {
      if (combinedSlug.startsWith(org.slug + '-')) {
        const eventSlug = combinedSlug.slice(org.slug.length + 1)
        event = await prisma.event.findFirst({
          where: {
            isPublished: true,
            slug: eventSlug,
            organizer: { slug: org.slug },
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
              orderBy: { sortOrder: "asc" },
            },
          },
        })
        if (event) break
      }
    }
  }

  if (!event) {
    notFound()
  }

  type TierType = typeof event.ticketTiers[number]

  const lowestPrice = event.ticketTiers.reduce(
    (min: number, tier: TierType) => (tier.price < min ? tier.price : min),
    event.ticketTiers[0]?.price || 0
  )

  const totalAvailable = event.ticketTiers.reduce(
    (sum: number, tier: TierType) => sum + (tier.quantity - tier.quantitySold),
    0
  )

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 pt-24 pb-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Event Info */}
          <div className="lg:col-span-2 space-y-6">
            {event.flyerUrl && (
              <div className="relative w-full aspect-video">
                <Image
                  src={event.flyerUrl}
                  alt={event.title}
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Presented by {event.organizer.displayName}
              </p>
              <h1 className="text-4xl font-bold">{event.title}</h1>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-muted-foreground" />
                <span>
                  {new Date(event.startsAt).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span>
                  {new Date(event.startsAt).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <span>{event.venueName}, {event.city}</span>
              </div>
              {event.ageRestriction && (
                <Badge variant="secondary">{event.ageRestriction}+</Badge>
              )}
            </div>

            {event.description && (
              <div className="prose dark:prose-invert max-w-none">
                <h2 className="text-xl font-semibold mb-2">About</h2>
                <p className="whitespace-pre-wrap">{event.description}</p>
              </div>
            )}

            <div>
              <h2 className="text-xl font-semibold mb-2">Location</h2>
              <p className="text-muted-foreground">
                {event.venueName}<br />
                {event.venueAddress}<br />
                {event.city}, {event.state}
              </p>
            </div>
          </div>

          {/* Ticket Selection */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Get Tickets</CardTitle>
                <CardDescription>
                  Starting at {formatCents(lowestPrice)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {event.ticketTiers.map((tier: TierType) => {
                  const available = tier.quantity - tier.quantitySold
                  const soldOut = available <= 0

                  return (
                    <div
                      key={tier.id}
                      className={`p-4 rounded-lg border ${soldOut ? "opacity-50" : ""}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{tier.name}</p>
                          {tier.description && (
                            <p className="text-sm text-muted-foreground">{tier.description}</p>
                          )}
                        </div>
                        <p className="font-bold">{formatCents(tier.price)}</p>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {soldOut ? "Sold out" : `${available} left`}
                        </span>
                      </div>
                    </div>
                  )
                })}

                {totalAvailable > 0 ? (
                  <Button className="w-full" size="lg" asChild>
                    <Link href={`/e/${slug}/checkout`}>
                      Select Tickets
                    </Link>
                  </Button>
                ) : (
                  <Button className="w-full" size="lg" disabled>
                    Sold Out
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
