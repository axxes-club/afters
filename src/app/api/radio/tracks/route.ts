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
        nextTrack: null,
        currentPosition: 0,
        isLive: false,
        timeline: []
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
    const nextTrackIndex = (currentTrackIndex + 1) % tracks.length
    const nextTrack = tracks[nextTrackIndex]

    // Build timeline with actual start times
    // Calculate when each track starts relative to current time
    const timeline = []
    let timeOffset = -currentPosition // Start from when current track began
    
    for (let i = 0; i < tracks.length; i++) {
      const trackIndex = (currentTrackIndex + i) % tracks.length
      const track = tracks[trackIndex]
      const startTime = now + (timeOffset * 1000)
      
      timeline.push({
        id: track.id,
        title: track.title,
        artistName: track.artist?.artistName || track.artistName || "Unknown Artist",
        artistSlug: track.artist?.slug || "unknown",
        duration: track.duration,
        artworkUrl: track.artworkUrl,
        startTime, // Unix timestamp when track starts
        isPlaying: i === 0,
      })
      
      timeOffset += track.duration
    }

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
    const nextArtistName = nextTrack.artist?.artistName || nextTrack.artistName || "Unknown Artist"
    const nextArtistSlug = nextTrack.artist?.slug || "unknown"

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
      nextTrack: {
        id: nextTrack.id,
        title: nextTrack.title,
        duration: nextTrack.duration,
        artworkUrl: nextTrack.artworkUrl,
        artistName: nextArtistName,
        artistSlug: nextArtistSlug,
      },
      currentIndex: currentTrackIndex,
      currentPosition, // Position in seconds within the current track
      serverTime: Date.now(),
      isLive: true,
      timeline, // Full timeline with start times
    })
  } catch (error) {
    console.error("Error getting radio state:", error)
    return NextResponse.json({ tracks: [], currentTrack: null, nextTrack: null, isLive: false, timeline: [] }, { status: 500 })
  }
}
