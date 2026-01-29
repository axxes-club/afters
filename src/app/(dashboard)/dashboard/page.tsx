import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getEffectiveUserId } from "@/lib/auth-utils"
import { DashboardContent } from "@/components/dashboard/DashboardContent"

export default async function DashboardPage() {
  const userId = await getEffectiveUserId()

  if (!userId) {
    redirect("/sign-in")
  }

  // Check if user has an organizer profile
  const organizerProfile = await prisma.organizerProfile.findUnique({
    where: { userId },
    include: {
      events: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  })

  // If no organizer profile, redirect to onboarding
  if (!organizerProfile) {
    redirect("/dashboard/onboarding")
  }

  // Get stats
  const totalEvents = await prisma.event.count({
    where: { organizerId: organizerProfile.id },
  })

  const totalTicketsSold = await prisma.ticket.count({
    where: {
      event: {
        organizerId: organizerProfile.id,
      },
    },
  })

  const totalRevenue = await prisma.order.aggregate({
    where: {
      event: {
        organizerId: organizerProfile.id,
      },
      status: "PAID",
    },
    _sum: {
      subtotal: true,
    },
  })

  return (
    <DashboardContent
      displayName={organizerProfile.displayName}
      totalEvents={totalEvents}
      totalTicketsSold={totalTicketsSold}
      totalRevenue={totalRevenue._sum.subtotal || 0}
      stripeChargesEnabled={organizerProfile.stripeChargesEnabled}
      events={organizerProfile.events}
    />
  )
}
