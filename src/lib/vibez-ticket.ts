import { createHmac, randomUUID } from "node:crypto"

/**
 * Tickets are signed with the app's own secret, so the upload middleware can
 * check one without a database round trip — and a client cannot mint its own.
 * Short life: the check that matters is "is this person an attendee right
 * now", and the middleware re-runs that check anyway.
 */
const TICKET_TTL_MS = 5 * 60 * 1000;

function secret(): string {
  return (
    process.env.VIBEZ_UPLOAD_SECRET ||
    process.env.UPLOADTHING_TOKEN ||
    process.env.CLERK_SECRET_KEY ||
    ""
  );
}

/** Mint a ticket: "<issuedAt>.<nonce>.<hmac>". */
export function mintTicket(userId: string, eventId: string): string {
  const issuedAt = Date.now();
  const nonce = randomUUID();
  const body = `${issuedAt}.${nonce}.${userId}.${eventId}`;
  const mac = createHmac("sha256", secret()).update(body).digest("base64url");
  return Buffer.from(`${body}.${mac}`).toString("base64url");
}

/** Is this ticket ours, for this person, for this event, and still fresh? */
export function verifyTicket(ticket: string, userId: string, eventId: string): boolean {
  try {
    const raw = Buffer.from(ticket, "base64url").toString("utf8");
    const parts = raw.split(".");
    if (parts.length !== 5) return false;
    const [issuedAt, nonce, ticketUser, ticketEvent, mac] = parts;

    const expected = createHmac("sha256", secret())
      .update(`${issuedAt}.${nonce}.${ticketUser}.${ticketEvent}`)
      .digest("base64url");

    // Constant-time compare: a ticket is a credential.
    if (mac.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < mac.length; i++) diff |= mac.charCodeAt(i) ^ expected.charCodeAt(i);
    if (diff !== 0) return false;

    if (ticketUser !== userId || ticketEvent !== eventId) return false;
    if (Date.now() - Number(issuedAt) > TICKET_TTL_MS) return false;
    return true;
  } catch {
    return false;
  }
}
