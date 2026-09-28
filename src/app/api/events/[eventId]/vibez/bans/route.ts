import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canModerate, vibezAccess } from "@/lib/vibez";

/** Moderators only, at every verb. A ban is a moderation decision. */
async function requireModerator(eventId: string, userId: string) {
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress ?? null;
  const access = await vibezAccess(eventId, userId, email);
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
    const { userId } = await auth();
    const { eventId } = await params;
    if (!userId) {
      return NextResponse.json({ message: "Sign in first" }, { status: 401 });
    }
    if (!(await requireModerator(eventId, userId))) {
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
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { userId } = await auth();
    const { eventId } = await params;
    if (!userId) {
      return NextResponse.json({ message: "Sign in first" }, { status: 401 });
    }
    if (!(await requireModerator(eventId, userId))) {
      return NextResponse.json({ message: "Not allowed" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const target = typeof body.userId === "string" ? body.userId : null;
    if (!target) {
      return NextResponse.json({ message: "userId is required" }, { status: 400 });
    }
    if (target === userId) {
      return NextResponse.json(
        { message: "You can't ban yourself from your own event" },
        { status: 400 }
      );
    }

    const reason = typeof body.reason === "string" ? body.reason.slice(0, 500) : null;

    const ban = await prisma.vibezBan.upsert({
      where: { eventId_userId: { eventId, userId: target } },
      create: { eventId, userId: target, bannedBy: userId, reason },
      update: { bannedBy: userId, reason },
      select: { id: true, userId: true, reason: true, createdAt: true },
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
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { userId } = await auth();
    const { eventId } = await params;
    if (!userId) {
      return NextResponse.json({ message: "Sign in first" }, { status: 401 });
    }
    if (!(await requireModerator(eventId, userId))) {
      return NextResponse.json({ message: "Not allowed" }, { status: 403 });
    }

    const target = new URL(req.url).searchParams.get("userId");
    if (!target) {
      return NextResponse.json({ message: "userId is required" }, { status: 400 });
    }

    await prisma.vibezBan.deleteMany({ where: { eventId, userId: target } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("VIBEZ ban DELETE error:", error);
    return NextResponse.json({ message: "Failed to lift ban" }, { status: 500 });
  }
}
