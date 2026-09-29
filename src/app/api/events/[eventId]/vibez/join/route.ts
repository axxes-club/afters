import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { mintGuestToken, VIBEZ_GUEST_COOKIE } from "@/lib/vibez-guest"
import { feedState } from "@/lib/vibez-identity"

/**
 * POST /api/events/[eventId]/vibez/join
 * Redeem a ticket for guest access to the feed.
 *
 * The point of this endpoint is that a guest never has to make an account. They
 * scan the code on the ticket they already have, and that is the whole flow —
 * which is the difference between a feature that works in a room full of people
 * who have not signed up for anything, and a feature that works only for the
 * people who already have a login.
 *
 * The code is the ticket number, which is printed on the ticket and is not a
 * secret. What makes redemption safe is that it can only ever grant access to
 * the event the ticket belongs to, and only while that ticket is VALID or
 * CHECKED_IN: cancelling or refunding revokes it, and the access check re-reads
 * the ticket every time rather than trusting the cookie.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params

    const state = await feedState(eventId)
    if (!state.ok) {
      return NextResponse.json({ message: state.message }, { status: state.status })
    }

    const body = await req.json().catch(() => ({}))
    const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : ""
    if (!code) {
      return NextResponse.json({ message: "Enter the code on your ticket" }, { status: 400 })
    }

    // Ticket number for a ticket, or the short code printed on a guestlist /
    // RSVP line. Both are looked up on this event only.
    const ticket = await prisma.ticket.findFirst({
      where: {
        eventId,
        OR: [
          { ticketNumber: code },
          { ticketNumber: code.replace(/^TKT-?/, "") },
        ],
        status: { in: ["VALID", "CHECKED_IN"] },
      },
      select: { id: true, eventId: true, status: true },
    })

    const guestlist =
      ticket ??
      (await prisma.guestlistEntry.findFirst({
        where: { eventId, name: { equals: code, mode: "insensitive" } },
        select: { id: true },
      }).then((entry) =>
        // A guestlist entry has no Ticket row, so mint against the entry id. It
        // is opaque and event-scoped in exactly the same way.
        entry ? { id: `gl_${entry.id}`, eventId, status: "VALID" as const } : null
      ))

    if (!guestlist) {
      // One message for "no such code" and "that ticket is cancelled": telling
      // them apart would let anyone confirm whether a guessed ticket number is
      // real, and whether it was refunded.
      return NextResponse.json(
        { message: "That code isn't valid for this event" },
        { status: 404 }
      )
    }

    const token = mintGuestToken(guestlist.id, eventId)
    if (!token) {
      return NextResponse.json(
        { message: "Guest access isn't configured for this event" },
        { status: 503 }
      )
    }

    const res = NextResponse.json({ ok: true })
    res.cookies.set(VIBEZ_GUEST_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      // The token is short-lived and scoped to one event, so it does not need to
      // survive the night — and a session cookie means a shared phone at the bar
      // does not hand the next person the last person's feed access.
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 12 * 60 * 60,
    })
    return res
  } catch (error) {
    console.error("VIBEZ join error:", error)
    return NextResponse.json({ message: "Could not join this feed" }, { status: 500 })
  }
}
