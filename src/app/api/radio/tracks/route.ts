import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Get the current radio state - synchronized across all clients
export async function GET() {
  try {
    // Get all tracks in the queue (approved + has queue position)
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
        }
      },
      orderBy: { queuePosition: "asc" }
    })

    if (tracks.length === 0) {
      return NextResponse.json({ 
        tracks: [], 
        currentTrack: null,
        currentPosition: 0,
        isLive: false 
      })
    }

    // Calculate total playlist duration
    const totalDuration = tracks.reduce((sum, t) => sum + t.duration, 0)
    
    // Get current position in the playlist based on server time
    // Radio "started" at a fixed epoch time and loops continuously
    const radioEpoch = new Date("2026-01-01T00:00:00Z").getTime()
    const now = Date.now()
    const elapsedSeconds = Math.floor((now - radioEpoch) / 1000)
    const positionInPlaylist = elapsedSeconds % totalDuration

    // Find which track is currently playing
    let accumulated = 0
    let currentTrackIndex = 0
    let currentPosition = 0

    for (let i = 0; i < tracks.length; i++) {
      if (accumulated + tracks[i].duration > positionInPlaylist) {
        currentTrackIndex = i
        currentPosition = positionInPlaylist - accumulated
        break
      }
      accumulated += tracks[i].duration
    }

    const currentTrack = tracks[currentTrackIndex]

    // Log the play (debounced - only once per track per minute)
    const oneMinuteAgo = new Date(Date.now() - 60000)
    const recentPlay = await prisma.radioPlay.findFirst({
      where: {
        trackId: currentTrack.id,
        playedAt: { gte: oneMinuteAgo }
      }
    })

    if (!recentPlay) {
      await prisma.radioPlay.create({
        data: {
          trackId: currentTrack.id,
          playedAt: new Date(),
          listeners: 1
        }
      })
    }

    // Determine artist name (from profile or direct field)
    const artistName = currentTrack.artist?.artistName || currentTrack.artistName || "Unknown Artist"
    const artistSlug = currentTrack.artist?.slug || "unknown"

    return NextResponse.json({
      tracks: tracks.map(t => ({
        id: t.id,
        title: t.title,
        fileUrl: t.fileUrl,
        duration: t.duration,
        artworkUrl: t.artworkUrl,
        artistName: t.artist?.artistName || t.artistName || "Unknown Artist",
        artistSlug: t.artist?.slug || "unknown",
        artistAvatar: t.artist?.avatarUrl,
      })),
      currentTrack: {
        id: currentTrack.id,
        title: currentTrack.title,
        fileUrl: currentTrack.fileUrl,
        duration: currentTrack.duration,
        artworkUrl: currentTrack.artworkUrl,
        artistName,
        artistSlug,
      },
      currentIndex: currentTrackIndex,
      currentPosition, // Position in seconds within the current track
      serverTime: Date.now(),
      isLive: true
    })
  } catch (error) {
    console.error("Error getting radio state:", error)
    return NextResponse.json({ tracks: [], currentTrack: null, isLive: false }, { status: 500 })
  }
}
