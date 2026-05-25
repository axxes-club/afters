import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { prisma } from "@/lib/prisma"
import { formatCents } from "@/lib/stripe"
import { CalendarDays, MapPin, Clock, Users, Lock, Instagram, ArrowRight, Ticket, ExternalLink, AlertCircle } from "lucide-react"
import { ViewTracker } from "@/components/ViewTracker"
import { SeriesBadge } from "@/components/events/SeriesBadge"
import { getSessionUser } from "@/lib/auth-utils"
import { safeHref } from "@/lib/security"
import EditDesignOverlay from "@/components/public/EventPageClient"
import EventInfoSections from "@/components/public/EventInfoSections"
import BrutalistTemplate from "@/components/public/templates/BrutalistTemplate"
import NeonTemplate from "@/components/public/templates/NeonTemplate"
import MinimalTemplate from "@/components/public/templates/MinimalTemplate"
import TiltTemplate from "@/components/public/templates/TiltTemplate"
import LushTemplate from "@/components/public/templates/LushTemplate"
import NiceAmTemplate from "@/components/public/templates/NiceAmTemplate"
import CardTemplate from "@/components/public/templates/CardTemplate"
import VaporTemplate from "@/components/public/templates/VaporTemplate"
import EditorialTemplate from "@/components/public/templates/EditorialTemplate"
import type { Metadata } from "next"
import type { CSSProperties } from "react"

// Helper to check for slug redirects
async function checkSlugRedirect(slug: string): Promise<string | null> {
  const redirectEntry = await prisma.eventSlugRedirect.findFirst({
    where: { oldSlug: slug },
    include: {
      event: {
        select: { slug: true, isPublished: true },
      },
    },
  })
  
  if (redirectEntry && redirectEntry.event.isPublished) {
    return redirectEntry.event.slug
  }
  
  return null
}

// Rescheduled banner component
function RescheduledBanner({ 
  previousStartsAt, 
  newStartsAt,
  accentColor = "#ffa500",
  timezone = "America/New_York"
}: { 
  previousStartsAt: Date
  newStartsAt: Date
  accentColor?: string
  timezone?: string
}) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone: timezone,
    })
  }
  
  return (
    <div 
      className="w-full py-3 px-4 flex items-center justify-center gap-3 text-sm"
      style={{ 
        backgroundColor: `${accentColor}20`,
        borderBottom: `1px solid ${accentColor}40`,
      }}
    >
      <AlertCircle className="w-4 h-4" style={{ color: accentColor }} />
      <span className="text-white/80">
        <span className="font-medium" style={{ color: accentColor }}>Rescheduled</span>
        {" "}from {formatDate(previousStartsAt)} → {formatDate(newStartsAt)}
      </span>
    </div>
  )
}

interface LiveDesign {
  accentColor?: string
  backgroundColor?: string
  pageTheme?: string
  typography?: string
  showLocationOnPage?: boolean
  showMapOnPage?: boolean
  isAddressHidden?: boolean
}

export const dynamic = "force-dynamic"
export const revalidate = 0

