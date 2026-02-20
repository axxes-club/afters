import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  Ticket,
  DollarSign,
  Clock,
  MapPin,
  Plus,
  Eye,
  Sparkles,
  Radio,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import { formatCents } from "@/lib/stripe";

export default async function OverviewPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const profile = await prisma.organizerProfile.findUnique({
    where: { userId },
    include: {
      events: {
        include: {
          ticketTiers: true,
          _count: {
            select: { tickets: true },
          },
        },
        orderBy: { startsAt: "asc" },
        take: 10,
      },
      subscription: true,
    },
  });

  // Auto-create profile if it doesn't exist
  let activeProfile = profile;
  if (!activeProfile) {
    // Get user info from Clerk (handles race condition where webhook hasn't fired yet)
    const clerkUser = await currentUser();

    // Ensure User record exists in DB before creating profile
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: clerkUser?.emailAddresses[0]?.emailAddress || "",
        firstName: clerkUser?.firstName,
        lastName: clerkUser?.lastName,
        imageUrl: clerkUser?.imageUrl,
        role: "ORGANIZER",
      },
    });

    activeProfile = await prisma.organizerProfile.create({
      data: {
        userId,
        displayName: user.firstName || "Organizer",
        slug: `organizer-${userId.slice(-8)}`,
      },
      include: {
        events: {
          include: {
            ticketTiers: true,
            _count: { select: { tickets: true } },
          },
          orderBy: { startsAt: "asc" },
          take: 10,
        },
        subscription: true,
      },
    });
  }

  // Calculate stats
  const now = new Date();
  const upcomingEvents = activeProfile.events.filter(
    (e) => new Date(e.startsAt) > now,
  );
  const liveEvents = upcomingEvents.filter((e) => e.isPublished);
  const draftEvents = upcomingEvents.filter((e) => !e.isPublished);

  const totalTicketsSold = activeProfile.events.reduce(
    (sum, e) => sum + e.ticketTiers.reduce((s, t) => s + t.quantitySold, 0),
    0,
  );

  const totalRevenue = activeProfile.events.reduce(
    (sum, e) =>
      sum + e.ticketTiers.reduce((s, t) => s + t.quantitySold * t.price, 0),
    0,
  );

  const totalCapacity = activeProfile.events.reduce(
    (sum, e) => sum + e.ticketTiers.reduce((s, t) => s + t.quantity, 0),
    0,
  );

  // Next event
  const nextEvent = upcomingEvents[0];

  return (
    <div className="space-y-6">
      {/* Command Center Header */}
      <div className="relative overflow-hidden border border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] pointer-events-none" />
        <div className="relative p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <span className="text-[10px] font-mono text-primary tracking-widest">COMMAND CENTER</span>
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl font-headline tracking-wide mb-1">
                {activeProfile.displayName || "Operator"}
              </h1>
              <p className="text-sm text-white/40 font-mono">
                {liveEvents.length} live • {draftEvents.length} drafts • {totalTicketsSold} tickets moved
              </p>
            </div>
            <Link
              href="/b/events/new"
              className="hidden sm:flex items-center gap-2 px-5 py-3 bg-primary text-black font-mono font-bold text-sm tracking-wider hover:bg-primary/90 transition-all group"
            >
              <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
              NEW EVENT
            </Link>
          </div>
        </div>
      </div>

      {/* Live Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="LIVE NOW"
          value={liveEvents.length.toString()}
          icon={<Radio className="w-4 h-4" />}
          accent
          pulse={liveEvents.length > 0}
        />
        <StatCard
          label="TICKETS SOLD"
          value={totalTicketsSold.toString()}
          icon={<Ticket className="w-4 h-4" />}
          subValue={totalCapacity > 0 ? `${Math.round((totalTicketsSold / totalCapacity) * 100)}% capacity` : undefined}
        />
        <StatCard
          label="REVENUE"
          value={formatCents(totalRevenue)}
          icon={<DollarSign className="w-4 h-4" />}
        />
        <StatCard
          label="TOTAL EVENTS"
          value={activeProfile.events.length.toString()}
          icon={<Calendar className="w-4 h-4" />}
          subValue={`${upcomingEvents.length} upcoming`}
        />
      </div>

      {/* Next Event - Hero Card */}
      {nextEvent ? (
        <div className="relative overflow-hidden border border-white/10 bg-white/[0.02] group">
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent pointer-events-none" />
          
          {/* Status bar */}
          <div className="relative px-4 py-2 border-b border-white/10 flex items-center justify-between bg-black/20">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-mono text-white/40 tracking-widest">NEXT UP</span>
            </div>
            <div className="flex items-center gap-2">
              {nextEvent.isPublished ? (
                <>
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                  <span className="text-[10px] font-mono text-primary">LIVE</span>
                </>
              ) : (
                <>
                  <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
                  <span className="text-[10px] font-mono text-yellow-500">DRAFT</span>
                </>
              )}
            </div>
          </div>

          <Link
            href={`/b/event-editor/${nextEvent.id}/overview`}
            className="relative flex flex-col sm:flex-row p-4 sm:p-6 gap-4 sm:gap-6 hover:bg-white/[0.02] transition-all"
          >
            {/* Flyer Thumbnail */}
            {nextEvent.flyerUrl && (
              <div className="relative w-full sm:w-24 h-40 sm:h-32 flex-shrink-0 overflow-hidden border border-white/10">
                <Image
                  src={nextEvent.flyerUrl}
                  alt={nextEvent.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {/* Event Details */}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-headline tracking-wide truncate group-hover:text-primary transition-colors">
                {nextEvent.title}
              </h2>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-white/40">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>
                    {new Date(nextEvent.startsAt).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{nextEvent.venueName}</span>
                </span>
              </div>

              {/* Ticket Progress */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-white/40">CAPACITY</span>
                  <span className="text-sm font-mono">
                    <span className="text-primary">
                      {nextEvent.ticketTiers.reduce((s, t) => s + t.quantitySold, 0)}
                    </span>
                    <span className="text-white/20 mx-1">/</span>
                    <span className="text-white/60">
                      {nextEvent.ticketTiers.reduce((s, t) => s + t.quantity, 0)}
                    </span>
                  </span>
                </div>
                <div className="h-2 bg-white/5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        (nextEvent.ticketTiers.reduce((s, t) => s + t.quantitySold, 0) /
                          Math.max(1, nextEvent.ticketTiers.reduce((s, t) => s + t.quantity, 0))) *
                          100,
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Revenue Badge */}
            <div className="hidden sm:flex flex-col items-end justify-center">
              <p className="text-2xl font-mono font-bold text-primary">
                {formatCents(nextEvent.ticketTiers.reduce((s, t) => s + t.quantitySold * t.price, 0))}
              </p>
              <p className="text-[10px] font-mono text-white/40 tracking-wider">REVENUE</p>
            </div>
          </Link>
        </div>
      ) : (
        /* Empty State */
        <div className="border border-dashed border-white/10 bg-white/[0.01] p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 border border-white/10 mb-4">
            <Calendar className="w-8 h-8 text-white/20" />
          </div>
          <h3 className="font-mono font-bold text-lg mb-2">No upcoming events</h3>
          <p className="text-white/40 text-sm mb-6 max-w-md mx-auto">
            Create your first event and start selling tickets in minutes.
          </p>
          <Link
            href="/b/events/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-black font-mono font-bold text-sm tracking-wider hover:bg-primary/90 transition-all"
          >
            <Plus className="w-4 h-4" />
            CREATE EVENT
          </Link>
        </div>
      )}

      {/* Events List */}
      {activeProfile.events.length > 0 && (
        <div className="border border-white/10">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5 text-white/40" />
              <span className="text-xs font-mono text-white/40 tracking-widest">ALL EVENTS</span>
            </div>
            <Link
              href="/b/events"
              className="flex items-center gap-1 text-xs font-mono text-primary hover:underline"
            >
              VIEW ALL <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-white/5">
            {activeProfile.events.slice(0, 5).map((event) => {
              const isPast = new Date(event.startsAt) <= now;
              const soldCount = event.ticketTiers.reduce((s, t) => s + t.quantitySold, 0);
              const totalCount = event.ticketTiers.reduce((s, t) => s + t.quantity, 0);
              const percentage = totalCount > 0 ? Math.round((soldCount / totalCount) * 100) : 0;
              const revenue = event.ticketTiers.reduce((s, t) => s + t.quantitySold * t.price, 0);

              return (
                <Link
                  key={event.id}
                  href={`/b/event-editor/${event.id}/overview`}
                  className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-white/[0.02] transition-all group ${isPast ? "opacity-50" : ""}`}
                >
                  {/* Date Block */}
                  <div className="w-12 h-14 bg-white/5 flex flex-col items-center justify-center flex-shrink-0 border border-white/5">
                    <span className="text-[9px] font-mono text-white/40 tracking-wider">
                      {new Date(event.startsAt).toLocaleDateString("en-US", { month: "short" }).toUpperCase()}
                    </span>
                    <span className="text-xl font-mono font-bold">
                      {new Date(event.startsAt).getDate()}
                    </span>
                  </div>

                  {/* Event Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-mono font-medium truncate text-sm sm:text-base group-hover:text-primary transition-colors">
                        {event.title}
                      </p>
                    </div>
                    <p className="text-xs text-white/40 font-mono truncate mt-0.5">
                      {event.venueName} • {event.city}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="hidden sm:flex items-center gap-6 flex-shrink-0">
                    {/* Capacity Bar */}
                    <div className="w-24">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono text-white/30">{soldCount}/{totalCount}</span>
                        <span className="text-[10px] font-mono text-white/30">{percentage}%</span>
                      </div>
                      <div className="h-1 bg-white/5">
                        <div
                          className="h-full bg-primary/60"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Revenue */}
                    <div className="w-20 text-right">
                      <p className="text-sm font-mono text-white/60">{formatCents(revenue)}</p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`text-[10px] font-mono px-2 py-1 ${
                        isPast
                          ? "bg-white/5 text-white/30"
                          : event.isPublished
                            ? "bg-primary/10 text-primary"
                            : "bg-yellow-500/10 text-yellow-500"
                      }`}
                    >
                      {isPast ? "PAST" : event.isPublished ? "LIVE" : "DRAFT"}
                    </span>
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Link
          href="/b/events/new"
          className="border border-primary/30 bg-primary/5 p-4 sm:p-6 flex flex-col items-center gap-2 sm:gap-3 hover:border-primary/60 hover:bg-primary/10 transition-all group"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 border border-primary/30 flex items-center justify-center group-hover:border-primary transition-colors">
            <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </div>
          <span className="text-xs sm:text-sm font-mono tracking-wider text-primary">NEW EVENT</span>
        </Link>
        <Link
          href="/b/events"
          className="border border-white/10 p-4 sm:p-6 flex flex-col items-center gap-2 sm:gap-3 hover:border-white/20 hover:bg-white/[0.02] transition-all group"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 border border-white/10 flex items-center justify-center group-hover:border-white/20 transition-colors">
            <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-white/40 group-hover:text-white/60 transition-colors" />
          </div>
          <span className="text-xs sm:text-sm font-mono tracking-wider text-white/50 group-hover:text-white/70 transition-colors">ALL EVENTS</span>
        </Link>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent = false,
  pulse = false,
  subValue,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: boolean;
  pulse?: boolean;
  subValue?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden border p-4 ${
        accent
          ? "border-primary/30 bg-gradient-to-br from-primary/10 to-transparent"
          : "border-white/10 bg-white/[0.02]"
      }`}
    >
      {pulse && (
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
        </div>
      )}
      <div className="flex items-center justify-between mb-3">
        <span className={accent ? "text-primary" : "text-white/30"}>{icon}</span>
        <span className="text-[9px] sm:text-[10px] font-mono text-white/30 tracking-widest">{label}</span>
      </div>
      <p className={`text-2xl sm:text-3xl font-mono font-bold ${accent ? "text-primary" : ""}`}>
        {value}
      </p>
      {subValue && (
        <p className="text-[10px] font-mono text-white/30 mt-1">{subValue}</p>
      )}
    </div>
  );
}
