import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

// Get current user's artist profile
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const profile = await prisma.artistProfile.findUnique({
      where: { userId },
      include: {
        radioTracks: {
          include: {
            _count: { select: { plays: true } }
          },
          orderBy: { createdAt: "desc" }
        }
      }
    })

    return NextResponse.json({ profile })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}

// Create or update artist profile
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { 
      artistName, 
      slug, 
      bio, 
      avatarUrl, 
      coverUrl, 
      genres, 
      spotifyUrl, 
      soundcloudUrl,
      instagramUrl,
      twitterUrl,
      websiteUrl,
      youtubeUrl
    } = body

    if (!artistName || !slug) {
      return NextResponse.json({ 
        error: "Artist name and slug are required" 
      }, { status: 400 })
    }

    // Check slug uniqueness
    const existing = await prisma.artistProfile.findUnique({ where: { slug } })
    if (existing && existing.userId !== userId) {
      return NextResponse.json({ 
        error: "This slug is already taken" 
      }, { status: 400 })
    }

    const profile = await prisma.artistProfile.upsert({
      where: { userId },
      update: {
        artistName,
        slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        bio,
        avatarUrl,
        coverUrl,
        genres,
        spotifyUrl,
        soundcloudUrl,
        instagramUrl,
        twitterUrl,
        websiteUrl,
        youtubeUrl,
      },
      create: {
        userId,
        artistName,
        slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        bio,
        avatarUrl,
        coverUrl,
        genres,
        spotifyUrl,
        soundcloudUrl,
        instagramUrl,
        twitterUrl,
        websiteUrl,
        youtubeUrl,
      }
    })

    // Update user role to ARTIST if not already
    await prisma.user.update({
      where: { id: userId },
      data: { role: "ARTIST" }
    })

    return NextResponse.json({ success: true, profile })
  } catch (error) {
    console.error("Error creating artist profile:", error)
    return NextResponse.json({ error: "Failed to create profile" }, { status: 500 })
  }
}
