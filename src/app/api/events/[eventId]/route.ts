import { getEffectiveUserId } from "@/lib/auth-utils";
import { getOrganizerContext, organizerWhere } from "@/lib/organizer-context";
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendEmail, generateEventRescheduledEmailHtml } from "@/lib/email"

// Helper function to generate a unique slug
async function generateUniqueSlug(title: string, organizerId: string, currentSlug: string): Promise<string> {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

  // If the title generates the same slug, keep it
  if (baseSlug === currentSlug) {
    return currentSlug
  }

  let slug = baseSlug
  let counter = 1
  
  while (true) {
    const existing = await prisma.event.findFirst({
      where: { organizerId, slug },
    })
    if (!existing) break
    slug = `${baseSlug}-${counter}`
    counter++
  }
  
  return slug
}

// Helper to format date for email
function formatDateForEmail(date: Date, timezone: string): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone,
  })
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const userId = await getEffectiveUserId()
    const { eventId } = await params

    // Check if user is the organizer (can see unpublished events)
    let isOrganizer = false
    if (userId) {
      const profile = await prisma.organizerProfile.findUnique({
        where: await organizerWhere(),
      })
      if (profile) {
        const ownedEvent = await prisma.event.findFirst({
          where: { id: eventId, organizerId: profile.id },
        })
        isOrganizer = !!ownedEvent
      }
    }

    // Select only public-safe fields for anonymous users
    const publicSelect = {
      id: true,
      title: true,
      slug: true,
      description: true,
      startsAt: true,
      endsAt: true,
      timezone: true,
      venueName: true,
      city: true,
      state: true,
      flyerUrl: true,
      ageRestriction: true,
      ticketingType: true,
      externalTicketingUrl: true,
      isRsvpOnly: true,
      rsvpCapacity: true,
      rsvpAllowPlusOnes: true,
      rsvpMaxPlusOnes: true,
      rsvpCount: true,
      isAddressHidden: true,
      lineup: true,
      pageTheme: true,
      accentColor: true,
      backgroundColor: true,
      expiresAfter: true,
      isPublished: true,
      status: true,
      // Conditionally include venueAddress based on isAddressHidden
      venueAddress: true,
      organizer: {
        select: {
          displayName: true,
          slug: true,
        },
      },
      ticketTiers: {
        where: { isVisible: true },
        orderBy: { sortOrder: "asc" as const },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          quantity: true,
          quantitySold: true,
          salesStartAt: true,
          salesEndAt: true,
          minPerOrder: true,
          maxPerOrder: true,
        },
      },
    }

    // Use different queries for organizer vs public to avoid select/include conflict
    const event = isOrganizer
      ? await prisma.event.findUnique({
          where: { id: eventId },
          include: {
            organizer: {
              select: {
                displayName: true,
                slug: true,
              },
            },
            ticketTiers: {
              where: { isVisible: true },
              orderBy: { sortOrder: "asc" },
            },
          },
        })
      : await prisma.event.findUnique({
          where: { id: eventId },
          select: publicSelect,
        })

    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 })
    }

    // For anonymous users, only return published events
    if (!isOrganizer && !event.isPublished) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 })
    }

    // Hide venue address if isAddressHidden is true (for anonymous users)
    if (!isOrganizer && event.isAddressHidden) {
      (event as Record<string, unknown>).venueAddress = null
    }

    return NextResponse.json(event)
  } catch (error) {
    console.error("Error fetching event:", error)
    return NextResponse.json(
      { message: "Failed to fetch event" },
      { status: 500 }
    )
  }
}

export async function PUT(
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
      where: await organizerWhere("events.edit"),
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
    })

    if (!existingEvent || existingEvent.organizerId !== profile.id) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 })
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
      expiresAfter,
    } = body

    // Normalize external ticketing URL — ensure it has a protocol
    let normalizedExternalUrl = externalTicketingUrl
    if (normalizedExternalUrl && !normalizedExternalUrl.startsWith('http')) {
      normalizedExternalUrl = `https://${normalizedExternalUrl}`
    }

    const event = await prisma.event.update({
      where: { id: eventId },
      data: {
        title,
        description,
        startsAt: startsAt ? new Date(startsAt) : undefined,
        endsAt: endsAt !== undefined ? (endsAt ? new Date(endsAt) : null) : undefined,
        timezone,
        venueName,
        venueAddress,
        city,
        state,
        flyerUrl,
        ageRestriction: ageRestriction !== undefined ? (ageRestriction ? parseInt(ageRestriction) : null) : undefined,
        ticketingType,
        externalTicketingUrl: normalizedExternalUrl,
        expiresAfter,
      },
    })

    return NextResponse.json(event)
  } catch (error) {
    console.error("Error updating event:", error)
    return NextResponse.json(
      { message: "Failed to update event" },
      { status: 500 }
    )
  }
}

