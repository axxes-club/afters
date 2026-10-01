import { NextResponse, type NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { mintGuestToken, newSpotGuestRef, verifyGuestToken, VIBEZ_GUEST_COOKIE } from "@/lib/vibez-guest"
import { mintSpotToken, verifySpotToken } from "@/lib/vibez-ticket"
import { VIBEZ_SPOT_COOKIE, spotCookieOptions } from "@/lib/vibez-spots"
import {
  budgetLimits,
  checkGeofence,
  feedState,
  resolveAccess,
} from "@/lib/vibez-identity"
import { getVibezSettings } from "@/lib/vibez-settings"
import { canPost, canView } from "@/lib/vibez"

/**
 * POST /api/events/[eventId]/vibez/join
 * Get into the feed. Two ways in, and both are here on purpose:
 *
 *   { code: "AFT-1234" }  — type the code printed on a ticket / guestlist line
 *   { spot: "<token>" }   — scanned a QR sticker somewhere in the room
 *
 * The point of this endpoint is that a guest never has to make an account. They
 * scan the code on the ticket they already have, or point a phone at the sticker
 * by the door, and that is the whole flow — which is the difference between a
 * feature that works in a room full of people who have not signed up for
 * anything, and one that works only for people who already have a login.
 *
 * What a scan grants and what a ticket grants is deliberately not the same. A
 * ticket is checked against the database on every later request, so a refund
 * revokes access immediately. A scan is recorded in a signed cookie, because
 * there is no server-side row that could prove someone stood in a room — and
 * that is exactly why an organizer can choose "tickets only" for an event where
 * that trade is the wrong one. See VibezSettings.accessMode.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params

    const state = await feedState(eventId)
    if (!state.ok) {
      return NextResponse.json({ message: state.message }, { status: state.status })
    }

    const settings = await getVibezSettings(eventId)
    const body = await req.json().catch(() => ({}))
    const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : ""
    const spotToken = typeof body.spot === "string" ? body.spot.trim() : ""
    const lat = Number(body.lat)
    const lng = Number(body.lng)

    const wantsTicket = Boolean(code)
    const wantsSpot = Boolean(spotToken)
    if (!wantsTicket && !wantsSpot) {
      return NextResponse.json(
        { message: "Scan a code at the venue, or enter the code on your ticket" },
        { status: 400 }
      )
    }

    const res = NextResponse.json({ ok: true })
    let granted = false

    // ── The ticket route ────────────────────────────────────────────────
    // Skipped entirely in 'qr' mode: a ticket is not the credential that
    // organizer asked for, and accepting it here would make the setting mean
    // nothing to anyone holding a phone with a ticket in the wallet app.
    if (wantsTicket && settings.accessMode !== "qr") {
      const ticket = await prisma.ticket.findFirst({
        where: {
          eventId,
          OR: [{ ticketNumber: code }, { ticketNumber: code.replace(/^TKT-?/, "") }],
          status: { in: ["VALID", "CHECKED_IN"] },
        },
        select: { id: true, eventId: true, status: true },
      })

      const guestlist =
        ticket ??
        (await prisma.guestlistEntry
          .findFirst({
            where: { eventId, name: { equals: code, mode: "insensitive" } },
            select: { id: true },
          })
          // A guestlist entry has no Ticket row, so mint against the entry id.
          // It is opaque and event-scoped in exactly the same way.
          .then((entry) =>
            entry ? { id: `gl_${entry.id}`, eventId, status: "VALID" as const } : null
          ))

      if (guestlist) {
        const token = mintGuestToken(guestlist.id, eventId)
        if (token) {
          // Short-lived and scoped to one event, so it does not need to survive
          // the night — and a session cookie means a shared phone at the bar
          // does not hand the next person the last person's access.
          res.cookies.set(VIBEZ_GUEST_COOKIE, token, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 12 * 60 * 60,
          })
          granted = true
        }
      }
    }

    // ── The QR sticker route ────────────────────────────────────────────
    // Skipped in 'ticket' mode, for the mirror-image reason.
    if (!granted && wantsSpot && settings.accessMode !== "ticket") {
      const spot = await prisma.vibezSpot.findFirst({
        where: { eventId, token: spotToken },
        select: { id: true },
      })
      if (spot) {
        // Union with whatever this browser already holds, so scanning a second
        // sticker does not throw away the first.
        const existing = verifySpotToken(req.cookies.get(VIBEZ_SPOT_COOKIE)?.value, eventId)
        const token = mintSpotToken(eventId, [...(existing?.spots ?? []), spot.id])

        if (token) {
          res.cookies.set(VIBEZ_SPOT_COOKIE, token, spotCookieOptions(14 * 24 * 60 * 60))
          // A sticker proves the person is in the room, but posting is keyed on a
          // subject. Give an anonymous scanner one, unless they already hold a
          // guest token (a ticket or guestlist proof outranks an anonymous one).
          if (!verifyGuestToken(req.cookies.get(VIBEZ_GUEST_COOKIE)?.value, eventId)) {
            const guest = mintGuestToken(newSpotGuestRef(), eventId)
            if (guest) {
              res.cookies.set(VIBEZ_GUEST_COOKIE, guest, {
                httpOnly: true,
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
                path: "/",
                maxAge: 12 * 60 * 60,
              })
            }
          }
          await prisma.vibezSpot
            .update({ where: { id: spot.id }, data: { scans: { increment: 1 } } })
            .catch(() => {
              // A missed scan count is not worth failing a join over.
            })
          granted = true
        }
      }
    }

    if (!granted) {
      // One message for "no such code", "that ticket is cancelled" and "that
      // sticker belongs to another event". Telling them apart would let anyone
      // confirm whether a guessed ticket number is real, whether it was
      // refunded, or whether a code they photographed is the right one.
      return NextResponse.json(
        { message: "That code isn't valid for this event" },
        { status: 404 }
      )
    }

    // ── Geofence, if the organizer wants one ────────────────────────────
    // Asked for *after* granting, so somebody whose location read badly is not
    // sent back to re-enter a code. It is not a bypass: access is re-checked on
    // every later request, and a refused guest simply gets no posting rights.
    if (settings.requireGeofence) {
      const position = Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null
      const fence = await checkGeofence(eventId, settings, position)
      if (!fence.ok) {
        return NextResponse.json({ message: fence.message }, { status: 403 })
      }
    }

    return res
  } catch (error) {
    console.error("VIBEZ join error:", error)
    return NextResponse.json({ message: "Could not join this feed" }, { status: 500 })
  }
}

/**
 * GET /api/events/[eventId]/vibez/join
 * "What do I need to do to get in?"
 *
 * The guest UI asks this to decide which of the two doors to show. Answering
 * from the same resolveAccess every other surface uses is what keeps the gate and
 * the feed from disagreeing — a gate that says "scan a code" to someone the feed
 * would have let in anyway is just a confusing extra step.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
    const { viewer, access, settings } = await resolveAccess(eventId)

    return NextResponse.json({
      canView: canView(access),
      canPost: canPost(access),
      isModerator: access === "staff",
      subject: viewer.subject,
      hasSpot: viewer.hasSpot,
      accessMode: settings.accessMode,
      requireGeofence: settings.requireGeofence,
      limits: budgetLimits(settings),
    })
  } catch (error) {
    console.error("VIBEZ join GET error:", error)
    return NextResponse.json({ message: "Failed to check access" }, { status: 500 })
  }
}
