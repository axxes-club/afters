import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

// Get radio play analytics for an artist
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
      return NextResponse.json({ error: "Artist profile not found" }, { status: 404 })
    }

    // Get all tracks with play counts
    const tracks = await prisma.radioTrack.findMany({
      where: { 
        artistId: artistProfile.id,
        status: "APPROVED"
      },
      include: {
        plays: {
          select: {
            playedAt: true,
            listeners: true
          },
          orderBy: { playedAt: "desc" },
          take: 100
        },
        _count: {
          select: { plays: true }
        }
      }
    })

    // Calculate analytics
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const analytics = await Promise.all(tracks.map(async (track) => {
      const [playsToday, playsWeek, playsMonth] = await Promise.all([
        prisma.radioPlay.count({
          where: { trackId: track.id, playedAt: { gte: oneDayAgo } }
        }),
        prisma.radioPlay.count({
          where: { trackId: track.id, playedAt: { gte: oneWeekAgo } }
        }),
        prisma.radioPlay.count({
          where: { trackId: track.id, playedAt: { gte: oneMonthAgo } }
        }),
      ])

      return {
        id: track.id,
        title: track.title,
        artworkUrl: track.artworkUrl,
        totalPlays: track._count.plays,
        playsToday,
        playsWeek,
        playsMonth,
        recentPlays: track.plays.slice(0, 10).map(p => ({
          playedAt: p.playedAt,
          listeners: p.listeners
        }))
      }
    }))

    // Total stats
    const totalPlays = analytics.reduce((sum, t) => sum + t.totalPlays, 0)
    const totalPlaysToday = analytics.reduce((sum, t) => sum + t.playsToday, 0)
    const totalPlaysWeek = analytics.reduce((sum, t) => sum + t.playsWeek, 0)

    return NextResponse.json({
      tracks: analytics,
      summary: {
        totalTracks: tracks.length,
        totalPlays,
        totalPlaysToday,
        totalPlaysWeek,
      }
    })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
