import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params

    const event = await prisma.event.findUnique({
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

    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 })
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

    // PATCH only updates provided fields
    const event = await prisma.event.update({
      where: { id: eventId },
      data: body,
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
