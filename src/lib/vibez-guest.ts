import { createHmac, randomUUID, timingSafeEqual } from "node:crypto"

/**
 * Guest access to VIBEZ.
 *
 * Why this exists: most people at a night bought a ticket as a guest and never
 * made an account. The feed as it stood required a Clerk session, so it served
 * the people least likely to be in the room and locked out most of the people who
 * were. A guest proves attendance with the ticket they already hold, gets a
 * short-lived signed token, and is identified from then on by a *subject* that
 * is stable for that ticket but carries no personal data.
 *
 * The subject is `tkt_<ticketId>`: opaque, not an email, not a name, and not
 * guessable, because it ends up in `VibezPost.authorSubject` and in ban rows.
 * Deriving it from the ticket id rather than from an email means rotating
 * someone's email does not orphan their photos, and it means two people who
 * share a phone number are not treated as one person.
 *
 * The ticket itself stays the source of truth. This does not mint attendance: it
 * only carries a proof that attendance already happened, so revoking the ticket
 * (`CANCELLED`/`REFUNDED`) stops access on the next check.
 */

const TICKET_TTL_MS = 12 * 60 * 60 * 1000 // one night plus the walk home
const COOKIE = "vz_guest"

function secret(): string | null {
  // Deliberately NOT falling back to other secrets. The previous ticket helper
  // fell through to UPLOADTHING_TOKEN and then CLERK_SECRET_KEY and finally "",
  // so in a misconfigured deployment it signed tickets with an empty string —
  // which is a constant, and therefore a key anybody can compute. A missing
  // secret now means "no guest access", which is a safe failure.
  return process.env.VIBEZ_UPLOAD_SECRET || process.env.WALLET_LINK_SECRET || null
}

/** Stable, opaque identity for whoever holds this ticket. */
export function guestSubject(ticketId: string): string {
  return `tkt_${ticketId}`
}

/** Mint "<issuedAt>.<ticketId>.<nonce>.<hmac>". */
export function mintGuestToken(ticketId: string, eventId: string): string | null {
  const key = secret()
  if (!key) return null
  const issuedAt = Date.now()
  const nonce = randomUUID()
  const body = `${issuedAt}.${ticketId}.${eventId}.${nonce}`
  const mac = createHmac("sha256", key).update(body).digest("base64url")
  return Buffer.from(`${body}.${mac}`).toString("base64url")
}

export type GuestToken = { ticketId: string; eventId: string; subject: string } | null

/** Is this token ours, for this event, and still fresh? */
export function verifyGuestToken(
  token: string | null | undefined,
  eventId: string
): GuestToken {
  if (!token) return null
  const key = secret()
  if (!key) return null
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8")
    const parts = raw.split(".")
    if (parts.length !== 5) return null
    const [issuedAt, ticketId, ticketEvent, nonce, mac] = parts

    const expected = createHmac("sha256", key)
      .update(`${issuedAt}.${ticketId}.${ticketEvent}.${nonce}`)
      .digest("base64url")

    // Constant-time: this is a credential.
    const a = Buffer.from(mac)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null

    if (ticketEvent !== eventId) return null
    if (Date.now() - Number(issuedAt) > TICKET_TTL_MS) return null

    return { ticketId, eventId, subject: guestSubject(ticketId) }
  } catch {
    return null
  }
}

export { COOKIE as VIBEZ_GUEST_COOKIE }

/**
 * Read the guest cookie from a request.
 *
 * `cookies()` is read inside a try/catch because it throws when called from a
 * Server Component render, and a feed page is exactly where someone might
 * accidentally call this.
 */
export async function readGuestToken(eventId: string): Promise<GuestToken> {
  try {
    const { cookies } = await import("next/headers")
    const store = await cookies()
    return verifyGuestToken(store.get(COOKIE)?.value, eventId)
  } catch {
    return null
  }
}
