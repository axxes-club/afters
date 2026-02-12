import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Calendar,
  Ticket,
  DollarSign,
  TrendingUp,
  ArrowRight,
  Clock,
  MapPin,
  Zap,
  Plus,
} from "lucide-react";
import { formatCents } from "@/lib/stripe";

export default async function DashboardPage() {
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

  if (!profile) redirect("/onboarding");

  // Calculate stats
  const now = new Date();
  const upcomingEvents = profile.events.filter(
    (e) => new Date(e.startsAt) > now,
  );
  const pastEvents = profile.events.filter((e) => new Date(e.startsAt) <= now);

  const totalTicketsSold = profile.events.reduce(
    (sum, e) => sum + e.ticketTiers.reduce((s, t) => s + t.quantitySold, 0),
    0,
  );

  const totalRevenue = profile.events.reduce(
    (sum, e) =>
      sum + e.ticketTiers.reduce((s, t) => s + t.quantitySold * t.price, 0),
    0,
  );

  // Next event
  const nextEvent = upcomingEvents[0];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-mono font-bold tracking-tight">
            CONTROL CENTER
          </h1>
          <p className="text-white/40 text-sm font-mono mt-1 truncate">
            {profile.displayName || "Operator"} • {upcomingEvents.length}{" "}
            upcoming
          </p>
        </div>
        <Link
          href="/d/events/new"
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#ff1493] text-black text-xs font-mono font-bold tracking-wider hover:bg-[#ff1493]/90 transition-all flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          NEW EVENT
        </Link>
      </div>

      {/* Stats Grid - Control Room Style */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="EVENTS LIVE"
          value={upcomingEvents.filter((e) => e.isPublished).length.toString()}
          icon={<Zap className="w-4 h-4" />}
          highlight
        />
        <StatCard
          label="TICKETS SOLD"
          value={totalTicketsSold.toString()}
          icon={<Ticket className="w-4 h-4" />}
        />
        <StatCard
          label="REVENUE"
          value={formatCents(totalRevenue)}
          icon={<DollarSign className="w-4 h-4" />}
        />
        <StatCard
          label="EVENTS TOTAL"
          value={profile.events.length.toString()}
          icon={<Calendar className="w-4 h-4" />}
        />
      </div>

      {/* Next Event - Featured */}
      {nextEvent && (
        <div className="border border-white/10 bg-white/[0.02]">
          <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between">
            <span className="text-[10px] font-mono text-white/40 tracking-widest">
              NEXT UP
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-[#ff1493] rounded-full animate-pulse" />
              <span className="text-[10px] font-mono text-[#ff1493]">
                {nextEvent.isPublished ? "LIVE" : "DRAFT"}
              </span>
            </div>
          </div>
          <Link
            href={`/d/events/${nextEvent.id}`}
            className="block p-6 hover:bg-white/[0.02] transition-all group"
          >
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-mono font-bold truncate group-hover:text-[#ff1493] transition-colors">
                  {nextEvent.title}
                </h2>
                <div
                  className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-2 text-sm text-white/40"
                  data-testid="event-details"
                >
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">
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
              </div>
              <div className="text-right">
                <p className="text-2xl font-mono font-bold">
                  {nextEvent.ticketTiers.reduce(
                    (s, t) => s + t.quantitySold,
                    0,
                  )}
                </p>
                <p className="text-xs text-white/40 font-mono">
                  / {nextEvent.ticketTiers.reduce((s, t) => s + t.quantity, 0)}{" "}
                  SOLD
                </p>
              </div>
            </div>
            <div className="mt-4 h-1 bg-white/5 overflow-hidden">
              <div
                className="h-full bg-[#ff1493] transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    (nextEvent.ticketTiers.reduce(
                      (s, t) => s + t.quantitySold,
                      0,
                    ) /
                      Math.max(
                        1,
                        nextEvent.ticketTiers.reduce(
                          (s, t) => s + t.quantity,
                          0,
                        ),
                      )) *
                      100,
                  )}%`,
                }}
              />
            </div>
          </Link>
        </div>
      )}

      {/* Events List */}
      <div className="border border-white/10">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <span className="text-xs font-mono text-white/40 tracking-widest">
            ALL EVENTS
          </span>
          <Link
            href="/d/events"
            className="text-xs font-mono text-[#ff1493] hover:underline flex items-center gap-1"
          >
            VIEW ALL <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {profile.events.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-10 h-10 mx-auto text-white/10 mb-3" />
            <p className="text-white/40 font-mono text-sm">No events yet</p>
            <Link
              href="/d/events/new"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 border border-white/20 text-xs font-mono hover:bg-white/5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              CREATE FIRST EVENT
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {profile.events.slice(0, 5).map((event) => {
              const isPast = new Date(event.startsAt) <= now;
              const soldCount = event.ticketTiers.reduce(
                (s, t) => s + t.quantitySold,
                0,
              );
              const totalCount = event.ticketTiers.reduce(
                (s, t) => s + t.quantity,
                0,
              );

              return (
                <Link
                  key={event.id}
                  href={`/d/events/${event.id}`}
                  className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-white/[0.02] transition-all ${isPast ? "opacity-50" : ""}`}
                >
                  {/* Date Block */}
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/5 flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-[9px] sm:text-[10px] font-mono text-white/40">
                      {new Date(event.startsAt)
                        .toLocaleDateString("en-US", { month: "short" })
                        .toUpperCase()}
                    </span>
                    <span className="text-base sm:text-lg font-mono font-bold">
                      {new Date(event.startsAt).getDate()}
                    </span>
                  </div>

                  {/* Event Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-mono font-medium truncate text-sm sm:text-base">
                      {event.title}
                    </p>
                    <p className="text-xs text-white/40 font-mono truncate">
                      {event.venueName}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <span
                      className={`text-[10px] sm:text-xs font-mono px-1.5 sm:px-2 py-0.5 sm:py-1 ${
                        isPast
                          ? "bg-white/5 text-white/30"
                          : event.isPublished
                            ? "bg-[#ff1493]/10 text-[#ff1493]"
                            : "bg-yellow-500/10 text-yellow-500"
                      }`}
                    >
                      {isPast ? "PAST" : event.isPublished ? "LIVE" : "DRAFT"}
                    </span>
                    <span className="text-xs sm:text-sm font-mono text-white/60 hidden sm:block w-16 text-right">
                      {soldCount}/{totalCount}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickAction
          href="/d/events/new"
          label="NEW EVENT"
          icon={<Plus className="w-5 h-5" />}
        />
        <QuickAction
          href="/d/events"
          label="ALL EVENTS"
          icon={<Calendar className="w-5 h-5" />}
        />
        <QuickAction
          href="/d/staff"
          label="MANAGE CREW"
          icon={<Ticket className="w-5 h-5" />}
        />
        <QuickAction
          href="/d/settings"
          label="SETTINGS"
          icon={<TrendingUp className="w-5 h-5" />}
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  highlight = false,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={`border p-4 ${highlight ? "border-[#ff1493]/50 bg-[#ff1493]/5" : "border-white/10 bg-white/[0.02]"}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className={`${highlight ? "text-[#ff1493]" : "text-white/30"}`}>
          {icon}
        </span>
        <span className="text-[10px] font-mono text-white/30 tracking-widest">
          {label}
        </span>
      </div>
      <p
        className={`text-2xl font-mono font-bold ${highlight ? "text-[#ff1493]" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

function QuickAction({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="border border-white/10 p-4 flex flex-col items-center gap-2 hover:border-[#ff1493]/50 hover:bg-white/[0.02] transition-all group"
    >
      <span className="text-white/30 group-hover:text-[#ff1493] transition-colors">
        {icon}
      </span>
      <span className="text-[10px] font-mono tracking-widest text-white/50 group-hover:text-white transition-colors">
        {label}
      </span>
    </Link>
  );
}
