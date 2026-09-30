import { prisma } from "@/lib/prisma"
import type { VibezAccessMode } from "@/lib/vibez-settings"

/**
 * Great-circle distance in metres.
 *
 * Ported from vibez.axxes.club/src/lib/vibez/geo.ts. Both apps geofence the
 * same way, and two implementations of the haversine formula is how one product
 * ends up letting people in at 250m and the other at 350m for the same venue.
 */
export function distanceM(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6_371_000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/**
 * How wrong a reported position might be.
 *
 * This is not paranoia about a malicious guest — a determined one would just
 * spoof the value and there is nothing a browser API can do about that. It is
 * about phones: urban GPS routinely errs by 30–50m, worse indoors and worse
 * again in a basement, which is exactly where these events happen.
 *
 * So the check is "are they within the radius, plus a tolerance for the fact
 * that we may be reading their position badly" rather than a strict radius that
 * rejects people who are demonstrably in the room.
 *
 * The tolerance does not vary with latitude in any way that matters at this
 * scale — a few tens of metres either side — so it is a constant rather than a
 * parameter pretending to be a function of something.
 */
export function geofenceToleranceM(): number {
  return 55
}

/**
 * Is this position inside the fence?
 *
 * Returns a reason on failure so the guest gets an explanation they can act on
 * ("you're too far away") rather than a bare refusal they will read as the app
 * being broken.
 */
export function withinGeofence(
  here: { lat: number; lng: number },
  venue: { lat: number; lng: number; radiusM: number }
): { ok: true } | { ok: false; reason: string; distanceM: number } {
  const d = distanceM(here, venue)
  const tolerance = geofenceToleranceM()
  if (d <= venue.radiusM + tolerance) return { ok: true }
  return {
    ok: false,
    distanceM: Math.round(d),
    reason:
      d > venue.radiusM + tolerance * 4
        ? "That doesn't look like the venue — turn your location on and try again."
        : "You're a little too far from the venue. Move closer and try again.",
  }
}

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

export type VibezAccess = "none" | "public" | "attendee" | "staff" | "banned"

/**
 * Can see the feed but has no identity yet.
 *
 * This is the "scanned a QR sticker but has not entered a name" state. It can
 * read, because the sticker was the credential, but it cannot post: authorship,
 * self-removal and bans are all keyed on a subject, and an anonymous attendee
 * can be neither moderated nor protected by removing their own photo.
 */
export function canView(access: VibezAccess): boolean {
  return access !== "none" && access !== "banned"
}


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
  guestSubjectId: string | null = null,
  /**
   * QR spot ids this browser has unlocked, from the signed spot cookie.
   *
   * Passed in rather than read from the cookie here, because this function is
   * called from the UploadThing middleware as well as from route handlers, and
   * both must reach the same answer. `resolveViewer` is the one place that
   * reads cookies.
   */
  spotIds: string[] = [],
  /**
   * The event's access mode, read by the caller. Passed in for the same reason
   * as spotIds: one decision, one caller-provided set of facts.
   */
  accessMode: VibezAccessMode = "ticket"
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

  // A ban is scoped to one event and keyed on the subject, so it catches a guest
  // as readily as an account holder.
  if (await isBanned(eventId, subject)) return "banned"

  // 'link' is the open door: anyone who has the URL. Checked before the ticket
  // lookups because it makes them irrelevant, and because a ban still has to
  // apply — an event that opens its feed to the world can still bar someone from
  // it, and the moderator UI would be lying otherwise.
  if (accessMode === "link") {
    return subject ? "attendee" : "public"
  }

  // A scanned sticker. The ids come from a signed cookie but are re-checked here
  // against this event's spots, so a cookie that survived the deletion of a
  // sticker — or one naming another event's spot — proves nothing.
  //
  // Under 'ticket' a scan is not enough on its own (anyone can photograph a
  // sticker); under 'ticket_or_qr' it is exactly as good as a ticket.
  if (spotIds.length > 0 && accessMode !== "ticket") {
    const spot = await prisma.vibezSpot.findFirst({
      where: { eventId, id: { in: spotIds } },
      select: { id: true },
    })
    if (spot) {
      // Still needs a subject: authorship, self-removal and bans are all keyed
      // on one, and an anonymous attendee can neither be banned nor take their
      // own photo down.
      return subject ? "attendee" : "public"
    }
  }

  // In 'qr' mode a ticket is deliberately not enough, for anybody. An organizer
  // who walls the feed to the physical room is saying "not just anyone who
  // bought a ticket in March" — they want the person who is standing here now,
  // and a forwarded link cannot be that. This gate sits *above* every ticket
  // branch, including the guest-token ones below, so the setting means the same
  // thing whether or not the person happens to have an account.
  if (accessMode === "qr") return "none"

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

async function isBanned(eventId: string, subject: string | null): Promise<boolean> {
  // A ban is scoped to one event and keyed on the subject, so it catches a guest
  // as readily as an account holder. The `userId` arm is for rows written before
  // VibezBan.subject existed.
  if (!subject) return false
  const ban = await prisma.vibezBan.findFirst({
    where: { eventId, OR: [{ subject }, { userId: subject }] },
    select: { id: true },
  })
  return !!ban
}

async function bannedOr(
  eventId: string,
  subject: string | null
): Promise<VibezAccess> {
  return (await isBanned(eventId, subject)) ? "banned" : "attendee"
}

/** May this person remove posts, ban people, and read the triage queue? */
export function canModerate(access: VibezAccess): boolean {
  return access === "staff"
}

export function canPost(access: VibezAccess): boolean {
  // 'public' is deliberately excluded: someone who has only scanned a sticker
  // has no subject, so there would be nothing to record as the author, nothing
  // to ban, and nothing to let them delete later. The camera prompts for a name
  // and issues a guest token before a post is ever created.
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
  subject?: string | null,
  /** Per-event limits. Read by the caller so the three counts below can go out
   *  in one round trip with everything else the request needs. */
  limits?: { perGuestPerHour?: number; perHour?: number; total?: number }
): Promise<{ allowed: boolean; reason?: string }> {
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000)
  // Keyed on the subject, not the account id, so a guest is rate-limited by
  // exactly the same ceilings as a signed-in attendee.
  const who = { OR: [{ authorSubject: subject ?? undefined }, { userId }] }

  const perGuest = limits?.perGuestPerHour ?? VIBEZ_POSTS_PER_HOUR
  const perRoom = limits?.perHour ?? VIBEZ_MAX_POSTS_PER_EVENT_PER_HOUR
  const totalCap = limits?.total ?? VIBEZ_MAX_POSTS_PER_EVENT

  const [mine, everyone] = await Promise.all([
    prisma.vibezPost.count({ where: { eventId, ...who, createdAt: { gte: hourAgo } } }),
    prisma.vibezPost.count({ where: { eventId, createdAt: { gte: hourAgo } } }),
  ])

  if (mine >= perGuest) {
    return { allowed: false, reason: "You've posted a lot already — try again later." }
  }

  // A busy night throttles the room, it does not close the feed. This compares
  // hour-against-hour. The previous code compared the room's hourly count with
  // the event's lifetime ceiling, which meant a popular event hit the wall at
  // 500 posts *in an hour* and then refused everyone for the rest of the night
  // while the lifetime count sat at 500 and never cleared.
  if (everyone >= perRoom) {
    return { allowed: false, reason: "This feed is busy right now. Try again shortly." }
  }

  const total = await prisma.vibezPost.count({ where: { eventId, removedAt: null } })
  if (total >= totalCap) {
    return { allowed: false, reason: "This feed is full. Ask an organizer about it." }
  }

  return { allowed: true }
}

/** The same ceilings, answered before anyone spends bandwidth on an upload. */
export async function uploadBudget(
  eventId: string,
  userId: string,
  subject?: string | null,
  limits?: { perGuestPerHour?: number }
): Promise<{ allowed: boolean; reason?: string }> {
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const mine = await prisma.vibezPost.count({
    where: {
      eventId,
      OR: [{ authorSubject: subject ?? undefined }, { userId }],
      createdAt: { gte: hourAgo },
    },
  })
  if (mine >= (limits?.perGuestPerHour ?? VIBEZ_POSTS_PER_HOUR)) {
    return { allowed: false, reason: "You've posted a lot already — try again later." }
  }
  return { allowed: true }
}
