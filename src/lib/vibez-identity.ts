import { prisma } from "@/lib/prisma"
import { readGuestToken } from "@/lib/vibez-guest"
import {
  canModerate,
  canPost,
  postBudget,
  uploadBudget,
  vibezAccess,
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
}

export async function resolveViewer(eventId: string): Promise<VibezIdentity> {
  const { auth, currentUser } = await import("@clerk/nextjs/server")
  const { userId } = await auth()

  if (userId) {
    const user = await currentUser()
    return {
      subject: userId,
      userId,
      email: user?.emailAddresses?.[0]?.emailAddress ?? null,
      isGuest: false,
    }
  }

  const guest = await readGuestToken(eventId)
  if (guest) {
    return { subject: guest.subject, userId: null, email: null, isGuest: true }
  }

  return { subject: null, userId: null, email: null, isGuest: false }
}

/** Resolve the viewer and their access in one call — the common case. */
export async function resolveAccess(
  eventId: string
): Promise<{ viewer: VibezIdentity; access: VibezAccess }> {
  const viewer = await resolveViewer(eventId)
  const access = await vibezAccess(eventId, viewer.userId, viewer.email, viewer.isGuest ? viewer.subject : null)
  return { viewer, access }
}

/** Is this event's feed switched on, and has it started? */
export async function feedState(
  eventId: string
): Promise<{ ok: true } | { ok: false; status: number; message: string }> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, vibezEnabled: true, startsAt: true },
  })
  if (!event) return { ok: false, status: 404, message: "Event not found" }
  if (!event.vibezEnabled) {
    return { ok: false, status: 403, message: "VIBEZ is not enabled for this event" }
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
export { canModerate, canPost, postBudget, uploadBudget }

