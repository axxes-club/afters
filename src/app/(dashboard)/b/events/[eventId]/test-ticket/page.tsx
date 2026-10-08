import { notFound } from "next/navigation"
import { getUserId } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"
import { TestTicketClient } from "@/app/(public)/e/[slug]/test-ticket/TestTicketClient"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { title: true, venueName: true, startsAt: true, flyerUrl: true },
  })

  if (!event) return { title: "Test Ticket" }

  return {
    title: `Test Ticket - ${event.title}`,
    description: `Training ticket for ${event.title} at ${event.venueName}`,
  }
}

export default async function DashboardTestTicketPage({ params }: { params: Promise<{ eventId: string }> }) {
  const userId = await getUserId()
  if (!userId) {
    notFound()
  }

  const { eventId } = await params

  // Find event by ID - verify organizer owns it
  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      organizer: { userId },
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

  if (!event) {
    notFound()
  }

  const eventDate = new Date(event.startsAt)

  return (
    <TestTicketClient
      event={{
        id: event.id,
        title: event.title,
        slug: event.slug,
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
