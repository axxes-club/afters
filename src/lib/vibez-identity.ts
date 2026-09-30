import { prisma } from "@/lib/prisma"
import { readGuestToken } from "@/lib/vibez-guest"
import {
  getVibezSettings,
  type VibezAccessMode,
  type VibezSettingsShape,
} from "@/lib/vibez-settings"
import {
  canModerate,
  canPost,
  canView,
  postBudget,
  uploadBudget,
  vibezAccess,
  withinGeofence,
  type VibezAccess,
} from "@/lib/vibez"

/**
 * The one place that answers "who is asking, and may they do that".
 *
 * Every VIBEZ route used to open with `const { userId } = await auth()` and then
 * branch on whether that was null. That is how the feed ended up serving the
 * people least likely to be in the room: a guest who bought a ticket without an
 * account was simply "signed out", and the feed said no. Resolving the viewer once,
 * here, is what makes a guest a first-class attendee rather than an accident.
 *
 * A viewer is a Clerk session, or a redeemed guest ticket, or neither.
 */
export type VibezIdentity = {
  /** Stable identity for authorship, self-removal and bans. Null when anonymous. */
  subject: string | null
  userId: string | null
  email: string | null
  /** True when this person proved attendance with a ticket but has no account. */
  isGuest: boolean
  /**
   * True when this person is in the room because they scanned a printed code.
   *
   * This is a weaker credential than a ticket — anyone can point a phone at a
   * sticker — which is why `accessMode` decides whether it counts. Under
   * `ticket_or_qr` (the default) it is exactly as good as a ticket; under
   * `ticket` it is not enough on its own.
   */
  hasSpot: boolean
  /** Which spot, when they scanned one. Recorded on posts for the scan stats. */
  spotId: string | null
  /** Every spot this browser has unlocked, not just the first. A guest who walks
   *  past two stickers in one night gets one cookie listing both. */
  spotIds: string[]
}

/**
 * Which spots this browser has unlocked, from the signed cookie.
 *
 * The cookie is signed (see vibez-ticket.ts) so a guest cannot add a spot id to
 * it. It is NOT trusted as proof on its own: `vibezAccess` re-checks every id
 * against the database, so a deleted sticker, or one belonging to a different
 * event, grants nothing.
 */
async function readSpotIds(eventId: string): Promise<string[]> {
  try {
    const { cookies } = await import("next/headers")
    const { verifySpotToken } = await import("@/lib/vibez-ticket")
    const { VIBEZ_SPOT_COOKIE } = await import("@/lib/vibez-spots")
    const store = await cookies()
    const raw = store.get(VIBEZ_SPOT_COOKIE)?.value
    const ticket = verifySpotToken(raw, eventId)
    return ticket?.spots ?? []
  } catch {
    return []
  }
}

export async function resolveViewer(eventId: string): Promise<VibezIdentity> {
  const { auth, currentUser } = await import("@clerk/nextjs/server")
  const { userId } = await auth()
  const spotIds = await readSpotIds(eventId)

  if (userId) {
    const user = await currentUser()
    return {
      subject: userId,
      userId,
      email: user?.emailAddresses?.[0]?.emailAddress ?? null,
      isGuest: false,
      hasSpot: spotIds.length > 0,
      spotId: spotIds[0] ?? null,
      spotIds,
    }
  }

  const guest = await readGuestToken(eventId)
  if (guest) {
    return {
      subject: guest.subject,
      userId: null,
      email: null,
      isGuest: true,
      hasSpot: spotIds.length > 0,
      spotId: spotIds[0] ?? null,
      spotIds,
    }
  }

  // Anonymous, but possibly holding a scanned spot. This is the state a guest is
  // in the moment they scan the sticker and before they enter a name: they can
  // look, and `canPost` is false until the camera has minted a guest token for
  // them.
  return {
    subject: null,
    userId: null,
    email: null,
    isGuest: false,
    hasSpot: spotIds.length > 0,
    spotId: spotIds[0] ?? null,
    spotIds,
  }
}

