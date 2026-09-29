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
/** Posts by the whole room in one hour, past which the feed stops accepting.
 *  Separate from the per-event ceiling on purpose: a busy night should slow
 *  down, not end the feed. */
export const VIBEZ_MAX_POSTS_PER_EVENT_PER_HOUR = 120

/**
 * Who is asking, as far as the feed is concerned.
 *
 * `subject` is the identity that authorship, self-removal and bans are keyed on.
 * It is a Clerk id for an account, or `tkt_<id>` for a guest who redeemed a
 * ticket. `email` is only ever an input to the attendee lookup — it is never
 * stored on a post and never used as an identity, because two people can share
 * an address and an email is not a secret.
 */
export type VibezViewer = {
  subject: string | null
  userId: string | null
  email: string | null
}

export async function vibezAccess(
  eventId: string,
  userId: string | null,
  userEmail: string | null,
  /** Set when the person is a guest holding a redeemed ticket. */
  guestSubjectId: string | null = null
): Promise<VibezAccess> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { organizerId: true },
  })
  if (!event) return "none"

  // Staff for this event's organizer
  if (userId) {
    const staff = await prisma.staffMember.findFirst({
      where: { userId, organizerProfileId: event.organizerId, status: "ACTIVE" },
      select: { id: true },
    })
    if (staff) return "staff"
  }

  const subject = userId ?? guestSubjectId

  // A guest's ticket is redeemed to prove attendance, but the row is still the
  // truth: if it was cancelled or refunded since, the proof is void. Checked on
  // every request rather than trusted from the cookie, so revoking a ticket takes
  // effect immediately rather than at the end of the token's life.
  //
  // Two subject shapes, because there are two ways into the room without an
  // account: a bought ticket (`tkt_`) and a guestlist/comp line (`gl_`).
  if (guestSubjectId?.startsWith("tkt_")) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: guestSubjectId.slice(4) },
      select: { id: true, eventId: true, status: true },
    })
    if (
      ticket &&
      ticket.eventId === eventId &&
      ["VALID", "CHECKED_IN"].includes(ticket.status)
    ) {
      return await bannedOr(eventId, subject)
    }
  } else if (guestSubjectId?.startsWith("gl_")) {
    // A guestlist entry has no Ticket row. The entry is the proof, and it is
    // scoped to one event by construction.
    const entry = await prisma.guestlistEntry.findFirst({
      where: { id: guestSubjectId.slice(3), eventId },
      select: { id: true },
    })
    if (entry) return await bannedOr(eventId, subject)
  }

  if (userId) {
    const ticketByUser = await prisma.ticket.findFirst({
      where: { eventId, userId, status: { in: ["VALID", "CHECKED_IN"] } },
      select: { id: true },
    })
    if (ticketByUser) return await bannedOr(eventId, subject)
  }

  if (userEmail) {
    const ticketByEmail = await prisma.ticket.findFirst({
      where: {
        eventId,
        status: { in: ["VALID", "CHECKED_IN"] },
        order: { email: { equals: userEmail, mode: "insensitive" } },
      },
      select: { id: true },
    })
    if (ticketByEmail) return await bannedOr(eventId, subject)

    const rsvp = await prisma.rsvp.findFirst({
      where: {
        eventId,
        email: { equals: userEmail, mode: "insensitive" },
        status: { in: ["CONFIRMED", "CHECKED_IN"] },
      },
      select: { id: true },
    })
    if (rsvp) return await bannedOr(eventId, subject)

    const guestlist = await prisma.guestlistEntry.findFirst({
      where: { eventId, email: { equals: userEmail, mode: "insensitive" } },
      select: { id: true },
    })
    if (guestlist) return await bannedOr(eventId, subject)
  }

  return "none"
}

async function bannedOr(
  eventId: string,
  subject: string | null
): Promise<VibezAccess> {
  // A ban is scoped to one event and keyed on the subject, so it catches a guest
  // as readily as an account holder.
  if (!subject) return "attendee"
  const ban = await prisma.vibezBan.findFirst({
    where: { eventId, OR: [{ subject }, { userId: subject }] },
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
  userId: string,
  subject?: string | null
): Promise<{ allowed: boolean; reason?: string }> {
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000)
  // Keyed on the subject, not the account id, so a guest is rate-limited by
  // exactly the same ceilings as a signed-in attendee.
  const who = { OR: [{ authorSubject: subject ?? undefined }, { userId }] }

  const [mine, everyone] = await Promise.all([
    prisma.vibezPost.count({ where: { eventId, ...who, createdAt: { gte: hourAgo } } }),
    prisma.vibezPost.count({ where: { eventId, createdAt: { gte: hourAgo } } }),
  ])

  if (mine >= VIBEZ_POSTS_PER_HOUR) {
    return { allowed: false, reason: "You've posted a lot already — try again later." }
  }

  // A busy night throttles the room, it does not close the feed. This compares
  // hour-against-hour. The previous code compared the room's hourly count with
  // the event's lifetime ceiling, which meant a popular event hit the wall at
  // 500 posts *in an hour* and then refused everyone for the rest of the night
  // while the lifetime count sat at 500 and never cleared.
  if (everyone >= VIBEZ_MAX_POSTS_PER_EVENT_PER_HOUR) {
    return { allowed: false, reason: "This feed is busy right now. Try again shortly." }
  }

  const total = await prisma.vibezPost.count({ where: { eventId, removedAt: null } })
  if (total >= VIBEZ_MAX_POSTS_PER_EVENT) {
    return { allowed: false, reason: "This feed is full. Ask an organizer about it." }
  }

  return { allowed: true }
}

/** The same ceilings, answered before anyone spends bandwidth on an upload. */
export async function uploadBudget(
  eventId: string,
  userId: string,
  subject?: string | null
): Promise<{ allowed: boolean; reason?: string }> {
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const mine = await prisma.vibezPost.count({
    where: {
      eventId,
      OR: [{ authorSubject: subject ?? undefined }, { userId }],
      createdAt: { gte: hourAgo },
    },
  })
  if (mine >= VIBEZ_POSTS_PER_HOUR) {
    return { allowed: false, reason: "You've posted a lot already — try again later." }
  }
  return { allowed: true }
}
