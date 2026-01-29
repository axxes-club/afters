import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

// Update a track's metadata
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (user?.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { trackId, title, artistName, genre, bpm } = await request.json()

    if (!trackId) {
      return NextResponse.json({ error: "Track ID required" }, { status: 400 })
    }

    const track = await prisma.radioTrack.update({
      where: { id: trackId },
      data: {
        title: title || undefined,
        artistName: artistName || undefined,
        genre: genre || null,
        bpm: bpm || null,
      }
    })

    return NextResponse.json({ success: true, track })
  } catch (error) {
    console.error("Error updating track:", error)
    return NextResponse.json({ error: "Failed to update track" }, { status: 500 })
  }
}
