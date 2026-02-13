import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

interface PastArtist {
  name: string
  role?: string
  imageUrl?: string
  socialUrl?: string
  usedCount: number
  lastUsedAt: string
}

// GET /api/organizer/past-artists - Get past artists for autocomplete
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const profile = await prisma.organizerProfile.findUnique({
      where: { userId },
      select: { pastArtists: true },
    })

    if (!profile) {
      return NextResponse.json({ artists: [] })
    }

    const artists = (profile.pastArtists as PastArtist[] | null) || []

    // Sort by usedCount descending (most used first)
    artists.sort((a, b) => b.usedCount - a.usedCount)

    return NextResponse.json({ artists })
  } catch (error) {
    console.error("Failed to fetch past artists:", error)
    return NextResponse.json(
      { error: "Failed to fetch past artists" },
      { status: 500 }
    )
  }
}
