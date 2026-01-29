import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getEffectiveUserId } from "@/lib/auth-utils"
import { EventsListContent } from "@/components/dashboard/EventsListContent"

export default async function DashboardEventsPage() {
  const userId = await getEffectiveUserId()

  if (!userId) {
    redirect("/sign-in")
  }

  const organizerProfile = await prisma.organizerProfile.findUnique({
    where: { userId },
  })

  if (!organizerProfile) {
    redirect("/dashboard/onboarding")
  }

  const events = await prisma.event.findMany({
    where: { organizerId: organizerProfile.id },
    include: {
      ticketTiers: true,
      _count: {
        select: { tickets: true },
      },
    },
    orderBy: { startsAt: "desc" },
  })

  return (
    <EventsListContent 
      events={events} 
      organizerSlug={organizerProfile.slug} 
    />
  )
}
