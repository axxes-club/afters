import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withApiAuth, apiError, type ApiContext } from "@/lib/api-middleware"
import { getNextOccurrences, generateSeriesSlug } from "@/lib/recurrence"
import type { ApiScope } from "@/lib/api-keys"

type RouteParams = { params: Promise<{ seriesId: string }> }

// POST /api/v1/event-series/:seriesId/generate - Manually trigger occurrence generation
async function generateOccurrences(req: NextRequest, ctx: ApiContext, { params }: RouteParams) {
  const { seriesId } = await params

  const profile = await prisma.organizerProfile.findUnique({
    where: { userId: ctx.userId },
  })

  if (!profile) {
    return apiError("Organizer profile not found", 404)
  }

  const series = await prisma.eventSeries.findFirst({
    where: {
      id: seriesId,
      organizerId: profile.id,
    },
    include: {
      events: {
        select: {
          startsAt: true,
          seriesOccurrence: true,
        },
        orderBy: { seriesOccurrence: "desc" },
        take: 1,
      },
    },
  })

  if (!series) {
    return apiError("Event series not found", 404)
  }

  const body = await req.json()
  const { count = 4 } = body // Default to generating 4 more occurrences

  // Find the latest occurrence date and number
  const latestEvent = series.events[0]
  const startFromDate = latestEvent ? new Date(latestEvent.startsAt.getTime() + 1) : new Date()
  const startOccurrenceNumber = latestEvent ? latestEvent.seriesOccurrence! + 1 : 1

  // Generate new occurrence dates
  const occurrenceDates = getNextOccurrences(series.recurrenceRule, count, startFromDate)

  if (occurrenceDates.length === 0) {
    return NextResponse.json({
      message: "No more occurrences to generate (series may have ended)",
      generatedCount: 0,
      events: [],
    })
  }

  // Get template data
  const templateData = (series.templateData as Record<string, unknown>) || {}

  // Generate base slug from title
  const baseSlug = series.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

  // Create events for each occurrence
  const events = []
  for (let i = 0; i < occurrenceDates.length; i++) {
    const occurrenceDate = occurrenceDates[i]
    const occurrenceNumber = startOccurrenceNumber + i

    // Check if we've hit maxOccurrences limit
    if (series.maxOccurrences && occurrenceNumber > series.maxOccurrences) {
      break
    }

    // Check if we've passed the series end date
    if (series.endsAt && occurrenceDate > series.endsAt) {
      break
    }

    const slug = generateSeriesSlug(baseSlug, occurrenceDate)

    // Check for slug conflicts and make unique
    let finalSlug = slug
    let counter = 1
    while (true) {
      const existing = await prisma.event.findFirst({
        where: { organizerId: profile.id, slug: finalSlug },
      })
      if (!existing) break
      finalSlug = `${slug}-${counter}`
      counter++
    }

    // Check if this occurrence already exists (by date)
    const existingOccurrence = await prisma.event.findFirst({
      where: {
        seriesId: seriesId,
        startsAt: occurrenceDate,
      },
    })

    if (existingOccurrence) {
      // Skip if occurrence already exists
      continue
    }

    // Calculate endsAt if template provides duration
    let eventEndsAt = null
    if (templateData.durationMinutes && typeof templateData.durationMinutes === "number") {
      eventEndsAt = new Date(occurrenceDate.getTime() + templateData.durationMinutes * 60 * 1000)
    }

    const event = await prisma.event.create({
      data: {
        organizerId: profile.id,
        seriesId: series.id,
        seriesOccurrence: occurrenceNumber,
        isSeriesOverride: false,
        title: (templateData.title as string) || series.title,
        slug: finalSlug,
        description: (templateData.description as string) || null,
        startsAt: occurrenceDate,
        endsAt: eventEndsAt,
        timezone: series.timezone,
        venueName: (templateData.venueName as string) || "TBD",
        venueAddress: (templateData.venueAddress as string) || "TBD",
        city: (templateData.city as string) || "TBD",
        state: (templateData.state as string) || null,
        country: (templateData.country as string) || "US",
        flyerUrl: (templateData.flyerUrl as string) || null,
        ageRestriction: (templateData.ageRestriction as number) || null,
        ticketingType: (templateData.ticketingType as "AFTERS" | "POSH" | "DICE" | "TICKETMASTER" | "LIVENATION" | "EVENTBRITE" | "OTHER") || "AFTERS",
        isAddressHidden: (templateData.isAddressHidden as boolean) || false,
        pageTheme: (templateData.pageTheme as string) || "neon",
        accentColor: (templateData.accentColor as string) || null,
        lineup: templateData.lineup ?? undefined,
        isRsvpOnly: (templateData.isRsvpOnly as boolean) || false,
        rsvpCapacity: (templateData.rsvpCapacity as number) || null,
        rsvpAllowPlusOnes: (templateData.rsvpAllowPlusOnes as boolean) || false,
        rsvpMaxPlusOnes: (templateData.rsvpMaxPlusOnes as number) || 1,
        hasGuestlist: (templateData.hasGuestlist as boolean) || false,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        startsAt: true,
        seriesOccurrence: true,
      },
    })

    // Create ticket tiers if provided in template
    if (templateData.ticketTiers && Array.isArray(templateData.ticketTiers)) {
      for (const tier of templateData.ticketTiers as Array<{
        name: string
        description?: string
        price: number
        quantity: number
        minPerOrder?: number
        maxPerOrder?: number
        sortOrder?: number
        isVisible?: boolean
      }>) {
        await prisma.ticketTier.create({
          data: {
            eventId: event.id,
            name: tier.name,
            description: tier.description || null,
            price: tier.price,
            quantity: tier.quantity,
            minPerOrder: tier.minPerOrder || 1,
            maxPerOrder: tier.maxPerOrder || 10,
            sortOrder: tier.sortOrder || 0,
            isVisible: tier.isVisible !== false,
          },
        })
      }
    }

    events.push(event)
  }

  // Update lastGeneratedAt
  await prisma.eventSeries.update({
    where: { id: seriesId },
    data: { lastGeneratedAt: new Date() },
  })

  return NextResponse.json({
    message: `Generated ${events.length} new occurrence(s)`,
    generatedCount: events.length,
    events,
  })
}

// Wrapper to pass params to handlers
function createHandler(
  handler: (req: NextRequest, ctx: ApiContext, params: RouteParams) => Promise<NextResponse>,
  options: { requiredScopes: ApiScope[]; allowSession: boolean }
) {
  return (req: NextRequest, routeParams: RouteParams) => {
    const wrappedHandler = withApiAuth(
      (request: NextRequest, context: ApiContext) => handler(request, context, routeParams),
      options
    )
    return wrappedHandler(req)
  }
}

export const POST = createHandler(generateOccurrences, {
  requiredScopes: ["events:write"],
  allowSession: true,
})