export async function PATCH(
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
      where: await organizerWhere("events.edit"),
    })

    if (!profile) {
      return NextResponse.json(
        { message: "Organizer profile required" },
        { status: 400 }
      )
    }

    // Verify ownership and get existing event with attendee counts
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: {
            tickets: { where: { status: { in: ["VALID", "CHECKED_IN"] } } },
            rsvps: { where: { status: { in: ["CONFIRMED", "CHECKED_IN"] } } },
          },
        },
      },
    })

    if (!existingEvent || existingEvent.organizerId !== profile.id) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 })
    }

    const body = await req.json()
    if ((body.isPublished !== undefined || body.status !== undefined) && !await getOrganizerContext("events.publish")) {
      return NextResponse.json({ message: "Publication permission required" }, { status: 403 })
    }

    // PATCH only updates provided fields - allowlist to prevent mass assignment
    const {
      title,
      slug: customSlug, // Allow manual slug customization
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
      isAddressHidden,
      lineup,
      pageTheme,
      accentColor,
      backgroundColor,
      isRsvpOnly,
      rsvpCapacity,
      rsvpAllowPlusOnes,
      rsvpMaxPlusOnes,
      expiresAfter,
      isPublished,
      status,
      vibezEnabled,
      // New flags for controlling behavior
      updateSlug, // If true and title changes, regenerate slug
      notifyAttendees, // If true and dates change, send notifications
      organizerMessage, // Custom message to include in reschedule notifications
    } = body

    // Build update data only from allowed fields that are present
    const updateData: Record<string, unknown> = {}
    const changeLogs: Array<{ field: string; oldValue: string; newValue: string }> = []
    
    // Track if we need to handle slug redirect or date notifications
    let needsSlugRedirect = false
    let needsDateNotification = false
    const oldSlug = existingEvent.slug

    // Handle title change and slug update
    if (title !== undefined && title !== existingEvent.title) {
      updateData.title = title
      changeLogs.push({
        field: "title",
        oldValue: existingEvent.title,
        newValue: title,
      })

      // If updateSlug flag is set or customSlug is provided, update the slug
      if (updateSlug || customSlug) {
        const newSlug = customSlug || await generateUniqueSlug(title, profile.id, existingEvent.slug)
        if (newSlug !== existingEvent.slug) {
          updateData.slug = newSlug
          needsSlugRedirect = true
          changeLogs.push({
            field: "slug",
            oldValue: existingEvent.slug,
            newValue: newSlug,
          })
        }
      }
    }

    // Handle manual slug change (without title change)
    if (customSlug !== undefined && customSlug !== existingEvent.slug && title === undefined) {
      // Validate slug uniqueness
      const slugExists = await prisma.event.findFirst({
        where: { 
          organizerId: profile.id, 
          slug: customSlug,
          id: { not: eventId },
        },
      })
      if (slugExists) {
        return NextResponse.json(
          { message: "This URL slug is already in use" },
          { status: 400 }
        )
      }
      updateData.slug = customSlug
      needsSlugRedirect = true
      changeLogs.push({
        field: "slug",
        oldValue: existingEvent.slug,
        newValue: customSlug,
      })
    }

    // Handle date changes
    if (startsAt !== undefined) {
      const newStartsAt = startsAt ? new Date(startsAt) : null
      if (newStartsAt && newStartsAt.getTime() !== existingEvent.startsAt.getTime()) {
        updateData.startsAt = newStartsAt
        changeLogs.push({
          field: "startsAt",
          oldValue: existingEvent.startsAt.toISOString(),
          newValue: newStartsAt.toISOString(),
        })
        
        // Set previous date and rescheduled timestamp if event has attendees
        const hasAttendees = existingEvent._count.tickets > 0 || existingEvent._count.rsvps > 0
        if (hasAttendees && existingEvent.isPublished) {
          updateData.previousStartsAt = existingEvent.previousStartsAt || existingEvent.startsAt
          updateData.rescheduledAt = new Date()
          needsDateNotification = notifyAttendees !== false // Default to true
        }
      }
    }
    
    if (endsAt !== undefined) {
      const newEndsAt = endsAt ? new Date(endsAt) : null
      const oldEndsAt = existingEvent.endsAt
      const endsAtChanged = (newEndsAt?.getTime() ?? null) !== (oldEndsAt?.getTime() ?? null)
      
      if (endsAtChanged) {
        updateData.endsAt = newEndsAt
        changeLogs.push({
          field: "endsAt",
          oldValue: oldEndsAt?.toISOString() || "",
          newValue: newEndsAt?.toISOString() || "",
        })
        
        // Track previous end date
        const hasAttendees = existingEvent._count.tickets > 0 || existingEvent._count.rsvps > 0
        if (hasAttendees && existingEvent.isPublished) {
          updateData.previousEndsAt = existingEvent.previousEndsAt || existingEvent.endsAt
          if (!updateData.rescheduledAt) {
            updateData.rescheduledAt = new Date()
          }
          needsDateNotification = notifyAttendees !== false
        }
      }
    }

    // Other fields
    if (description !== undefined) updateData.description = description
    if (timezone !== undefined) updateData.timezone = timezone
    if (venueName !== undefined) updateData.venueName = venueName
    if (venueAddress !== undefined) updateData.venueAddress = venueAddress
    if (city !== undefined) updateData.city = city
    if (state !== undefined) updateData.state = state
    if (flyerUrl !== undefined) updateData.flyerUrl = flyerUrl
    if (ageRestriction !== undefined) updateData.ageRestriction = ageRestriction ? parseInt(ageRestriction) : null
    if (ticketingType !== undefined) updateData.ticketingType = ticketingType
    if (externalTicketingUrl !== undefined) {
      let normalizedUrl = externalTicketingUrl
      if (normalizedUrl && !normalizedUrl.startsWith('http')) {
        normalizedUrl = `https://${normalizedUrl}`
      }
      updateData.externalTicketingUrl = normalizedUrl
    }
    if (isAddressHidden !== undefined) updateData.isAddressHidden = isAddressHidden
    if (lineup !== undefined) updateData.lineup = lineup
    if (pageTheme !== undefined) updateData.pageTheme = pageTheme
    if (accentColor !== undefined) updateData.accentColor = accentColor
    if (backgroundColor !== undefined) updateData.backgroundColor = backgroundColor
    if (isRsvpOnly !== undefined) updateData.isRsvpOnly = isRsvpOnly
    if (rsvpCapacity !== undefined) updateData.rsvpCapacity = rsvpCapacity ? parseInt(rsvpCapacity) : null
    if (rsvpAllowPlusOnes !== undefined) updateData.rsvpAllowPlusOnes = rsvpAllowPlusOnes
    if (rsvpMaxPlusOnes !== undefined) updateData.rsvpMaxPlusOnes = rsvpMaxPlusOnes ? parseInt(rsvpMaxPlusOnes) : null
    if (expiresAfter !== undefined) updateData.expiresAfter = expiresAfter
    if (isPublished !== undefined) updateData.isPublished = isPublished
    if (status !== undefined) updateData.status = status
    if (vibezEnabled !== undefined) updateData.vibezEnabled = vibezEnabled

    // Execute update in a transaction with slug redirect and change logs
    const result = await prisma.$transaction(async (tx) => {
      // Create slug redirect if needed
      if (needsSlugRedirect) {
        await tx.eventSlugRedirect.upsert({
          where: {
            eventId_oldSlug: {
              eventId,
              oldSlug,
            },
          },
          create: {
            eventId,
            oldSlug,
          },
          update: {}, // No update needed, just ensure it exists
        })
      }

      // Create change logs
      if (changeLogs.length > 0) {
        await tx.eventChangeLog.createMany({
          data: changeLogs.map((log) => ({
            eventId,
            field: log.field,
            oldValue: log.oldValue,
            newValue: log.newValue,
            changedBy: userId,
          })),
        })
      }

      // Update the event
      const updatedEvent = await tx.event.update({
        where: { id: eventId },
        data: updateData,
      })

      return updatedEvent
    })

    // Send reschedule notifications asynchronously (don't block response)
    if (needsDateNotification) {
      // Fire and forget - send notifications in background
      sendRescheduleNotifications(eventId, existingEvent, result, organizerMessage).catch((err) => {
        console.error("Failed to send reschedule notifications:", err)
      })
    }

    return NextResponse.json({
      ...result,
      slugChanged: needsSlugRedirect,
      notificationsSent: needsDateNotification,
    })
  } catch (error) {
    console.error("Error patching event:", error)
    return NextResponse.json(
      { message: "Failed to update event" },
      { status: 500 }
    )
  }
}

