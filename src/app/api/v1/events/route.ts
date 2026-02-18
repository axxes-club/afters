import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withApiAuth, apiError, type ApiContext } from "@/lib/api-middleware"

// GET /api/v1/events - List events for the authenticated user
async function getEvents(req: NextRequest, ctx: ApiContext) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status") // draft, published, all
  const seriesId = searchParams.get("seriesId") // Filter by series
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100)
  const offset = parseInt(searchParams.get("offset") || "0")

  // Get organizer profile for this user
  const profile = await prisma.organizerProfile.findUnique({
    where: { userId: ctx.userId },
  })

  if (!profile) {
    return apiError("Organizer profile not found", 404)
  }

  const statusFilter =
    status === "draft"
      ? { isPublished: false }
      : status === "published"
        ? { isPublished: true }
        : {}

  const seriesFilter = seriesId ? { seriesId } : {}

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where: {
        organizerId: profile.id,
        ...statusFilter,
        ...seriesFilter,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        startsAt: true,
        endsAt: true,
        timezone: true,
        venueName: true,
        venueAddress: true,
        city: true,
        state: true,
        country: true,
        flyerUrl: true,
        status: true,
        isPublished: true,
        ticketingType: true,
        seriesId: true,
        seriesOccurrence: true,
        isSeriesOverride: true,
        createdAt: true,
        updatedAt: true,
        series: {
          select: {
            id: true,
            title: true,
          },
        },
        ticketTiers: {
          select: {
            id: true,
            name: true,
            price: true,
            quantity: true,
            quantitySold: true,
          },
        },
        _count: {
          select: {
            orders: true,
            tickets: true,
            views: true,
          },
        },
      },
      orderBy: { startsAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.event.count({
      where: {
        organizerId: profile.id,
        ...statusFilter,
        ...seriesFilter,
      },
    }),
  ])

  return NextResponse.json({
    events,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + events.length < total,
    },
  })
}

// POST /api/v1/events - Create a new event
async function createEvent(req: NextRequest, ctx: ApiContext) {
  const profile = await prisma.organizerProfile.findUnique({
    where: { userId: ctx.userId },
  })

  if (!profile) {
    return apiError("Organizer profile not found", 404)
  }

  const body = await req.json()
  const {
    title,
    description,
    startsAt,
    endsAt,
    timezone,
    venueName,
    venueAddress,
    city,
    state,
    country,
    flyerUrl,
    ageRestriction,
    ticketingType,
    externalTicketingUrl,
    isAddressHidden,
    pageTheme,
    accentColor,
    isRsvpOnly,
    rsvpCapacity,
  } = body

  // Validate required fields
  if (!title || !startsAt || !venueName || !venueAddress || !city) {
    return apiError("Missing required fields: title, startsAt, venueName, venueAddress, city")
  }

  // Generate unique slug
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

  let slug = baseSlug
  let counter = 1
  while (true) {
    const existing = await prisma.event.findFirst({
      where: { organizerId: profile.id, slug },
    })
    if (!existing) break
    slug = `${baseSlug}-${counter}`
    counter++
  }

  const event = await prisma.event.create({
    data: {
      organizerId: profile.id,
      title,
      slug,
      description,
      startsAt: new Date(startsAt),
      endsAt: endsAt ? new Date(endsAt) : null,
      timezone: timezone || "America/New_York",
      venueName,
      venueAddress,
      city,
      state,
      country: country || "US",
      flyerUrl,
      ageRestriction: ageRestriction ? parseInt(ageRestriction) : null,
      ticketingType: ticketingType || "AFTERS",
      externalTicketingUrl,
      isAddressHidden: isAddressHidden || false,
      pageTheme: pageTheme || "neon",
      accentColor,
      isRsvpOnly: isRsvpOnly || false,
      rsvpCapacity: rsvpCapacity ? parseInt(rsvpCapacity) : null,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      startsAt: true,
      status: true,
      createdAt: true,
    },
  })

  return NextResponse.json(event, { status: 201 })
}

// Export wrapped handlers
export const GET = withApiAuth(getEvents, {
  requiredScopes: ["events:read"],
  allowSession: true,
})

export const POST = withApiAuth(createEvent, {
  requiredScopes: ["events:write"],
  allowSession: true,
})
