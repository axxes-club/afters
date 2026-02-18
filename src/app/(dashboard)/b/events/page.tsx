import { auth, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import type { Event, TicketTier, TicketStatus, RsvpStatus } from "@prisma/client"

type EventWithTiers = Event & { ticketTiers: TicketTier[] }

import Link from "next/link"
import Image from "next/image"
import {
  Plus,
  Calendar,
  MapPin,
  Ticket as TicketIcon,
  UserCheck,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react"
import { formatCents } from "@/lib/stripe"

export default async function EventsPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const user = await currentUser()
  const userEmail = user?.emailAddresses?.[0]?.emailAddress

  // Get organizer profile and their events
  const profile = await prisma.organizerProfile.findUnique({
    where: { userId },
    include: {
      events: {
        include: {
          ticketTiers: true,
        },
        orderBy: { startsAt: "desc" },
      },
    },
  })

  // Get user's tickets (events they're attending)
  const myTickets = await prisma.ticket.findMany({
    where: { 
      userId,
      status: { not: "REFUNDED" as TicketStatus },
    },
    include: {
      event: true,
      ticketTier: true,
    },
    orderBy: { event: { startsAt: "desc" } },
  })

  // Get user's RSVPs (by email)
  const myRsvps = userEmail ? await prisma.rsvp.findMany({
    where: { 
      email: userEmail,
      status: { not: "CANCELLED" as RsvpStatus },
    },
    include: {
      event: true,
    },
    orderBy: { event: { startsAt: "desc" } },
  }) : []

  // Filter out events user organizes from attending list (avoid duplicates)
  const organizerEventIds = new Set(profile?.events.map(e => e.id) || [])
  const attendingTickets = myTickets.filter(t => !organizerEventIds.has(t.eventId))
  const attendingRsvps = myRsvps.filter(r => !organizerEventIds.has(r.eventId))

  const now = new Date()
  const upcoming = profile?.events.filter(e => new Date(e.startsAt) > now) || []
  const past = profile?.events.filter(e => new Date(e.startsAt) <= now) || []

  const upcomingAttending = [
    ...attendingTickets.filter(t => new Date(t.event.startsAt) > now),
    ...attendingRsvps.filter(r => new Date(r.event.startsAt) > now),
  ]
  const pastAttending = [
    ...attendingTickets.filter(t => new Date(t.event.startsAt) <= now),
    ...attendingRsvps.filter(r => new Date(r.event.startsAt) <= now),
  ]

  const hasOrganizerEvents = profile && profile.events.length > 0
  const hasAttendingEvents = attendingTickets.length > 0 || attendingRsvps.length > 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-mono font-bold tracking-tight">EVENTS</h1>
          <p className="text-white/40 text-sm font-mono mt-1">
            {upcoming.length} upcoming • {past.length} past
            {hasAttendingEvents && ` • ${attendingTickets.length + attendingRsvps.length} attending`}
          </p>
        </div>
        {profile && (
          <Link 
            href="/b/events/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-[#ff1493] text-black text-xs font-mono font-bold tracking-wider hover:bg-[#ff1493]/90 transition-all"
          >
            <Plus className="w-4 h-4" />
            NEW EVENT
          </Link>
        )}
      </div>

      {/* My Tickets & RSVPs Section */}
      {hasAttendingEvents && (
        <section className="border border-cyan-500/20 bg-cyan-500/5 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TicketIcon className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-mono text-cyan-400 tracking-widest">MY TICKETS & RSVPs</h2>
          </div>

          {/* Upcoming Attending */}
          {upcomingAttending.length > 0 && (
            <div className="space-y-3 mb-6">
              <p className="text-[10px] font-mono text-white/40 tracking-wider">UPCOMING</p>
              <div className="space-y-2">
                {attendingTickets
                  .filter(t => new Date(t.event.startsAt) > now)
                  .map((ticket) => (
                    <AttendingEventRow 
                      key={ticket.id} 
                      event={ticket.event} 
                      type="ticket"
                      details={{
                        tierName: ticket.ticketTier.name,
                        status: ticket.status,
                        checkedIn: !!ticket.checkedInAt,
                      }}
                    />
                  ))}
                {attendingRsvps
                  .filter(r => new Date(r.event.startsAt) > now)
                  .map((rsvp) => (
                    <AttendingEventRow 
                      key={rsvp.id} 
                      event={rsvp.event} 
                      type="rsvp"
                      details={{
                        status: rsvp.status,
                        plusOnes: rsvp.plusOnes,
                        checkedIn: !!rsvp.checkedInAt,
                      }}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* Past Attending */}
          {pastAttending.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-mono text-white/40 tracking-wider">PAST</p>
              <div className="space-y-2 opacity-60">
                {attendingTickets
                  .filter(t => new Date(t.event.startsAt) <= now)
                  .map((ticket) => (
                    <AttendingEventRow 
                      key={ticket.id} 
                      event={ticket.event} 
                      type="ticket"
                      details={{
                        tierName: ticket.ticketTier.name,
                        status: ticket.status,
                        checkedIn: !!ticket.checkedInAt,
                      }}
                    />
                  ))}
                {attendingRsvps
                  .filter(r => new Date(r.event.startsAt) <= now)
                  .map((rsvp) => (
                    <AttendingEventRow 
                      key={rsvp.id} 
                      event={rsvp.event} 
                      type="rsvp"
                      details={{
                        status: rsvp.status,
                        plusOnes: rsvp.plusOnes,
                        checkedIn: !!rsvp.checkedInAt,
                      }}
                    />
                  ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Organizer Events Section */}
      {profile && (
        <>
          {/* Upcoming Events */}
          {upcoming.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-1.5 bg-[#ff1493] rounded-full animate-pulse" />
                <h2 className="text-xs font-mono text-white/40 tracking-widest">MY EVENTS • UPCOMING</h2>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {upcoming.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}

          {/* Past Events */}
          {past.length > 0 && (
            <section>
              <h2 className="text-xs font-mono text-white/40 tracking-widest mb-4">MY EVENTS • PAST</h2>
              
              <div className="border border-white/10 divide-y divide-white/5">
                {past.map((event) => (
                  <PastEventRow key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Empty State */}
      {!hasOrganizerEvents && !hasAttendingEvents && (
        <div className="border border-white/10 p-12 text-center">
          <Calendar className="w-12 h-12 mx-auto text-white/10 mb-4" />
          <h2 className="text-lg font-mono font-bold mb-2">No Events Yet</h2>
          <p className="text-white/40 text-sm font-mono mb-6">
            {profile 
              ? "Create your first event to start selling tickets"
              : "Complete onboarding to create events, or browse events to get tickets"
            }
          </p>
          {profile && (
            <Link 
              href="/b/events/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#ff1493] text-black text-xs font-mono font-bold tracking-wider hover:bg-[#ff1493]/90 transition-all"
            >
              <Plus className="w-4 h-4" />
              CREATE FIRST EVENT
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

function AttendingEventRow({ 
  event, 
  type, 
  details 
}: { 
  event: Event
  type: "ticket" | "rsvp"
  details: {
    tierName?: string
    status: string
    plusOnes?: number
    checkedIn: boolean
  }
}) {
  const statusConfig = {
    // Ticket statuses
    VALID: { icon: CheckCircle2, color: "text-emerald-400", label: "Valid" },
    USED: { icon: CheckCircle2, color: "text-white/40", label: "Used" },
    CANCELLED: { icon: XCircle, color: "text-red-400", label: "Cancelled" },
    REFUNDED: { icon: XCircle, color: "text-red-400", label: "Refunded" },
    // RSVP statuses
    CONFIRMED: { icon: CheckCircle2, color: "text-emerald-400", label: "Confirmed" },
    PENDING: { icon: Clock, color: "text-yellow-400", label: "Pending" },
    DECLINED: { icon: XCircle, color: "text-red-400", label: "Declined" },
  }

  const status = statusConfig[details.status as keyof typeof statusConfig] || statusConfig.VALID
  const StatusIcon = status.icon

  return (
    <Link 
      href={`/e/${event.slug}`}
      className="flex items-center gap-4 p-3 bg-white/[0.02] border border-white/5 hover:border-cyan-500/30 transition-all"
    >
      {/* Date */}
      <div className="w-12 h-12 bg-white/5 flex flex-col items-center justify-center flex-shrink-0">
        <span className="text-[10px] font-mono text-white/40">
          {new Date(event.startsAt).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
        </span>
        <span className="text-lg font-mono font-bold">
          {new Date(event.startsAt).getDate()}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-mono font-medium truncate">{event.title}</p>
        <p className="text-xs text-white/40 font-mono flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {event.venueName}
        </p>
      </div>

      {/* Type Badge & Status */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Type Badge */}
        <div className={`flex items-center gap-1.5 px-2 py-1 text-[10px] font-mono tracking-wider ${
          type === "ticket" 
            ? "bg-[#ff1493]/10 text-[#ff1493] border border-[#ff1493]/20" 
            : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
        }`}>
          {type === "ticket" ? (
            <>
              <TicketIcon className="w-3 h-3" />
              {details.tierName || "TICKET"}
            </>
          ) : (
            <>
              <UserCheck className="w-3 h-3" />
              RSVP{details.plusOnes ? ` +${details.plusOnes}` : ""}
            </>
          )}
        </div>

        {/* Status */}
        <div className={`flex items-center gap-1 ${status.color}`}>
          <StatusIcon className="w-4 h-4" />
          {details.checkedIn && (
            <span className="text-[10px] font-mono">CHECKED IN</span>
          )}
        </div>
      </div>
    </Link>
  )
}

function EventCard({ event }: { event: EventWithTiers }) {
  const soldCount = event.ticketTiers.reduce((s: number, t: TicketTier) => s + t.quantitySold, 0)
  const totalCount = event.ticketTiers.reduce((s: number, t: TicketTier) => s + t.quantity, 0)
  const revenue = event.ticketTiers.reduce((s: number, t: TicketTier) => s + (t.quantitySold * t.price), 0)
  const percentSold = totalCount > 0 ? (soldCount / totalCount) * 100 : 0

  return (
    <Link 
      href={`/d/events/${event.id}`}
      className="group border border-white/10 bg-white/[0.02] hover:border-[#ff1493]/30 transition-all overflow-hidden"
    >
      {/* Flyer */}
      <div className="aspect-[16/9] relative bg-white/5">
        {event.flyerUrl ? (
          <Image 
            src={event.flyerUrl} 
            alt={event.title}
            fill
            className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Calendar className="w-8 h-8 text-white/10" />
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <span className={`text-[10px] font-mono px-2 py-1 ${
            event.isPublished 
              ? 'bg-[#ff1493] text-black' 
              : 'bg-yellow-500 text-black'
          }`}>
            {event.isPublished ? 'LIVE' : 'DRAFT'}
          </span>
        </div>

        {/* Date Overlay */}
        <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-sm px-2 py-1">
          <span className="text-[10px] font-mono text-white/80">
            {new Date(event.startsAt).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            }).toUpperCase()}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-mono font-bold truncate group-hover:text-[#ff1493] transition-colors">
          {event.title}
        </h3>
        <p className="text-xs text-white/40 font-mono mt-1 flex items-center gap-1.5">
          <MapPin className="w-3 h-3" />
          {event.venueName}
        </p>

        {/* Progress */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-white/40">{soldCount}/{totalCount} sold</span>
            <span className="text-[#ff1493]">{formatCents(revenue)}</span>
          </div>
          <div className="h-1 bg-white/5">
            <div 
              className="h-full bg-[#ff1493] transition-all" 
              style={{ width: `${Math.min(100, percentSold)}%` }} 
            />
          </div>
        </div>
      </div>
    </Link>
  )
}

function PastEventRow({ event }: { event: EventWithTiers }) {
  const soldCount = event.ticketTiers.reduce((s: number, t: TicketTier) => s + t.quantitySold, 0)
  const revenue = event.ticketTiers.reduce((s: number, t: TicketTier) => s + (t.quantitySold * t.price), 0)

  return (
    <Link 
      href={`/d/events/${event.id}`}
      className="flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-all opacity-60 hover:opacity-100"
    >
      {/* Date */}
      <div className="w-12 h-12 bg-white/5 flex flex-col items-center justify-center flex-shrink-0">
        <span className="text-[10px] font-mono text-white/40">
          {new Date(event.startsAt).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
        </span>
        <span className="text-lg font-mono font-bold">
          {new Date(event.startsAt).getDate()}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-mono font-medium truncate">{event.title}</p>
        <p className="text-xs text-white/40 font-mono">{event.venueName}</p>
      </div>

      {/* Stats */}
      <div className="text-right">
        <p className="font-mono font-bold">{formatCents(revenue)}</p>
        <p className="text-xs text-white/40 font-mono">{soldCount} sold</p>
      </div>
    </Link>
  )
}