// Helper function to send reschedule notifications
async function sendRescheduleNotifications(
  eventId: string,
  oldEvent: {
    title: string
    startsAt: Date
    endsAt: Date | null
    timezone: string
    venueName: string
    venueAddress: string
    slug: string
  },
  newEvent: {
    title: string
    startsAt: Date
    endsAt: Date | null
    slug: string
  },
  organizerMessage?: string
) {
  // Get all attendees (ticket holders + RSVPs)
  const [tickets, rsvps] = await Promise.all([
    prisma.ticket.findMany({
      where: { 
        eventId,
        status: { in: ["VALID", "CHECKED_IN"] },
      },
      include: {
        order: {
          select: { email: true },
        },
      },
    }),
    prisma.rsvp.findMany({
      where: { 
        eventId,
        status: { in: ["CONFIRMED", "CHECKED_IN"] },
      },
      select: { email: true },
    }),
  ])

  // Collect unique emails
  const emailSet = new Set<string>()
  tickets.forEach((t) => {
    if (t.order?.email) {
      emailSet.add(t.order.email)
    }
  })
  rsvps.forEach((r) => emailSet.add(r.email))

  const emails = Array.from(emailSet)
  if (emails.length === 0) return

  const eventUrl = `https://afters.am/e/${newEvent.slug}`
  const oldDate = formatDateForEmail(oldEvent.startsAt, oldEvent.timezone)
  const newDate = formatDateForEmail(newEvent.startsAt, oldEvent.timezone)

  const html = generateEventRescheduledEmailHtml({
    eventTitle: newEvent.title,
    oldDate,
    newDate,
    venueName: oldEvent.venueName,
    venueAddress: oldEvent.venueAddress,
    eventUrl,
    organizerMessage,
  })

  // Send emails in batches (Resend has rate limits)
  const batchSize = 50
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize)
    await Promise.all(
      batch.map((email) =>
        sendEmail({
          to: email,
          subject: `📅 ${newEvent.title} has been rescheduled`,
          html,
        }).catch((err) => {
          console.error(`Failed to send reschedule email to ${email}:`, err)
        })
      )
    )
  }

  console.log(`Sent reschedule notifications to ${emails.length} attendees for event ${eventId}`)
}

