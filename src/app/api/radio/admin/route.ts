import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

// Superadmin: Get all pending tracks for review
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if superadmin
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (user?.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status") || "PENDING"

    const tracks = await prisma.radioTrack.findMany({
      where: { 
        status: status as "PENDING" | "APPROVED" | "REJECTED"
      },
      include: {
        artist: {
          select: {
            artistName: true,
            slug: true,
            avatarUrl: true,
            user: {
              select: { email: true }
            }
          }
        },
        _count: {
          select: { plays: true }
        }
      },
      orderBy: { submittedAt: "desc" }
    })

    return NextResponse.json({ tracks })
  } catch (error) {
    console.error("Error fetching tracks for review:", error)
    return NextResponse.json({ error: "Failed to fetch tracks" }, { status: 500 })
  }
}

// Superadmin: Approve or reject a track
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if superadmin
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (user?.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { trackId, action, rejectionReason } = body

    if (!trackId || !action) {
      return NextResponse.json({ error: "Track ID and action required" }, { status: 400 })
    }

    if (action === "approve") {
      await prisma.radioTrack.update({
        where: { id: trackId },
        data: {
          status: "APPROVED",
          approvedAt: new Date(),
          approvedBy: userId,
        }
      })
      return NextResponse.json({ success: true, message: "Track approved for AFTERS RADIO" })
    } else if (action === "reject") {
      await prisma.radioTrack.update({
        where: { id: trackId },
        data: {
          status: "REJECTED",
          rejectionReason: rejectionReason || "Does not meet our quality standards",
        }
      })
      return NextResponse.json({ success: true, message: "Track rejected" })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error updating track:", error)
    return NextResponse.json({ error: "Failed to update track" }, { status: 500 })
  }
}

// Superadmin: Delete a track
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
    
    await prisma.radioTrack.delete({ where: { id: trackId } })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting track:", error)
    return NextResponse.json({ error: "Failed to delete track" }, { status: 500 })
  }
}
