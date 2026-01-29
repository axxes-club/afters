import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function PUT(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      displayName,
      slug,
      bio,
      logoUrl,
      coverUrl,
      genres,
      artistType,
      websiteUrl,
      instagramUrl,
      twitterUrl,
      youtubeUrl,
      spotifyUrl,
      soundcloudUrl,
    } = body

    // Check if user has organizer profile
    const existingProfile = await prisma.organizerProfile.findUnique({
      where: { userId }
    })

    if (!existingProfile) {
      return NextResponse.json({ error: "Organizer profile not found" }, { status: 404 })
    }

    // Check if slug is taken by another organizer
    if (slug !== existingProfile.slug) {
      const slugTaken = await prisma.organizerProfile.findUnique({
        where: { slug }
      })
      if (slugTaken) {
        return NextResponse.json({ error: "This URL is already taken" }, { status: 400 })
      }
    }

    const updatedProfile = await prisma.organizerProfile.update({
      where: { userId },
      data: {
        displayName,
        slug,
        bio,
        logoUrl,
        coverUrl,
        genres,
        artistType,
        websiteUrl,
        instagramUrl,
        twitterUrl,
        youtubeUrl,
        spotifyUrl,
        soundcloudUrl,
      }
    })

    return NextResponse.json(updatedProfile)
  } catch (error) {
    console.error("Error updating organizer profile:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const profile = await prisma.organizerProfile.findUnique({
      where: { userId },
      include: {
        events: {
          orderBy: { startsAt: "desc" },
          take: 10,
          include: {
            _count: { select: { tickets: true, orders: true } }
          }
        },
        followers: {
          take: 10,
          include: {
            follower: {
              select: { id: true, firstName: true, lastName: true, imageUrl: true }
            }
          }
        },
        _count: {
          select: { events: true, followers: true }
        }
      }
    })

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error("Error fetching organizer profile:", error)
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}