// Generate dynamic metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  try {
    const { slug: combinedSlug } = await params

    const event = await prisma.event.findFirst({
      where: {
        isPublished: true,
        slug: combinedSlug,
      },
      select: {
        title: true,
        description: true,
        flyerUrl: true,
        startsAt: true,
        venueName: true,
        city: true,
        organizer: {
          select: {
            displayName: true,
          },
        },
      },
    })

    if (!event) {
      return {
        title: "Event Not Found",
        description: "The requested event could not be found.",
      }
    }

    const eventDate = new Date(event.startsAt).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })

    const description = event.description
      ? event.description.slice(0, 160)
      : `${event.title} at ${event.venueName}, ${event.city} on ${eventDate}. Hosted by ${event.organizer?.displayName ?? 'Unknown Organizer'}.`

    return {
      title: event.title,
      description,
      openGraph: {
        title: event.title,
        description,
        type: "website",
        images: event.flyerUrl
          ? [
              {
                url: event.flyerUrl,
                width: 1200,
                height: 630,
                alt: event.title,
              },
            ]
          : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: event.title,
        description,
        images: event.flyerUrl ? [event.flyerUrl] : undefined,
      },
    }
  } catch {
    // Fallback metadata if database is unavailable during build
    return {
      title: "Event",
      description: "Discover and book tickets to nightlife events and after-parties.",
    }
  }
}

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
      timezone: true,
      venueName: true,
      venueAddress: true,
      city: true,
      state: true,
      isAddressHidden: true,
      ageRestriction: true,
      lineup: true,
      isPublished: true,
      accentColor: true,
      backgroundColor: true,
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
      // Reschedule tracking fields
      previousStartsAt: true,
      previousEndsAt: true,
      rescheduledAt: true,
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
      // Series/recurring event info
      seriesId: true,
      seriesOccurrence: true,
      series: {
        select: {
          id: true,
          title: true,
        },
      },
      ticketTiers: {
        where: { isVisible: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  })
  
  // If event not found, check for slug redirect
  if (!event) {
    const newSlug = await checkSlugRedirect(combinedSlug)
    if (newSlug) {
      // Permanent redirect (301) to new slug
      redirect(`/e/${newSlug}`)
    }
  }

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
            timezone: true,
            // Reschedule tracking fields
            previousStartsAt: true,
            previousEndsAt: true,
            rescheduledAt: true,
            venueName: true,
            venueAddress: true,
            city: true,
            state: true,
            isAddressHidden: true,
            ageRestriction: true,
            lineup: true,
            isPublished: true,
            accentColor: true,
            backgroundColor: true,
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
            // Series/recurring event info
            seriesId: true,
            seriesOccurrence: true,
            series: {
              select: {
                id: true,
                title: true,
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

  // Fetch other occurrences if this event is part of a series
  let seriesOccurrences: { id: string; title: string; slug: string; startsAt: Date; seriesOccurrence: number | null }[] = []
  if (event.seriesId) {
    seriesOccurrences = await prisma.event.findMany({
      where: {
        seriesId: event.seriesId,
        id: { not: event.id },
        isPublished: true,
        startsAt: { gte: new Date() },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        startsAt: true,
        seriesOccurrence: true,
      },
      orderBy: { startsAt: "asc" },
      take: 5,
    })
  }

  // Check if current user is the event owner
  const currentUser = await getSessionUser()
  const isOwner = currentUser?.organizerProfile?.id === event.organizer?.id

  type TierType = typeof event.ticketTiers[number]

  const availableTiers = event.organizer?.stripeChargesEnabled
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

  // Helper to calculate relative luminance for contrast detection
  const getLuminance = (hex: string): number => {
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255
    const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
  }

  // Determine if a color is "light" (needs dark text) or "dark" (needs light text)
  const isLightColor = (hex: string): boolean => getLuminance(hex) > 0.179

  // Create render function that accepts live design
  // Preview params take priority for owners, allowing live preview via URL
  const renderEventPage = (liveDesign?: LiveDesign) => {
    const accentColor = (isOwner && preview_color) || liveDesign?.accentColor || event.accentColor || '#ff1493'
    const backgroundColor = liveDesign?.backgroundColor || event.backgroundColor || '#000000'
    const pageTheme = (isOwner && preview_theme) || liveDesign?.pageTheme || event.pageTheme || 'neon'
    const typography = (isOwner && preview_typography) || liveDesign?.typography || event.typography || 'headline'
    const typographyClass = typographyMap[typography] || 'font-headline'

    // Automatic contrast detection
    const bgIsLight = isLightColor(backgroundColor)
    const accentIsLight = isLightColor(accentColor)
    // Primary text color based on background
    const textColor = bgIsLight ? '#000000' : '#ffffff'
    const _textMuted = bgIsLight ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)'
    const _textSubtle = bgIsLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)'
    // Text color for accent-colored backgrounds (buttons, etc.)
    const accentTextColor = accentIsLight ? '#000000' : '#ffffff'
    // Border colors
    const _borderColor = bgIsLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'
    const _borderColorStrong = bgIsLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)'

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
    
    // Rescheduled banner logic - show if event was rescheduled and hasn't passed yet
    const showRescheduledBanner = event.previousStartsAt && 
      event.rescheduledAt && 
      new Date(event.startsAt) > new Date()
    
    const rescheduledBannerElement = showRescheduledBanner && event.previousStartsAt ? (
      <RescheduledBanner
        previousStartsAt={new Date(event.previousStartsAt)}
        newStartsAt={new Date(event.startsAt)}
        accentColor="#ffa500"
        timezone={event.timezone}
      />
    ) : null


    const templateProps = {
      event,
      accentColor,
      backgroundColor,
      typographyClass,
      textColor,
      accentTextColor,
      dateStr,
      timeStr,
      dayStr,
      showLocation,
      showMap,
      locationPrecision,
      mapUrl,
      mapEmbedUrl,
      rescheduledBannerElement,
      lowestPrice,
      hasAvailability,
      isRsvpEvent,
      ctaUrl,
      ctaText,
      ctaTextLower,
      lineup,
      rsvpSpotsLeft: event.rsvpSpotsLeft,
      rsvpAvailable: event.rsvpSpotsLeft === null || event.rsvpSpotsLeft > 0,
      totalAvailable: availableTiers.reduce((sum, tier) => sum + (tier.quantity - tier.quantitySold), 0),
    };

    switch (pageTheme) {
      case 'brutalist':
        return <BrutalistTemplate {...templateProps} />;
      case 'neon':
        return <NeonTemplate {...templateProps} />;
      case 'minimal':
        return <MinimalTemplate {...templateProps} />;
      case 'tilt':
        return <TiltTemplate {...templateProps} />;
      case 'lush':
        return <LushTemplate {...templateProps} />;
      case 'nice':
        return <NiceAmTemplate {...templateProps} />;
      case 'card':
        return <CardTemplate {...templateProps} />;
      case 'vapor':
        return <VaporTemplate {...templateProps} />;
      case 'editorial':
      default:
        return <EditorialTemplate {...templateProps} />;
    }
  }

  // Render the page with optional edit overlay for owners
  // Use preview params for initialDesign so the editor shows the correct current state
  const previewDesign = {
    accentColor: preview_color || event.accentColor || '#ff1493',
    backgroundColor: event.backgroundColor || '#000000',
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
