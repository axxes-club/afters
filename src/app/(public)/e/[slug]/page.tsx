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
  const pageTheme = event.pageTheme || 'neon'
  const typography = event.typography || 'headline'

  // Map typography ID to Tailwind class
  const typographyMap: Record<string, string> = {
    mono: 'font-mono',
    headline: 'font-headline',
    elegant: 'font-serif',
    modern: 'font-sans',
  }
  const typographyClass = typographyMap[typography] || 'font-headline'

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

  // Template-specific styles
  const getTemplateStyles = () => {
    switch (pageTheme) {
      case 'brutalist':
        return {
          pageBg: 'bg-black',
          heroOverlay: 'bg-gradient-to-t from-black via-black/60 to-black/20',
          cardBorder: `border-4`,
          cardBorderColor: accentColor,
          cardBg: 'bg-black',
          sectionDivider: `border-t-4 border-[${accentColor}]`,
          buttonStyle: `border-4 bg-transparent hover:bg-[${accentColor}]`,
          buttonTextColor: accentColor,
          pillStyle: `border-2 bg-transparent`,
          accentBar: true,
          glowEffects: false,
          rotatedElements: false,
          minimalStyle: false,
          editorialStyle: false,
        }
      case 'neon':
        return {
          pageBg: 'bg-black',
          heroOverlay: 'bg-gradient-to-t from-black via-black/70 to-transparent',
          cardBorder: 'border',
          cardBorderColor: `${accentColor}50`,
          cardBg: 'bg-black/50',
          sectionDivider: 'bg-gradient-to-r from-white/20 to-transparent h-px',
          buttonStyle: 'border',
          buttonTextColor: accentColor,
          pillStyle: 'border',
          accentBar: false,
          glowEffects: true,
          rotatedElements: false,
          minimalStyle: false,
          editorialStyle: false,
        }
      case 'minimal':
        return {
          pageBg: 'bg-zinc-950',
          heroOverlay: 'bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent',
          cardBorder: 'border',
          cardBorderColor: 'rgba(255,255,255,0.08)',
          cardBg: 'bg-white/[0.02]',
          sectionDivider: 'bg-white/10 h-px',
          buttonStyle: '',
          buttonTextColor: '#000',
          pillStyle: 'border border-white/10',
          accentBar: false,
          glowEffects: false,
          rotatedElements: false,
          minimalStyle: true,
          editorialStyle: false,
        }
      case 'rave':
        return {
          pageBg: 'bg-black',
          heroOverlay: 'bg-gradient-to-t from-black via-black/50 to-transparent',
          cardBorder: 'border-2',
          cardBorderColor: accentColor,
          cardBg: 'bg-black',
          sectionDivider: `bg-[${accentColor}] h-1 -rotate-1`,
          buttonStyle: '-rotate-1 hover:rotate-0 transition-transform',
          buttonTextColor: '#000',
          pillStyle: 'border-2 -rotate-1',
          accentBar: false,
          glowEffects: false,
          rotatedElements: true,
          minimalStyle: false,
          editorialStyle: false,
        }
      case 'editorial':
        return {
          pageBg: 'bg-neutral-950',
          heroOverlay: 'bg-gradient-to-t from-neutral-950 via-neutral-950/90 to-neutral-950/50',
          cardBorder: 'border',
          cardBorderColor: 'rgba(255,255,255,0.1)',
          cardBg: 'bg-neutral-900/50',
          sectionDivider: 'bg-white/10 h-px',
          buttonStyle: '',
          buttonTextColor: '#000',
          pillStyle: 'border border-white/10',
          accentBar: false,
          glowEffects: false,
          rotatedElements: false,
          minimalStyle: false,
          editorialStyle: true,
        }
      default:
        return {
          pageBg: 'bg-black',
          heroOverlay: 'bg-gradient-to-t from-black via-black/70 to-transparent',
          cardBorder: 'border',
          cardBorderColor: `${accentColor}50`,
          cardBg: 'bg-black/50',
          sectionDivider: 'bg-gradient-to-r from-white/20 to-transparent h-px',
          buttonStyle: '',
          buttonTextColor: '#000',
          pillStyle: 'border',
          accentBar: false,
          glowEffects: true,
          rotatedElements: false,
          minimalStyle: false,
          editorialStyle: false,
        }
    }
  }

  const styles = getTemplateStyles()

  // Generate glow box shadow for neon template
  const glowShadow = styles.glowEffects
    ? `0 0 30px ${accentColor}40, 0 0 60px ${accentColor}20`
    : 'none'

  return (
    <div className={`min-h-screen ${styles.pageBg} text-white relative`} data-template={pageTheme}>
      <ViewTracker eventId={event.id} />

      {/* Template-specific background effects */}
      {pageTheme === 'brutalist' && (
        <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(${accentColor} 2px, transparent 2px),
                linear-gradient(90deg, ${accentColor} 2px, transparent 2px)
              `,
              backgroundSize: '80px 80px',
            }}
          />
        </div>
      )}

      {pageTheme === 'neon' && (
        <>
          <div className="fixed inset-0 pointer-events-none grain z-50 opacity-30" />
          <div
            className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[150px] opacity-20 pointer-events-none"
            style={{ backgroundColor: accentColor }}
          />
        </>
      )}

      {pageTheme === 'rave' && (
        <>
          <div
            className="fixed -top-20 -left-20 w-80 h-80 border-[12px] rotate-12 pointer-events-none opacity-10"
            style={{ borderColor: accentColor }}
          />
          <div
            className="fixed -bottom-32 -right-32 w-96 h-96 -rotate-12 pointer-events-none opacity-20"
            style={{ backgroundColor: accentColor }}
          />
          <div className="fixed top-1/3 right-10 w-20 h-20 border-4 border-white rotate-45 pointer-events-none opacity-10" />
        </>
      )}

      {pageTheme === 'editorial' && (
        <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.02]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `repeating-linear-gradient(0deg, white 0px, white 1px, transparent 1px, transparent 8px)`,
            }}
          />
        </div>
      )}

      {/* Hero Section */}
      <section className={`relative min-h-[85vh] md:min-h-[90vh] flex items-end overflow-hidden ${pageTheme === 'rave' ? 'skew-y-0' : ''}`}>
        {/* Background Image */}
        {event.flyerUrl ? (
          <div className="absolute inset-0 group">
            <Image
              src={event.flyerUrl}
              alt={event.title}
              fill
              className={`object-cover ${pageTheme === 'minimal' ? 'opacity-60' : ''}`}
              priority
            />
            <div className={`absolute inset-0 ${styles.heroOverlay}`} />
            {pageTheme === 'neon' && (
              <div className="absolute inset-0 scanlines opacity-40" />
            )}
            {pageTheme === 'brutalist' && (
              <div className="absolute inset-0 bg-black/40" />
            )}
          </div>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: pageTheme === 'minimal'
                ? 'linear-gradient(180deg, #18181b 0%, #09090b 100%)'
                : pageTheme === 'editorial'
                  ? 'linear-gradient(180deg, #171717 0%, #0a0a0a 100%)'
                  : `
                    radial-gradient(ellipse at 30% 20%, ${accentColor}15 0%, transparent 50%),
                    radial-gradient(ellipse at 70% 80%, ${accentColor}10 0%, transparent 50%),
                    linear-gradient(180deg, #0a0a0a 0%, #000000 100%)
                  `
            }}
          />
        )}

        {/* Brutalist accent bar */}
        {pageTheme === 'brutalist' && (
          <div
            className="absolute top-0 left-0 right-0 h-3 z-20"
            style={{ backgroundColor: accentColor }}
          />
        )}

        {/* Floating Date Badge - different per template */}
        {pageTheme !== 'editorial' && (
          <div
            className={`absolute top-24 right-6 md:right-12 hidden md:block ${pageTheme === 'rave' ? '-rotate-6' : ''}`}
          >
            <div
              className={`w-24 h-24 flex flex-col items-center justify-center ${pageTheme === 'brutalist' ? 'border-4' : 'border-2'}`}
              style={{
                borderColor: accentColor,
                backgroundColor: pageTheme === 'minimal' ? 'rgba(24,24,27,0.9)' : 'rgba(0,0,0,0.8)',
                boxShadow: styles.glowEffects ? glowShadow : 'none',
              }}
            >
              <span className={`${typographyClass} text-3xl`} style={{ color: accentColor }}>
                {eventDate.getDate()}
              </span>
              <span className="font-mono text-[10px] tracking-widest text-white/60 uppercase">
                {eventDate.toLocaleDateString("en-US", { month: "short" })}
              </span>
            </div>
          </div>
        )}

        {/* Hero Content */}
        <div className="relative z-10 w-full p-6 md:p-12 lg:p-16 pb-10">
          <div className="container mx-auto max-w-6xl">
            {/* Editorial category tag */}
            {pageTheme === 'editorial' && (
              <div
                className="font-mono text-[10px] tracking-[0.3em] uppercase mb-4"
                style={{ color: accentColor }}
              >
                Music Event
              </div>
            )}

            {/* Organizer Tag */}
            <div className={`flex items-center gap-3 mb-6 ${pageTheme === 'rave' ? '-rotate-1' : ''}`}>
              {event.organizer.logoUrl && (
                <div
                  className={`relative w-8 h-8 overflow-hidden ${pageTheme === 'brutalist' ? 'border-2' : 'rounded-full border'}`}
                  style={{ borderColor: pageTheme === 'brutalist' ? accentColor : 'rgba(255,255,255,0.2)' }}
                >
                  <Image
                    src={event.organizer.logoUrl}
                    alt={event.organizer.displayName}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <span className="font-body text-sm text-white/60 tracking-wide">
                {pageTheme === 'editorial' ? 'Presented by ' : 'Presented by '}
                <span className="text-white">{event.organizer.displayName}</span>
              </span>
            </div>

            {/* Title */}
            <h1
              className={`${typographyClass} text-5xl md:text-7xl lg:text-8xl tracking-wide mb-8 ${pageTheme === 'rave' ? '-rotate-1' : ''} ${pageTheme === 'minimal' ? 'font-light' : ''}`}
              style={{
                textShadow: styles.glowEffects ? `0 0 40px ${accentColor}60` : 'none',
              }}
            >
              {pageTheme === 'editorial' ? (
                <>
                  <span className="text-white">{event.title.split(' ')[0]}</span>
                  {event.title.split(' ').length > 1 && (
                    <>
                      <br />
                      <span className="text-white/60">{event.title.split(' ').slice(1).join(' ')}</span>
                    </>
                  )}
                </>
              ) : (
                event.title
              )}
            </h1>

            {/* Info Pills */}
            <div className={`flex flex-wrap gap-3 mb-8 ${pageTheme === 'rave' ? 'rotate-1' : ''}`}>
              <div
                className={`flex items-center gap-2.5 px-4 py-2.5 font-body text-sm ${styles.pillStyle} ${pageTheme === 'rave' ? '-rotate-2' : ''}`}
                style={{
                  backgroundColor: pageTheme === 'minimal' || pageTheme === 'editorial' ? 'transparent' : `${accentColor}15`,
                  borderColor: pageTheme === 'brutalist' ? accentColor : pageTheme === 'rave' ? accentColor : undefined,
                  borderLeftWidth: pageTheme !== 'brutalist' && pageTheme !== 'rave' ? '3px' : undefined,
                  borderLeftColor: pageTheme !== 'brutalist' && pageTheme !== 'rave' ? accentColor : undefined,
                }}
              >
                <CalendarDays className="h-4 w-4" style={{ color: accentColor }} />
                <span className="text-white/90">{dayStr}, {dateStr}</span>
              </div>
              <div
                className={`flex items-center gap-2.5 px-4 py-2.5 font-body text-sm ${styles.pillStyle} ${pageTheme === 'rave' ? 'rotate-1' : ''}`}
                style={{
                  backgroundColor: pageTheme === 'minimal' || pageTheme === 'editorial' ? 'transparent' : `${accentColor}15`,
                  borderColor: pageTheme === 'brutalist' ? accentColor : pageTheme === 'rave' ? accentColor : undefined,
                  borderLeftWidth: pageTheme !== 'brutalist' && pageTheme !== 'rave' ? '3px' : undefined,
                  borderLeftColor: pageTheme !== 'brutalist' && pageTheme !== 'rave' ? accentColor : undefined,
                }}
              >
                <Clock className="h-4 w-4" style={{ color: accentColor }} />
                <span className="text-white/90">{timeStr}</span>
              </div>
              <div
                className={`flex items-center gap-2.5 px-4 py-2.5 font-body text-sm ${styles.pillStyle} ${pageTheme === 'rave' ? '-rotate-1' : ''}`}
                style={{
                  backgroundColor: pageTheme === 'minimal' || pageTheme === 'editorial' ? 'transparent' : `${accentColor}15`,
                  borderColor: pageTheme === 'brutalist' ? accentColor : pageTheme === 'rave' ? accentColor : undefined,
                  borderLeftWidth: pageTheme !== 'brutalist' && pageTheme !== 'rave' ? '3px' : undefined,
                  borderLeftColor: pageTheme !== 'brutalist' && pageTheme !== 'rave' ? accentColor : undefined,
                }}
              >
                {event.isAddressHidden ? (
                  <>
                    <Lock className="h-4 w-4" style={{ color: accentColor }} />
                    <span className="text-white/90">{event.city} {pageTheme === 'editorial' ? '—' : '•'} Secret Location</span>
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4" style={{ color: accentColor }} />
                    <span className="text-white/90">{event.venueName}, {event.city}</span>
                  </>
                )}
              </div>
              {event.ageRestriction && (
                <div
                  className={`flex items-center px-4 py-2.5 font-mono text-xs ${pageTheme === 'brutalist' ? 'border-2' : 'border'} ${pageTheme === 'rave' ? 'rotate-2' : ''}`}
                  style={{ borderColor: pageTheme === 'brutalist' ? 'white' : 'rgba(255,255,255,0.2)' }}
                >
                  <span className="text-white/70">{event.ageRestriction}+ ONLY</span>
                </div>
              )}
            </div>

            {/* Desktop CTA */}
            <div className={`hidden md:flex items-center gap-6 ${pageTheme === 'rave' ? '-rotate-1' : ''}`}>
              {totalAvailable > 0 ? (
                <Link
                  href={`/e/${combinedSlug}/checkout`}
                  className={`group flex items-center gap-3 px-8 py-4 ${typographyClass} text-xl tracking-wider transition-all ${styles.buttonStyle}`}
                  style={{
                    backgroundColor: pageTheme === 'brutalist' ? 'transparent' : accentColor,
                    color: pageTheme === 'brutalist' ? accentColor : '#000',
                    borderColor: pageTheme === 'brutalist' ? accentColor : 'transparent',
                    boxShadow: styles.glowEffects ? `0 0 20px ${accentColor}50` : 'none',
                  }}
                >
                  <span>{pageTheme === 'brutalist' ? 'GET TICKETS →' : 'GET TICKETS'}</span>
                  {pageTheme !== 'brutalist' && (
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  )}
                </Link>
              ) : (
                <div className={`px-8 py-4 ${typographyClass} text-xl tracking-wider bg-white/5 text-white/30`}>
                  SOLD OUT
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-body text-xs text-white/40 uppercase tracking-wider">
                  {pageTheme === 'editorial' ? 'From' : 'Starting at'}
                </span>
                <span
                  className={`${typographyClass} text-3xl`}
                  style={{
                    color: accentColor,
                    textShadow: styles.glowEffects ? `0 0 20px ${accentColor}60` : 'none',
                  }}
                >
                  {lowestPrice === 0 ? 'FREE' : formatCents(lowestPrice)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Sticky CTA */}
      <div
        className={`md:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl border-t safe-area-bottom ${pageTheme === 'minimal' ? 'bg-zinc-950/95 border-white/5' : pageTheme === 'editorial' ? 'bg-neutral-950/95 border-white/5' : 'bg-black/95 border-white/10'}`}
      >
        <div className="flex items-center justify-between p-4">
          <div>
            <p className="font-body text-[10px] text-white/40 uppercase tracking-wider">From</p>
            <p
              className={`${typographyClass} text-2xl`}
              style={{
                color: accentColor,
                textShadow: styles.glowEffects ? `0 0 15px ${accentColor}60` : 'none',
              }}
            >
              {lowestPrice === 0 ? 'FREE' : formatCents(lowestPrice)}
            </p>
          </div>
          {totalAvailable > 0 ? (
            <Link
              href={`/e/${combinedSlug}/checkout`}
              className={`flex items-center gap-2 px-6 py-3.5 ${typographyClass} text-base tracking-wider ${styles.buttonStyle}`}
              style={{
                backgroundColor: pageTheme === 'brutalist' ? 'transparent' : accentColor,
                color: pageTheme === 'brutalist' ? accentColor : '#000',
                borderColor: pageTheme === 'brutalist' ? accentColor : 'transparent',
                boxShadow: styles.glowEffects ? `0 0 15px ${accentColor}40` : 'none',
              }}
            >
              <Ticket className="h-4 w-4" />
              {pageTheme === 'brutalist' ? 'TICKETS' : 'GET TICKETS'}
            </Link>
          ) : (
            <div className={`px-6 py-3.5 ${typographyClass} text-base tracking-wider bg-white/5 text-white/30`}>
              SOLD OUT
            </div>
          )}
        </div>
      </div>

      {/* Content Section */}
      <section className={`relative py-12 md:py-20 pb-32 md:pb-20 ${pageTheme === 'minimal' ? '' : pageTheme === 'editorial' ? '' : 'stripe-pattern'}`}>
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid lg:grid-cols-[1fr_380px] gap-12 lg:gap-16">
            {/* Main Content */}
            <div className="space-y-16">
              {/* Lineup Section */}
              {lineup.length > 0 && (
                <div className={pageTheme === 'rave' ? 'rotate-0' : ''}>
                  <div className={`flex items-center gap-4 mb-8 ${pageTheme === 'rave' ? '-rotate-1' : ''}`}>
                    <h2 className={`${typographyClass} text-3xl tracking-wide ${pageTheme === 'minimal' ? 'font-light' : ''}`}>
                      {pageTheme === 'editorial' ? 'Lineup' : 'LINEUP'}
                    </h2>
                    <div
                      className={`flex-1 ${pageTheme === 'brutalist' ? 'h-1' : 'h-px'}`}
                      style={{
                        background: pageTheme === 'brutalist'
                          ? accentColor
                          : 'linear-gradient(to right, rgba(255,255,255,0.2), transparent)',
                      }}
                    />
                  </div>
                  <div className="grid gap-3">
                    {lineup.map((artist, i) => (
                      <div
                        key={i}
                        className={`group flex items-center gap-5 p-5 transition-all ${styles.cardBorder} ${pageTheme === 'rave' ? (i % 2 === 0 ? '-rotate-1' : 'rotate-1') : ''}`}
                        style={{
                          borderColor: pageTheme === 'brutalist' ? accentColor : styles.cardBorderColor,
                          backgroundColor: styles.cardBg.includes('bg-') ? undefined : 'rgba(255,255,255,0.02)',
                          boxShadow: styles.glowEffects ? `0 0 20px ${accentColor}10` : 'none',
                        }}
                      >
                        {artist.imageUrl ? (
                          <div
                            className={`relative w-14 h-14 overflow-hidden ${pageTheme === 'brutalist' ? 'border-2' : 'rounded-full border-2'}`}
                            style={{ borderColor: `${accentColor}50` }}
                          >
                            <Image
                              src={artist.imageUrl}
                              alt={artist.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div
                            className={`w-14 h-14 flex items-center justify-center ${typographyClass} text-2xl ${pageTheme === 'brutalist' ? '' : ''}`}
                            style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                          >
                            {artist.name.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`${typographyClass} text-xl tracking-wide group-hover:text-white transition-colors ${pageTheme === 'minimal' ? 'font-light' : ''}`}>
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
                <div>
                  <div className={`flex items-center gap-4 mb-8 ${pageTheme === 'rave' ? 'rotate-1' : ''}`}>
                    <h2 className={`${typographyClass} text-3xl tracking-wide ${pageTheme === 'minimal' ? 'font-light' : ''}`}>
                      {pageTheme === 'editorial' ? 'About' : 'ABOUT'}
                    </h2>
                    <div
                      className={`flex-1 ${pageTheme === 'brutalist' ? 'h-1' : 'h-px'}`}
                      style={{
                        background: pageTheme === 'brutalist'
                          ? accentColor
                          : 'linear-gradient(to right, rgba(255,255,255,0.2), transparent)',
                      }}
                    />
                  </div>
                  <div
                    className={`relative pl-6 ${pageTheme === 'brutalist' ? 'border-l-4' : 'border-l-2'} ${pageTheme === 'rave' ? '-rotate-1' : ''}`}
                    style={{ borderColor: `${accentColor}${pageTheme === 'minimal' ? '30' : '50'}` }}
                  >
                    <p className={`font-body text-base whitespace-pre-wrap leading-relaxed ${pageTheme === 'minimal' || pageTheme === 'editorial' ? 'text-white/60' : 'text-white/70'}`}>
                      {event.description}
                    </p>
                  </div>
                </div>
              )}

              {/* Location Section */}
              <div>
                <div className={`flex items-center gap-4 mb-8 ${pageTheme === 'rave' ? '-rotate-1' : ''}`}>
                  <h2 className={`${typographyClass} text-3xl tracking-wide ${pageTheme === 'minimal' ? 'font-light' : ''}`}>
                    {pageTheme === 'editorial' ? 'Location' : 'LOCATION'}
                  </h2>
                  <div
                    className={`flex-1 ${pageTheme === 'brutalist' ? 'h-1' : 'h-px'}`}
                    style={{
                      background: pageTheme === 'brutalist'
                        ? accentColor
                        : 'linear-gradient(to right, rgba(255,255,255,0.2), transparent)',
                    }}
                  />
                </div>
                {event.isAddressHidden ? (
                  <div
                    className={`p-6 ${pageTheme === 'brutalist' ? 'border-l-4' : 'border-l-4'} ${pageTheme === 'rave' ? 'rotate-1' : ''}`}
                    style={{
                      borderColor: accentColor,
                      backgroundColor: `${accentColor}08`,
                    }}
                  >
                    <div className="flex items-center gap-4 mb-3">
                      <div
                        className={`w-12 h-12 flex items-center justify-center ${pageTheme === 'brutalist' ? 'border-2' : ''}`}
                        style={{
                          backgroundColor: pageTheme === 'brutalist' ? 'transparent' : `${accentColor}20`,
                          borderColor: pageTheme === 'brutalist' ? accentColor : undefined,
                        }}
                      >
                        <Lock className="h-6 w-6" style={{ color: accentColor }} />
                      </div>
                      <div>
                        <p className={`${typographyClass} text-xl tracking-wide ${pageTheme === 'minimal' ? 'font-light' : ''}`}>
                          {pageTheme === 'editorial' ? 'Secret Location' : 'SECRET LOCATION'}
                        </p>
                        <p className="font-body text-sm text-white/50">{event.city}</p>
                      </div>
                    </div>
                    <p className="font-body text-sm text-white/40 pl-16">
                      The exact address will be revealed after you purchase tickets.
                    </p>
                  </div>
                ) : (
                  <div className={`space-y-2 ${pageTheme === 'rave' ? 'rotate-1' : ''}`}>
                    <p className={`${typographyClass} text-2xl tracking-wide ${pageTheme === 'minimal' ? 'font-light' : ''}`}>
                      {event.venueName}
                    </p>
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
              <div className={`sticky top-20 ${pageTheme === 'rave' ? '-rotate-1' : ''}`}>
                <div
                  className={`relative overflow-hidden ${styles.cardBorder}`}
                  style={{
                    borderColor: pageTheme === 'brutalist' ? accentColor : styles.cardBorderColor,
                    boxShadow: styles.glowEffects ? `0 0 40px ${accentColor}20` : 'none',
                  }}
                >
                  {/* Accent top bar */}
                  <div
                    className={pageTheme === 'brutalist' ? 'h-3' : 'h-2'}
                    style={{ backgroundColor: accentColor }}
                  />

                  {/* Header */}
                  <div
                    className={`px-6 py-4 border-b`}
                    style={{
                      borderColor: pageTheme === 'brutalist' ? accentColor : 'rgba(255,255,255,0.1)',
                      backgroundColor: `${accentColor}08`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className={`${typographyClass} text-xl tracking-wider ${pageTheme === 'minimal' ? 'font-light' : ''}`}>
                        {pageTheme === 'editorial' ? 'Tickets' : 'TICKETS'}
                      </h3>
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
                            relative p-4 transition-all ${styles.cardBorder}
                            ${soldOut
                              ? 'opacity-50'
                              : 'hover:border-white/20 cursor-pointer'
                            }
                            ${pageTheme === 'rave' ? (i % 2 === 0 ? '-rotate-1' : 'rotate-1') : ''}
                          `}
                          style={{
                            borderColor: soldOut
                              ? 'rgba(255,255,255,0.05)'
                              : pageTheme === 'brutalist'
                                ? accentColor
                                : 'rgba(255,255,255,0.1)',
                            borderLeftWidth: !soldOut && pageTheme !== 'brutalist' ? '3px' : undefined,
                            borderLeftColor: !soldOut && pageTheme !== 'brutalist' ? accentColor : undefined,
                          }}
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className={`${typographyClass} text-lg tracking-wide ${pageTheme === 'minimal' ? 'font-light' : ''}`}>
                                  {tier.name}
                                </p>
                                {almostGone && (
                                  <span
                                    className="px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider"
                                    style={{ backgroundColor: `${accentColor}30`, color: accentColor }}
                                  >
                                    {pageTheme === 'editorial' ? 'Few Left' : 'Almost Gone'}
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
                            <p
                              className={`${typographyClass} text-2xl`}
                              style={{
                                color: soldOut ? 'rgba(255,255,255,0.3)' : accentColor,
                                textShadow: !soldOut && styles.glowEffects ? `0 0 15px ${accentColor}60` : 'none',
                              }}
                            >
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
                        className={`w-full flex items-center justify-center gap-2 py-4 ${typographyClass} text-lg tracking-wider transition-all ${styles.buttonStyle}`}
                        style={{
                          backgroundColor: pageTheme === 'brutalist' ? 'transparent' : accentColor,
                          color: pageTheme === 'brutalist' ? accentColor : '#000',
                          borderColor: pageTheme === 'brutalist' ? accentColor : 'transparent',
                          boxShadow: styles.glowEffects ? `0 0 20px ${accentColor}40` : 'none',
                        }}
                      >
                        <Ticket className="h-5 w-5" />
                        {pageTheme === 'brutalist' ? 'GET TICKETS →' : 'GET TICKETS'}
                      </Link>
                    ) : (
                      <div className={`w-full flex items-center justify-center py-4 ${typographyClass} text-lg tracking-wider bg-white/5 text-white/30`}>
                        SOLD OUT
                      </div>
                    )}
                  </div>

                  {/* Tear effect divider */}
                  <div className="relative py-4">
                    <div
                      className="absolute left-0 top-1/2 w-4 h-8 -translate-y-1/2 -translate-x-1/2 rounded-r-full"
                      style={{ backgroundColor: pageTheme === 'minimal' ? '#09090b' : pageTheme === 'editorial' ? '#0a0a0a' : '#000' }}
                    />
                    <div
                      className="absolute right-0 top-1/2 w-4 h-8 -translate-y-1/2 translate-x-1/2 rounded-l-full"
                      style={{ backgroundColor: pageTheme === 'minimal' ? '#09090b' : pageTheme === 'editorial' ? '#0a0a0a' : '#000' }}
                    />
                    <div
                      className={`mx-6 ${pageTheme === 'brutalist' ? 'border-t-2 border-dashed' : 'border-t border-dashed'}`}
                      style={{ borderColor: pageTheme === 'brutalist' ? accentColor : 'rgba(255,255,255,0.1)' }}
                    />
                  </div>

                  {/* Organizer */}
                  <div className="p-4 pt-0">
                    <div
                      className={`flex items-center gap-4 p-4 ${pageTheme === 'brutalist' ? 'border-2' : ''}`}
                      style={{
                        backgroundColor: pageTheme === 'brutalist' ? 'transparent' : 'rgba(255,255,255,0.02)',
                        borderColor: pageTheme === 'brutalist' ? accentColor : undefined,
                      }}
                    >
                      {event.organizer.logoUrl ? (
                        <div
                          className={`relative w-12 h-12 overflow-hidden ${pageTheme === 'brutalist' ? 'border-2' : 'rounded-full border'}`}
                          style={{ borderColor: pageTheme === 'brutalist' ? accentColor : 'rgba(255,255,255,0.1)' }}
                        >
                          <Image
                            src={event.organizer.logoUrl}
                            alt={event.organizer.displayName}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div
                          className={`w-12 h-12 flex items-center justify-center ${typographyClass} text-xl`}
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
      <footer
        className={`py-8 px-4 ${pageTheme === 'brutalist' ? 'border-t-4' : 'border-t'}`}
        style={{ borderColor: pageTheme === 'brutalist' ? accentColor : 'rgba(255,255,255,0.05)' }}
      >
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <Link
            href="/"
            className={`${typographyClass} text-xl tracking-wide text-white/40 hover:text-white transition-colors ${pageTheme === 'minimal' ? 'font-light' : ''}`}
          >
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