export async function DELETE(
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
      where: await organizerWhere("events.delete"),
    })

    if (!profile) {
      return NextResponse.json(
        { message: "Organizer profile required" },
        { status: 400 }
      )
    }

    // Verify ownership and check if deletable
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        orders: {
          select: { total: true },
        },
      },
    })

    if (!existingEvent || existingEvent.organizerId !== profile.id) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 })
    }

    // Allow deletion if:
    // 1. Event is RSVP only (no paid tickets)
    // 2. All orders are free ($0 total)
    const hasPaidOrders = existingEvent.orders.some(order => order.total > 0)

    if (!existingEvent.isRsvpOnly && hasPaidOrders) {
      return NextResponse.json(
        { message: "Cannot delete event with paid ticket orders. Only free/RSVP events can be deleted." },
        { status: 400 }
      )
    }

    // Delete related records first (cascade doesn't always work with all relations)
    await prisma.$transaction([
      prisma.eventView.deleteMany({ where: { eventId } }),
      prisma.eventScanner.deleteMany({ where: { eventId } }),
      prisma.ticket.deleteMany({ where: { eventId } }),
      prisma.orderItem.deleteMany({ where: { order: { eventId } } }),
      prisma.order.deleteMany({ where: { eventId } }),
      prisma.ticketTier.deleteMany({ where: { eventId } }),
      prisma.guestlistEntry.deleteMany({ where: { eventId } }),
      prisma.rsvp.deleteMany({ where: { eventId } }),
      prisma.event.delete({ where: { id: eventId } }),
    ])

    return NextResponse.json({ message: "Event deleted" })
  } catch (error) {
    console.error("Error deleting event:", error)
    return NextResponse.json(
      { message: "Failed to delete event" },
      { status: 500 }
    )
  }
}
