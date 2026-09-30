/**
 * QR spots: the printed codes that put a camera in a room.
 *
 * A spot is a short, unguessable token in a URL. Printed on a sticker above the
 * bar it is something a guest cannot forward usefully — the room is the
 * credential. That is the whole reason this exists rather than just sharing the
 * feed link in the group chat.
 *
 * Tokens are 12 bytes of randomness from the platform CSPRNG. They are not
 * sequential and not derived from the event id, because a guessable spot token
 * is a spot anyone can unlock from their sofa.
 */

import { randomBytes } from "node:crypto"
import { prisma } from "@/lib/prisma"

/** Cookie holding the spots this guest has scanned, so "scan once, stay in"
 *  survives a page reload. */
export const VIBEZ_SPOT_COOKIE = "vz_spots"

export function newSpotToken(): string {
  return randomBytes(12).toString("base64url")
}

/** The public URL a spot's QR encodes.
 *
 * Deliberately the vbz.afters.am alias (see src/lib/vbz-alias.ts) rather than a
 * long /e/<slug>/vibez path: this string gets printed, sticker-cut and read off
 * a wall in bad light, and a short memorable domain survives that better than a
 * slug that might change when the event is renamed.
 */
export function spotUrl(baseUrl: string, eventSlug: string, token: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/s/${token}?e=${encodeURIComponent(eventSlug)}`
}

export type VibezSpotRow = {
  id: string
  label: string
  token: string
  scans: number
  createdAt: Date
}

/** Every spot for an event, oldest first so the list order is stable. */
export async function listSpots(eventId: string): Promise<VibezSpotRow[]> {
  return prisma.vibezSpot.findMany({
    where: { eventId },
    select: { id: true, label: true, token: true, scans: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  })
}

/** Resolve a token to a spot of *this* event.
 *
 * The eventId is part of the query, not a check afterwards. Scanning another
 * event's code must not grant access to this one even though tokens are unique
 * across the table — a spot is a fact about a room, not a global pass.
 */
export async function findSpot(eventId: string, token: string) {
  return prisma.vibezSpot.findFirst({
    where: { eventId, token },
    select: { id: true, eventId: true, label: true },
  })
}

/** Count a scan. Fire-and-forget from the request path: a stat that is a few
 *  milliseconds stale is fine, and a failed counter should never stop someone
 *  taking a photo. */
export async function recordScan(spotId: string): Promise<void> {
  try {
    await prisma.vibezSpot.update({
      where: { id: spotId },
      data: { scans: { increment: 1 } },
    })
  } catch {
    // A missed scan count is not worth surfacing to a guest holding a phone up
    // to a sticker at the door.
  }
}

/** Create a spot, defaulting the label to something an organizer recognises. */
export async function createSpot(eventId: string, label: string): Promise<VibezSpotRow> {
  return prisma.vibezSpot.create({
    data: { eventId, label: label.trim().slice(0, 60) || "Main entrance", token: newSpotToken() },
    select: { id: true, label: true, token: true, scans: true, createdAt: true },
  })
}

export async function deleteSpot(eventId: string, spotId: string): Promise<void> {
  // eventId in the where, so a crafted spot id cannot delete another event's
  // code. VibezPost.spotId is ON DELETE SET NULL, so removing a sticker leaves
  // the photos it produced alone.
  await prisma.vibezSpot.deleteMany({ where: { id: spotId, eventId } })
}

/** Parse the spot cookie into a list of spot ids, discarding anything that is
 *  not shaped like one. The cookie is signed by the caller; this only guards
 *  against a malformed value reaching the database layer. */
export function parseSpotCookie(value: string | undefined | null): string[] {
  if (!value) return []
  return value
    .split(".")
    .map((s) => s.trim())
    // cuid and cuid2 ids are lowercase alphanumeric; anything else is dropped
    // rather than passed to a query.
    .filter((s) => /^[a-z0-9]{8,40}$/.test(s))
    .slice(0, 20)
}

export function appendSpotCookie(current: string | undefined | null, spotId: string): string {
  const list = parseSpotCookie(current)
  if (list.includes(spotId)) return list.join(".")
  return [...list, spotId].join(".")
}

export const spotCookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge,
})
