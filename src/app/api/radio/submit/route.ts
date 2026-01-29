import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

// Artist submits a track for radio consideration
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has an artist profile
    const artistProfile = await prisma.artistProfile.findUnique({
      where: { userId }
    })

    if (!artistProfile) {
      return NextResponse.json({ 
        error: "You need an artist profile to submit tracks. Create one in your dashboard." 
      }, { status: 403 })
    }

    const body = await request.json()
    const { title, fileUrl, duration, artworkUrl, genre, bpm } = body

    if (!title || !fileUrl || !duration) {
      return NextResponse.json({ 
        error: "Title, file URL, and duration are required" 
      }, { status: 400 })
    }

    // Create the track submission
    const track = await prisma.radioTrack.create({
      data: {
        artistId: artistProfile.id,
        title,
        fileUrl,
        duration: parseInt(duration),
        artworkUrl,
        genre,
        bpm: bpm ? parseInt(bpm) : null,
        status: "PENDING",
      }
    })

    return NextResponse.json({ 
      success: true, 
      track,
      message: "Track submitted for review. You'll be notified when it's approved."
    })
  } catch (error) {
    console.error("Error submitting track:", error)
    return NextResponse.json({ error: "Failed to submit track" }, { status: 500 })
  }
}

// Get artist's submitted tracks
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const artistProfile = await prisma.artistProfile.findUnique({
      where: { userId }
    })

    if (!artistProfile) {
      return NextResponse.json({ tracks: [] })
    }

    const tracks = await prisma.radioTrack.findMany({
      where: { artistId: artistProfile.id },
      include: {
        _count: {
          select: { plays: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({ tracks })
  } catch (error) {
    console.error("Error fetching artist tracks:", error)
    return NextResponse.json({ error: "Failed to fetch tracks" }, { status: 500 })
  }
}
