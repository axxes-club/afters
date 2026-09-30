import { getEffectiveUserId } from "@/lib/auth-utils";
import { organizerWhere } from "@/lib/organizer-context";
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

interface LineupArtist {
  name: string
  role?: string
  imageUrl?: string
  socialUrl?: string
}

interface PastArtist extends LineupArtist {
  usedCount: number
  lastUsedAt: string
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const userId = await getEffectiveUserId()
    const { eventId } = await params

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const profile = await prisma.organizerProfile.findUnique({
      where: await organizerWhere("events.publish"),
      select: { id: true, pastArtists: true },
    })

    if (!profile) {
      return NextResponse.json(
        { message: "Organizer profile required" },
        { status: 400 }
      )
    }

    // Verify ownership
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        ticketTiers: true,
      },
    })

    if (!existingEvent || existingEvent.organizerId !== profile.id) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 })
    }

    // Check for ticket tiers (only required for non-RSVP events)
    if (!existingEvent.isRsvpOnly && existingEvent.ticketTiers.length === 0) {
      return NextResponse.json(
        { message: "Add at least one ticket tier before publishing" },
        { status: 400 }
      )
    }

    const event = await prisma.event.update({
      where: { id: eventId },
      data: {
        status: "PUBLISHED",
        isPublished: true,
      },
    })

    // Capture artists from lineup to pastArtists
    const lineup = (existingEvent.lineup as LineupArtist[] | null) || []
    if (lineup.length > 0) {
      const existingPastArtists = (profile.pastArtists as PastArtist[] | null) || []
      const now = new Date().toISOString()

      // Merge new artists with existing past artists
      const updatedPastArtists = [...existingPastArtists]

      for (const artist of lineup) {
        if (!artist.name?.trim()) continue

        const existingIndex = updatedPastArtists.findIndex(
          (pa) => pa.name.toLowerCase() === artist.name.toLowerCase()
        )

        if (existingIndex >= 0) {
          // Update existing artist
          updatedPastArtists[existingIndex] = {
            ...updatedPastArtists[existingIndex],
            role: artist.role || updatedPastArtists[existingIndex].role,
            imageUrl: artist.imageUrl || updatedPastArtists[existingIndex].imageUrl,
            socialUrl: artist.socialUrl || updatedPastArtists[existingIndex].socialUrl,
            usedCount: updatedPastArtists[existingIndex].usedCount + 1,
            lastUsedAt: now,
          }
        } else {
          // Add new artist
          updatedPastArtists.push({
            name: artist.name,
            role: artist.role,
            imageUrl: artist.imageUrl,
            socialUrl: artist.socialUrl,
            usedCount: 1,
            lastUsedAt: now,
          })
        }
      }

      // Save updated past artists
      await prisma.organizerProfile.update({
        where: { id: profile.id },
        data: { pastArtists: updatedPastArtists as unknown as Prisma.InputJsonValue },
      })
    }

    return NextResponse.json(event)
  } catch (error) {
    console.error("Error publishing event:", error)
    return NextResponse.json(
      { message: "Failed to publish event" },
      { status: 500 }
    )
  }
}
