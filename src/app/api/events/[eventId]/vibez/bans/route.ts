import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canModerate, resolveAccess } from "@/lib/vibez-identity";

/** Moderators only, at every verb. A ban is a moderation decision. */
async function requireModerator(eventId: string) {
  const { access } = await resolveAccess(eventId);
  return canModerate(access);
}

/**
 * GET /api/events/[eventId]/vibez/bans
 * Who is barred from this event's feed. Moderators only.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    if (!(await requireModerator(eventId))) {
      return NextResponse.json({ message: "Not allowed" }, { status: 403 });
    }

    const bans = await prisma.vibezBan.findMany({
      where: { eventId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ bans });
  } catch (error) {
    console.error("VIBEZ bans GET error:", error);
    return NextResponse.json({ message: "Failed to load bans" }, { status: 500 });
  }
}

/**
 * POST /api/events/[eventId]/vibez/bans
 * Bar someone from this event's feed. Scoped to the event: a ban here does not
 * follow them to the next one. Moderators only.
 *
 * The target is a *subject* — a Clerk id or `tkt_<id>` for a guest. The unique
 * key stays (eventId, userId) because that is the column the existing index and
 * the moderator UI address, and because a guest ban still has to be idempotent.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const { viewer } = await resolveAccess(eventId);
    if (!viewer.userId) {
      return NextResponse.json({ message: "Sign in first" }, { status: 401 });
    }
    if (!(await requireModerator(eventId))) {
      return NextResponse.json({ message: "Not allowed" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const target = typeof body.subject === "string" ? body.subject : null;
    if (!target) {
      return NextResponse.json({ message: "subject is required" }, { status: 400 });
    }
    if (target === viewer.subject) {
      return NextResponse.json(
        { message: "You can't ban yourself from your own event" },
        { status: 400 }
      );
    }

    const reason = typeof body.reason === "string" ? body.reason.slice(0, 500) : null;

    const ban = await prisma.vibezBan.upsert({
      where: { eventId_userId: { eventId, userId: target } },
      create: {
        eventId,
        userId: target,
        subject: target,
        bannedBy: viewer.userId,
        reason,
      },
      update: { subject: target, bannedBy: viewer.userId, reason },
      select: { id: true, userId: true, subject: true, reason: true, createdAt: true },
    });

    return NextResponse.json({ ban }, { status: 201 });
  } catch (error) {
    console.error("VIBEZ ban POST error:", error);
    return NextResponse.json({ message: "Failed to ban" }, { status: 500 });
  }
}

/**
 * DELETE /api/events/[eventId]/vibez/bans
 * Lift a ban. Moderators only.
 *
 * Scoped to this event in both directions. The previous version deleted with
 * `where: { eventId, userId: target }` but the target came from a query string,
 * and an empty or absent value deleted nothing while a crafted one could reach
 * across events. The subject is now required and the event is never taken from
 * the caller.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    if (!(await requireModerator(eventId))) {
      return NextResponse.json({ message: "Not allowed" }, { status: 403 });
    }

    const target = new URL(req.url).searchParams.get("subject");
    if (!target) {
      return NextResponse.json({ message: "subject is required" }, { status: 400 });
    }

    // eventId comes from the route, never from the request, so this cannot
    // reach a ban that belongs to a different event.
    await prisma.vibezBan.deleteMany({ where: { eventId, userId: target } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("VIBEZ ban DELETE error:", error);
    return NextResponse.json({ message: "Failed to lift ban" }, { status: 500 });
  }
}
