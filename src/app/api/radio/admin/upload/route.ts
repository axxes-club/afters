import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

// Admin uploads a track directly (auto-approved and added to queue)
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

    const body = await request.json()
    const { title, artistName, fileUrl, duration, artworkUrl, genre, bpm } = body

    if (!title || !fileUrl || !duration || !artistName) {
      return NextResponse.json({ 
        error: "Title, artist name, file URL, and duration are required" 
      }, { status: 400 })
    }

    // Get the highest queue position
    const lastInQueue = await prisma.radioTrack.findFirst({
      where: { queuePosition: { not: null } },
      orderBy: { queuePosition: "desc" }
    })

    const newPosition = (lastInQueue?.queuePosition || 0) + 1

    // Create the track (auto-approved and added to queue)
    const track = await prisma.radioTrack.create({
      data: {
        title,
        artistName,
        fileUrl,
        duration: parseInt(duration.toString()),
        artworkUrl: artworkUrl || null,
        genre: genre || null,
        bpm: bpm ? parseInt(bpm.toString()) : null,
        status: "APPROVED",
        approvedAt: new Date(),
        approvedBy: userId,
        uploadedBy: userId,
        queuePosition: newPosition,
      }
    })

    return NextResponse.json({ 
      success: true, 
      track,
      message: "Track uploaded and added to queue!"
    })
  } catch (error) {
    console.error("Error uploading track:", error)
    return NextResponse.json({ error: "Failed to upload track" }, { status: 500 })
  }
}
