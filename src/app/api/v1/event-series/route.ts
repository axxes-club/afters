import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withApiAuth, apiError, type ApiContext } from "@/lib/api-middleware"
import { buildRRule, getNextOccurrences, generateSeriesSlug, isValidRRule } from "@/lib/recurrence"
import type { RecurrencePattern } from "@/lib/recurrence"

// GET /api/v1/event-series - List event series for the authenticated user
async function getEventSeries(req: NextRequest, ctx: ApiContext) {
  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100)
  const offset = parseInt(searchParams.get("offset") || "0")

  // Get organizer profile for this user
  const profile = await prisma.organizerProfile.findUnique({
    where: { userId: ctx.userId },
  })

  if (!profile) {
    return apiError("Organizer profile not found", 404)
  }

  const [series, total] = await Promise.all([
    prisma.eventSeries.findMany({
      where: {
        organizerId: profile.id,
      },
      select: {
        id: true,
        title: true,
        recurrenceRule: true,
        timezone: true,
        startsAt: true,
        endsAt: true,
        maxOccurrences: true,
        lastGeneratedAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            events: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.eventSeries.count({
      where: {
        organizerId: profile.id,
      },
    }),
  ])

  return NextResponse.json({
    series,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + series.length < total,
    },
  })
}

// POST /api/v1/event-series - Create a new event series with occurrences
async function createEventSeries(req: NextRequest, ctx: ApiContext) {
  const profile = await prisma.organizerProfile.findUnique({
    where: { userId: ctx.userId },
  })

  if (!profile) {
    return apiError("Organizer profile not found", 404)
  }

  const body = await req.json()
  const {
    title,
    recurrencePattern,
    dayOfWeek,
    weekOfMonth,
    dayOfMonth,
    interval,
    startsAt,
    endsAt,
    maxOccurrences,
    timezone,
    templateData,
    generateCount = 8, // Number of occurrences to generate
  } = body

  // Validate required fields
  if (!title || !recurrencePattern || !startsAt) {
    return apiError("Missing required fields: title, recurrencePattern, startsAt")
  }

  // Validate recurrence pattern
  const validPatterns: RecurrencePattern[] = ["weekly", "biweekly", "monthly-by-day", "monthly-by-date", "custom"]
  if (!validPatterns.includes(recurrencePattern)) {
    return apiError(`Invalid recurrence pattern. Must be one of: ${validPatterns.join(", ")}`)
  }

  // Build the RRULE string
  const rruleString = buildRRule({
    pattern: recurrencePattern as RecurrencePattern,
    dayOfWeek,
    weekOfMonth,
    dayOfMonth,
    interval,
    startsAt: new Date(startsAt),
    endsAt: endsAt ? new Date(endsAt) : undefined,
    maxOccurrences,
  })

  if (!isValidRRule(rruleString)) {
    return apiError("Failed to generate valid recurrence rule")
  }

  // Generate base slug from title
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

  // Create the series
  const series = await prisma.eventSeries.create({
    data: {
      organizerId: profile.id,
      title,
      recurrenceRule: rruleString,
      timezone: timezone || "America/New_York",
      templateData: templateData || {},
      startsAt: new Date(startsAt),
      endsAt: endsAt ? new Date(endsAt) : null,
      maxOccurrences: maxOccurrences || null,
      lastGeneratedAt: new Date(),
    },
  })

  // Generate occurrences
  const occurrenceDates = getNextOccurrences(rruleString, generateCount, new Date(startsAt))

  // Create events for each occurrence
  const events = []
  for (let i = 0; i < occurrenceDates.length; i++) {
    const occurrenceDate = occurrenceDates[i]
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

    // Calculate endsAt if template provides duration
    let eventEndsAt = null
    if (templateData?.durationMinutes) {
      eventEndsAt = new Date(occurrenceDate.getTime() + templateData.durationMinutes * 60 * 1000)
    }

    const event = await prisma.event.create({
      data: {
        organizerId: profile.id,
        seriesId: series.id,
        seriesOccurrence: i + 1,
        isSeriesOverride: false,
        title: templateData?.title || title,
        slug: finalSlug,
        description: templateData?.description || null,
        startsAt: occurrenceDate,
        endsAt: eventEndsAt,
        timezone: timezone || "America/New_York",
        venueName: templateData?.venueName || "TBD",
        venueAddress: templateData?.venueAddress || "TBD",
        city: templateData?.city || "TBD",
        state: templateData?.state || null,
        country: templateData?.country || "US",
        flyerUrl: templateData?.flyerUrl || null,
        ageRestriction: templateData?.ageRestriction || null,
        ticketingType: templateData?.ticketingType || "AFTERS",
        isAddressHidden: templateData?.isAddressHidden || false,
        pageTheme: templateData?.pageTheme || "neon",
        accentColor: templateData?.accentColor || null,
        lineup: templateData?.lineup || null,
        isRsvpOnly: templateData?.isRsvpOnly || false,
        rsvpCapacity: templateData?.rsvpCapacity || null,
        rsvpAllowPlusOnes: templateData?.rsvpAllowPlusOnes || false,
        rsvpMaxPlusOnes: templateData?.rsvpMaxPlusOnes || 1,
        hasGuestlist: templateData?.hasGuestlist || false,
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
    if (templateData?.ticketTiers && Array.isArray(templateData.ticketTiers)) {
      for (const tier of templateData.ticketTiers) {
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

  return NextResponse.json(
    {
      series: {
        id: series.id,
        title: series.title,
        recurrenceRule: series.recurrenceRule,
        timezone: series.timezone,
        startsAt: series.startsAt,
        endsAt: series.endsAt,
        maxOccurrences: series.maxOccurrences,
        createdAt: series.createdAt,
      },
      events,
      generatedCount: events.length,
    },
    { status: 201 }
  )
}

// Export wrapped handlers
export const GET = withApiAuth(getEventSeries, {
  requiredScopes: ["events:read"],
  allowSession: true,
})

export const POST = withApiAuth(createEventSeries, {
  requiredScopes: ["events:write"],
  allowSession: true,
})
