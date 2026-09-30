import { createHmac, randomUUID, timingSafeEqual } from "node:crypto"

/**
 * Tickets are signed with the app's own secret, so the upload middleware can
 * check one without a database round trip — and a client cannot mint its own.
 * Short life: the check that matters is "is this person an attendee right
 * now", and the middleware re-runs that check anyway.
 */
const TICKET_TTL_MS = 5 * 60 * 1000;

function secret(): string | null {
  // Deliberately NOT falling back to other secrets, and never to "".
  //
  // The old version walked a chain — VIBEZ_UPLOAD_SECRET, then
  // UPLOADTHING_TOKEN, then CLERK_SECRET_KEY, then an empty string. In a
  // deployment where none of those was set it signed every ticket with "", which
  // is a constant: anybody could compute a valid ticket and mint their own
  // upload permission for any event. Silent, total, and invisible in review.
  //
  // A missing secret now yields null, and both minting and verifying refuse.
  // That is a loud failure in one place instead of a quiet forgery in another.
  return process.env.VIBEZ_UPLOAD_SECRET || process.env.WALLET_LINK_SECRET || null
}

/** Mint a ticket: "<issuedAt>.<nonce>.<subject>.<eventId>.<hmac>". */
export function mintTicket(subject: string, eventId: string): string | null {
  const key = secret()
  if (!key) return null
  const issuedAt = Date.now();
  const nonce = randomUUID();
  const body = `${issuedAt}.${nonce}.${subject}.${eventId}`;
  const mac = createHmac("sha256", key).update(body).digest("base64url");
  return Buffer.from(`${body}.${mac}`).toString("base64url");
}

/** Is this ticket ours, for this subject, for this event, and still fresh? */
export function verifyTicket(
  ticket: string,
  subject: string,
  eventId: string
): boolean {
  const key = secret()
  if (!key) return false
  try {
    const raw = Buffer.from(ticket, "base64url").toString("utf8");
    const parts = raw.split(".");
    if (parts.length !== 5) return false;
    const [issuedAt, nonce, ticketSubject, ticketEvent, mac] = parts;

    const expected = createHmac("sha256", key)
      .update(`${issuedAt}.${nonce}.${ticketSubject}.${ticketEvent}`)
      .digest("base64url");

    // Constant-time compare: a ticket is a credential.
    if (mac.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < mac.length; i++) diff |= mac.charCodeAt(i) ^ expected.charCodeAt(i);
    if (diff !== 0) return false;

    if (ticketSubject !== subject || ticketEvent !== eventId) return false;
    if (Date.now() - Number(issuedAt) > TICKET_TTL_MS) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Spot cookies: the QR spots this browser has unlocked, for one event.
 *
 * A different shape from the upload ticket and the guest token, so it gets its
 * own mint/verify rather than being bent into one of them: it carries a *list*
 * of ids and is scoped to a single event, which neither of the others is.
 *
 * Signing proves we issued the list. It does not prove the spots still exist —
 * `vibezAccess` re-checks every id against the database, so deleting a sticker
 * actually revokes it.
 */
const SPOT_TTL_MS = 14 * 24 * 60 * 60 * 1000 // a fortnight covers a whole festival run

export type SpotTicket = {
  eventId: string
  spots: string[]
}

/** Mint "issuedAt.eventId.nonce.ids.signature". */
export function mintSpotToken(eventId: string, spots: string[]): string | null {
  const key = secret()
  if (!key) return null
  const issuedAt = Date.now()
  const nonce = randomUUID()
  // Sorted and de-duplicated so the same set always mints the same body: two
  // taps on the same sticker produce an identical cookie instead of churning a
  // new Set-Cookie header on every scan.
  const ids = [...new Set(spots)].sort()
  const body = `${issuedAt}.${eventId}.${nonce}.${ids.join(",")}`
  const mac = createHmac("sha256", key).update(body).digest("base64url")
  return Buffer.from(`${body}.${mac}`).toString("base64url")
}

/** Verify and return the spot list, or null when this is not ours / is stale. */
export function verifySpotToken(
  token: string | null | undefined,
  eventId: string
): SpotTicket | null {
  const key = secret()
  if (!key || !token) return null
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8")
    const parts = raw.split(".")
    if (parts.length !== 5) return null
    const [issuedAt, ticketEvent, nonce, ids, mac] = parts

    const expected = createHmac("sha256", key)
      .update(`${issuedAt}.${ticketEvent}.${nonce}.${ids}`)
      .digest("base64url")

    // Constant-time: this is a credential.
    const a = Buffer.from(mac)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null

    if (ticketEvent !== eventId) return null
    if (Date.now() - Number(issuedAt) > SPOT_TTL_MS) return null

    return { eventId, spots: ids ? ids.split(",").filter(Boolean) : [] }
  } catch {
    return null
  }
}

