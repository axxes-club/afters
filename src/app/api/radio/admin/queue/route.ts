import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

// Get tracks in the queue (ordered by queuePosition)
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (user?.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const tracks = await prisma.radioTrack.findMany({
      where: {
        status: "APPROVED",
        queuePosition: { not: null }
      },
      include: {
        artist: {
          select: {
            artistName: true,
            slug: true,
            avatarUrl: true,
          }
        },
        _count: {
          select: { plays: true }
        }
      },
      orderBy: { queuePosition: "asc" }
    })

    return NextResponse.json({ tracks })
  } catch (error) {
    console.error("Error fetching queue:", error)
    return NextResponse.json({ error: "Failed to fetch queue" }, { status: 500 })
  }
}

// Add track to queue
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (user?.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { trackId } = await request.json()

    // Get the highest queue position
    const lastInQueue = await prisma.radioTrack.findFirst({
      where: { queuePosition: { not: null } },
      orderBy: { queuePosition: "desc" }
    })

    const newPosition = (lastInQueue?.queuePosition || 0) + 1

    await prisma.radioTrack.update({
      where: { id: trackId },
      data: { queuePosition: newPosition }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error adding to queue:", error)
    return NextResponse.json({ error: "Failed to add to queue" }, { status: 500 })
  }
}

// Update queue order (bulk reorder)
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (user?.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { trackIds } = await request.json()

    // Update all positions in a transaction
    await prisma.$transaction(
      trackIds.map((id: string, index: number) =>
        prisma.radioTrack.update({
          where: { id },
          data: { queuePosition: index + 1 }
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating queue order:", error)
    return NextResponse.json({ error: "Failed to update queue" }, { status: 500 })
  }
}

// Remove track from queue
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (user?.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { trackId } = await request.json()

    await prisma.radioTrack.update({
      where: { id: trackId },
      data: { queuePosition: null }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing from queue:", error)
    return NextResponse.json({ error: "Failed to remove from queue" }, { status: 500 })
  }
}
