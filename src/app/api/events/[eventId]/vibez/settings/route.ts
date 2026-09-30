import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import {
  ensureVibezSettings,
  getVibezSettings,
  updateVibezSettings,
} from "@/lib/vibez-settings";

/**
 * Moderators only. Settings decide who can post and what their photos look like,
 * so an ordinary attendee editing them would be editing the rules of the room.
 *
 * The check is against the Event's organizer rather than VibezBan, which is a
 * per-event *feed* ban: barring someone from the photos must not also stop them
 * from managing the event they organize.
 */
async function requireOrganizer(eventId: string) {
  const { userId } = await auth();
  if (!userId) return null;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { organizerId: true, organizer: { select: { userId: true } } },
  });
  if (!event) return null;

  if (event.organizer.userId === userId) return userId;

  // Active staff of the *organizing profile that owns this event* — the same
  // rule vibezAccess uses, so "can moderate the feed" and "can configure the
  // feed" cannot disagree.
  const staff = await prisma.staffMember.findFirst({
    where: { userId, organizerProfileId: event.organizerId, status: "ACTIVE" },
    select: { id: true },
  });
  return staff ? userId : null;
}

/**
 * GET /api/events/[eventId]/vibez/settings
 * The current configuration, with defaults filled in for an event that has never
 * opened the screen.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const settings = await getVibezSettings(eventId);
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("VIBEZ settings GET error:", error);
    return NextResponse.json({ message: "Failed to load settings" }, { status: 500 });
  }
}

/**
 * PATCH /api/events/[eventId]/vibez/settings
 * Turn the knobs.
 *
 * Values are validated and clamped in updateVibezSettings rather than here, so
 * that every caller — this route and anything added later — gets the same
 * guarantees. An unknown key is simply not written.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    if (!(await requireOrganizer(eventId))) {
      return NextResponse.json({ message: "Not allowed" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ message: "Expected a settings object" }, { status: 400 });
    }

    await ensureVibezSettings(eventId);
    const settings = await updateVibezSettings(eventId, body as Record<string, unknown>);
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("VIBEZ settings PATCH error:", error);
    return NextResponse.json({ message: "Failed to save settings" }, { status: 500 });
  }
}
