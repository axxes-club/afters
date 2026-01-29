import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getEffectiveUserId } from "@/lib/auth-utils";
import { DashboardContent } from "@/components/dashboard/DashboardContent";

export default async function DashboardPage() {
  const userId = await getEffectiveUserId();

  if (!userId) {
    redirect("/sign-in");
  }

  // Check if user has ANY profile type (users can only have one at a time)
  const [organizerProfile, artistProfile, personalProfile] = await Promise.all([
    prisma.organizerProfile.findUnique({
      where: { userId },
      include: {
        events: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    }),
    prisma.artistProfile.findUnique({
      where: { userId },
    }),
    prisma.personalProfile.findUnique({
      where: { userId },
    }),
  ]);

  // If user has no profile at all, redirect to onboarding
  if (!organizerProfile && !artistProfile && !personalProfile) {
    redirect("/onboarding");
  }

  // If user is an artist or personal profile holder, redirect them to their profile page
  // (since dashboard is primarily for organizers)
  if (!organizerProfile && artistProfile) {
    redirect("/dashboard/artist");
  }

  if (!organizerProfile && personalProfile) {
    redirect("/dashboard/account");
  }

  // At this point, user must have an organizer profile
  if (!organizerProfile) {
    redirect("/onboarding");
  }

  // Get stats
  const totalEvents = await prisma.event.count({
    where: { organizerId: organizerProfile.id },
  });

  const totalTicketsSold = await prisma.ticket.count({
    where: {
      event: {
        organizerId: organizerProfile.id,
      },
    },
  });

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
  });

  return (
    <DashboardContent
      displayName={organizerProfile.displayName}
      totalEvents={totalEvents}
      totalTicketsSold={totalTicketsSold}
      totalRevenue={totalRevenue._sum.subtotal || 0}
      stripeChargesEnabled={organizerProfile.stripeChargesEnabled}
      events={organizerProfile.events}
    />
  );
}