/** Resolve the viewer, their settings and their access in one call.
 *
 *  This is the common entry point and it deliberately reads the settings here,
 *  once, rather than leaving each route to fetch them. `vibezAccess` is a pure
 *  decision over facts it is handed; a route that forgot to pass the access mode
 *  would silently fall back to "ticket only" and lock out every guest who came
 *  in by scanning a code. Gathering the facts in one place is what stops that
 *  class of bug.
 */
export async function resolveAccess(
  eventId: string
): Promise<{ viewer: VibezIdentity; access: VibezAccess; settings: VibezSettingsShape }> {
  const [viewer, settings] = await Promise.all([
    resolveViewer(eventId),
    getVibezSettings(eventId),
  ])
  const access = await vibezAccess(
    eventId,
    viewer.userId,
    viewer.email,
    viewer.isGuest ? viewer.subject : null,
    viewer.spotIds,
    settings.accessMode as VibezAccessMode
  )
  return { viewer, access, settings }
}

/** The limit numbers, in the shape postBudget/uploadBudget take. */
export function budgetLimits(settings: VibezSettingsShape) {
  return {
    perGuestPerHour: settings.maxPerGuestPerHour,
    perHour: settings.maxPerHour,
    total: settings.maxPhotosTotal,
  }
}

/**
 * Check a guest's reported position against the event's venue, if the organizer
 * asked for one.
 *
 * Returns null when there is nothing to check (geofencing off, or no venue
 * coordinates on the event) so callers can treat "null" as "not this layer's
 * problem" and keep one code path for the three access modes.
 *
 * The venue coordinates come from Event.mapLat/mapLng, which the organizer sets
 * on the venue tab — the same pin that is on the ticket. That is deliberate:
 * asking an organizer to enter the venue twice, once for the map and once for
 * the feed, guarantees one of them is wrong.
 */
export async function checkGeofence(
  eventId: string,
  settings: VibezSettingsShape,
  position: { lat: number; lng: number } | null
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!settings.requireGeofence) return { ok: true }

  const venue = await prisma.event.findUnique({
    where: { id: eventId },
    select: { mapLat: true, mapLng: true },
  })
  if (venue?.mapLat == null || venue?.mapLng == null) {
    // The organizer turned the geofence on without a venue pin. Refusing every
    // guest would be worse than not enforcing it, and the settings screen warns
    // about this case; enforcing nothing is the safe failure.
    return { ok: true }
  }

  if (!position || !Number.isFinite(position.lat) || !Number.isFinite(position.lng)) {
    return {
      ok: false,
      message: "Share your location so we can check you're at the venue.",
    }
  }

  const result = withinGeofence(position, {
    lat: venue.mapLat,
    lng: venue.mapLng,
    radiusM: settings.geoRadiusM,
  })
  return result.ok ? { ok: true } : { ok: false, message: result.reason }
}

/** Is this event's feed switched on, and has it started?
 *
 *  `closedManually` is checked first so an organizer who deliberately closed the
 *  feed gets "the organizer closed this" rather than the far more confusing "the
 *  event hasn't started yet" — the two look identical to a guest otherwise, and
 *  they mean completely different things.
 */
export async function feedState(
  eventId: string
): Promise<{ ok: true } | { ok: false; status: number; message: string }> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      vibezEnabled: true,
      startsAt: true,
      vibezSettings: { select: { closedManually: true } },
    },
  })
  if (!event) return { ok: false, status: 404, message: "Event not found" }
  if (!event.vibezEnabled) {
    return { ok: false, status: 403, message: "VIBEZ is not enabled for this event" }
  }
  if (event.vibezSettings?.closedManually) {
    return { ok: false, status: 403, message: "The organizer has closed this feed" }
  }
  if (new Date(event.startsAt) > new Date()) {
    return { ok: false, status: 403, message: "The VIBEZ feed opens when the event starts" }
  }
  return { ok: true }
}


// Re-exported so a route can import one thing and get the whole vocabulary.
// `resolveViewer` is already exported above (the UploadThing middleware needs
// the identity without the access decision — it is the last gate before bytes
// land, and it must ask the same question every other surface asks).
export { canModerate, canPost, canView, postBudget, uploadBudget }

