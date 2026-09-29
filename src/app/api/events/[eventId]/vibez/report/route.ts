import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveAccess } from "@/lib/vibez-identity";

/** The reasons a guest is offered. Anything else is filed as "other". */
const REASONS = new Set(["spam", "abusive", "explicit", "private", "other"]);

/**
 * POST /api/events/[eventId]/vibez/report
 * Flag a post. Anyone who can see the feed can flag, and one person can only
 * flag a given post once. A report does not remove anything on its own — it
 * puts the post in front of a moderator, who decides.
 *
 * Reports are keyed on the viewer's *subject*, so a guest can report too and
 * cannot report the same photo twice under a different identity.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;

    const { viewer, access } = await resolveAccess(eventId);
    if (!viewer.subject) {
      return NextResponse.json({ message: "Sign in to report" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const postId = typeof body.postId === "string" ? body.postId : null;
    if (!postId) {
      return NextResponse.json({ message: "postId is required" }, { status: 400 });
    }

    const post = await prisma.vibezPost.findUnique({
      where: { id: postId },
      select: { id: true, eventId: true, removedAt: true, authorSubject: true },
    });
    if (!post || post.eventId !== eventId) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }
    if (post.removedAt) {
      return NextResponse.json({ message: "That post was already removed" }, { status: 400 });
    }
    // You can report your own post to yourself; it just does nothing useful.
    if (post.authorSubject === viewer.subject) {
      return NextResponse.json(
        { message: "That's your own post — you can remove it instead" },
        { status: 400 }
      );
    }

    if (access === "none" || access === "banned") {
      return NextResponse.json(
        { message: "Only attendees can report" },
        { status: 403 }
      );
    }

    const reason =
      typeof body.reason === "string" && REASONS.has(body.reason) ? body.reason : "other";
    const note = typeof body.note === "string" ? body.note.slice(0, 500) : null;

    // The unique (postId, reporterId) index is the real guard: two taps at once
    // must not become two reports.
    const existing = await prisma.vibezReport.findUnique({
      where: { postId_reporterId: { postId, reporterId: viewer.subject } },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({ message: "Already reported" }, { status: 409 });
    }

    const report = await prisma.vibezReport.create({
      data: { postId, reporterId: viewer.subject, reason, note },
      select: { id: true, createdAt: true },
    });

    await prisma.vibezPost.update({
      where: { id: postId },
      data: { reportCount: { increment: 1 } },
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    console.error("VIBEZ report error:", error);
    return NextResponse.json({ message: "Failed to send report" }, { status: 500 });
  }
}
