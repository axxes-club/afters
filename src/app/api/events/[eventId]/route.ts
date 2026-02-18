import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { userId } = await auth()
    const { eventId } = await params

    // Check if user is the organizer (can see unpublished events)
    let isOrganizer = false
    if (userId) {
      const profile = await prisma.organizerProfile.findUnique({
        where: { userId },
      })
      if (profile) {
        const ownedEvent = await prisma.event.findFirst({
          where: { id: eventId, organizerId: profile.id },
        })
        isOrganizer = !!ownedEvent
      }
    }

    // Select only public-safe fields for anonymous users
    const publicSelect = {
      id: true,
      title: true,
      slug: true,
      description: true,
      startsAt: true,
      endsAt: true,
      timezone: true,
      venueName: true,
      city: true,
      state: true,
      flyerUrl: true,
      ageRestriction: true,
      ticketingType: true,
      externalTicketingUrl: true,
      isRsvpOnly: true,
      rsvpCapacity: true,
      rsvpAllowPlusOnes: true,
      rsvpMaxPlusOnes: true,
      rsvpCount: true,
      isAddressHidden: true,
      lineup: true,
      pageTheme: true,
      accentColor: true,
      expiresAfter: true,
      isPublished: true,
      status: true,
      // Conditionally include venueAddress based on isAddressHidden
      venueAddress: true,
      organizer: {
        select: {
          displayName: true,
          slug: true,
        },
      },
      ticketTiers: {
        where: { isVisible: true },
        orderBy: { sortOrder: "asc" as const },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          quantity: true,
          quantitySold: true,
          salesStartAt: true,
          salesEndAt: true,
          minPerOrder: true,
          maxPerOrder: true,
        },
      },
    }

    // Use different queries for organizer vs public to avoid select/include conflict
    const event = isOrganizer
      ? await prisma.event.findUnique({
          where: { id: eventId },
          include: {
            organizer: {
              select: {
                displayName: true,
                slug: true,
              },
            },
            ticketTiers: {
              where: { isVisible: true },
              orderBy: { sortOrder: "asc" },
            },
          },
        })
      : await prisma.event.findUnique({
          where: { id: eventId },
          select: publicSelect,
        })

    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 })
    }

    // For anonymous users, only return published events
    if (!isOrganizer && !event.isPublished) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 })
    }

    // Hide venue address if isAddressHidden is true (for anonymous users)
    if (!isOrganizer && event.isAddressHidden) {
      (event as Record<string, unknown>).venueAddress = null
    }

    return NextResponse.json(event)
  } catch (error) {
    console.error("Error fetching event:", error)
    return NextResponse.json(
      { message: "Failed to fetch event" },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { userId } = await auth()
    const { eventId } = await params

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const profile = await prisma.organizerProfile.findUnique({
      where: { userId },
    })

    if (!profile) {
      return NextResponse.json(
        { message: "Organizer profile required" },
        { status: 400 }
      )
    }

    // Verify ownership
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
    })

    if (!existingEvent || existingEvent.organizerId !== profile.id) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 })
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
      flyerUrl,
      ageRestriction,
      ticketingType,
      externalTicketingUrl,
      expiresAfter,
    } = body

    // Normalize external ticketing URL — ensure it has a protocol
    let normalizedExternalUrl = externalTicketingUrl
    if (normalizedExternalUrl && !normalizedExternalUrl.startsWith('http')) {
      normalizedExternalUrl = `https://${normalizedExternalUrl}`
    }

    const event = await prisma.event.update({
      where: { id: eventId },
      data: {
        title,
        description,
        startsAt: startsAt ? new Date(startsAt) : undefined,
        endsAt: endsAt !== undefined ? (endsAt ? new Date(endsAt) : null) : undefined,
        timezone,
        venueName,
        venueAddress,
        city,
        state,
        flyerUrl,
        ageRestriction: ageRestriction !== undefined ? (ageRestriction ? parseInt(ageRestriction) : null) : undefined,
        ticketingType,
        externalTicketingUrl: normalizedExternalUrl,
        expiresAfter,
      },
    })

    return NextResponse.json(event)
  } catch (error) {
    console.error("Error updating event:", error)
    return NextResponse.json(
      { message: "Failed to update event" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { userId } = await auth()
    const { eventId } = await params

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const profile = await prisma.organizerProfile.findUnique({
      where: { userId },
    })

    if (!profile) {
      return NextResponse.json(
        { message: "Organizer profile required" },
        { status: 400 }
      )
    }

    // Verify ownership
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
    })

    if (!existingEvent || existingEvent.organizerId !== profile.id) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 })
    }

    const body = await req.json()

    // PATCH only updates provided fields - allowlist to prevent mass assignment
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
      flyerUrl,
      ageRestriction,
      ticketingType,
      externalTicketingUrl,
      isAddressHidden,
      lineup,
      pageTheme,
      accentColor,
      isRsvpOnly,
      rsvpCapacity,
      rsvpAllowPlusOnes,
      rsvpMaxPlusOnes,
      expiresAfter,
      isPublished,
      status,
    } = body

    // Build update data only from allowed fields that are present
    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (startsAt !== undefined) updateData.startsAt = startsAt ? new Date(startsAt) : null
    if (endsAt !== undefined) updateData.endsAt = endsAt ? new Date(endsAt) : null
    if (timezone !== undefined) updateData.timezone = timezone
    if (venueName !== undefined) updateData.venueName = venueName
    if (venueAddress !== undefined) updateData.venueAddress = venueAddress
    if (city !== undefined) updateData.city = city
    if (state !== undefined) updateData.state = state
    if (flyerUrl !== undefined) updateData.flyerUrl = flyerUrl
    if (ageRestriction !== undefined) updateData.ageRestriction = ageRestriction ? parseInt(ageRestriction) : null
    if (ticketingType !== undefined) updateData.ticketingType = ticketingType
    if (externalTicketingUrl !== undefined) {
      let normalizedUrl = externalTicketingUrl
      if (normalizedUrl && !normalizedUrl.startsWith('http')) {
        normalizedUrl = `https://${normalizedUrl}`
      }
      updateData.externalTicketingUrl = normalizedUrl
    }
    if (isAddressHidden !== undefined) updateData.isAddressHidden = isAddressHidden
    if (lineup !== undefined) updateData.lineup = lineup
    if (pageTheme !== undefined) updateData.pageTheme = pageTheme
    if (accentColor !== undefined) updateData.accentColor = accentColor
    if (isRsvpOnly !== undefined) updateData.isRsvpOnly = isRsvpOnly
    if (rsvpCapacity !== undefined) updateData.rsvpCapacity = rsvpCapacity ? parseInt(rsvpCapacity) : null
    if (rsvpAllowPlusOnes !== undefined) updateData.rsvpAllowPlusOnes = rsvpAllowPlusOnes
    if (rsvpMaxPlusOnes !== undefined) updateData.rsvpMaxPlusOnes = rsvpMaxPlusOnes ? parseInt(rsvpMaxPlusOnes) : null
    if (expiresAfter !== undefined) updateData.expiresAfter = expiresAfter
    if (isPublished !== undefined) updateData.isPublished = isPublished
    if (status !== undefined) updateData.status = status

    const event = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
    })

    return NextResponse.json(event)
  } catch (error) {
    console.error("Error patching event:", error)
    return NextResponse.json(
      { message: "Failed to update event" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { userId } = await auth()
    const { eventId } = await params

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const profile = await prisma.organizerProfile.findUnique({
      where: { userId },
    })

    if (!profile) {
      return NextResponse.json(
        { message: "Organizer profile required" },
        { status: 400 }
      )
    }

    // Verify ownership and check if deletable
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        orders: {
          select: { total: true },
        },
      },
    })

    if (!existingEvent || existingEvent.organizerId !== profile.id) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 })
    }

    // Allow deletion if:
    // 1. Event is RSVP only (no paid tickets)
    // 2. All orders are free ($0 total)
    const hasPaidOrders = existingEvent.orders.some(order => order.total > 0)

    if (!existingEvent.isRsvpOnly && hasPaidOrders) {
      return NextResponse.json(
        { message: "Cannot delete event with paid ticket orders. Only free/RSVP events can be deleted." },
        { status: 400 }
      )
    }

    // Delete related records first (cascade doesn't always work with all relations)
    await prisma.$transaction([
      prisma.eventView.deleteMany({ where: { eventId } }),
      prisma.eventScanner.deleteMany({ where: { eventId } }),
      prisma.ticket.deleteMany({ where: { eventId } }),
      prisma.orderItem.deleteMany({ where: { order: { eventId } } }),
      prisma.order.deleteMany({ where: { eventId } }),
      prisma.ticketTier.deleteMany({ where: { eventId } }),
      prisma.guestlistEntry.deleteMany({ where: { eventId } }),
      prisma.rsvp.deleteMany({ where: { eventId } }),
      prisma.event.delete({ where: { id: eventId } }),
    ])

    return NextResponse.json({ message: "Event deleted" })
  } catch (error) {
    console.error("Error deleting event:", error)
    return NextResponse.json(
      { message: "Failed to delete event" },
      { status: 500 }
    )
  }
}
