import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { prisma } from "@/lib/prisma"
import { formatCents } from "@/lib/stripe"
import { CalendarDays, MapPin, Clock, Users, Lock, Instagram } from "lucide-react"
import { ViewTracker } from "@/components/ViewTracker"
import { auth } from "@clerk/nextjs/server"
import { SaveEventButton } from "@/components/SaveEventButton"

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
    <div className="min-h-screen bg-black text-white font-mono">
      <ViewTracker eventId={event.id} />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-white/5">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight">
            AFTERS<span style={{ color: accentColor }}>.</span>
          </Link>
          <SaveEventButton
            eventId={event.id}
            initialIsSaved={isSaved}
            variant="icon"
            className="text-white/50 hover:text-white"
          />
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-[60vh] md:min-h-[70vh] flex items-end overflow-hidden">
        {event.flyerUrl ? (
          <>
            <Image
              src={event.flyerUrl}
              alt={event.title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(180deg, ${accentColor}10 0%, black 100%)` }}
          />
        )}

        <div className="relative z-10 w-full p-6 md:p-10 pb-8">
          <div className="container mx-auto max-w-4xl">
            {/* Organizer */}
            <div className="flex items-center gap-2 text-xs text-white/50 mb-4 uppercase tracking-wider">
              {event.organizer.logoUrl && (
                <Image
                  src={event.organizer.logoUrl}
                  alt={event.organizer.displayName}
                  width={20}
                  height={20}
                  className="rounded-full"
                />
              )}
              {event.organizer.displayName}
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 uppercase">
              {event.title}
            </h1>

            {/* Info Row */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" style={{ color: accentColor }} />
                <span>{dateStr}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" style={{ color: accentColor }} />
                <span>{timeStr}</span>
              </div>
              <div className="flex items-center gap-2">
                {event.isAddressHidden ? (
                  <>
                    <Lock className="h-4 w-4" style={{ color: accentColor }} />
                    <span>{event.city} • Location TBA</span>
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4" style={{ color: accentColor }} />
                    <span>{event.venueName}, {event.city}</span>
                  </>
                )}
              </div>
              {event.ageRestriction && (
                <span className="px-2 py-0.5 border border-white/20 text-xs uppercase">
                  {event.ageRestriction}+
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Mobile CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 p-4 bg-black border-t border-white/5 safe-area-bottom">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-wider">Starting at</p>
            <p className="text-xl font-bold tabular-nums" style={{ color: accentColor }}>
              {lowestPrice === 0 ? 'FREE' : formatCents(lowestPrice)}
            </p>
          </div>
          {totalAvailable > 0 ? (
            <Link
              href={`/e/${combinedSlug}/checkout`}
              className="flex-1 max-w-[180px] h-12 flex items-center justify-center text-xs font-bold uppercase tracking-wider"
              style={{ backgroundColor: accentColor, color: '#000' }}
            >
              Get Tickets
            </Link>
          ) : (
            <div className="flex-1 max-w-[180px] h-12 flex items-center justify-center text-xs font-bold uppercase tracking-wider bg-white/5 text-white/30">
              Sold Out
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <section className="py-10 md:py-14 pb-32 md:pb-14">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid md:grid-cols-3 gap-8 md:gap-10">
            {/* Main Content */}
            <div className="md:col-span-2 space-y-10">
              {/* Lineup */}
              {lineup.length > 0 && (
                <div>
                  <h2
                    className="text-[10px] font-bold tracking-[0.2em] uppercase mb-4"
                    style={{ color: accentColor }}
                  >
                    Lineup
                  </h2>
                  <div className="space-y-2">
                    {lineup.map((artist, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-4 p-4 border border-white/5 hover:border-white/10 transition-colors"
                      >
                        {artist.imageUrl ? (
                          <Image
                            src={artist.imageUrl}
                            alt={artist.name}
                            width={48}
                            height={48}
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-12 h-12 flex items-center justify-center text-lg font-bold"
                            style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                          >
                            {artist.name.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold truncate">{artist.name}</p>
                          {artist.role && (
                            <p className="text-xs text-white/40">{artist.role}</p>
                          )}
                        </div>
                        {artist.socialUrl && (
                          <a
                            href={artist.socialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-white/30 hover:text-white transition-colors"
                          >
                            <Instagram className="h-4 w-4" />
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
                  <h2
                    className="text-[10px] font-bold tracking-[0.2em] uppercase mb-4"
                    style={{ color: accentColor }}
                  >
                    About
                  </h2>
                  <p className="text-sm text-white/60 whitespace-pre-wrap leading-relaxed">
                    {event.description}
                  </p>
                </div>
              )}

              {/* Venue */}
              <div>
                <h2
                  className="text-[10px] font-bold tracking-[0.2em] uppercase mb-4"
                  style={{ color: accentColor }}
                >
                  Location
                </h2>
                {event.isAddressHidden ? (
                  <div className="p-4 border border-white/5" style={{ borderLeftWidth: '2px', borderLeftColor: accentColor }}>
                    <div className="flex items-center gap-3 mb-1">
                      <Lock className="h-4 w-4" style={{ color: accentColor }} />
                      <p className="font-bold text-sm">Address Revealed After Purchase</p>
                    </div>
                    <p className="text-xs text-white/40 ml-7">
                      The exact location will be sent to you after you purchase tickets.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1 text-sm text-white/60">
                    <p className="font-bold text-white">{event.venueName}</p>
                    <p>{event.venueAddress}</p>
                    <p>{event.city}{event.state ? `, ${event.state}` : ''}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar - Desktop */}
            <div className="hidden md:block">
              <div className="sticky top-20 border border-white/5">
                <div
                  className="px-4 py-3 border-b border-white/5"
                  style={{ backgroundColor: `${accentColor}10` }}
                >
                  <h3 className="text-xs font-bold uppercase tracking-wider">Get Tickets</h3>
                </div>

                <div className="p-4 space-y-2">
                  {availableTiers.map((tier: TierType) => {
                    const available = tier.quantity - tier.quantitySold
                    const soldOut = available <= 0

                    return (
                      <div
                        key={tier.id}
                        className={`p-3 border border-white/5 ${soldOut ? 'opacity-40' : 'hover:border-white/10'} transition-colors`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <p className="font-bold text-sm">{tier.name}</p>
                            {tier.description && (
                              <p className="text-xs text-white/40">{tier.description}</p>
                            )}
                          </div>
                          <p className="font-bold tabular-nums" style={{ color: accentColor }}>
                            {tier.price === 0 ? 'FREE' : formatCents(tier.price)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-white/30 uppercase tracking-wider">
                          <Users className="h-3 w-3" />
                          {soldOut ? "Sold out" : `${available} left`}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="p-4 pt-0">
                  {totalAvailable > 0 ? (
                    <Link
                      href={`/e/${combinedSlug}/checkout`}
                      className="w-full h-11 flex items-center justify-center text-xs font-bold uppercase tracking-wider"
                      style={{ backgroundColor: accentColor, color: '#000' }}
                    >
                      Get Tickets
                    </Link>
                  ) : (
                    <div className="w-full h-11 flex items-center justify-center text-xs font-bold uppercase tracking-wider bg-white/5 text-white/30">
                      Sold Out
                    </div>
                  )}
                </div>

                {/* Organizer */}
                <div className="p-4 border-t border-white/5">
                  <div className="flex items-center gap-3">
                    {event.organizer.logoUrl ? (
                      <Image
                        src={event.organizer.logoUrl}
                        alt={event.organizer.displayName}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    ) : (
                      <div
                        className="w-8 h-8 flex items-center justify-center font-bold text-sm"
                        style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                      >
                        {event.organizer.displayName.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-white/30 uppercase tracking-wider">Presented by</p>
                      <p className="text-sm font-medium truncate">{event.organizer.displayName}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 px-4">
        <div className="container mx-auto flex justify-between items-center text-[10px] text-white/20 uppercase tracking-wider">
          <span>&copy; {new Date().getFullYear()} Afters</span>
          <a
            href="https://afters.fm"
            className="hover:text-white/40 transition-colors"
          >
            afters.fm
          </a>
        </div>
      </footer>
    </div>
  )
}
