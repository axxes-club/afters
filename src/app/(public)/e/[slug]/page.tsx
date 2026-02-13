import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { prisma } from "@/lib/prisma"
import { formatCents } from "@/lib/stripe"
import { CalendarDays, MapPin, Clock, Users, Lock, Instagram, ArrowRight, Ticket, ExternalLink } from "lucide-react"
import { ViewTracker } from "@/components/ViewTracker"
import { getSessionUser } from "@/lib/auth-utils"
import EditDesignOverlay from "@/components/public/EventPageClient"
import EventInfoSections from "@/components/public/EventInfoSections"

export const dynamic = "force-dynamic"
export const revalidate = 0

interface LineupArtist {
  name: string
  role?: string
  imageUrl?: string
  socialUrl?: string
  showtime?: string
  showShowtime?: boolean
}

export default async function EventPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ preview_theme?: string; preview_color?: string; preview_typography?: string }>
}) {
  const { slug: combinedSlug } = await params
  const { preview_theme, preview_color, preview_typography } = await searchParams

  let event = null

  event = await prisma.event.findFirst({
    where: {
      isPublished: true,
      slug: combinedSlug,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      flyerUrl: true,
      startsAt: true,
      venueName: true,
      venueAddress: true,
      city: true,
      state: true,
      isAddressHidden: true,
      ageRestriction: true,
      lineup: true,
      isPublished: true,
      accentColor: true,
      pageTheme: true,
      typography: true,
      showLocationOnPage: true,
      showMapOnPage: true,
      locationPrecision: true,
      isRsvpOnly: true,
      rsvpCapacity: true,
      rsvpAllowPlusOnes: true,
      rsvpMaxPlusOnes: true,
      rsvpCount: true,
      about: true,
      refundPolicy: true,
      faqs: true,
      organizer: {
        select: {
          id: true,
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
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            flyerUrl: true,
            startsAt: true,
            venueName: true,
            venueAddress: true,
            city: true,
            state: true,
            isAddressHidden: true,
            ageRestriction: true,
            lineup: true,
            isPublished: true,
            accentColor: true,
            pageTheme: true,
            typography: true,
            showLocationOnPage: true,
            showMapOnPage: true,
            locationPrecision: true,
            isRsvpOnly: true,
            rsvpCapacity: true,
            rsvpAllowPlusOnes: true,
            rsvpMaxPlusOnes: true,
            rsvpCount: true,
            about: true,
            refundPolicy: true,
            faqs: true,
            organizer: {
              select: {
                id: true,
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

  // Check if current user is the event owner
  const currentUser = await getSessionUser()
  const isOwner = currentUser?.organizerProfile?.id === event.organizer.id

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

  // RSVP event logic
  const isRsvpEvent = event.isRsvpOnly
  const rsvpAvailable = isRsvpEvent
    ? (event.rsvpCapacity === null || event.rsvpCount < event.rsvpCapacity)
    : false
  const rsvpSpotsLeft = isRsvpEvent && event.rsvpCapacity
    ? event.rsvpCapacity - event.rsvpCount
    : null
  const ctaUrl = isRsvpEvent ? `/e/${combinedSlug}/rsvp` : `/e/${combinedSlug}/checkout`
  const ctaText = isRsvpEvent ? 'RSVP' : 'GET TICKETS'
  const ctaTextLower = isRsvpEvent ? 'RSVP' : 'Reserve'
  const hasAvailability = isRsvpEvent ? rsvpAvailable : totalAvailable > 0

  const lineup = (event.lineup as LineupArtist[] | null) || []

  // Map typography ID to Tailwind class
  const typographyMap: Record<string, string> = {
    mono: 'font-mono',
    headline: 'font-headline',
    elegant: 'font-serif',
    modern: 'font-sans',
  }

  // Create render function that accepts live design
  // Preview params take priority for owners, allowing live preview via URL
  const renderEventPage = (liveDesign?: any) => {
    const accentColor = (isOwner && preview_color) || liveDesign?.accentColor || event.accentColor || '#ff1493'
    const pageTheme = (isOwner && preview_theme) || liveDesign?.pageTheme || event.pageTheme || 'neon'
    const typography = (isOwner && preview_typography) || liveDesign?.typography || event.typography || 'headline'
    const typographyClass = typographyMap[typography] || 'font-headline'

    // Location display logic - use live design if provided
    const showLocationOnPage = liveDesign?.showLocationOnPage ?? event.showLocationOnPage
    const showMapOnPage = liveDesign?.showMapOnPage ?? event.showMapOnPage
    const isAddressHidden = liveDesign?.isAddressHidden ?? event.isAddressHidden
    const showLocation = showLocationOnPage && !isAddressHidden
    const showMap = showMapOnPage && showLocation
    const locationPrecision = event.locationPrecision || 'exact'

    const eventDate = new Date(event.startsAt)
    const dayStr = eventDate.toLocaleDateString("en-US", { weekday: "long" })
    const dateStr = eventDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }).toUpperCase()
    const timeStr = eventDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })

    // Generate Google Maps URL
    const getMapUrl = () => {
      if (!showLocation) return null
      const query = locationPrecision === 'exact'
        ? `${event.venueAddress}, ${event.city}${event.state ? `, ${event.state}` : ''}`
        : locationPrecision === 'area'
          ? `${event.venueName}, ${event.city}`
          : event.city
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
    }

    const getMapEmbedUrl = () => {
      if (!showMap) return null
      const query = locationPrecision === 'exact'
        ? `${event.venueAddress}, ${event.city}${event.state ? `, ${event.state}` : ''}`
        : locationPrecision === 'area'
          ? `${event.venueName}, ${event.city}`
          : event.city
      return `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(query)}&zoom=${locationPrecision === 'exact' ? 16 : locationPrecision === 'area' ? 14 : 12}`
    }

    const mapUrl = getMapUrl()
    const mapEmbedUrl = getMapEmbedUrl()

    // ============================================
    // BRUTALIST TEMPLATE - Raw, grid-exposed, stark
    // ============================================
    if (pageTheme === 'brutalist') {
      return (
        <div className="min-h-screen bg-black text-white font-mono">
          <ViewTracker eventId={event.id} />

        {/* Exposed grid background */}
        <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.04]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(${accentColor} 2px, transparent 2px),
                linear-gradient(90deg, ${accentColor} 2px, transparent 2px)
              `,
              backgroundSize: '100px 100px',
            }}
          />
        </div>

        {/* Top accent bar */}
        <div className="h-4 w-full" style={{ backgroundColor: accentColor }} />

        {/* Two-column harsh grid layout */}
        <div className="relative z-10 grid lg:grid-cols-2 min-h-[calc(100vh-4rem)]">
          {/* Left: Flyer with harsh border */}
          <div className="relative p-6 lg:p-12 flex items-center justify-center border-b-4 lg:border-b-0 lg:border-r-4" style={{ borderColor: accentColor }}>
            {event.flyerUrl ? (
              <div className="relative w-full max-w-md aspect-[3/4] border-8" style={{ borderColor: accentColor }}>
                <Image
                  src={event.flyerUrl}
                  alt={event.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            ) : (
              <div
                className="w-full max-w-md aspect-[3/4] border-8 flex items-center justify-center"
                style={{ borderColor: accentColor, backgroundColor: `${accentColor}10` }}
              >
                <span className={`${typographyClass} text-6xl`} style={{ color: accentColor }}>
                  {event.title.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* Right: Info block */}
          <div className="p-6 lg:p-12 flex flex-col justify-between">
            {/* Header */}
            <div>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-3 h-3" style={{ backgroundColor: accentColor }} />
                <span className="text-xs tracking-[0.3em] uppercase text-white/50">
                  {event.organizer.displayName}
                </span>
              </div>

              <h1 className={`${typographyClass} text-5xl lg:text-7xl font-black tracking-tight mb-8 uppercase`}>
                {event.title}
              </h1>

              {/* Date/Time in monospace blocks */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="border-2 p-4" style={{ borderColor: accentColor }}>
                  <div className="text-[10px] tracking-widest uppercase text-white/40 mb-1">DATE</div>
                  <div className="text-lg font-bold">{dateStr}</div>
                </div>
                <div className="border-2 p-4" style={{ borderColor: accentColor }}>
                  <div className="text-[10px] tracking-widest uppercase text-white/40 mb-1">TIME</div>
                  <div className="text-lg font-bold">{timeStr}</div>
                </div>
                <div className="border-2 p-4" style={{ borderColor: accentColor }}>
                  <div className="text-[10px] tracking-widest uppercase text-white/40 mb-1">PRICE</div>
                  <div className="text-lg font-bold" style={{ color: accentColor }}>
                    {lowestPrice === 0 ? 'FREE' : formatCents(lowestPrice)}
                  </div>
                </div>
              </div>

              {/* Location */}
              {showLocation ? (
                <div className="border-l-4 pl-4 mb-8" style={{ borderColor: accentColor }}>
                  <div className="text-xs tracking-widest uppercase text-white/40 mb-2">LOCATION</div>
                  <div className="text-xl font-bold uppercase">{event.venueName}</div>
                  {locationPrecision === 'exact' && (
                    <div className="text-sm text-white/60 mt-1">{event.venueAddress}</div>
                  )}
                  <div className="text-sm text-white/40 mt-1">{event.city}{event.state ? `, ${event.state}` : ''}</div>
                  {mapUrl && (
                    <a
                      href={mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-3 text-xs tracking-widest uppercase hover:underline"
                      style={{ color: accentColor }}
                    >
                      VIEW MAP <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ) : (
                <div className="border-l-4 pl-4 mb-8" style={{ borderColor: accentColor }}>
                  <div className="text-xs tracking-widest uppercase text-white/40 mb-2">LOCATION</div>
                  <div className="text-xl font-bold uppercase flex items-center gap-3">
                    <Lock className="w-5 h-5" style={{ color: accentColor }} />
                    {event.city} // SECRET
                  </div>
                  <div className="text-xs text-white/40 mt-2">Address revealed on ticket</div>
                </div>
              )}

              {/* Map embed */}
              {showMap && mapEmbedUrl && (
                <div className="mb-8 border-4" style={{ borderColor: accentColor }}>
                  <iframe
                    src={mapEmbedUrl}
                    className="w-full h-48 grayscale contrast-125"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              )}
            </div>

            {/* Lineup */}
            {lineup.length > 0 && (
              <div className="mb-8">
                <div className="text-xs tracking-widest uppercase text-white/40 mb-4">LINEUP</div>
                <div className="flex flex-wrap gap-2">
                  {lineup.map((artist, i) => (
                    <div
                      key={i}
                      className="border-2 px-4 py-2 text-sm font-bold uppercase flex items-center gap-2"
                      style={{ borderColor: accentColor }}
                    >
                      <span>{artist.name}</span>
                      {artist.showtime && artist.showShowtime !== false && (
                        <span className="text-[10px] font-mono text-white/50">
                          {artist.showtime}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="mt-auto">
              {hasAvailability ? (
                <Link
                  href={ctaUrl}
                  className="group block w-full p-6 text-center text-xl font-black tracking-widest uppercase border-4 transition-colors"
                  style={{
                    borderColor: accentColor,
                    ['--accent' as any]: accentColor,
                  }}
                >
                  <span
                    className="transition-colors"
                    style={{ color: accentColor }}
                  >
                    <span className="group-hover:text-black">{ctaText} →</span>
                  </span>
                  <style>{`
                    .group:hover { background-color: var(--accent); }
                  `}</style>
                </Link>
              ) : (
                <div className="w-full p-6 text-center text-xl font-black tracking-widest uppercase border-4 border-white/20 text-white/30">
                  {isRsvpEvent ? 'FULL' : 'SOLD OUT'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile sticky CTA */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-black border-t-4 z-50" style={{ borderColor: accentColor }}>
          {hasAvailability ? (
            <Link
              href={ctaUrl}
              className="block w-full p-4 text-center font-black tracking-widest uppercase"
              style={{ backgroundColor: accentColor, color: '#000' }}
            >
              {ctaText} // {isRsvpEvent ? 'FREE' : (lowestPrice === 0 ? 'FREE' : formatCents(lowestPrice))}
            </Link>
          ) : (
            <div className="w-full p-4 text-center font-black tracking-widest uppercase bg-white/10 text-white/30">
              {isRsvpEvent ? 'FULL' : 'SOLD OUT'}
            </div>
          )}
        </div>

        {/* Info Sections */}
        <div className="relative z-10 px-6 lg:px-12 pb-12">
          <EventInfoSections
            about={event.about}
            refundPolicy={event.refundPolicy}
            faqs={event.faqs}
            variant="brutalist"
            accentColor={accentColor}
          />
        </div>

        {/* Footer */}
        <footer className="relative z-10 py-6 px-6 border-t-4" style={{ borderColor: accentColor }}>
          <div className="flex justify-between items-center text-xs tracking-widest uppercase text-white/30">
            <span style={{ color: accentColor }} className="font-headline text-lg">.</span>
            <a href="https://afters.am" className="hover:text-white transition-colors">afters.am</a>
          </div>
        </footer>
        </div>
      )
    }

    // ============================================
    // NEON TEMPLATE - Glowing, centered, atmospheric
    // ============================================
    if (pageTheme === 'neon') {
      return (
        <div className="min-h-screen bg-black text-white relative overflow-hidden">
          <ViewTracker eventId={event.id} />

        {/* Ambient glow */}
        <div
          className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full blur-[200px] opacity-20 pointer-events-none"
          style={{ backgroundColor: accentColor }}
        />
        <div className="fixed inset-0 pointer-events-none grain z-50 opacity-30" />

        {/* Centered content layout */}
        <div className="relative z-10 min-h-screen flex flex-col items-center px-6 py-12">
          {/* Organizer */}
          <div className="flex items-center gap-3 mb-8">
            {event.organizer.logoUrl && (
              <div className="relative w-8 h-8 rounded-full overflow-hidden border" style={{ borderColor: `${accentColor}50` }}>
                <Image src={event.organizer.logoUrl} alt={event.organizer.displayName} fill className="object-cover" />
              </div>
            )}
            <span className="text-sm text-white/40">{event.organizer.displayName}</span>
          </div>

          {/* Flyer with glow */}
          <div
            className="relative w-full max-w-sm aspect-[3/4] mb-10"
            style={{
              boxShadow: `0 0 80px ${accentColor}40, 0 0 160px ${accentColor}20`,
            }}
          >
            {event.flyerUrl ? (
              <Image
                src={event.flyerUrl}
                alt={event.title}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div
                className="absolute inset-0 flex items-center justify-center border-2"
                style={{ borderColor: accentColor, backgroundColor: `${accentColor}10` }}
              >
                <span className={`${typographyClass} text-8xl`} style={{ color: accentColor }}>
                  {event.title.charAt(0)}
                </span>
              </div>
            )}
            {/* Glow border */}
            <div
              className="absolute inset-0 border-2 pointer-events-none"
              style={{ borderColor: accentColor, boxShadow: `inset 0 0 30px ${accentColor}20` }}
            />
          </div>

          {/* Title with glow */}
          <h1
            className={`${typographyClass} text-4xl md:text-6xl text-center mb-4`}
            style={{
              color: accentColor,
              textShadow: `0 0 60px ${accentColor}80, 0 0 120px ${accentColor}40`,
            }}
          >
            {event.title}
          </h1>

          {/* Date/Time */}
          <div className="flex items-center gap-4 text-sm text-white/50 mb-8">
            <span>{dayStr}</span>
            <span className="w-1 h-1 rounded-full" style={{ backgroundColor: accentColor }} />
            <span>{dateStr}</span>
            <span className="w-1 h-1 rounded-full" style={{ backgroundColor: accentColor }} />
            <span>{timeStr}</span>
          </div>

          {/* Location */}
          <div
            className="px-6 py-4 mb-8 border"
            style={{
              borderColor: `${accentColor}30`,
              backgroundColor: `${accentColor}05`,
              boxShadow: `0 0 30px ${accentColor}10`,
            }}
          >
            {showLocation ? (
              <div className="text-center">
                <div className="text-lg font-medium mb-1">{event.venueName}</div>
                {locationPrecision === 'exact' && (
                  <div className="text-sm text-white/50">{event.venueAddress}</div>
                )}
                <div className="text-sm text-white/40">{event.city}{event.state ? `, ${event.state}` : ''}</div>
                {mapUrl && (
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-3 text-xs hover:underline"
                    style={{ color: accentColor }}
                  >
                    <MapPin className="w-3 h-3" /> Open in Maps
                  </a>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 text-white/60">
                <Lock className="w-4 h-4" style={{ color: accentColor }} />
                <span>{event.city} &bull; Secret Location</span>
              </div>
            )}
          </div>

          {/* Map */}
          {showMap && mapEmbedUrl && (
            <div
              className="w-full max-w-md mb-10 border rounded-lg overflow-hidden"
              style={{ borderColor: `${accentColor}30`, boxShadow: `0 0 40px ${accentColor}20` }}
            >
              <iframe
                src={mapEmbedUrl}
                className="w-full h-48"
                style={{ border: 0, filter: 'saturate(0.8) brightness(0.8)' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          )}

          {/* Lineup */}
          {lineup.length > 0 && (
            <div className="w-full max-w-md mb-10">
              <h2
                className="text-center text-sm tracking-[0.3em] uppercase mb-6"
                style={{ color: accentColor }}
              >
                Lineup
              </h2>
              <div className="space-y-3">
                {lineup.map((artist, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-4 border rounded"
                    style={{ borderColor: `${accentColor}20`, backgroundColor: `${accentColor}05` }}
                  >
                    {artist.imageUrl ? (
                      <div className="relative w-12 h-12 rounded-full overflow-hidden border" style={{ borderColor: `${accentColor}50` }}>
                        <Image src={artist.imageUrl} alt={artist.name} fill className="object-cover" />
                      </div>
                    ) : (
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${accentColor}20` }}
                      >
                        <span style={{ color: accentColor }}>{artist.name.charAt(0)}</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className={`${typographyClass} text-lg`}>{artist.name}</div>
                      {artist.role && <div className="text-sm text-white/40">{artist.role}</div>}
                    </div>
                    {artist.showtime && artist.showShowtime !== false && (
                      <div className="text-sm font-mono" style={{ color: accentColor }}>
                        {artist.showtime}
                      </div>
                    )}
                    {artist.socialUrl && (
                      <a href={artist.socialUrl} target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-white">
                        <Instagram className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="w-full max-w-md mb-10 text-center">
              <p className="text-white/60 leading-relaxed">{event.description}</p>
            </div>
          )}

          {/* Tickets section */}
          <div className="w-full max-w-md mb-10">
            <h2
              className="text-center text-sm tracking-[0.3em] uppercase mb-6"
              style={{ color: accentColor }}
            >
              Tickets
            </h2>
            <div className="space-y-3">
              {availableTiers.map((tier: TierType) => {
                const available = tier.quantity - tier.quantitySold
                const soldOut = available <= 0

                return (
                  <div
                    key={tier.id}
                    className={`p-4 border rounded ${soldOut ? 'opacity-50' : ''}`}
                    style={{ borderColor: `${accentColor}30`, backgroundColor: `${accentColor}05` }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className={`${typographyClass} text-lg`}>{tier.name}</div>
                        {tier.description && <div className="text-sm text-white/40 mt-1">{tier.description}</div>}
                        <div className="text-xs text-white/30 mt-2">{soldOut ? 'Sold out' : `${available} left`}</div>
                      </div>
                      <div
                        className={`${typographyClass} text-2xl`}
                        style={{ color: soldOut ? 'rgba(255,255,255,0.3)' : accentColor }}
                      >
                        {tier.price === 0 ? 'FREE' : formatCents(tier.price)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* CTA */}
          {hasAvailability ? (
            <Link
              href={ctaUrl}
              className="px-12 py-4 text-lg tracking-wider flex items-center gap-3 transition-all hover:scale-105"
              style={{
                backgroundColor: accentColor,
                color: '#000',
                boxShadow: `0 0 40px ${accentColor}50`,
              }}
            >
              {!isRsvpEvent && <Ticket className="w-5 h-5" />}
              {isRsvpEvent && <Users className="w-5 h-5" />}
              {ctaText}
            </Link>
          ) : (
            <div className="px-12 py-4 text-lg tracking-wider bg-white/10 text-white/30">
              {isRsvpEvent ? 'FULL' : 'SOLD OUT'}
            </div>
          )}

          {/* Footer */}
          <footer className="mt-auto pt-20 text-center text-white/30 text-sm">
            <a href="https://afters.am" className="hover:text-white transition-colors">afters.am</a>
          </footer>
        </div>

        {/* Mobile sticky CTA */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-black/95 backdrop-blur border-t border-white/10 z-50">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-white/40">{isRsvpEvent ? 'Entry' : 'From'}</div>
              <div className={`${typographyClass} text-xl`} style={{ color: accentColor }}>
                {isRsvpEvent ? 'FREE' : (lowestPrice === 0 ? 'FREE' : formatCents(lowestPrice))}
              </div>
            </div>
            {hasAvailability ? (
              <Link
                href={ctaUrl}
                className="px-6 py-3 flex items-center gap-2"
                style={{ backgroundColor: accentColor, color: '#000' }}
              >
                {!isRsvpEvent && <Ticket className="w-4 h-4" />}
                {isRsvpEvent && <Users className="w-4 h-4" />}
                {ctaText}
              </Link>
            ) : (
              <div className="px-6 py-3 bg-white/10 text-white/30">{isRsvpEvent ? 'FULL' : 'SOLD OUT'}</div>
            )}
          </div>
        </div>

        {/* Info Sections */}
        <div className="max-w-4xl mx-auto px-4 py-12">
          <EventInfoSections
            about={event.about}
            refundPolicy={event.refundPolicy}
            faqs={event.faqs}
            variant="neon"
            accentColor={accentColor}
          />
        </div>
        </div>
      )
    }

    // ============================================
    // MINIMAL TEMPLATE - Elegant, refined, spacious
    // ============================================
    if (pageTheme === 'minimal') {
      return (
        <div className="min-h-screen bg-zinc-950 text-white">
          <ViewTracker eventId={event.id} />

        {/* Subtle gradient */}
        <div className="fixed inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black pointer-events-none" />

        <div className="relative z-10">
          {/* Main content - asymmetric layout */}
          <main className="px-6 md:px-12 lg:px-24 py-12 md:py-20">
            <div className="max-w-7xl mx-auto">
              {/* Small accent line */}
              <div className="w-12 h-0.5 mb-8" style={{ backgroundColor: accentColor }} />

              {/* Title - elegant, lowercase */}
              <h1 className={`${typographyClass} text-4xl md:text-6xl lg:text-7xl font-light tracking-tight mb-6`}>
                {event.title.toLowerCase()}
              </h1>

              {/* Date line */}
              <p className="text-white/40 text-lg mb-16">
                {dayStr.toLowerCase()}, {eventDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }).toLowerCase()} &bull; {timeStr.toLowerCase()}
              </p>

              {/* Two column layout */}
              <div className="grid lg:grid-cols-[2fr_1fr] gap-16 lg:gap-24">
                {/* Left column */}
                <div>
                  {/* Flyer - minimal frame */}
                  {event.flyerUrl && (
                    <div className="relative aspect-[4/5] mb-16 bg-white/[0.02] border border-white/5">
                      <Image
                        src={event.flyerUrl}
                        alt={event.title}
                        fill
                        className="object-cover opacity-90"
                        priority
                      />
                    </div>
                  )}

                  {/* Description */}
                  {event.description && (
                    <div className="mb-16">
                      <div className="w-8 h-px bg-white/20 mb-6" />
                      <p className="text-white/50 text-lg leading-relaxed max-w-xl">
                        {event.description}
                      </p>
                    </div>
                  )}

                  {/* Lineup - horizontal */}
                  {lineup.length > 0 && (
                    <div className="mb-16">
                      <div className="w-8 h-px bg-white/20 mb-6" />
                      <h2 className="text-sm text-white/30 uppercase tracking-wider mb-6">Artists</h2>
                      <div className="flex flex-wrap gap-x-8 gap-y-4">
                        {lineup.map((artist, i) => (
                          <div key={i} className="flex items-center gap-3">
                            {artist.imageUrl && (
                              <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/10">
                                <Image src={artist.imageUrl} alt={artist.name} fill className="object-cover" />
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className={`${typographyClass} text-xl font-light`}>{artist.name}</span>
                              {artist.showtime && artist.showShowtime !== false && (
                                <span className="text-xs text-white/40">{artist.showtime}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Location */}
                  <div className="mb-16">
                    <div className="w-8 h-px bg-white/20 mb-6" />
                    <h2 className="text-sm text-white/30 uppercase tracking-wider mb-6">Location</h2>
                    {showLocation ? (
                      <div>
                        <p className={`${typographyClass} text-2xl font-light mb-2`}>{event.venueName.toLowerCase()}</p>
                        {locationPrecision === 'exact' && (
                          <p className="text-white/40">{event.venueAddress.toLowerCase()}</p>
                        )}
                        <p className="text-white/30">{event.city.toLowerCase()}{event.state ? `, ${event.state.toLowerCase()}` : ''}</p>
                        {mapUrl && (
                          <a
                            href={mapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 mt-4 text-sm hover:underline"
                            style={{ color: accentColor }}
                          >
                            view map <ArrowRight className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 text-white/40">
                        <Lock className="w-4 h-4" />
                        <span>{event.city.toLowerCase()} &bull; location revealed on ticket</span>
                      </div>
                    )}
                  </div>

                  {/* Map */}
                  {showMap && mapEmbedUrl && (
                    <div className="mb-16 border border-white/5 rounded overflow-hidden">
                      <iframe
                        src={mapEmbedUrl}
                        className="w-full h-64 opacity-80"
                        style={{ border: 0, filter: 'grayscale(1) brightness(0.7)' }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                  )}
                </div>

                {/* Right column - Tickets */}
                <div className="lg:sticky lg:top-8 lg:self-start">
                  <div className="border border-white/5 bg-white/[0.02] p-6 md:p-8">
                    <h2 className="text-sm text-white/30 uppercase tracking-wider mb-6">Tickets</h2>

                    <div className="space-y-4 mb-8">
                      {availableTiers.map((tier: TierType) => {
                        const available = tier.quantity - tier.quantitySold
                        const soldOut = available <= 0

                        return (
                          <div
                            key={tier.id}
                            className={`p-4 border border-white/5 ${soldOut ? 'opacity-40' : ''}`}
                          >
                            <div className="flex justify-between items-baseline mb-2">
                              <span className={`${typographyClass} font-light`}>{tier.name}</span>
                              <span style={{ color: soldOut ? 'rgba(255,255,255,0.3)' : accentColor }}>
                                {tier.price === 0 ? 'Free' : formatCents(tier.price)}
                              </span>
                            </div>
                            <div className="text-xs text-white/30">
                              {soldOut ? 'sold out' : `${available} available`}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {hasAvailability ? (
                      <Link
                        href={ctaUrl}
                        className="w-full block py-4 text-center text-black transition-opacity hover:opacity-90"
                        style={{ backgroundColor: accentColor }}
                      >
                        {ctaTextLower}
                      </Link>
                    ) : (
                      <div className="w-full py-4 text-center bg-white/5 text-white/30">
                        {isRsvpEvent ? 'Full' : 'Sold Out'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer className="px-6 md:px-12 lg:px-24 py-12 border-t border-white/5">
            <div className="max-w-7xl mx-auto flex justify-between items-center text-sm text-white/30">
              <span>&copy; {new Date().getFullYear()} afters</span>
              <a href="https://afters.am" className="hover:text-white transition-colors">afters.am</a>
            </div>
          </footer>
        </div>

        {/* Mobile sticky CTA */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-zinc-950/95 backdrop-blur border-t border-white/5 z-50">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-white/30">{isRsvpEvent ? 'entry' : 'from'}</div>
              <div className="text-lg" style={{ color: accentColor }}>
                {isRsvpEvent ? 'Free' : (lowestPrice === 0 ? 'Free' : formatCents(lowestPrice))}
              </div>
            </div>
            {hasAvailability ? (
              <Link
                href={ctaUrl}
                className="px-8 py-3 text-black"
                style={{ backgroundColor: accentColor }}
              >
                {ctaTextLower}
              </Link>
            ) : (
              <div className="px-8 py-3 bg-white/5 text-white/30">{isRsvpEvent ? 'Full' : 'Sold Out'}</div>
            )}
          </div>
        </div>

        {/* Info Sections */}
        <div className="container mx-auto px-4 py-12">
          <EventInfoSections
            about={event.about}
            refundPolicy={event.refundPolicy}
            faqs={event.faqs}
            variant="minimal"
            accentColor={accentColor}
          />
        </div>
        </div>
      )
    }

    // ============================================
    // TILT TEMPLATE - Chaotic, rotated, high energy
    // ============================================
    if (pageTheme === 'tilt') {
      return (
        <div className="min-h-screen bg-black text-white overflow-hidden">
          <ViewTracker eventId={event.id} />

        {/* Chaotic background shapes */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute -top-32 -left-32 w-96 h-96 border-[20px] rotate-[15deg]"
            style={{ borderColor: accentColor, opacity: 0.1 }}
          />
          <div
            className="absolute -bottom-48 -right-48 w-[500px] h-[500px] -rotate-[20deg]"
            style={{ backgroundColor: accentColor, opacity: 0.15 }}
          />
          <div className="absolute top-1/3 right-20 w-32 h-32 border-8 border-white rotate-45 opacity-10" />
          <div
            className="absolute bottom-1/4 left-10 w-20 h-20"
            style={{ backgroundColor: accentColor, opacity: 0.2 }}
          />
          <div
            className="absolute top-1/2 left-1/3 w-2 h-[600px] rotate-[25deg]"
            style={{ backgroundColor: accentColor, opacity: 0.1 }}
          />
        </div>

        <div className="relative z-10">
          {/* Main content - chaotic grid */}
          <main className="px-6 md:px-10 py-10">
            {/* Title - large, tilted */}
            <div className="-rotate-3 mb-12">
              <h1
                className={`${typographyClass} text-6xl md:text-8xl lg:text-9xl font-black uppercase`}
                style={{ color: accentColor }}
              >
                {event.title}
              </h1>
            </div>

            {/* Flyer and info - overlapping */}
            <div className="relative mb-20">
              {/* Flyer - rotated */}
              {event.flyerUrl && (
                <div className="relative w-full max-w-lg mx-auto md:ml-0 aspect-[3/4] rotate-3 border-4" style={{ borderColor: accentColor }}>
                  <Image
                    src={event.flyerUrl}
                    alt={event.title}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              )}

              {/* Info box - overlapping, counter-rotated */}
              <div
                className="relative md:absolute md:right-10 md:top-1/2 md:-translate-y-1/2 -rotate-2 mt-8 md:mt-0 p-6 border-4 bg-black max-w-sm"
                style={{ borderColor: accentColor }}
              >
                <div className="font-mono text-xs uppercase tracking-wider text-white/40 mb-4">Event Info</div>

                <div className="space-y-4">
                  <div className="rotate-1">
                    <div className="text-xs text-white/40 uppercase mb-1">When</div>
                    <div className={`${typographyClass} text-xl`}>{dayStr}, {timeStr}</div>
                  </div>

                  <div className="-rotate-1">
                    <div className="text-xs text-white/40 uppercase mb-1">Where</div>
                    {showLocation ? (
                      <>
                        <div className={`${typographyClass} text-xl`}>{event.venueName}</div>
                        <div className="text-sm text-white/50">{event.city}</div>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4" style={{ color: accentColor }} />
                        <span className={`${typographyClass} text-xl`}>SECRET</span>
                      </div>
                    )}
                  </div>

                  <div className="rotate-2">
                    <div className="text-xs text-white/40 uppercase mb-1">Price</div>
                    <div className={`${typographyClass} text-3xl`} style={{ color: accentColor }}>
                      {lowestPrice === 0 ? 'FREE' : formatCents(lowestPrice)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Map - if enabled */}
            {showMap && mapEmbedUrl && (
              <div className="mb-20 -rotate-1 border-4 max-w-2xl mx-auto" style={{ borderColor: accentColor }}>
                <iframe
                  src={mapEmbedUrl}
                  className="w-full h-64"
                  style={{ border: 0, filter: 'contrast(1.2) saturate(0.8)' }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            )}

            {/* Lineup - scattered */}
            {lineup.length > 0 && (
              <div className="mb-20">
                <h2
                  className={`${typographyClass} text-4xl md:text-5xl font-black uppercase rotate-2 mb-8`}
                  style={{ color: accentColor }}
                >
                  LINEUP
                </h2>
                <div className="flex flex-wrap gap-4">
                  {lineup.map((artist, i) => (
                    <div
                      key={i}
                      className={`px-6 py-4 border-4 ${i % 3 === 0 ? '-rotate-3' : i % 3 === 1 ? 'rotate-2' : '-rotate-1'}`}
                      style={{ borderColor: accentColor }}
                    >
                      <div className="font-black text-xl uppercase">{artist.name}</div>
                      {artist.showtime && artist.showShowtime !== false && (
                        <div className="text-xs text-white/50 mt-1 font-mono">{artist.showtime}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {event.description && (
              <div className="mb-20 max-w-xl rotate-1 pl-6 border-l-4" style={{ borderColor: accentColor }}>
                <p className="text-white/60">{event.description}</p>
              </div>
            )}

            {/* Tickets - tilted cards */}
            <div className="mb-20">
              <h2
                className={`${typographyClass} text-4xl md:text-5xl font-black uppercase -rotate-2 mb-8`}
                style={{ color: accentColor }}
              >
                TICKETS
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableTiers.map((tier: TierType, i) => {
                  const available = tier.quantity - tier.quantitySold
                  const soldOut = available <= 0

                  return (
                    <div
                      key={tier.id}
                      className={`p-6 border-4 ${soldOut ? 'opacity-40' : ''} ${i % 2 === 0 ? '-rotate-2' : 'rotate-2'}`}
                      style={{ borderColor: accentColor }}
                    >
                      <div className={`${typographyClass} text-2xl font-black uppercase mb-2`}>{tier.name}</div>
                      <div
                        className={`${typographyClass} text-4xl font-black`}
                        style={{ color: soldOut ? 'rgba(255,255,255,0.3)' : accentColor }}
                      >
                        {tier.price === 0 ? 'FREE' : formatCents(tier.price)}
                      </div>
                      <div className="font-mono text-xs uppercase text-white/40 mt-2">
                        {soldOut ? 'SOLD OUT' : `${available} LEFT`}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* CTA */}
            <div className="text-center mb-20">
              {hasAvailability ? (
                <Link
                  href={ctaUrl}
                  className={`inline-block px-16 py-6 ${typographyClass} text-2xl font-black uppercase -rotate-2 hover:rotate-0 transition-transform`}
                  style={{ backgroundColor: accentColor, color: '#000' }}
                >
                  {isRsvpEvent ? 'RSVP NOW' : 'GET TICKETS NOW'}
                </Link>
              ) : (
                <div className={`inline-block px-16 py-6 ${typographyClass} text-2xl font-black uppercase -rotate-2 bg-white/10 text-white/30`}>
                  {isRsvpEvent ? 'FULL' : 'SOLD OUT'}
                </div>
              )}
            </div>
          </main>

          {/* Footer */}
          <footer className="p-6 md:p-10 border-t-4" style={{ borderColor: accentColor }}>
            <div className="flex justify-between items-center font-mono text-sm uppercase rotate-1">
              <span style={{ color: accentColor }} className="font-headline text-lg">.</span>
              <a href="https://afters.am" className="hover:underline">afters.am</a>
            </div>
          </footer>
        </div>

        {/* Mobile sticky CTA */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-black border-t-4 z-50" style={{ borderColor: accentColor }}>
          {hasAvailability ? (
            <Link
              href={ctaUrl}
              className="block w-full py-4 text-center font-black text-xl uppercase"
              style={{ backgroundColor: accentColor, color: '#000' }}
            >
              {ctaText} // {isRsvpEvent ? 'FREE' : (lowestPrice === 0 ? 'FREE' : formatCents(lowestPrice))}
            </Link>
          ) : (
            <div className="w-full py-4 text-center font-black text-xl uppercase bg-white/10 text-white/30">
              {isRsvpEvent ? 'FULL' : 'SOLD OUT'}
            </div>
          )}
        </div>

        {/* Info Sections */}
        <div className="container mx-auto px-4 py-12">
          <EventInfoSections
            about={event.about}
            refundPolicy={event.refundPolicy}
            faqs={event.faqs}
            variant="tilt"
            accentColor={accentColor}
          />
        </div>
        </div>
      )
    }

    // ============================================
    // LUSH TEMPLATE - Warm, luxurious, community-focused
    // ============================================
    if (pageTheme === 'lush') {
      return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
          <ViewTracker eventId={event.id} />

          {/* Warm gradient overlay */}
          <div className="fixed inset-0 pointer-events-none z-0">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                background: `radial-gradient(circle at 30% 20%, ${accentColor}40 0%, transparent 50%)`
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
          </div>

          {/* Two-column layout */}
          <div className="relative z-10 grid lg:grid-cols-[1.2fr_1fr] min-h-screen">
            {/* Left: Flyer with backdrop blur card */}
            <div className="relative p-4 lg:p-12 flex items-start justify-center">
              <div className="w-full max-w-lg sticky top-12">
                {event.flyerUrl ? (
                  <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden group">
                    <Image
                      src={event.flyerUrl}
                      alt={event.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      priority
                    />
                    {/* Subtle overlay on hover */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{
                        background: `linear-gradient(180deg, transparent 0%, ${accentColor}20 100%)`
                      }}
                    />
                  </div>
                ) : (
                  <div
                    className="w-full aspect-[3/4] rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/10"
                    style={{ backgroundColor: `${accentColor}15` }}
                  >
                    <span className={`${typographyClass} text-8xl font-bold`} style={{ color: accentColor }}>
                      {event.title.charAt(0)}
                    </span>
                  </div>
                )}

                {/* Quick info card below flyer */}
                <div className="mt-6 p-6 rounded-xl backdrop-blur-xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4" style={{ color: accentColor }} />
                      <span className="text-sm font-medium">{dayStr}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" style={{ color: accentColor }} />
                      <span className="text-sm font-medium">{timeStr}</span>
                    </div>
                  </div>
                  {showLocation && (
                    <div className="flex items-start gap-2 pt-4 border-t border-white/10">
                      <MapPin className="w-4 h-4 mt-0.5" style={{ color: accentColor }} />
                      <div className="text-sm">
                        <div className="font-medium">{event.venueName}</div>
                        {locationPrecision === 'exact' && (
                          <div className="text-white/60 text-xs mt-0.5">{event.venueAddress}</div>
                        )}
                        <div className="text-white/40 text-xs mt-0.5">
                          {event.city}{event.state ? `, ${event.state}` : ''}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Event details */}
            <div className="relative p-6 lg:p-12 lg:pt-12">
              {/* Organizer badge */}
              <div className="flex items-center gap-3 mb-8">
                {event.organizer.logoUrl ? (
                  <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/20">
                    <Image
                      src={event.organizer.logoUrl}
                      alt={event.organizer.displayName}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ backgroundColor: `${accentColor}30`, color: accentColor }}
                  >
                    {event.organizer.displayName.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="text-sm font-medium">{event.organizer.displayName}</div>
                  <div className="text-xs text-white/40">Event Organizer</div>
                </div>
              </div>

              {/* Event title */}
              <h1 className={`${typographyClass} text-4xl lg:text-6xl font-bold mb-6 leading-tight`}>
                {event.title}
              </h1>

              {/* Description */}
              {event.description && (
                <div className="mb-8 text-white/70 leading-relaxed">
                  {event.description}
                </div>
              )}

              {/* Lineup */}
              {lineup.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-sm uppercase tracking-widest text-white/40 mb-4">Lineup</h2>
                  <div className="space-y-3">
                    {lineup.map((artist: LineupArtist, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors duration-300"
                      >
                        {artist.imageUrl ? (
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                            <Image
                              src={artist.imageUrl}
                              alt={artist.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div
                            className="w-12 h-12 rounded-lg flex items-center justify-center font-bold"
                            style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                          >
                            {artist.name.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="font-medium">{artist.name}</div>
                          {artist.role && (
                            <div className="text-xs text-white/40">{artist.role}</div>
                          )}
                        </div>
                        {artist.showtime && artist.showShowtime !== false && (
                          <span className="text-sm font-mono" style={{ color: accentColor }}>
                            {artist.showtime}
                          </span>
                        )}
                        {artist.socialUrl && (
                          <a
                            href={artist.socialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          >
                            <Instagram className="w-4 h-4" style={{ color: accentColor }} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Age restriction */}
              {event.ageRestriction && (
                <div className="mb-8 p-4 rounded-lg border border-white/10 bg-white/5">
                  <div className="flex items-center gap-2 text-sm">
                    <Lock className="w-4 h-4" style={{ color: accentColor }} />
                    <span className="text-white/60">
                      Ages {event.ageRestriction}+
                    </span>
                  </div>
                </div>
              )}

              {/* Tickets/RSVP */}
              <div className="space-y-4">
                <h2 className="text-sm uppercase tracking-widest text-white/40 mb-4">
                  {isRsvpEvent ? 'RSVP' : 'Tickets'}
                </h2>

                {isRsvpEvent ? (
                  <div className="p-6 rounded-xl backdrop-blur-xl border border-white/10" style={{ backgroundColor: `${accentColor}10` }}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-2xl font-bold" style={{ color: accentColor }}>Free Entry</div>
                        <div className="text-sm text-white/60 mt-1">RSVP Required</div>
                      </div>
                      <Users className="w-8 h-8 opacity-20" />
                    </div>
                    {rsvpSpotsLeft !== null && (
                      <div className="text-xs text-white/40 mb-4">
                        {rsvpSpotsLeft} spots remaining
                      </div>
                    )}
                    {rsvpAvailable ? (
                      <Link
                        href={ctaUrl}
                        className="block w-full py-4 rounded-lg text-center font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                        style={{
                          backgroundColor: accentColor,
                          color: '#000',
                          boxShadow: `0 8px 32px ${accentColor}40`
                        }}
                      >
                        RSVP Now
                      </Link>
                    ) : (
                      <div className="w-full py-4 rounded-lg text-center font-semibold bg-white/5 text-white/30">
                        RSVP Full
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {availableTiers.map((tier: TierType) => (
                      <div
                        key={tier.id}
                        className="p-6 rounded-xl backdrop-blur-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-lg">{tier.name}</h3>
                          <div className="text-2xl font-bold" style={{ color: accentColor }}>
                            {tier.price === 0 ? 'Free' : formatCents(tier.price)}
                          </div>
                        </div>
                        {tier.description && (
                          <p className="text-sm text-white/60 mb-4">{tier.description}</p>
                        )}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white/40">
                            {tier.quantity - tier.quantitySold} / {tier.quantity} available
                          </span>
                          <Ticket className="w-4 h-4 text-white/20" />
                        </div>
                      </div>
                    ))}

                    {hasAvailability && (
                      <Link
                        href={ctaUrl}
                        className="block w-full py-5 rounded-xl text-center font-bold text-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl mt-6"
                        style={{
                          backgroundColor: accentColor,
                          color: '#000',
                          boxShadow: `0 12px 40px ${accentColor}50`
                        }}
                      >
                        Get Tickets
                      </Link>
                    )}
                  </>
                )}
              </div>

              {/* Map */}
              {showMap && mapEmbedUrl && (
                <div className="mt-8">
                  <h2 className="text-sm uppercase tracking-widest text-white/40 mb-4">Location</h2>
                  <div className="rounded-xl overflow-hidden border border-white/10">
                    <iframe
                      src={mapEmbedUrl}
                      width="100%"
                      height="300"
                      style={{ border: 0, filter: 'invert(0.9) grayscale(0.5)' }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                </div>
              )}

              {/* Organizer social */}
              {event.organizer.instagramUrl && (
                <div className="mt-8 pt-8 border-t border-white/10">
                  <a
                    href={event.organizer.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-300 group"
                  >
                    <Instagram className="w-5 h-5 transition-colors" style={{ color: accentColor }} />
                    <span className="text-sm font-medium group-hover:underline">
                      Follow {event.organizer.displayName} on Instagram
                    </span>
                    <ArrowRight className="w-4 h-4 ml-auto opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Info Sections - not included as they're already in LUSH template main content */}
          <div className="relative z-10 px-4 py-12">
            <div className="max-w-7xl mx-auto">
              <EventInfoSections
                about={event.about}
                refundPolicy={event.refundPolicy}
                faqs={event.faqs}
                variant="lush"
                accentColor={accentColor}
              />
            </div>
          </div>
        </div>
      )
    }

    // ============================================
    // NICE.AM TEMPLATE - Clean, modern, dice.fm-inspired
    // ============================================
    if (pageTheme === 'nice') {
      const faqs = Array.isArray(event.faqs) ? event.faqs : []

      return (
        <div className="min-h-screen bg-black text-white">
          <ViewTracker eventId={event.id} />

          {/* Blurred background image */}
          {event.flyerUrl && (
            <div className="fixed inset-0 z-0 overflow-hidden opacity-30">
              <Image
                src={event.flyerUrl}
                alt=""
                fill
                className="object-cover blur-[50px] scale-110"
                priority
              />
            </div>
          )}

          <div className="relative z-10">
            {/* Container with max-width */}
            <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
              {/* Two-column layout */}
              <div className="grid lg:grid-cols-[1fr_400px] gap-8 lg:gap-12">
                {/* Left: Main content */}
                <div className="space-y-8">
                  {/* Hero image */}
                  {event.flyerUrl && (
                    <div className="w-full aspect-square lg:aspect-[4/3] rounded-2xl overflow-hidden">
                      <Image
                        src={event.flyerUrl}
                        alt={event.title}
                        width={800}
                        height={600}
                        className="w-full h-full object-cover"
                        priority
                      />
                    </div>
                  )}

                  {/* Event title & organizer */}
                  <div>
                    <div className="flex items-center gap-2 mb-3 text-sm text-white/50">
                      <span>Presented by {event.organizer.displayName}</span>
                    </div>
                    <h1 className={`${typographyClass} text-4xl lg:text-6xl font-bold mb-4 leading-tight`}>
                      {event.title}
                    </h1>
                  </div>

                  {/* About */}
                  {event.about && (
                    <div className="p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                      <h2 className="text-xl font-bold mb-4">About</h2>
                      <div className="text-white/80 whitespace-pre-wrap leading-relaxed">
                        {event.about}
                      </div>
                    </div>
                  )}

                  {/* Lineup */}
                  {lineup.length > 0 && (
                    <div className="p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                      <h2 className="text-xl font-bold mb-4">Lineup</h2>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {lineup.map((artist: LineupArtist, idx: number) => (
                          <div key={idx} className="text-center">
                            {artist.imageUrl ? (
                              <div className="relative w-20 h-20 mx-auto mb-2 rounded-full overflow-hidden">
                                <Image
                                  src={artist.imageUrl}
                                  alt={artist.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div
                                className="w-20 h-20 mx-auto mb-2 rounded-full flex items-center justify-center font-bold text-xl"
                                style={{ backgroundColor: `${accentColor}30`, color: accentColor }}
                              >
                                {artist.name.charAt(0)}
                              </div>
                            )}
                            <div className="font-medium text-sm">{artist.name}</div>
                            {artist.role && (
                              <div className="text-xs text-white/50">{artist.role}</div>
                            )}
                            {artist.showtime && artist.showShowtime !== false && (
                              <div className="text-xs mt-1" style={{ color: accentColor }}>{artist.showtime}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* FAQs */}
                  {faqs.length > 0 && (
                    <div className="p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                      <h2 className="text-xl font-bold mb-4">FAQs</h2>
                      <div className="space-y-3">
                        {faqs.filter((faq: any) => faq && faq.question && faq.answer).map((faq: any, idx: number) => (
                          <details key={idx} className="group">
                            <summary className="flex items-center justify-between cursor-pointer p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                              <span className="font-medium pr-4">{faq.question}</span>
                              <svg
                                className="w-5 h-5 transition-transform group-open:rotate-180"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </summary>
                            <div className="px-4 pt-3 pb-4 text-white/70 leading-relaxed">
                              {faq.answer}
                            </div>
                          </details>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Refund Policy */}
                  {event.refundPolicy && (
                    <div className="p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                      <h2 className="text-xl font-bold mb-4">Refund Policy</h2>
                      <div className="text-white/70 whitespace-pre-wrap leading-relaxed">
                        {event.refundPolicy}
                      </div>
                    </div>
                  )}

                  {/* Map */}
                  {showMap && mapEmbedUrl && (
                    <div className="rounded-xl overflow-hidden border border-white/10">
                      <iframe
                        src={mapEmbedUrl}
                        width="100%"
                        height="400"
                        style={{ border: 0, filter: 'invert(0.9) grayscale(0.5)' }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                  )}
                </div>

                {/* Right: Sticky purchase sidebar */}
                <div className="lg:sticky lg:top-8 lg:self-start">
                  <div className="p-6 rounded-2xl backdrop-blur-xl border border-white/10" style={{ backgroundColor: '#0a0a0aCC' }}>
                    {/* Date & Time */}
                    <div className="mb-6 pb-6 border-b border-white/10">
                      <div className="flex items-center gap-2 text-sm text-white/50 mb-2">
                        <CalendarDays className="w-4 h-4" />
                        <span>{dayStr}</span>
                      </div>
                      <div className="text-2xl font-bold" style={{ color: accentColor }}>
                        {dateStr}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-white/70 mt-2">
                        <Clock className="w-4 h-4" />
                        <span>{timeStr}</span>
                      </div>
                    </div>

                    {/* Venue */}
                    {showLocation && (
                      <div className="mb-6 pb-6 border-b border-white/10">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 mt-1" style={{ color: accentColor }} />
                          <div className="text-sm">
                            <div className="font-bold mb-1">{event.venueName}</div>
                            {locationPrecision === 'exact' && (
                              <div className="text-white/60">{event.venueAddress}</div>
                            )}
                            <div className="text-white/50">
                              {event.city}{event.state ? `, ${event.state}` : ''}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Age restriction */}
                    {event.ageRestriction && (
                      <div className="mb-6 pb-6 border-b border-white/10">
                        <div className="flex items-center gap-2 text-sm">
                          <Lock className="w-4 h-4" style={{ color: accentColor }} />
                          <span className="text-white/70">Ages {event.ageRestriction}+</span>
                        </div>
                      </div>
                    )}

                    {/* Tickets/RSVP */}
                    <div>
                      {isRsvpEvent ? (
                        <>
                          <div className="mb-4">
                            <div className="text-3xl font-bold mb-1" style={{ color: accentColor }}>Free</div>
                            <div className="text-sm text-white/50">RSVP Required</div>
                            {rsvpSpotsLeft !== null && (
                              <div className="text-xs text-white/40 mt-2">
                                {rsvpSpotsLeft} spots remaining
                              </div>
                            )}
                          </div>
                          {rsvpAvailable ? (
                            <Link
                              href={ctaUrl}
                              className="block w-full py-4 rounded-xl text-center font-bold transition-all duration-150 hover:scale-[1.02]"
                              style={{
                                backgroundColor: accentColor,
                                color: '#000'
                              }}
                            >
                              RSVP Now
                            </Link>
                          ) : (
                            <div className="w-full py-4 rounded-xl text-center font-bold bg-white/5 text-white/30">
                              RSVP Full
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="mb-4 space-y-3">
                            {availableTiers.map((tier: TierType) => (
                              <div key={tier.id} className="p-4 rounded-lg bg-white/5 border border-white/10">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="font-semibold">{tier.name}</div>
                                  <div className="font-bold" style={{ color: accentColor }}>
                                    {tier.price === 0 ? 'Free' : formatCents(tier.price)}
                                  </div>
                                </div>
                                {tier.description && (
                                  <div className="text-xs text-white/60 mb-2">{tier.description}</div>
                                )}
                                <div className="text-xs text-white/40">
                                  {tier.quantity - tier.quantitySold} / {tier.quantity} available
                                </div>
                              </div>
                            ))}
                          </div>

                          {hasAvailability ? (
                            <Link
                              href={ctaUrl}
                              className="block w-full py-4 rounded-xl text-center font-bold transition-all duration-150 hover:scale-[1.02]"
                              style={{
                                backgroundColor: accentColor,
                                color: '#000'
                              }}
                            >
                              Get Tickets
                            </Link>
                          ) : (
                            <div className="w-full py-4 rounded-xl text-center font-bold bg-white/5 text-white/30">
                              Sold Out
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Organizer */}
                    <div className="mt-6 pt-6 border-t border-white/10">
                      <div className="flex items-center gap-3">
                        {event.organizer.logoUrl ? (
                          <div className="relative w-12 h-12 rounded-full overflow-hidden">
                            <Image
                              src={event.organizer.logoUrl}
                              alt={event.organizer.displayName}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center font-bold"
                            style={{ backgroundColor: `${accentColor}30`, color: accentColor }}
                          >
                            {event.organizer.displayName.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="text-xs text-white/40">Organized by</div>
                          <div className="font-medium">{event.organizer.displayName}</div>
                        </div>
                      </div>
                      {event.organizer.instagramUrl && (
                        <a
                          href={event.organizer.instagramUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 flex items-center justify-center gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm"
                        >
                          <Instagram className="w-4 h-4" />
                          <span>Follow on Instagram</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // ============================================
    // CARD TEMPLATE - Floating cards, modern depth
    // ============================================
    if (pageTheme === 'card') {
      return (
        <div className="min-h-screen bg-[#0c0c0c] text-white">
          <ViewTracker eventId={event.id} />

          {/* Ambient gradient background */}
          <div
            className="fixed inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at top center, ${accentColor}08 0%, transparent 50%), radial-gradient(ellipse at bottom right, ${accentColor}05 0%, transparent 40%)`,
            }}
          />

          {/* Main content */}
          <div className="relative z-10 min-h-screen p-4 md:p-8 lg:p-12">
            <div className="max-w-6xl mx-auto space-y-6">

              {/* Hero Card - Flyer */}
              <div
                className="relative rounded-3xl overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)`,
                  boxShadow: `0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.1)`,
                }}
              >
                <div className="grid lg:grid-cols-[1fr_1.2fr] gap-0">
                  {/* Flyer side */}
                  <div className="relative aspect-[3/4] lg:aspect-auto lg:min-h-[600px]">
                    {event.flyerUrl ? (
                      <Image
                        src={event.flyerUrl}
                        alt={event.title}
                        fill
                        className="object-cover"
                        priority
                      />
                    ) : (
                      <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}05)` }}
                      >
                        <span className={`${typographyClass} text-8xl`} style={{ color: accentColor }}>
                          {event.title.charAt(0)}
                        </span>
                      </div>
                    )}
                    {/* Gradient overlay on mobile */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0c] via-transparent to-transparent lg:hidden" />
                  </div>

                  {/* Info side */}
                  <div className="p-6 md:p-10 lg:p-12 flex flex-col justify-between -mt-20 lg:mt-0 relative">
                    <div>
                      {/* Organizer */}
                      <div className="flex items-center gap-3 mb-6">
                        {event.organizer.logoUrl ? (
                          <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/10">
                            <Image src={event.organizer.logoUrl} alt={event.organizer.displayName} fill className="object-cover" />
                          </div>
                        ) : (
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                            style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                          >
                            {event.organizer.displayName.charAt(0)}
                          </div>
                        )}
                        <span className="text-sm text-white/50">{event.organizer.displayName}</span>
                      </div>

                      {/* Title */}
                      <h1 className={`${typographyClass} text-4xl md:text-5xl lg:text-6xl font-bold mb-4`}>
                        {event.title}
                      </h1>

                      {/* Description */}
                      {event.description && (
                        <p className="text-white/60 text-lg leading-relaxed mb-8 max-w-xl">
                          {event.description}
                        </p>
                      )}
                    </div>

                    {/* CTA Area */}
                    <div className="mt-8">
                      <div className="flex items-baseline gap-2 mb-4">
                        <span className={`${typographyClass} text-3xl`} style={{ color: accentColor }}>
                          {isRsvpEvent ? 'Free' : (lowestPrice === 0 ? 'Free' : formatCents(lowestPrice))}
                        </span>
                        {!isRsvpEvent && lowestPrice > 0 && (
                          <span className="text-white/40 text-sm">and up</span>
                        )}
                      </div>
                      {hasAvailability ? (
                        <Link
                          href={ctaUrl}
                          className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-black font-bold text-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                          style={{
                            backgroundColor: accentColor,
                            boxShadow: `0 10px 40px ${accentColor}40`,
                          }}
                        >
                          {ctaText}
                          <ArrowRight className="w-5 h-5" />
                        </Link>
                      ) : (
                        <div className="inline-flex px-8 py-4 rounded-2xl bg-white/5 text-white/30 font-bold text-lg">
                          {isRsvpEvent ? 'Full' : 'Sold Out'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Cards Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Date & Time Card */}
                <div
                  className="p-6 rounded-2xl"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${accentColor}15` }}
                    >
                      <CalendarDays className="w-5 h-5" style={{ color: accentColor }} />
                    </div>
                    <span className="text-xs font-mono tracking-wider text-white/40 uppercase">When</span>
                  </div>
                  <p className={`${typographyClass} text-xl mb-1`}>{dayStr}</p>
                  <p className="text-white/50">{dateStr} · {timeStr}</p>
                </div>

                {/* Location Card */}
                <div
                  className="p-6 rounded-2xl"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${accentColor}15` }}
                    >
                      <MapPin className="w-5 h-5" style={{ color: accentColor }} />
                    </div>
                    <span className="text-xs font-mono tracking-wider text-white/40 uppercase">Where</span>
                  </div>
                  {showLocation ? (
                    <>
                      <p className={`${typographyClass} text-xl mb-1`}>{event.venueName}</p>
                      <p className="text-white/50">{event.city}{event.state ? `, ${event.state}` : ''}</p>
                      {mapUrl && (
                        <a
                          href={mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-3 text-sm"
                          style={{ color: accentColor }}
                        >
                          View map <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </>
                  ) : (
                    <>
                      <p className={`${typographyClass} text-xl mb-1 flex items-center gap-2`}>
                        <Lock className="w-4 h-4" /> Hidden
                      </p>
                      <p className="text-white/50">Revealed after {isRsvpEvent ? 'RSVP' : 'purchase'}</p>
                    </>
                  )}
                </div>

                {/* Tickets Card */}
                <div
                  className="p-6 rounded-2xl md:col-span-2 lg:col-span-1"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${accentColor}15` }}
                    >
                      <Ticket className="w-5 h-5" style={{ color: accentColor }} />
                    </div>
                    <span className="text-xs font-mono tracking-wider text-white/40 uppercase">
                      {isRsvpEvent ? 'RSVP' : 'Tickets'}
                    </span>
                  </div>
                  {isRsvpEvent ? (
                    <>
                      <p className={`${typographyClass} text-xl mb-1`}>Free Entry</p>
                      <p className="text-white/50">
                        {rsvpSpotsLeft !== null ? `${rsvpSpotsLeft} spots left` : 'Open registration'}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className={`${typographyClass} text-xl mb-1`}>
                        {availableTiers.length} tier{availableTiers.length !== 1 ? 's' : ''} available
                      </p>
                      <p className="text-white/50">{totalAvailable} remaining</p>
                    </>
                  )}
                </div>
              </div>

              {/* Lineup Card */}
              {lineup.length > 0 && (
                <div
                  className="p-6 md:p-8 rounded-2xl"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <h3 className="text-xs font-mono tracking-wider text-white/40 uppercase mb-6">Lineup</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {lineup.map((artist, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] transition-colors"
                      >
                        {artist.imageUrl ? (
                          <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0">
                            <Image src={artist.imageUrl} alt={artist.name} fill className="object-cover" />
                          </div>
                        ) : (
                          <div
                            className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 text-lg font-bold"
                            style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
                          >
                            {artist.name.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`${typographyClass} text-lg truncate`}>{artist.name}</p>
                            {artist.showtime && artist.showShowtime !== false && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-white/5" style={{ color: accentColor }}>
                                {artist.showtime}
                              </span>
                            )}
                          </div>
                          {artist.role && <p className="text-sm text-white/40 truncate">{artist.role}</p>}
                        </div>
                        {artist.socialUrl && (
                          <a href={artist.socialUrl} target="_blank" rel="noopener noreferrer" className="text-white/20 hover:text-white transition-colors">
                            <Instagram className="w-5 h-5" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ticket Tiers Card */}
              {!isRsvpEvent && availableTiers.length > 0 && (
                <div
                  className="p-6 md:p-8 rounded-2xl"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <h3 className="text-xs font-mono tracking-wider text-white/40 uppercase mb-6">Ticket Options</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableTiers.map((tier: TierType) => {
                      const available = tier.quantity - tier.quantitySold
                      const soldOut = available <= 0

                      return (
                        <div
                          key={tier.id}
                          className={`p-5 rounded-xl border transition-all ${soldOut ? 'opacity-50' : 'hover:border-white/20'}`}
                          style={{
                            backgroundColor: soldOut ? 'transparent' : `${accentColor}05`,
                            borderColor: soldOut ? 'rgba(255,255,255,0.05)' : `${accentColor}30`,
                          }}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <span className={`${typographyClass} text-lg`}>{tier.name}</span>
                            <span
                              className="text-lg font-bold"
                              style={{ color: soldOut ? 'rgba(255,255,255,0.3)' : accentColor }}
                            >
                              {tier.price === 0 ? 'Free' : formatCents(tier.price)}
                            </span>
                          </div>
                          {tier.description && (
                            <p className="text-sm text-white/50 mb-3">{tier.description}</p>
                          )}
                          <p className="text-xs text-white/30">
                            {soldOut ? 'Sold out' : `${available} remaining`}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Map Card */}
              {showMap && mapEmbedUrl && (
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    boxShadow: '0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <iframe
                    src={mapEmbedUrl}
                    width="100%"
                    height="300"
                    style={{ border: 0, filter: 'grayscale(1) contrast(1.1) brightness(0.8)' }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              )}

              {/* Info Sections */}
              <EventInfoSections
                about={event.about}
                refundPolicy={event.refundPolicy}
                faqs={event.faqs}
                variant="default"
                accentColor={accentColor}
              />

              {/* Footer */}
              <footer className="text-center py-8 text-sm text-white/30">
                <span>&copy; {new Date().getFullYear()} Afters</span>
              </footer>
            </div>
          </div>

          {/* Mobile sticky CTA */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-[#0c0c0c]/95 backdrop-blur-xl border-t border-white/5 z-50">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-white/40">{isRsvpEvent ? 'Entry' : 'From'}</div>
                <div className={`${typographyClass} text-xl`} style={{ color: accentColor }}>
                  {isRsvpEvent ? 'Free' : (lowestPrice === 0 ? 'Free' : formatCents(lowestPrice))}
                </div>
              </div>
              {hasAvailability ? (
                <Link
                  href={ctaUrl}
                  className="px-8 py-3 rounded-xl text-black font-bold"
                  style={{ backgroundColor: accentColor }}
                >
                  {ctaText}
                </Link>
              ) : (
                <div className="px-8 py-3 rounded-xl bg-white/5 text-white/30">{isRsvpEvent ? 'Full' : 'Sold Out'}</div>
              )}
            </div>
          </div>
        </div>
      )
    }

    // ============================================
    // VAPOR TEMPLATE - Retro-futuristic, synthwave vibes
    // ============================================
    if (pageTheme === 'vapor') {
      return (
        <div className="min-h-screen bg-[#0a0612] text-white overflow-hidden">
          <ViewTracker eventId={event.id} />

          {/* Vaporwave gradient background */}
          <div
            className="fixed inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(180deg, #1a0a2e 0%, #0a0612 40%, ${accentColor}10 100%)`,
            }}
          />

          {/* Scan lines overlay */}
          <div
            className="fixed inset-0 pointer-events-none opacity-[0.15] z-10"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.4) 2px, rgba(0,0,0,0.4) 4px)',
            }}
          />

          {/* Perspective grid floor */}
          <div className="fixed bottom-0 left-0 right-0 h-[40vh] pointer-events-none overflow-hidden z-0 opacity-40">
            <div
              className="absolute inset-0"
              style={{
                background: `
                  repeating-linear-gradient(90deg, ${accentColor}40 0px, ${accentColor}40 1px, transparent 1px, transparent 60px),
                  repeating-linear-gradient(0deg, ${accentColor}40 0px, ${accentColor}40 1px, transparent 1px, transparent 60px)
                `,
                transform: 'perspective(200px) rotateX(60deg)',
                transformOrigin: 'bottom center',
              }}
            />
          </div>

          {/* Sun element */}
          <div
            className="fixed bottom-[30vh] left-1/2 -translate-x-1/2 w-[500px] h-[250px] pointer-events-none z-0"
            style={{
              background: `linear-gradient(180deg, ${accentColor} 0%, #ff00ff 40%, #ff6600 70%, transparent 100%)`,
              borderRadius: '100% 100% 0 0',
              filter: 'blur(2px)',
              opacity: 0.6,
              maskImage: 'repeating-linear-gradient(0deg, black 0px, black 3px, transparent 3px, transparent 8px)',
              WebkitMaskImage: 'repeating-linear-gradient(0deg, black 0px, black 3px, transparent 3px, transparent 8px)',
            }}
          />

          {/* Main content */}
          <div className="relative z-20 min-h-screen">
            {/* Hero Section */}
            <section className="min-h-screen flex flex-col items-center justify-center px-6 text-center relative">
              {/* Flyer with chrome frame */}
              {event.flyerUrl && (
                <div
                  className="relative w-64 md:w-80 aspect-[3/4] mb-8"
                  style={{
                    boxShadow: `0 0 60px ${accentColor}40, 0 0 120px ${accentColor}20, inset 0 0 60px ${accentColor}10`,
                    border: `3px solid ${accentColor}`,
                  }}
                >
                  <Image src={event.flyerUrl} alt={event.title} fill className="object-cover" priority />
                  {/* Corner accents */}
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-l-2 border-t-2" style={{ borderColor: '#00ffff' }} />
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-r-2 border-t-2" style={{ borderColor: '#00ffff' }} />
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-l-2 border-b-2" style={{ borderColor: '#ff00ff' }} />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-r-2 border-b-2" style={{ borderColor: '#ff00ff' }} />
                </div>
              )}

              {/* Chrome text title */}
              <h1
                className={`${typographyClass} text-5xl md:text-7xl lg:text-8xl font-black tracking-wider mb-4`}
                style={{
                  color: accentColor,
                  textShadow: `0 0 20px ${accentColor}, 0 0 60px ${accentColor}60, 0 4px 0 #ff00ff`,
                }}
              >
                {event.title.toUpperCase()}
              </h1>

              {/* Organizer */}
              <div
                className="text-sm tracking-[0.3em] mb-8 px-4 py-2"
                style={{
                  color: '#00ffff',
                  textShadow: '0 0 10px #00ffff',
                  border: '1px solid #00ffff40',
                }}
              >
                PRESENTED BY {event.organizer.displayName.toUpperCase()}
              </div>

              {/* Date/Time display */}
              <div className="flex items-center gap-6 mb-10">
                <div
                  className="text-center px-6 py-3"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,0,255,0.2) 0%, transparent 100%)',
                    border: '1px solid #ff00ff60',
                  }}
                >
                  <div className="font-mono text-2xl font-bold" style={{ color: '#ff00ff', textShadow: '0 0 10px #ff00ff' }}>
                    {dateStr}
                  </div>
                  <div className="font-mono text-xs text-white/50 tracking-wider">{dayStr.toUpperCase()}</div>
                </div>
                <div
                  className="text-center px-6 py-3"
                  style={{
                    background: 'linear-gradient(180deg, rgba(0,255,255,0.2) 0%, transparent 100%)',
                    border: '1px solid #00ffff60',
                  }}
                >
                  <div className="font-mono text-2xl font-bold" style={{ color: '#00ffff', textShadow: '0 0 10px #00ffff' }}>
                    {timeStr}
                  </div>
                  <div className="font-mono text-xs text-white/50 tracking-wider">DOORS OPEN</div>
                </div>
              </div>

              {/* CTA */}
              {hasAvailability ? (
                <Link
                  href={ctaUrl}
                  className="relative px-12 py-4 font-mono text-xl font-bold tracking-wider text-black"
                  style={{
                    background: `linear-gradient(90deg, ${accentColor}, #ff00ff, #00ffff)`,
                    boxShadow: `0 0 30px ${accentColor}60, 0 0 60px ${accentColor}30`,
                  }}
                >
                  <span className="relative z-10">{ctaText}</span>
                  {/* Glitch effect layers */}
                  <div
                    className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity"
                    style={{
                      background: `linear-gradient(90deg, #00ffff, ${accentColor}, #ff00ff)`,
                      clipPath: 'inset(40% 0 40% 0)',
                      transform: 'translateX(2px)',
                    }}
                  />
                </Link>
              ) : (
                <div className="px-12 py-4 font-mono text-xl text-white/30 border border-white/20">
                  {isRsvpEvent ? 'CAPACITY REACHED' : 'SOLD OUT'}
                </div>
              )}

              {/* Price tag */}
              <div className="mt-6 font-mono text-sm" style={{ color: accentColor }}>
                {isRsvpEvent ? '// FREE ENTRY' : `// FROM ${lowestPrice === 0 ? 'FREE' : formatCents(lowestPrice)}`}
              </div>

              {/* Scroll indicator */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
                <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
                  <div className="w-1 h-2 bg-white/50 rounded-full" />
                </div>
              </div>
            </section>

            {/* Info Section */}
            <section className="py-20 px-6">
              <div className="max-w-4xl mx-auto">
                {/* Section divider */}
                <div className="flex items-center gap-4 mb-12">
                  <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }} />
                  <span className="font-mono text-xs tracking-[0.5em]" style={{ color: accentColor }}>INFO</span>
                  <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }} />
                </div>

                {/* Description */}
                {event.description && (
                  <p
                    className={`${typographyClass} text-xl md:text-2xl text-center leading-relaxed mb-16`}
                    style={{ color: 'rgba(255,255,255,0.7)' }}
                  >
                    {event.description}
                  </p>
                )}

                {/* Location card */}
                <div
                  className="p-8 mb-8"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,0,255,0.1) 0%, rgba(0,255,255,0.05) 100%)',
                    border: '1px solid rgba(255,0,255,0.3)',
                    boxShadow: '0 0 30px rgba(255,0,255,0.1)',
                  }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <MapPin className="w-5 h-5" style={{ color: '#ff00ff' }} />
                    <span className="font-mono text-xs tracking-[0.3em]" style={{ color: '#ff00ff' }}>LOCATION</span>
                  </div>
                  {showLocation ? (
                    <>
                      <p className={`${typographyClass} text-2xl mb-2`}>{event.venueName}</p>
                      {locationPrecision === 'exact' && (
                        <p className="text-white/50">{event.venueAddress}</p>
                      )}
                      <p className="text-white/50">{event.city}{event.state ? `, ${event.state}` : ''}</p>
                      {mapUrl && (
                        <a
                          href={mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 mt-4 font-mono text-sm"
                          style={{ color: '#00ffff' }}
                        >
                          OPEN IN MAPS <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </>
                  ) : (
                    <p className={`${typographyClass} text-2xl flex items-center gap-3`}>
                      <Lock className="w-5 h-5" /> LOCATION REVEALED AFTER {isRsvpEvent ? 'RSVP' : 'PURCHASE'}
                    </p>
                  )}
                </div>

                {/* Lineup */}
                {lineup.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, #00ffff, transparent)` }} />
                      <span className="font-mono text-xs tracking-[0.5em]" style={{ color: '#00ffff' }}>LINEUP</span>
                      <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, #00ffff, transparent)` }} />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      {lineup.map((artist, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-4 p-4 group"
                          style={{
                            background: 'linear-gradient(135deg, rgba(0,255,255,0.05) 0%, transparent 100%)',
                            border: '1px solid rgba(0,255,255,0.2)',
                          }}
                        >
                          {artist.imageUrl ? (
                            <div className="relative w-16 h-16 flex-shrink-0" style={{ border: '2px solid #00ffff' }}>
                              <Image src={artist.imageUrl} alt={artist.name} fill className="object-cover" />
                            </div>
                          ) : (
                            <div
                              className="w-16 h-16 flex items-center justify-center flex-shrink-0 font-mono text-xl font-bold"
                              style={{ border: '2px solid #00ffff', color: '#00ffff' }}
                            >
                              {artist.name.charAt(0)}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className={`${typographyClass} text-xl`}>{artist.name}</p>
                            {artist.role && (
                              <p className="font-mono text-xs text-white/40 tracking-wider">{artist.role.toUpperCase()}</p>
                            )}
                          </div>
                          {artist.showtime && artist.showShowtime !== false && (
                            <span className="font-mono text-sm" style={{ color: accentColor }}>
                              {artist.showtime}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tickets */}
                {!isRsvpEvent && availableTiers.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }} />
                      <span className="font-mono text-xs tracking-[0.5em]" style={{ color: accentColor }}>TICKETS</span>
                      <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }} />
                    </div>

                    <div className="space-y-4">
                      {availableTiers.map((tier: TierType) => {
                        const available = tier.quantity - tier.quantitySold
                        const soldOut = available <= 0

                        return (
                          <div
                            key={tier.id}
                            className={`p-6 flex items-center justify-between ${soldOut ? 'opacity-40' : ''}`}
                            style={{
                              background: `linear-gradient(135deg, ${accentColor}10 0%, transparent 100%)`,
                              border: `1px solid ${accentColor}40`,
                            }}
                          >
                            <div>
                              <p className={`${typographyClass} text-xl`}>{tier.name}</p>
                              {tier.description && (
                                <p className="text-sm text-white/40 mt-1">{tier.description}</p>
                              )}
                              <p className="font-mono text-xs text-white/30 mt-2">
                                {soldOut ? 'SOLD OUT' : `${available} REMAINING`}
                              </p>
                            </div>
                            <div
                              className="font-mono text-2xl font-bold"
                              style={{ color: soldOut ? 'rgba(255,255,255,0.3)' : accentColor }}
                            >
                              {tier.price === 0 ? 'FREE' : formatCents(tier.price)}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Info Sections */}
                <EventInfoSections
                  about={event.about}
                  refundPolicy={event.refundPolicy}
                  faqs={event.faqs}
                  variant="default"
                  accentColor={accentColor}
                />
              </div>
            </section>

            {/* Footer */}
            <footer className="py-8 text-center">
              <p className="font-mono text-xs text-white/30 tracking-wider">
                &copy; {new Date().getFullYear()} AFTERS // ALL RIGHTS RESERVED
              </p>
            </footer>
          </div>

          {/* Mobile sticky CTA */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-[#0a0612]/95 backdrop-blur-xl border-t z-50" style={{ borderColor: `${accentColor}30` }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-mono text-xs text-white/40">{isRsvpEvent ? 'ENTRY' : 'FROM'}</div>
                <div className="font-mono text-xl" style={{ color: accentColor }}>
                  {isRsvpEvent ? 'FREE' : (lowestPrice === 0 ? 'FREE' : formatCents(lowestPrice))}
                </div>
              </div>
              {hasAvailability ? (
                <Link
                  href={ctaUrl}
                  className="px-8 py-3 font-mono font-bold text-black"
                  style={{ background: `linear-gradient(90deg, ${accentColor}, #ff00ff)` }}
                >
                  {ctaText}
                </Link>
              ) : (
                <div className="px-8 py-3 bg-white/5 text-white/30 font-mono">{isRsvpEvent ? 'FULL' : 'SOLD OUT'}</div>
              )}
            </div>
          </div>
        </div>
      )
    }

    // ============================================
    // EDITORIAL TEMPLATE - Magazine-style, sophisticated (DEFAULT)
    // ============================================
    return (
      <div className="min-h-screen bg-neutral-950 text-white">
        <ViewTracker eventId={event.id} />

      {/* Subtle texture */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, white 0px, white 1px, transparent 1px, transparent 8px)`,
          }}
        />
      </div>

      <div className="relative z-10">
        {/* Hero - full-width image with editorial overlay */}
        <section className="relative">
          {event.flyerUrl ? (
            <div className="relative h-[70vh] md:h-[80vh]">
              <Image
                src={event.flyerUrl}
                alt={event.title}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent" />
            </div>
          ) : (
            <div
              className="h-[50vh] bg-gradient-to-br from-neutral-900 to-neutral-950"
            />
          )}

          {/* Editorial text overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 lg:p-16">
            <div className="max-w-7xl mx-auto">
              {/* Organizer tag */}
              <div className="flex items-center gap-3 mb-4">
                {event.organizer.logoUrl && (
                  <div className="relative w-6 h-6 rounded-full overflow-hidden border border-white/20">
                    <Image src={event.organizer.logoUrl} alt={event.organizer.displayName} fill className="object-cover" />
                  </div>
                )}
                <span
                  className="font-mono text-[10px] tracking-[0.4em] uppercase"
                  style={{ color: accentColor }}
                >
                  {event.organizer.displayName}
                </span>
              </div>

              {/* Title - editorial split */}
              <h1 className={`${typographyClass} text-5xl md:text-7xl lg:text-8xl tracking-tight leading-[0.9]`}>
                <span className="text-white">{event.title.split(' ')[0]}</span>
                {event.title.split(' ').length > 1 && (
                  <>
                    <br />
                    <span className="text-white/50">{event.title.split(' ').slice(1).join(' ')}</span>
                  </>
                )}
              </h1>

              {/* Meta line */}
              <div className="flex items-center gap-4 mt-6 text-sm text-white/40 font-mono">
                <span>{eventDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span>{timeStr}</span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span>{event.city}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Editorial content grid */}
        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="grid lg:grid-cols-[2fr_1fr] gap-16">
              {/* Main column */}
              <div>
                {/* Intro section */}
                <div className="mb-16">
                  <div className="w-16 h-px mb-8" style={{ backgroundColor: accentColor }} />
                  <p className={`${typographyClass} text-2xl md:text-3xl font-light leading-relaxed text-white/80`}>
                    {event.description || `Join us for an unforgettable night featuring incredible music and atmosphere.`}
                  </p>
                </div>

                {/* Details grid */}
                <div className="grid md:grid-cols-2 gap-12 mb-16">
                  {/* Date & Time */}
                  <div>
                    <h3 className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/40 mb-4">When</h3>
                    <p className={`${typographyClass} text-xl`}>{dayStr}</p>
                    <p className="text-white/60">{eventDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
                    <p className="text-white/40 mt-1">{timeStr}</p>
                  </div>

                  {/* Location */}
                  <div>
                    <h3 className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/40 mb-4">Where</h3>
                    {showLocation ? (
                      <>
                        <p className={`${typographyClass} text-xl`}>{event.venueName}</p>
                        {locationPrecision === 'exact' && (
                          <p className="text-white/60">{event.venueAddress}</p>
                        )}
                        <p className="text-white/40 mt-1">{event.city}{event.state ? `, ${event.state}` : ''}</p>
                        {mapUrl && (
                          <a
                            href={mapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 mt-3 text-sm"
                            style={{ color: accentColor }}
                          >
                            View on map <ArrowRight className="w-3 h-3" />
                          </a>
                        )}
                      </>
                    ) : (
                      <>
                        <p className={`${typographyClass} text-xl flex items-center gap-2`}>
                          <Lock className="w-4 h-4" style={{ color: accentColor }} />
                          Secret Location
                        </p>
                        <p className="text-white/40 mt-1">{event.city}</p>
                        <p className="text-sm text-white/30 mt-2">Address revealed after purchase</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Map */}
                {showMap && mapEmbedUrl && (
                  <div className="mb-16">
                    <h3 className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/40 mb-4">Location</h3>
                    <div className="border border-white/10 rounded overflow-hidden">
                      <iframe
                        src={mapEmbedUrl}
                        className="w-full h-80"
                        style={{ border: 0, filter: 'grayscale(0.5) brightness(0.8)' }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                  </div>
                )}

                {/* Lineup */}
                {lineup.length > 0 && (
                  <div className="mb-16">
                    <h3 className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/40 mb-8">Featured Artists</h3>
                    <div className="space-y-6">
                      {lineup.map((artist, i) => (
                        <div key={i} className="flex items-center gap-6 group">
                          <span className="font-mono text-xs text-white/20">{String(i + 1).padStart(2, '0')}</span>
                          {artist.imageUrl && (
                            <div className="relative w-16 h-16 rounded-full overflow-hidden border border-white/10 group-hover:border-white/30 transition-colors">
                              <Image src={artist.imageUrl} alt={artist.name} fill className="object-cover" />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className={`${typographyClass} text-2xl group-hover:text-white transition-colors`}>{artist.name}</p>
                            {artist.role && <p className="text-sm text-white/40">{artist.role}</p>}
                          </div>
                          {artist.showtime && artist.showShowtime !== false && (
                            <span className="font-mono text-sm" style={{ color: accentColor }}>
                              {artist.showtime}
                            </span>
                          )}
                          {artist.socialUrl && (
                            <a href={artist.socialUrl} target="_blank" rel="noopener noreferrer" className="ml-auto text-white/20 hover:text-white transition-colors">
                              <Instagram className="w-5 h-5" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar - Tickets */}
              <div className="lg:sticky lg:top-8 lg:self-start">
                <div className="border border-white/10 bg-neutral-900/50">
                  {/* Header */}
                  <div className="p-6 border-b border-white/10">
                    <h3 className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/40 mb-2">Admission</h3>
                    <p className={`${typographyClass} text-3xl`} style={{ color: accentColor }}>
                      {lowestPrice === 0 ? 'Free Entry' : `From ${formatCents(lowestPrice)}`}
                    </p>
                  </div>

                  {/* Tiers */}
                  <div className="p-6 space-y-4">
                    {availableTiers.map((tier: TierType) => {
                      const available = tier.quantity - tier.quantitySold
                      const soldOut = available <= 0

                      return (
                        <div
                          key={tier.id}
                          className={`p-4 border border-white/10 ${soldOut ? 'opacity-40' : ''}`}
                        >
                          <div className="flex justify-between items-baseline">
                            <span className={`${typographyClass}`}>{tier.name}</span>
                            <span style={{ color: soldOut ? 'rgba(255,255,255,0.3)' : accentColor }}>
                              {tier.price === 0 ? 'Free' : formatCents(tier.price)}
                            </span>
                          </div>
                          <div className="text-xs text-white/30 mt-1">
                            {soldOut ? 'Sold out' : `${available} remaining`}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* CTA */}
                  <div className="p-6 pt-0">
                    {hasAvailability ? (
                      <Link
                        href={ctaUrl}
                        className="w-full block py-4 text-center text-black font-medium transition-opacity hover:opacity-90"
                        style={{ backgroundColor: accentColor }}
                      >
                        {isRsvpEvent ? 'RSVP' : 'Get Tickets'}
                      </Link>
                    ) : (
                      <div className="w-full py-4 text-center bg-white/5 text-white/30">
                        {isRsvpEvent ? 'Full' : 'Sold Out'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Organizer card */}
                <div className="mt-6 p-6 border border-white/10 bg-neutral-900/30">
                  <div className="flex items-center gap-4">
                    {event.organizer.logoUrl ? (
                      <div className="relative w-12 h-12 rounded-full overflow-hidden border border-white/10">
                        <Image src={event.organizer.logoUrl} alt={event.organizer.displayName} fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accentColor}20` }}>
                        <span style={{ color: accentColor }}>{event.organizer.displayName.charAt(0)}</span>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-white/40 uppercase tracking-wider">Presented by</p>
                      <p className={`${typographyClass}`}>{event.organizer.displayName}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Info Sections */}
        <div className="px-6 md:px-12 py-12">
          <div className="max-w-7xl mx-auto">
            <EventInfoSections
              about={event.about}
              refundPolicy={event.refundPolicy}
              faqs={event.faqs}
              variant="default"
              accentColor={accentColor}
            />
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-white/10 py-8 px-6 md:px-12">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/30">
            <span>&copy; {new Date().getFullYear()} Afters</span>
            <a href="https://afters.am" className="hover:text-white transition-colors">afters.am</a>
          </div>
        </footer>
      </div>

      {/* Mobile sticky CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-neutral-950/95 backdrop-blur border-t border-white/10 z-50">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-white/40">{isRsvpEvent ? 'Entry' : 'From'}</div>
            <div className={`${typographyClass} text-xl`} style={{ color: accentColor }}>
              {isRsvpEvent ? 'Free' : (lowestPrice === 0 ? 'Free' : formatCents(lowestPrice))}
            </div>
          </div>
          {hasAvailability ? (
            <Link
              href={ctaUrl}
              className="px-8 py-3 text-black font-medium"
              style={{ backgroundColor: accentColor }}
            >
              {isRsvpEvent ? 'RSVP' : 'Get Tickets'}
            </Link>
          ) : (
            <div className="px-8 py-3 bg-white/5 text-white/30">{isRsvpEvent ? 'Full' : 'Sold Out'}</div>
          )}
        </div>
      </div>
    </div>
    )
  }

  // Render the page with optional edit overlay for owners
  // Use preview params for initialDesign so the editor shows the correct current state
  const previewDesign = {
    accentColor: preview_color || event.accentColor || '#ff1493',
    typography: preview_typography || event.typography || 'headline',
    pageTheme: preview_theme || event.pageTheme || 'neon',
    showLocationOnPage: event.showLocationOnPage ?? false,
    showMapOnPage: event.showMapOnPage ?? false,
    isAddressHidden: event.isAddressHidden ?? false,
  }

  return (
    <>
      {isOwner && (
        <EditDesignOverlay
          eventId={event.id}
          initialDesign={previewDesign}
        />
      )}
      {renderEventPage()}
    </>
  )
}
