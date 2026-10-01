import { getEffectiveUserId } from "@/lib/auth-utils";
import { organizerWhere } from "@/lib/organizer-context";
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET or create a test ticket for an event
export async function GET(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const userId = await getEffectiveUserId()
    const { eventId } = await params

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Get organizer profile for the current user
    const profile = await prisma.organizerProfile.findUnique({
      where: await organizerWhere("owner"),
    })

    if (!profile) {
      return NextResponse.json(
        { message: "Organizer profile required" },
        { status: 400 }
      )
    }

    // Verify event exists and user owns it
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        slug: true,
        isPublished: true,
        organizerId: true,
        organizer: {
          select: { id: true, displayName: true },
        },
      },
    })

    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 })
    }

    // Verify ownership
    if (event.organizerId !== profile.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    if (!event.isPublished) {
      return NextResponse.json(
        { message: "Event is not published" },
        { status: 403 }
      )
    }

    // Check if a test ticket already exists for this event
    const existingTestTicket = await prisma.ticket.findFirst({
      where: {
        eventId,
        isTestTicket: true,
      },
      include: {
        ticketTier: true,
      },
    })

    if (existingTestTicket) {
      return NextResponse.json({
        ticketId: existingTestTicket.id,
        ticketNumber: existingTestTicket.ticketNumber,
        tierName: existingTestTicket.ticketTier.name,
      })
    }

    // Get or create a hidden test tier
    let testTier = await prisma.ticketTier.findFirst({
      where: {
        eventId,
        name: "Staff Training",
        isVisible: false,
      },
    })

    if (!testTier) {
      testTier = await prisma.ticketTier.create({
        data: {
          eventId,
          name: "Staff Training",
          description: "For staff check-in practice",
          price: 0,
          quantity: 1,
          isVisible: false,
          sortOrder: 999,
        },
      })
    }

    // Generate order number
    const orderCount = await prisma.order.count({ where: { eventId } })
    const orderNumber = `TEST-${event.slug.toUpperCase().slice(0, 6)}-${String(orderCount + 1).padStart(4, "0")}`

    // Create a test order
    const testOrder = await prisma.order.create({
      data: {
        orderNumber,
        eventId,
        email: "test@afters.app",
        guestName: "Test Scanner",
        subtotal: 0,
        platformFee: 0,
        stripeFee: 0,
        total: 0,
        status: "PAID",
        paidAt: new Date(),
        items: {
          create: {
            ticketTierId: testTier.id,
            quantity: 1,
            unitPrice: 0,
          },
        },
      },
    })

    // Generate ticket number
    const ticketCount = await prisma.ticket.count({ where: { eventId } })
    const ticketNumber = `${event.slug.toUpperCase().slice(0, 4)}-TEST-${String(ticketCount + 1).padStart(4, "0")}`

    // Create the test ticket
    const testTicket = await prisma.ticket.create({
      data: {
        ticketNumber,
        orderId: testOrder.id,
        eventId,
        ticketTierId: testTier.id,
        isTestTicket: true,
        status: "VALID",
      },
    })

    return NextResponse.json({
      ticketId: testTicket.id,
      ticketNumber: testTicket.ticketNumber,
      tierName: testTier.name,
    })
  } catch (error) {
    console.error("Error creating test ticket:", error)
    return NextResponse.json(
      { message: "Failed to create test ticket" },
      { status: 500 }
    )
  }
}

// Reset the test ticket (mark as not checked in)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const userId = await getEffectiveUserId()
    const { eventId } = await params

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Get organizer profile for the current user
    const profile = await prisma.organizerProfile.findUnique({
      where: await organizerWhere("owner"),
    })

    if (!profile) {
      return NextResponse.json(
        { message: "Organizer profile required" },
        { status: 400 }
      )
    }

    // Verify event ownership
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true },
    })

    if (!event || event.organizerId !== profile.id) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 })
    }

    // Find and reset the test ticket
    const testTicket = await prisma.ticket.findFirst({
      where: {
        eventId,
        isTestTicket: true,
      },
    })

    if (!testTicket) {
      return NextResponse.json(
        { message: "No test ticket found" },
        { status: 404 }
      )
    }

    // Reset the ticket status
    await prisma.ticket.update({
      where: { id: testTicket.id },
      data: {
        status: "VALID",
        checkedInAt: null,
        checkedInBy: null,
      },
    })

    return NextResponse.json({
      message: "Test ticket reset successfully",
      ticketId: testTicket.id,
    })
  } catch (error) {
    console.error("Error resetting test ticket:", error)
    return NextResponse.json(
      { message: "Failed to reset test ticket" },
      { status: 500 }
    )
  }
}
