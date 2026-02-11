import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { prisma } from "@/lib/prisma"
import { formatCents } from "@/lib/stripe"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/layout/header"
import { CalendarDays, MapPin, Clock, Users, Lock, Instagram } from "lucide-react"
import { ViewTracker } from "@/components/ViewTracker"
import { auth } from "@clerk/nextjs/server"
import { SaveEventButton } from "@/components/SaveEventButton"
import { cn } from "@/lib/utils"

// Force dynamic rendering - no caching
export const dynamic = "force-dynamic"
export const revalidate = 0

interface LineupArtist {
  name: string
  role?: string
  imageUrl?: string
  socialUrl?: string
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: combinedSlug } = await params
  
  // URL format is {organizer-slug}-{event-slug}
  let event = null
  
  // First try: find by exact event slug
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
          logoUrl: true,
          instagramUrl: true,
          stripeChargesEnabled: true,
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
                logoUrl: true,
                instagramUrl: true,
                stripeChargesEnabled: true,
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

  const { userId } = await auth()
  const isSaved = userId ? !!(await prisma.savedEvent.findUnique({
    where: {
      userId_eventId: {
        userId,
        eventId: event.id,
      },
    },
  })) : false

  type TierType = typeof event.ticketTiers[number]

  // Filter out paid tiers if Stripe is not enabled
  const availableTiers = event.organizer.stripeChargesEnabled
    ? event.ticketTiers
    : event.ticketTiers.filter((tier: TierType) => tier.price === 0)

  const lowestPrice = availableTiers.reduce(
    (min: number, tier: TierType) => (tier.price < min ? tier.price : min),
    availableTiers[0]?.price || 0
  )

  const totalAvailable = availableTiers.reduce(
    (sum: number, tier: TierType) => sum + (tier.quantity - tier.quantitySold),
    0
  )

  const lineup = (event.lineup as LineupArtist[] | null) || []
  const isUnderground = event.pageTheme === 'underground' || event.pageTheme === 'minimal'
  const accentColor = event.accentColor || '#ff1493'

  // Format date for display
  const eventDate = new Date(event.startsAt)
  const dateStr = eventDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).toUpperCase()
  const timeStr = eventDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })

  return (
    <div 
      className="min-h-screen bg-black text-white"
      style={{ '--accent': accentColor } as React.CSSProperties}
    >
      <ViewTracker eventId={event.id} />
      
      {/* Floating Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight">
            AFTERS<span style={{ color: accentColor }}>.</span>
          </Link>
          <SaveEventButton 
            eventId={event.id} 
            initialIsSaved={isSaved} 
            variant="icon"
            className="text-white hover:text-white/80"
          />
        </div>
      </header>

      {/* Hero Section - Full Bleed Flyer */}
      <section className="relative min-h-[70vh] md:min-h-[80vh] flex items-end">
        {event.flyerUrl ? (
          <>
            <Image
              src={event.flyerUrl}
              alt={event.title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          </>
        ) : (
          <div 
            className="absolute inset-0" 
            style={{ background: `linear-gradient(135deg, ${accentColor}20 0%, black 100%)` }}
          />
        )}
        
        {/* Event Info Overlay */}
        <div className="relative z-10 w-full p-6 md:p-10 pb-8">
          <div className="container mx-auto max-w-4xl">
            {/* Organizer */}
            <div className="inline-flex items-center gap-2 text-sm text-white/60 mb-4">
              {event.organizer.logoUrl && (
                <Image
                  src={event.organizer.logoUrl}
                  alt={event.organizer.displayName}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              )}
              {event.organizer.displayName}
            </div>
            
            {/* Title */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              {event.title}
            </h1>
            
            {/* Quick Info Row */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-white/80">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" style={{ color: accentColor }} />
                <span className="font-medium">{dateStr}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" style={{ color: accentColor }} />
                <span>{timeStr}</span>
              </div>
              <div className="flex items-center gap-2">
                {event.isAddressHidden ? (
                  <>
                    <Lock className="h-5 w-5" style={{ color: accentColor }} />
                    <span>{event.city} • Location TBA</span>
                  </>
                ) : (
                  <>
                    <MapPin className="h-5 w-5" style={{ color: accentColor }} />
                    <span>{event.venueName}, {event.city}</span>
                  </>
                )}
              </div>
              {event.ageRestriction && (
                <Badge 
                  variant="outline" 
                  className="border-white/30 text-white"
                >
                  {event.ageRestriction}+
                </Badge>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Sticky Ticket CTA - Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 p-4 bg-black/95 backdrop-blur-lg border-t border-white/10 safe-area-bottom">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-white/60">Starting at</p>
            <p className="text-xl font-bold" style={{ color: accentColor }}>
              {lowestPrice === 0 ? 'FREE' : formatCents(lowestPrice)}
            </p>
          </div>
          {totalAvailable > 0 ? (
            <Button
              size="lg"
              className="flex-1 max-w-[200px] font-bold"
              style={{ backgroundColor: accentColor }}
              asChild
            >
              <Link href={`/e/${combinedSlug}/checkout`}>
                Get Tickets
              </Link>
            </Button>
          ) : (
            <Button size="lg" disabled className="flex-1 max-w-[200px]">
              Sold Out
            </Button>
          )}
        </div>
      </div>

      {/* Content Section */}
      <section className="py-12 md:py-16 pb-32 md:pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {/* Main Content */}
            <div className="md:col-span-2 space-y-10">
              {/* Lineup */}
              {lineup.length > 0 && (
                <div>
                  <h2 className="text-sm font-bold tracking-widest text-white/40 uppercase mb-6">
                    Lineup
                  </h2>
                  <div className="space-y-4">
                    {lineup.map((artist, i) => (
                      <div 
                        key={i} 
                        className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        {artist.imageUrl ? (
                          <Image
                            src={artist.imageUrl}
                            alt={artist.name}
                            width={56}
                            height={56}
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <div 
                            className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
                            style={{ backgroundColor: `${accentColor}30`, color: accentColor }}
                          >
                            {artist.name.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-lg truncate">{artist.name}</p>
                          {artist.role && (
                            <p className="text-sm text-white/50">{artist.role}</p>
                          )}
                        </div>
                        {artist.socialUrl && (
                          <a 
                            href={artist.socialUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 rounded-full hover:bg-white/10 transition-colors"
                          >
                            <Instagram className="h-5 w-5 text-white/50" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {event.description && (
                <div>
                  <h2 className="text-sm font-bold tracking-widest text-white/40 uppercase mb-4">
                    About
                  </h2>
                  <p className="text-white/70 whitespace-pre-wrap leading-relaxed">
                    {event.description}
                  </p>
                </div>
              )}

              {/* Venue Info */}
              <div>
                <h2 className="text-sm font-bold tracking-widest text-white/40 uppercase mb-4">
                  Location
                </h2>
                {event.isAddressHidden ? (
                  <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3 mb-2">
                      <Lock className="h-5 w-5" style={{ color: accentColor }} />
                      <p className="font-bold">Address Revealed After Purchase</p>
                    </div>
                    <p className="text-white/50 text-sm">
                      The exact location will be sent to you after you purchase tickets.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1 text-white/70">
                    <p className="font-bold text-white">{event.venueName}</p>
                    <p>{event.venueAddress}</p>
                    <p>{event.city}{event.state ? `, ${event.state}` : ''}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar - Ticket Card (Desktop) */}
            <div className="hidden md:block">
              <div className="sticky top-24 p-6 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="font-bold text-lg mb-4">Get Tickets</h3>
                
                <div className="space-y-3 mb-6">
                  {availableTiers.map((tier: TierType) => {
                    const available = tier.quantity - tier.quantitySold
                    const soldOut = available <= 0

                    return (
                      <div
                        key={tier.id}
                        className={cn(
                          "p-4 rounded-xl border border-white/10 transition-colors",
                          soldOut ? "opacity-50" : "hover:border-white/20"
                        )}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">{tier.name}</p>
                            {tier.description && (
                              <p className="text-sm text-white/50">{tier.description}</p>
                            )}
                          </div>
                          <p className="font-bold" style={{ color: accentColor }}>
                            {tier.price === 0 ? 'FREE' : formatCents(tier.price)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-white/40">
                          <Users className="h-4 w-4" />
                          {soldOut ? "Sold out" : `${available} left`}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {totalAvailable > 0 ? (
                  <Button
                    className="w-full font-bold"
                    size="lg"
                    style={{ backgroundColor: accentColor }}
                    asChild
                  >
                    <Link href={`/e/${combinedSlug}/checkout`}>
                      Get Tickets
                    </Link>
                  </Button>
                ) : (
                  <Button className="w-full" size="lg" disabled>
                    Sold Out
                  </Button>
                )}

                {/* Organizer Card */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <div className="flex items-center gap-3">
                    {event.organizer.logoUrl ? (
                      <Image
                        src={event.organizer.logoUrl}
                        alt={event.organizer.displayName}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                        style={{ backgroundColor: `${accentColor}30`, color: accentColor }}
                      >
                        {event.organizer.displayName.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/50">Presented by</p>
                      <p className="font-medium truncate">
                        {event.organizer.displayName}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
