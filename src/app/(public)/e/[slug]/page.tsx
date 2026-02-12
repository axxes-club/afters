import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { prisma } from "@/lib/prisma"
import { formatCents } from "@/lib/stripe"
import { CalendarDays, MapPin, Clock, Users, Lock, Instagram, ArrowRight, Ticket } from "lucide-react"
import { ViewTracker } from "@/components/ViewTracker"

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

  let event = null

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

  type TierType = typeof event.ticketTiers[number]

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
  const accentColor = event.accentColor || '#ff1493'

  const eventDate = new Date(event.startsAt)
  const dayStr = eventDate.toLocaleDateString("en-US", { weekday: "long" })
  const dateStr = eventDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  }).toUpperCase()
  const yearStr = eventDate.getFullYear()
  const timeStr = eventDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })

  return (
    <div className="min-h-screen bg-black text-white relative">
      <ViewTracker eventId={event.id} />

      {/* Noise texture overlay */}
      <div className="fixed inset-0 pointer-events-none grain z-50" />

      {/* Hero Section */}
      <section className="relative min-h-[85vh] md:min-h-[90vh] flex items-end overflow-hidden">
        {/* Background Image with Parallax Effect */}
        {event.flyerUrl ? (
          <div className="absolute inset-0 group">
            <Image
              src={event.flyerUrl}
              alt={event.title}
              fill
              className="object-cover img-zoom"
              priority
            />
            {/* Multi-layer gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />
            {/* Scanline effect */}
            <div className="absolute inset-0 scanlines opacity-40" />
          </div>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse at 30% 20%, ${accentColor}15 0%, transparent 50%),
                radial-gradient(ellipse at 70% 80%, ${accentColor}10 0%, transparent 50%),
                linear-gradient(180deg, #0a0a0a 0%, #000000 100%)
              `
            }}
          />
        )}

        {/* Floating Date Badge */}
        <div
          className="absolute top-24 right-6 md:right-12 animate-float hidden md:block"
          style={{ animationDelay: '0.5s' }}
        >
          <div
            className="w-24 h-24 flex flex-col items-center justify-center border-2"
            style={{ borderColor: accentColor, backgroundColor: 'rgba(0,0,0,0.8)' }}
          >
            <span className="font-headline text-3xl" style={{ color: accentColor }}>{eventDate.getDate()}</span>
            <span className="font-mono text-[10px] tracking-widest text-white/60 uppercase">
              {eventDate.toLocaleDateString("en-US", { month: "short" })}
            </span>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 w-full p-6 md:p-12 lg:p-16 pb-10">
          <div className="container mx-auto max-w-6xl">
            {/* Organizer Tag */}
            <div className="reveal-up reveal-delay-1 flex items-center gap-3 mb-6">
              {event.organizer.logoUrl && (
                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/20">
                  <Image
                    src={event.organizer.logoUrl}
                    alt={event.organizer.displayName}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <span className="font-body text-sm text-white/60 tracking-wide">
                Presented by <span className="text-white">{event.organizer.displayName}</span>
              </span>
            </div>

            {/* Title */}
            <h1 className="reveal-up reveal-delay-2 font-headline text-5xl md:text-7xl lg:text-8xl tracking-wide mb-8 text-glitch">
              {event.title}
            </h1>

            {/* Info Pills */}
            <div className="reveal-up reveal-delay-3 flex flex-wrap gap-3 mb-8">
              <div
                className="flex items-center gap-2.5 px-4 py-2.5 font-body text-sm"
                style={{ backgroundColor: `${accentColor}15`, borderLeft: `3px solid ${accentColor}` }}
              >
                <CalendarDays className="h-4 w-4" style={{ color: accentColor }} />
                <span className="text-white/90">{dayStr}, {dateStr}</span>
              </div>
              <div
                className="flex items-center gap-2.5 px-4 py-2.5 font-body text-sm"
                style={{ backgroundColor: `${accentColor}15`, borderLeft: `3px solid ${accentColor}` }}
              >
                <Clock className="h-4 w-4" style={{ color: accentColor }} />
                <span className="text-white/90">{timeStr}</span>
              </div>
              <div
                className="flex items-center gap-2.5 px-4 py-2.5 font-body text-sm"
                style={{ backgroundColor: `${accentColor}15`, borderLeft: `3px solid ${accentColor}` }}
              >
                {event.isAddressHidden ? (
                  <>
                    <Lock className="h-4 w-4" style={{ color: accentColor }} />
                    <span className="text-white/90">{event.city} • Secret Location</span>
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4" style={{ color: accentColor }} />
                    <span className="text-white/90">{event.venueName}, {event.city}</span>
                  </>
                )}
              </div>
              {event.ageRestriction && (
                <div className="flex items-center px-4 py-2.5 border border-white/20 font-mono text-xs">
                  <span className="text-white/70">{event.ageRestriction}+ ONLY</span>
                </div>
              )}
            </div>

            {/* Desktop CTA */}
            <div className="reveal-up reveal-delay-4 hidden md:flex items-center gap-6">
              {totalAvailable > 0 ? (
                <Link
                  href={`/e/${combinedSlug}/checkout`}
                  className="btn-premium group flex items-center gap-3 px-8 py-4 font-headline text-xl tracking-wider"
                  style={{ backgroundColor: accentColor, color: '#000' }}
                >
                  <span>GET TICKETS</span>
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              ) : (
                <div className="px-8 py-4 font-headline text-xl tracking-wider bg-white/5 text-white/30">
                  SOLD OUT
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-body text-xs text-white/40 uppercase tracking-wider">Starting at</span>
                <span className="font-headline text-3xl" style={{ color: accentColor }}>
                  {lowestPrice === 0 ? 'FREE' : formatCents(lowestPrice)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Sticky CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-xl border-t border-white/10 safe-area-bottom">
        <div className="flex items-center justify-between p-4">
          <div>
            <p className="font-body text-[10px] text-white/40 uppercase tracking-wider">From</p>
            <p className="font-headline text-2xl" style={{ color: accentColor }}>
              {lowestPrice === 0 ? 'FREE' : formatCents(lowestPrice)}
            </p>
          </div>
          {totalAvailable > 0 ? (
            <Link
              href={`/e/${combinedSlug}/checkout`}
              className="btn-premium flex items-center gap-2 px-6 py-3.5 font-headline text-base tracking-wider"
              style={{ backgroundColor: accentColor, color: '#000' }}
            >
              <Ticket className="h-4 w-4" />
              GET TICKETS
            </Link>
          ) : (
            <div className="px-6 py-3.5 font-headline text-base tracking-wider bg-white/5 text-white/30">
              SOLD OUT
            </div>
          )}
        </div>
      </div>

      {/* Content Section */}
      <section className="relative py-12 md:py-20 pb-32 md:pb-20 stripe-pattern">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid lg:grid-cols-[1fr_380px] gap-12 lg:gap-16">
            {/* Main Content */}
            <div className="space-y-16">
              {/* Lineup Section */}
              {lineup.length > 0 && (
                <div className="reveal-up">
                  <div className="flex items-center gap-4 mb-8">
                    <h2 className="font-headline text-3xl tracking-wide">LINEUP</h2>
                    <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent" />
                  </div>
                  <div className="grid gap-3">
                    {lineup.map((artist, i) => (
                      <div
                        key={i}
                        className="ticket-card group flex items-center gap-5 p-5 border border-white/5 hover:border-white/15 transition-all bg-white/[0.02]"
                        style={{ animationDelay: `${i * 0.1}s` }}
                      >
                        {artist.imageUrl ? (
                          <div className="relative w-14 h-14 rounded-full overflow-hidden border-2" style={{ borderColor: `${accentColor}50` }}>
                            <Image
                              src={artist.imageUrl}
                              alt={artist.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div
                            className="w-14 h-14 flex items-center justify-center font-headline text-2xl"
                            style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                          >
                            {artist.name.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-headline text-xl tracking-wide group-hover:text-white transition-colors">
                            {artist.name}
                          </p>
                          {artist.role && (
                            <p className="font-body text-sm text-white/40 mt-0.5">{artist.role}</p>
                          )}
                        </div>
                        {artist.socialUrl && (
                          <a
                            href={artist.socialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3 text-white/30 hover:text-white transition-colors hover:scale-110"
                          >
                            <Instagram className="h-5 w-5" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* About Section */}
              {event.description && (
                <div className="reveal-up">
                  <div className="flex items-center gap-4 mb-8">
                    <h2 className="font-headline text-3xl tracking-wide">ABOUT</h2>
                    <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent" />
                  </div>
                  <div className="relative pl-6 border-l-2" style={{ borderColor: `${accentColor}50` }}>
                    <p className="font-body text-base text-white/70 whitespace-pre-wrap leading-relaxed">
                      {event.description}
                    </p>
                  </div>
                </div>
              )}

              {/* Location Section */}
              <div className="reveal-up">
                <div className="flex items-center gap-4 mb-8">
                  <h2 className="font-headline text-3xl tracking-wide">LOCATION</h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent" />
                </div>
                {event.isAddressHidden ? (
                  <div
                    className="p-6 border-l-4"
                    style={{ borderColor: accentColor, backgroundColor: `${accentColor}08` }}
                  >
                    <div className="flex items-center gap-4 mb-3">
                      <div
                        className="w-12 h-12 flex items-center justify-center"
                        style={{ backgroundColor: `${accentColor}20` }}
                      >
                        <Lock className="h-6 w-6" style={{ color: accentColor }} />
                      </div>
                      <div>
                        <p className="font-headline text-xl tracking-wide">SECRET LOCATION</p>
                        <p className="font-body text-sm text-white/50">{event.city}</p>
                      </div>
                    </div>
                    <p className="font-body text-sm text-white/40 pl-16">
                      The exact address will be revealed after you purchase tickets.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="font-headline text-2xl tracking-wide">{event.venueName}</p>
                    <p className="font-body text-base text-white/60">{event.venueAddress}</p>
                    <p className="font-body text-sm text-white/40">
                      {event.city}{event.state ? `, ${event.state}` : ''}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar - Desktop Ticket Panel */}
            <div className="hidden lg:block">
              <div className="sticky top-20">
                {/* Ticket Card Design */}
                <div className="relative border border-white/10 overflow-hidden">
                  {/* Accent top bar */}
                  <div className="h-2" style={{ backgroundColor: accentColor }} />

                  {/* Header */}
                  <div
                    className="px-6 py-4 border-b border-white/10"
                    style={{ backgroundColor: `${accentColor}08` }}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-headline text-xl tracking-wider">TICKETS</h3>
                      <span className="font-mono text-[10px] text-white/40 uppercase tracking-wider">
                        {totalAvailable > 0 ? `${totalAvailable} left` : 'Sold out'}
                      </span>
                    </div>
                  </div>

                  {/* Ticket Tiers */}
                  <div className="p-4 space-y-3">
                    {availableTiers.map((tier: TierType, i: number) => {
                      const available = tier.quantity - tier.quantitySold
                      const soldOut = available <= 0
                      const almostGone = available > 0 && available <= 10

                      return (
                        <div
                          key={tier.id}
                          className={`
                            ticket-card relative p-4 border transition-all
                            ${soldOut
                              ? 'border-white/5 opacity-50'
                              : 'border-white/10 hover:border-white/20 cursor-pointer'
                            }
                          `}
                          style={!soldOut ? { borderLeftWidth: '3px', borderLeftColor: accentColor } : undefined}
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-headline text-lg tracking-wide">{tier.name}</p>
                                {almostGone && (
                                  <span
                                    className="px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider"
                                    style={{ backgroundColor: `${accentColor}30`, color: accentColor }}
                                  >
                                    Almost Gone
                                  </span>
                                )}
                              </div>
                              {tier.description && (
                                <p className="font-body text-xs text-white/40 mb-2">{tier.description}</p>
                              )}
                              <div className="flex items-center gap-2 text-white/30">
                                <Users className="h-3 w-3" />
                                <span className="font-mono text-[10px] uppercase tracking-wider">
                                  {soldOut ? "Sold out" : `${available} available`}
                                </span>
                              </div>
                            </div>
                            <p className="font-headline text-2xl" style={{ color: soldOut ? 'rgba(255,255,255,0.3)' : accentColor }}>
                              {tier.price === 0 ? 'FREE' : formatCents(tier.price)}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* CTA Button */}
                  <div className="p-4 pt-0">
                    {totalAvailable > 0 ? (
                      <Link
                        href={`/e/${combinedSlug}/checkout`}
                        className="btn-premium w-full flex items-center justify-center gap-2 py-4 font-headline text-lg tracking-wider"
                        style={{ backgroundColor: accentColor, color: '#000' }}
                      >
                        <Ticket className="h-5 w-5" />
                        GET TICKETS
                      </Link>
                    ) : (
                      <div className="w-full flex items-center justify-center py-4 font-headline text-lg tracking-wider bg-white/5 text-white/30">
                        SOLD OUT
                      </div>
                    )}
                  </div>

                  {/* Tear effect divider */}
                  <div className="relative py-4">
                    <div className="absolute left-0 top-1/2 w-4 h-8 -translate-y-1/2 -translate-x-1/2 bg-black rounded-r-full" />
                    <div className="absolute right-0 top-1/2 w-4 h-8 -translate-y-1/2 translate-x-1/2 bg-black rounded-l-full" />
                    <div className="border-t border-dashed border-white/10 mx-6" />
                  </div>

                  {/* Organizer */}
                  <div className="p-4 pt-0">
                    <div className="flex items-center gap-4 p-4 bg-white/[0.02]">
                      {event.organizer.logoUrl ? (
                        <div className="relative w-12 h-12 rounded-full overflow-hidden border border-white/10">
                          <Image
                            src={event.organizer.logoUrl}
                            alt={event.organizer.displayName}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div
                          className="w-12 h-12 flex items-center justify-center font-headline text-xl"
                          style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                        >
                          {event.organizer.displayName.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-[10px] text-white/30 uppercase tracking-wider mb-0.5">Hosted by</p>
                        <p className="font-body text-sm font-semibold truncate">{event.organizer.displayName}</p>
                      </div>
                      {event.organizer.instagramUrl && (
                        <a
                          href={event.organizer.instagramUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-white/30 hover:text-white transition-colors"
                        >
                          <Instagram className="h-5 w-5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-4">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <Link href="/" className="font-headline text-xl tracking-wide text-white/40 hover:text-white transition-colors">
            AFTERS<span style={{ color: accentColor }}>.</span>
          </Link>
          <div className="flex items-center gap-6 text-white/30 font-body text-sm">
            <span>&copy; {new Date().getFullYear()} Afters</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <a href="https://afters.fm" className="hover:text-white transition-colors">
              afters.fm
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
