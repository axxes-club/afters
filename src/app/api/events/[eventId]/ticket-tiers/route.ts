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

    // Check if user is the organizer (can see hidden tiers)
    let isOrganizer = false
    if (userId) {
      const profile = await prisma.organizerProfile.findUnique({
        where: { userId },
      })
      if (profile) {
        const event = await prisma.event.findFirst({
          where: { id: eventId, organizerId: profile.id },
        })
        isOrganizer = !!event
      }
    }

    // For anonymous users, only show visible tiers with limited fields
    const tiers = await prisma.ticketTier.findMany({
      where: {
        eventId,
        // Only filter by isVisible for non-organizers
        ...(isOrganizer ? {} : { isVisible: true }),
      },
      orderBy: { sortOrder: "asc" },
      // Limit fields for anonymous users
      ...(isOrganizer ? {} : {
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          quantity: true,
          // Don't expose exact quantitySold to public - just show availability
          isVisible: true,
          salesStartAt: true,
          salesEndAt: true,
          minPerOrder: true,
          maxPerOrder: true,
          sortOrder: true,
        },
      }),
    })

    return NextResponse.json(tiers)
  } catch (error) {
    console.error("Error fetching ticket tiers:", error)
    return NextResponse.json(
      { message: "Failed to fetch ticket tiers" },
      { status: 500 }
    )
  }
}

export async function POST(
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

    // Verify event ownership
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    })

    if (!event || event.organizerId !== profile.id) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 })
    }

    const body = await req.json()
    const {
      name,
      description,
      price,
      quantity,
      salesStartAt,
      salesEndAt,
      minPerOrder,
      maxPerOrder,
    } = body

    if (!name || price === undefined || !quantity) {
      return NextResponse.json(
        { message: "Name, price, and quantity are required" },
        { status: 400 }
      )
    }

    // Get next sort order
    const lastTier = await prisma.ticketTier.findFirst({
      where: { eventId },
      orderBy: { sortOrder: "desc" },
    })

    const tier = await prisma.ticketTier.create({
      data: {
        eventId,
        name,
        description,
        price: 0, // Free during beta - ignore provided price
        quantity,
        salesStartAt: salesStartAt ? new Date(salesStartAt) : null,
        salesEndAt: salesEndAt ? new Date(salesEndAt) : null,
        minPerOrder: minPerOrder || 1,
        maxPerOrder: maxPerOrder || 10,
        sortOrder: (lastTier?.sortOrder ?? -1) + 1,
      },
    })

    return NextResponse.json(tier)
  } catch (error) {
    console.error("Error creating ticket tier:", error)
    return NextResponse.json(
      { message: "Failed to create ticket tier" },
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

    // Verify event ownership
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    })

    if (!event || event.organizerId !== profile.id) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 })
    }

    const body = await req.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ message: "Tier ID required" }, { status: 400 })
    }

    // Allowlist updatable fields to prevent mass assignment
    // Explicitly exclude: price (beta), quantitySold, id, eventId, createdAt, updatedAt
    const {
      name,
      description,
      quantity,
      isVisible,
      salesStartAt,
      salesEndAt,
      minPerOrder,
      maxPerOrder,
      sortOrder,
    } = body

    // Build update data only from allowed fields that are present
    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (quantity !== undefined) updateData.quantity = quantity
    if (isVisible !== undefined) updateData.isVisible = isVisible
    if (salesStartAt !== undefined) updateData.salesStartAt = salesStartAt ? new Date(salesStartAt) : null
    if (salesEndAt !== undefined) updateData.salesEndAt = salesEndAt ? new Date(salesEndAt) : null
    if (minPerOrder !== undefined) updateData.minPerOrder = minPerOrder
    if (maxPerOrder !== undefined) updateData.maxPerOrder = maxPerOrder
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder
    // price changes disabled during beta - intentionally not included

    const tier = await prisma.ticketTier.update({
      where: { id, eventId },
      data: updateData,
    })

    return NextResponse.json(tier)
  } catch (error) {
    console.error("Error updating ticket tier:", error)
    return NextResponse.json(
      { message: "Failed to update ticket tier" },
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
    const { searchParams } = new URL(req.url)
    const tierId = searchParams.get("tierId")

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    if (!tierId) {
      return NextResponse.json({ message: "Tier ID required" }, { status: 400 })
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

    // Verify event ownership
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    })

    if (!event || event.organizerId !== profile.id) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 })
    }

    // Check if tier has sales
    const tier = await prisma.ticketTier.findUnique({
      where: { id: tierId, eventId },
    })

    if (!tier) {
      return NextResponse.json({ message: "Tier not found" }, { status: 404 })
    }

    if (tier.quantitySold > 0) {
      return NextResponse.json(
        { message: "Cannot delete tier with sales" },
        { status: 400 }
      )
    }

    await prisma.ticketTier.delete({
      where: { id: tierId },
    })

    return NextResponse.json({ message: "Tier deleted" })
  } catch (error) {
    console.error("Error deleting ticket tier:", error)
    return NextResponse.json(
      { message: "Failed to delete ticket tier" },
      { status: 500 }
    )
  }
}
