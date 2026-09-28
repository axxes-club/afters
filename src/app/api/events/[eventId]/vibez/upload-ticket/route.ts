import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canPost, uploadBudget, vibezAccess } from "@/lib/vibez";
import { mintTicket } from "@/lib/vibez-ticket";

/**
 * POST /api/events/[eventId]/vibez/upload-ticket
 * "May I upload here, right now?" Answered before any bytes move, so a
 * non-attendee never spends our bandwidth finding out they cannot post.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { userId } = await auth();
    const { eventId } = await params;

    if (!userId) {
      return NextResponse.json({ message: "Sign in to post" }, { status: 401 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, vibezEnabled: true, startsAt: true },
    });
    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }
    if (!event.vibezEnabled) {
      return NextResponse.json(
        { message: "VIBEZ is not enabled for this event" },
        { status: 403 }
      );
    }
    if (new Date(event.startsAt) > new Date()) {
      return NextResponse.json(
        { message: "You can only post once the event has started" },
        { status: 403 }
      );
    }

    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress ?? null;
    const access = await vibezAccess(eventId, userId, email);

    if (access === "banned") {
      return NextResponse.json({ message: "You can't post in this feed." }, { status: 403 });
    }
    if (!canPost(access)) {
      return NextResponse.json(
        { message: "Only attendees can post to the VIBEZ feed" },
        { status: 403 }
      );
    }

    const budget = await uploadBudget(eventId, userId);
    if (!budget.allowed) {
      return NextResponse.json({ message: budget.reason }, { status: 429 });
    }

    return NextResponse.json({ ticket: mintTicket(userId, eventId), eventId });
  } catch (error) {
    console.error("VIBEZ upload-ticket error:", error);
    return NextResponse.json({ message: "Could not start an upload" }, { status: 500 });
  }
}
