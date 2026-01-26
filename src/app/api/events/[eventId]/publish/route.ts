import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { userId } = await auth()
    const { eventId } = await params

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const profile = await prisma.organizerProfile.findUnique({
      where: { userId },
    })

    if (!profile) {
      return NextResponse.json(
        { message: "Organizer profile required" },
        { status: 400 }
      )
    }

    // Check Stripe Connect status
    if (!profile.stripeChargesEnabled) {
      return NextResponse.json(
        { message: "Complete Stripe setup before publishing" },
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

    // Check for ticket tiers
    if (existingEvent.ticketTiers.length === 0) {
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

    return NextResponse.json(event)
  } catch (error) {
    console.error("Error publishing event:", error)
    return NextResponse.json(
      { message: "Failed to publish event" },
      { status: 500 }
    )
  }
}
