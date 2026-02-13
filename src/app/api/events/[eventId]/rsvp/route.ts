import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
    const { name, email, phone, plusOnes, message } = await req.json()

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { message: "Name and email are required" },
        { status: 400 }
      )
    }

    // Get event with RSVP settings
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organizer: {
          select: {
            displayName: true,
          },
        },
      },
    })

    if (!event) {
      return NextResponse.json(
        { message: "Event not found" },
        { status: 404 }
      )
    }

    if (!event.isRsvpOnly) {
      return NextResponse.json(
        { message: "This event does not accept RSVPs" },
        { status: 400 }
      )
    }

    if (!event.isPublished) {
      return NextResponse.json(
        { message: "Event is not published" },
        { status: 400 }
      )
    }

    // Validate plus ones
    const requestedPlusOnes = plusOnes || 0
    if (requestedPlusOnes > 0 && !event.rsvpAllowPlusOnes) {
      return NextResponse.json(
        { message: "Plus ones are not allowed for this event" },
        { status: 400 }
      )
    }

    if (requestedPlusOnes > event.rsvpMaxPlusOnes) {
      return NextResponse.json(
        { message: `Maximum ${event.rsvpMaxPlusOnes} plus ones allowed` },
        { status: 400 }
      )
    }

    // Check capacity
    const totalGuests = 1 + requestedPlusOnes
    if (event.rsvpCapacity !== null) {
      const currentCount = event.rsvpCount
      if (currentCount + totalGuests > event.rsvpCapacity) {
        return NextResponse.json(
          { message: "Event is at capacity" },
          { status: 400 }
        )
      }
    }

    // Check for existing RSVP
    const existingRsvp = await prisma.rsvp.findUnique({
      where: {
        eventId_email: {
          eventId,
          email: email.toLowerCase(),
        },
      },
    })

    if (existingRsvp) {
      return NextResponse.json(
        { message: "You have already RSVPd to this event" },
        { status: 400 }
      )
    }

    // Create RSVP and update count in a transaction
    const rsvp = await prisma.$transaction(async (tx) => {
      const newRsvp = await tx.rsvp.create({
        data: {
          eventId,
          name,
          email: email.toLowerCase(),
          phone: phone || null,
          plusOnes: requestedPlusOnes,
          message: message || null,
          status: "CONFIRMED",
        },
      })

      // Update RSVP count
      await tx.event.update({
        where: { id: eventId },
        data: {
          rsvpCount: {
            increment: totalGuests,
          },
        },
      })

      return newRsvp
    })

    // Send confirmation email (non-blocking)
    const eventDate = new Date(event.startsAt)
    const dateStr = eventDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
    const timeStr = eventDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })

    resend.emails.send({
      from: "Afters <noreply@afters.am>",
      to: email,
      subject: `RSVP Confirmed: ${event.title}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 40px;">
          <h1 style="font-size: 24px; margin-bottom: 8px;">You're on the list!</h1>
          <p style="color: #888; margin-bottom: 32px;">Your RSVP for ${event.title} has been confirmed.</p>

          <div style="background: #111; padding: 24px; border-left: 3px solid ${event.accentColor || '#ff1493'};">
            <h2 style="font-size: 20px; margin: 0 0 16px 0;">${event.title}</h2>
            <p style="color: #888; margin: 0 0 8px 0;">${dateStr} at ${timeStr}</p>
            <p style="color: #888; margin: 0;">${event.venueName}, ${event.city}</p>
          </div>

          <div style="margin-top: 24px; padding: 16px; background: #111;">
            <p style="color: #888; margin: 0;">Guests: <strong style="color: #fff;">${totalGuests}</strong></p>
          </div>

          ${!event.showLocationOnPage && event.venueAddress ? `
            <div style="margin-top: 24px; padding: 16px; background: #111; border: 1px solid #333;">
              <p style="color: ${event.accentColor || '#ff1493'}; margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase;">Secret Location</p>
              <p style="color: #fff; margin: 0;">${event.venueAddress}</p>
            </div>
          ` : ''}

          <p style="color: #666; margin-top: 32px; font-size: 12px;">
            Presented by ${event.organizer.displayName} &bull; Powered by Afters
          </p>
        </div>
      `,
    }).catch(console.error)

    return NextResponse.json({
      id: rsvp.id,
      message: "RSVP confirmed",
    })
  } catch (error) {
    console.error("RSVP error:", error)
    return NextResponse.json(
      { message: "Failed to process RSVP" },
      { status: 500 }
    )
  }
}
