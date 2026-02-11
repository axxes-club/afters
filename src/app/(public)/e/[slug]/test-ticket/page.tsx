import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { TestTicketClient } from "./TestTicketClient"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const event = await prisma.event.findFirst({
    where: { slug, isPublished: true },
    select: { title: true, venueName: true, startsAt: true, flyerUrl: true },
  })

  if (!event) return { title: "Test Ticket" }

  const eventDate = new Date(event.startsAt).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })

  return {
    title: `Test Ticket - ${event.title}`,
    description: `Training ticket for ${event.title} at ${event.venueName} on ${eventDate}`,
    openGraph: {
      title: `Test Ticket - ${event.title}`,
      description: `Training ticket for staff check-in practice`,
      images: event.flyerUrl ? [event.flyerUrl] : [],
    },
  }
}

export default async function TestTicketPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  // Find event by slug
  let event = await prisma.event.findFirst({
    where: { slug, isPublished: true },
    include: {
      organizer: {
        select: {
          displayName: true,
          slug: true,
          logoUrl: true,
        },
      },
    },
  })

  // Try combined slug format if not found
  if (!event) {
    const organizers = await prisma.organizerProfile.findMany({
      select: { slug: true },
    })

    for (const org of organizers) {
      if (slug.startsWith(org.slug + '-')) {
        const eventSlug = slug.slice(org.slug.length + 1)

        event = await prisma.event.findFirst({
          where: {
            isPublished: true,
            slug: eventSlug,
            organizer: { slug: org.slug },
          },
          include: {
            organizer: {
              select: {
                displayName: true,
                slug: true,
                logoUrl: true,
              },
            },
          },
        })
        if (event) break
      }
    }
  }

  if (!event) {
    notFound()
  }

  const eventDate = new Date(event.startsAt)

  return (
    <TestTicketClient
      event={{
        id: event.id,
        title: event.title,
        slug: slug,
        venueName: event.venueName,
        venueAddress: event.venueAddress,
        city: event.city,
        state: event.state,
        startsAt: event.startsAt.toISOString(),
        flyerUrl: event.flyerUrl,
        accentColor: event.accentColor,
        organizer: event.organizer,
      }}
      eventDate={eventDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })}
      eventTime={eventDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })}
    />
  )
}
