import { prisma } from "@/lib/prisma"

/**
 * Who the feed answers to, and who may moderate it.
 *
 * The feed is guest photos, so "may I" has to be decided in one place and used
 * by every caller: the API, the upload middleware and the tests. Access is:
 *
 *   - the event's organizer, or their active staff
 *   - anyone holding a valid/checked-in ticket, a confirmed RSVP, or a
 *     guestlist entry, matched by account *or* by order email (guest checkout
 *     attendees never had to make an account)
 *
 * A ban is scoped to one event. It never follows someone to the next one.
 */

export type VibezAccess = "none" | "attendee" | "staff" | "banned"

/** Attendee capacity: how often one person may post, and how many posts the
 *  event may hold before new ones are refused. Both are the ceiling that keeps
 *  an event from being flooded. */
export const VIBEZ_POSTS_PER_HOUR = 10
export const VIBEZ_MAX_POSTS_PER_EVENT = 500

export async function vibezAccess(
  eventId: string,
  userId: string,
  userEmail: string | null
): Promise<VibezAccess> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { organizerId: true },
  })
  if (!event) return "none"

  // Staff for this event's organizer
  const staff = await prisma.staffMember.findFirst({
    where: { userId, organizerProfileId: event.organizerId, status: "ACTIVE" },
    select: { id: true },
  })
  if (staff) return "staff"

  const ticketByUser = await prisma.ticket.findFirst({
    where: { eventId, userId, status: { in: ["VALID", "CHECKED_IN"] } },
    select: { id: true },
  })
  if (ticketByUser) return await bannedOr(eventId, userId)

  if (userEmail) {
    const ticketByEmail = await prisma.ticket.findFirst({
      where: {
        eventId,
        status: { in: ["VALID", "CHECKED_IN"] },
        order: { email: { equals: userEmail, mode: "insensitive" } },
      },
      select: { id: true },
    })
    if (ticketByEmail) return await bannedOr(eventId, userId)

    const rsvp = await prisma.rsvp.findFirst({
      where: {
        eventId,
        email: { equals: userEmail, mode: "insensitive" },
        status: { in: ["CONFIRMED", "CHECKED_IN"] },
      },
      select: { id: true },
    })
    if (rsvp) return await bannedOr(eventId, userId)

    const guestlist = await prisma.guestlistEntry.findFirst({
      where: { eventId, email: { equals: userEmail, mode: "insensitive" } },
      select: { id: true },
    })
    if (guestlist) return await bannedOr(eventId, userId)
  }

  return "none"
}

async function bannedOr(eventId: string, userId: string): Promise<VibezAccess> {
  const ban = await prisma.vibezBan.findUnique({
    where: { eventId_userId: { eventId, userId } },
    select: { id: true },
  })
  return ban ? "banned" : "attendee"
}

/** May this person remove posts, ban people, and read the triage queue? */
export function canModerate(access: VibezAccess): boolean {
  return access === "staff"
}

export function canPost(access: VibezAccess): boolean {
  return access === "attendee" || access === "staff"
}

/**
 * Upload ceilings. Both are counted in the database rather than in process
 * memory, so they hold across every serverless instance — an in-memory counter
 * would be reset by each cold start and reset again by each scale-out.
 */
export async function postBudget(
  eventId: string,
  userId: string
): Promise<{ allowed: boolean; reason?: string }> {
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000)

  const [mine, everyone] = await Promise.all([
    prisma.vibezPost.count({ where: { eventId, userId, createdAt: { gte: hourAgo } } }),
    prisma.vibezPost.count({ where: { eventId, createdAt: { gte: hourAgo } } }),
  ])

  if (mine >= VIBEZ_POSTS_PER_HOUR) {
    return { allowed: false, reason: "You've posted a lot already — try again later." }
  }

  const total = await prisma.vibezPost.count({ where: { eventId, removedAt: null } })
  if (total >= VIBEZ_MAX_POSTS_PER_EVENT) {
    return { allowed: false, reason: "This feed is full. Ask an organizer about it." }
  }

  // A single person taking the whole event's hour is still one person.
  if (everyone >= VIBEZ_MAX_POSTS_PER_EVENT) {
    return { allowed: false, reason: "This feed is busy right now. Try again shortly." }
  }

  return { allowed: true }
}

/** The same ceilings, answered before anyone spends bandwidth on an upload. */
export async function uploadBudget(
  eventId: string,
  userId: string
): Promise<{ allowed: boolean; reason?: string }> {
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const mine = await prisma.vibezPost.count({
    where: { eventId, userId, createdAt: { gte: hourAgo } },
  })
  if (mine >= VIBEZ_POSTS_PER_HOUR) {
    return { allowed: false, reason: "You've posted a lot already — try again later." }
  }
  return { allowed: true }
}
