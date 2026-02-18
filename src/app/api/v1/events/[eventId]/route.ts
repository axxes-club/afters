import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withApiAuth, apiError, type ApiContext } from "@/lib/api-middleware"

type RouteParams = { params: Promise<{ eventId: string }> }

// GET /api/v1/events/[eventId] - Get event details
async function getEvent(
  req: NextRequest,
  ctx: ApiContext,
  routeParams: RouteParams
) {
  const { eventId } = await routeParams.params

  const profile = await prisma.organizerProfile.findUnique({
    where: { userId: ctx.userId },
  })

  if (!profile) {
    return apiError("Organizer profile not found", 404)
  }

  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      organizerId: profile.id,
    },
    include: {
      ticketTiers: {
        orderBy: { sortOrder: "asc" },
      },
      series: {
        select: {
          id: true,
          title: true,
          recurrenceRule: true,
          timezone: true,
        },
      },
      _count: {
        select: {
          orders: true,
          tickets: true,
          views: true,
          scanLogs: true,
          guestlistEntries: true,
          rsvps: true,
        },
      },
    },
  })

  if (!event) {
    return apiError("Event not found", 404)
  }

  // If this is part of a series, also get other occurrences
  let seriesOccurrences = null
  if (event.seriesId) {
    seriesOccurrences = await prisma.event.findMany({
      where: {
        seriesId: event.seriesId,
        id: { not: event.id },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        startsAt: true,
        status: true,
        seriesOccurrence: true,
      },
      orderBy: { startsAt: "asc" },
      take: 10,
    })
  }

  return NextResponse.json({
    ...event,
    seriesOccurrences,
  })
}

// PATCH /api/v1/events/[eventId] - Update event
async function updateEvent(
  req: NextRequest,
  ctx: ApiContext,
  routeParams: RouteParams
) {
  const { eventId } = await routeParams.params

  const profile = await prisma.organizerProfile.findUnique({
    where: { userId: ctx.userId },
  })

  if (!profile) {
    return apiError("Organizer profile not found", 404)
  }

  const existingEvent = await prisma.event.findFirst({
    where: {
      id: eventId,
      organizerId: profile.id,
    },
    select: {
      id: true,
      seriesId: true,
      isSeriesOverride: true,
    },
  })

  if (!existingEvent) {
    return apiError("Event not found", 404)
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
    isAddressHidden,
    pageTheme,
    accentColor,
    markAsOverride, // Optional: explicitly mark as override for series events
  } = body

  // If this event is part of a series and being edited, mark as override
  // This prevents template changes from overwriting this occurrence
  const shouldMarkAsOverride =
    existingEvent.seriesId && !existingEvent.isSeriesOverride && markAsOverride !== false

  const event = await prisma.event.update({
    where: { id: eventId },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(startsAt !== undefined && { startsAt: new Date(startsAt) }),
      ...(endsAt !== undefined && { endsAt: endsAt ? new Date(endsAt) : null }),
      ...(timezone !== undefined && { timezone }),
      ...(venueName !== undefined && { venueName }),
      ...(venueAddress !== undefined && { venueAddress }),
      ...(city !== undefined && { city }),
      ...(state !== undefined && { state }),
      ...(country !== undefined && { country }),
      ...(flyerUrl !== undefined && { flyerUrl }),
      ...(ageRestriction !== undefined && {
        ageRestriction: ageRestriction ? parseInt(ageRestriction) : null,
      }),
      ...(isAddressHidden !== undefined && { isAddressHidden }),
      ...(pageTheme !== undefined && { pageTheme }),
      ...(accentColor !== undefined && { accentColor }),
      ...(shouldMarkAsOverride && { isSeriesOverride: true }),
    },
    select: {
      id: true,
      title: true,
      slug: true,
      startsAt: true,
      status: true,
      isPublished: true,
      isSeriesOverride: true,
      seriesId: true,
      updatedAt: true,
    },
  })

  return NextResponse.json(event)
}

// DELETE /api/v1/events/[eventId] - Delete event
async function deleteEvent(
  req: NextRequest,
  ctx: ApiContext,
  routeParams: RouteParams
) {
  const { eventId } = await routeParams.params

  const profile = await prisma.organizerProfile.findUnique({
    where: { userId: ctx.userId },
  })

  if (!profile) {
    return apiError("Organizer profile not found", 404)
  }

  const existingEvent = await prisma.event.findFirst({
    where: {
      id: eventId,
      organizerId: profile.id,
    },
    include: {
      _count: {
        select: { tickets: true },
      },
    },
  })

  if (!existingEvent) {
    return apiError("Event not found", 404)
  }

  // Prevent deletion of events with sold tickets
  if (existingEvent._count.tickets > 0) {
    return apiError(
      "Cannot delete event with sold tickets. Consider cancelling instead.",
      400
    )
  }

  await prisma.event.delete({
    where: { id: eventId },
  })

  return NextResponse.json({ message: "Event deleted successfully" })
}

// Create wrapped handlers with route params support
export async function GET(req: NextRequest, routeParams: RouteParams) {
  const handler = withApiAuth(
    (r, ctx) => getEvent(r, ctx, routeParams),
    { requiredScopes: ["events:read"], allowSession: true }
  )
  return handler(req)
}

export async function PATCH(req: NextRequest, routeParams: RouteParams) {
  const handler = withApiAuth(
    (r, ctx) => updateEvent(r, ctx, routeParams),
    { requiredScopes: ["events:write"], allowSession: true }
  )
  return handler(req)
}

export async function DELETE(req: NextRequest, routeParams: RouteParams) {
  const handler = withApiAuth(
    (r, ctx) => deleteEvent(r, ctx, routeParams),
    { requiredScopes: ["events:delete"], allowSession: true }
  )
  return handler(req)
}
