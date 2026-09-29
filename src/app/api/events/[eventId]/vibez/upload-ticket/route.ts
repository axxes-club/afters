import { NextResponse } from "next/server";
import { canPost, feedState, resolveAccess, uploadBudget } from "@/lib/vibez-identity";
import { mintTicket } from "@/lib/vibez-ticket";

/**
 * POST /api/events/[eventId]/vibez/upload-ticket
 * "May I upload here, right now?" Answered before any bytes move, so a
 * non-attendee never spends our bandwidth finding out they cannot post.
 *
 * The ticket is bound to a *subject*, not to a Clerk id, so a guest holding a
 * redeemed ticket gets one too. The upload middleware re-checks that subject.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;

    const state = await feedState(eventId);
    if (!state.ok) {
      return NextResponse.json({ message: state.message }, { status: state.status });
    }

    const { viewer, access } = await resolveAccess(eventId);

    if (access === "banned") {
      return NextResponse.json({ message: "You can't post in this feed." }, { status: 403 });
    }
    if (!canPost(access) || !viewer.subject) {
      return NextResponse.json(
        {
          message: viewer.subject
            ? "Only attendees can post to the VIBEZ feed"
            : "Show the QR code on your ticket to join this feed",
        },
        { status: 403 }
      );
    }

    const budget = await uploadBudget(eventId, viewer.userId ?? "", viewer.subject);
    if (!budget.allowed) {
      return NextResponse.json({ message: budget.reason }, { status: 429 });
    }

    // A missing VIBEZ_UPLOAD_SECRET mints nothing rather than minting something
    // signed with a guessable constant. See src/lib/vibez-ticket.ts.
    const ticket = mintTicket(viewer.subject, eventId);
    if (!ticket) {
      return NextResponse.json(
        { message: "Uploads are not configured for this event" },
        { status: 503 }
      );
    }

    return NextResponse.json({ ticket, eventId });
  } catch (error) {
    console.error("VIBEZ upload-ticket error:", error);
    return NextResponse.json({ message: "Could not start an upload" }, { status: 500 });
  }
}
