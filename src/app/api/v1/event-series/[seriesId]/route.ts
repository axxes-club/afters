import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withApiAuth, apiError, type ApiContext } from "@/lib/api-middleware"
import { getRecurrenceDescription } from "@/lib/recurrence"
import type { ApiScope } from "@/lib/api-keys"

type RouteParams = { params: Promise<{ seriesId: string }> }

// GET /api/v1/event-series/:seriesId - Get series info and list occurrences
async function getEventSeries(req: NextRequest, ctx: ApiContext, { params }: RouteParams) {
  const { seriesId } = await params

  // Get organizer profile for this user
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
          id: true,
          title: true,
          slug: true,
          startsAt: true,
          endsAt: true,
          status: true,
          isPublished: true,
          seriesOccurrence: true,
          isSeriesOverride: true,
          flyerUrl: true,
          venueName: true,
          city: true,
          _count: {
            select: {
              tickets: true,
              orders: true,
            },
          },
        },
        orderBy: { startsAt: "asc" },
      },
    },
  })

  if (!series) {
    return apiError("Event series not found", 404)
  }

  return NextResponse.json({
    ...series,
    recurrenceDescription: getRecurrenceDescription(series.recurrenceRule),
    upcomingCount: series.events.filter((e) => new Date(e.startsAt) > new Date()).length,
    pastCount: series.events.filter((e) => new Date(e.startsAt) <= new Date()).length,
  })
}

// PATCH /api/v1/event-series/:seriesId - Update series template (propagates to future events)
async function updateEventSeries(req: NextRequest, ctx: ApiContext, { params }: RouteParams) {
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
  })

  if (!series) {
    return apiError("Event series not found", 404)
  }

  const body = await req.json()
  const { title, templateData, propagateToFuture = true } = body

  // Update the series
  const updatedSeries = await prisma.eventSeries.update({
    where: { id: seriesId },
    data: {
      ...(title && { title }),
      ...(templateData && {
        templateData: {
          ...((series.templateData as object) || {}),
          ...templateData,
        },
      }),
    },
  })

  // Propagate changes to future events that haven't been overridden
  let updatedEventsCount = 0
  if (propagateToFuture && templateData) {
    const now = new Date()

    // Build update data from templateData
    const eventUpdateData: Record<string, unknown> = {}
    const fieldMappings: Record<string, string> = {
      description: "description",
      venueName: "venueName",
      venueAddress: "venueAddress",
      city: "city",
      state: "state",
      country: "country",
      flyerUrl: "flyerUrl",
      ageRestriction: "ageRestriction",
      isAddressHidden: "isAddressHidden",
      pageTheme: "pageTheme",
      accentColor: "accentColor",
      lineup: "lineup",
      isRsvpOnly: "isRsvpOnly",
      rsvpCapacity: "rsvpCapacity",
      rsvpAllowPlusOnes: "rsvpAllowPlusOnes",
      rsvpMaxPlusOnes: "rsvpMaxPlusOnes",
      hasGuestlist: "hasGuestlist",
    }

    for (const [templateKey, eventKey] of Object.entries(fieldMappings)) {
      if (templateData[templateKey] !== undefined) {
        eventUpdateData[eventKey] = templateData[templateKey]
      }
    }

    if (title) {
      eventUpdateData.title = title
    }

    if (Object.keys(eventUpdateData).length > 0) {
      const result = await prisma.event.updateMany({
        where: {
          seriesId: seriesId,
          isSeriesOverride: false,
          startsAt: { gt: now },
        },
        data: eventUpdateData,
      })
      updatedEventsCount = result.count
    }
  }

  return NextResponse.json({
    series: updatedSeries,
    propagatedToEvents: updatedEventsCount,
  })
}

// DELETE /api/v1/event-series/:seriesId - Cancel series (all future occurrences)
async function deleteEventSeries(req: NextRequest, ctx: ApiContext, { params }: RouteParams) {
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
        where: {
          startsAt: { gt: new Date() },
        },
        select: {
          id: true,
          _count: {
            select: {
              tickets: true,
            },
          },
        },
      },
    },
  })

  if (!series) {
    return apiError("Event series not found", 404)
  }

  // Check if any future events have tickets sold
  const eventsWithTickets = series.events.filter((e) => e._count.tickets > 0)
  if (eventsWithTickets.length > 0) {
    return apiError(
      `Cannot delete series: ${eventsWithTickets.length} future event(s) have tickets sold. Cancel individual events instead.`,
      400
    )
  }

  // Cancel all future events
  const cancelledResult = await prisma.event.updateMany({
    where: {
      seriesId: seriesId,
      startsAt: { gt: new Date() },
    },
    data: {
      status: "CANCELLED",
      isPublished: false,
    },
  })

  // Optionally: you could also delete the series itself
  // For now, we just cancel the events and keep the series for history
  // await prisma.eventSeries.delete({ where: { id: seriesId } })

  return NextResponse.json({
    message: "Series cancelled",
    cancelledEventsCount: cancelledResult.count,
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

export const GET = createHandler(getEventSeries, {
  requiredScopes: ["events:read"],
  allowSession: true,
})

export const PATCH = createHandler(updateEventSeries, {
  requiredScopes: ["events:write"],
  allowSession: true,
})

export const DELETE = createHandler(deleteEventSeries, {
  requiredScopes: ["events:write"],
  allowSession: true,
})
