import { NextRequest, NextResponse } from "next/server"
import { getEffectiveUserId } from "@/lib/auth-utils"
import { organizerWhere } from "@/lib/organizer-context"
import { prisma } from "@/lib/prisma"

// GET - List all guestlist entries for an event
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const userId = await getEffectiveUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { eventId } = await params
    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") || ""

    // Verify user owns this event
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        organizer: await organizerWhere("tickets.view"),
      },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const entries = await prisma.guestlistEntry.findMany({
      where: {
        eventId,
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      orderBy: { createdAt: "desc" },
    })

    const stats = {
      total: entries.length,
      checkedIn: entries.filter((e) => e.checkedInAt).length,
      totalWithPlusOnes: entries.reduce((sum, e) => sum + 1 + e.plusOnes, 0),
    }

    return NextResponse.json({ entries, stats })
  } catch (error) {
    console.error("Failed to get guestlist:", error)
    return NextResponse.json(
      { error: "Failed to get guestlist" },
      { status: 500 }
    )
  }
}

// POST - Add a new guestlist entry
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const userId = await getEffectiveUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { eventId } = await params
    const body = await req.json()
    const { name, phone, email, plusOnes, notes } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    // Verify user owns this event
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        organizer: await organizerWhere("owner"),
      },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const entry = await prisma.guestlistEntry.create({
      data: {
        eventId,
        name: name.trim(),
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        plusOnes: Math.max(0, parseInt(plusOnes) || 0),
        notes: notes?.trim() || null,
        addedBy: userId,
      },
    })

    // Enable guestlist on event if not already
    if (!event.hasGuestlist) {
      await prisma.event.update({
        where: { id: eventId },
        data: { hasGuestlist: true },
      })
    }

    return NextResponse.json(entry)
  } catch (error) {
    console.error("Failed to add guestlist entry:", error)
    return NextResponse.json(
      { error: "Failed to add guestlist entry" },
      { status: 500 }
    )
  }
}

// DELETE - Remove a guestlist entry
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const userId = await getEffectiveUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { eventId } = await params
    const { searchParams } = new URL(req.url)
    const entryId = searchParams.get("id")

    if (!entryId) {
      return NextResponse.json({ error: "Entry ID required" }, { status: 400 })
    }

    // Verify user owns this event
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        organizer: await organizerWhere("owner"),
      },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Include eventId in where clause to prevent cross-event deletion
    await prisma.guestlistEntry.delete({
      where: { id: entryId, eventId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete guestlist entry:", error)
    return NextResponse.json(
      { error: "Failed to delete guestlist entry" },
      { status: 500 }
    )
  }
}
