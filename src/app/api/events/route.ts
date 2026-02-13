import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const city = searchParams.get("city")
    const organizerId = searchParams.get("organizerId")
    const slug = searchParams.get("slug")

    // If slug is provided, return single event (for checkout page)
    if (slug) {
      // First try: exact event slug match
      let event = await prisma.event.findFirst({
        where: {
          isPublished: true,
          slug: slug,
        },
        include: {
          organizer: {
            select: {
              displayName: true,
              slug: true,
              stripeChargesEnabled: true,
            },
          },
          ticketTiers: {
            where: { isVisible: true },
            orderBy: { sortOrder: "asc" },
          },
        },
      })

      // Add RSVP fields to response
      if (event) {
        return NextResponse.json([{
          ...event,
          isRsvpOnly: event.isRsvpOnly,
          rsvpCapacity: event.rsvpCapacity,
          rsvpAllowPlusOnes: event.rsvpAllowPlusOnes,
          rsvpMaxPlusOnes: event.rsvpMaxPlusOnes,
          rsvpCount: event.rsvpCount,
        }])
      }

      // Second try: parse combined slug (organizer-slug + event-slug)
      const organizers = await prisma.organizerProfile.findMany({
        select: { slug: true, id: true },
      })

      for (const org of organizers) {
        if (slug.startsWith(org.slug + '-')) {
          const eventSlug = slug.slice(org.slug.length + 1)
          event = await prisma.event.findFirst({
            where: {
              isPublished: true,
              slug: eventSlug,
              organizerId: org.id,
            },
            include: {
              organizer: {
                select: {
                  displayName: true,
                  slug: true,
                  stripeChargesEnabled: true,
                },
              },
              ticketTiers: {
                where: { isVisible: true },
                orderBy: { sortOrder: "asc" },
              },
            },
          })
          if (event) break
        }
      }

      if (!event) {
        return NextResponse.json([], { status: 200 })
      }

      return NextResponse.json([{
        ...event,
        isRsvpOnly: event.isRsvpOnly,
        rsvpCapacity: event.rsvpCapacity,
        rsvpAllowPlusOnes: event.rsvpAllowPlusOnes,
        rsvpMaxPlusOnes: event.rsvpMaxPlusOnes,
        rsvpCount: event.rsvpCount,
      }])
    }

    const events = await prisma.event.findMany({
      where: {
        isPublished: true,
        status: "PUBLISHED",
        ...(city && { city }),
        ...(organizerId && { organizerId }),
        startsAt: {
          gte: new Date(),
        },
      },
      include: {
        organizer: {
          select: {
            displayName: true,
            slug: true,
          },
        },
        ticketTiers: {
          where: { isVisible: true },
          orderBy: { price: "asc" },
          take: 1,
        },
      },
      orderBy: { startsAt: "asc" },
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json(
      { message: "Failed to fetch events" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth()

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

    const body = await req.json()
    const {
      title,
      description,
      startsAt,
      endsAt,
      timezone,
      venueName,
      venueAddress,
      city,
      state,
      flyerUrl,
      ageRestriction,
      ticketingType,
      externalTicketingUrl,
      // Underground features
      isAddressHidden,
      lineup,
      pageTheme,
      accentColor,
      // RSVP settings
      isRsvpOnly,
      rsvpCapacity,
      rsvpAllowPlusOnes,
      rsvpMaxPlusOnes,
    } = body

    if (!title || !startsAt || !venueName || !venueAddress || !city) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      )
    }

    // Generate slug from title
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")

    // Check for existing slugs and make unique
    let slug = baseSlug
    let counter = 1
    while (true) {
      const existing = await prisma.event.findFirst({
        where: { organizerId: profile.id, slug },
      })
      if (!existing) break
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Normalize external ticketing URL — ensure it has a protocol
    let normalizedExternalUrl = externalTicketingUrl || null
    if (normalizedExternalUrl && !normalizedExternalUrl.startsWith('http')) {
      normalizedExternalUrl = `https://${normalizedExternalUrl}`
    }

    const event = await prisma.event.create({
      data: {
        organizerId: profile.id,
        title,
        slug,
        description,
        startsAt: new Date(startsAt),
        endsAt: endsAt ? new Date(endsAt) : null,
        timezone: timezone || "America/New_York",
        venueName,
        venueAddress,
        city,
        state,
        flyerUrl,
        ageRestriction: ageRestriction ? parseInt(ageRestriction) : null,
        ticketingType: ticketingType || 'AFTERS',
        externalTicketingUrl: normalizedExternalUrl,
        // Underground features
        isAddressHidden: isAddressHidden || false,
        // RSVP settings
        isRsvpOnly: isRsvpOnly || false,
        rsvpCapacity: rsvpCapacity ? parseInt(rsvpCapacity) : null,
        rsvpAllowPlusOnes: rsvpAllowPlusOnes || false,
        rsvpMaxPlusOnes: rsvpMaxPlusOnes ? parseInt(rsvpMaxPlusOnes) : 1,
        lineup: lineup || null,
        pageTheme: pageTheme || 'default',
        accentColor: accentColor || null,
      },
    })

    return NextResponse.json(event)
  } catch (error) {
    console.error("Error creating event:", error)
    return NextResponse.json(
      { message: "Failed to create event" },
      { status: 500 }
    )
  }
}
