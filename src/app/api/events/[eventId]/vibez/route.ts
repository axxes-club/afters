import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canModerate, canPost, postBudget, vibezAccess } from "@/lib/vibez";
import { deleteStoredFile } from "@/lib/vibez-storage";

/** A removed post is invisible to everyone except the people moderating. */
const VISIBLE_ONLY = { removedAt: null } as const;

const NOT_ENABLED = { message: "VIBEZ is not enabled for this event" };
const NOT_STARTED = { message: "VIBEZ feed is only available after the event starts" };

/** The email of whoever is signed in, for attendee lookups. */
async function callerEmail(): Promise<string | null> {
  const user = await currentUser();
  return user?.emailAddresses?.[0]?.emailAddress ?? null;
}

/** Only accept images we host. Anything else is a hotlink to someone else's
 *  bandwidth, or a script pretending to be a photo. */
function isOurImage(url: string): boolean {
  return /^https:\/\/[^/]*ufs\.sh\//i.test(url) || /^https:\/\/utfs\.io\//i.test(url);
}

/**
 * GET /api/events/[eventId]/vibez
 * List vibez posts. Attendees (or organizer/staff) only, and only once the
 * event has started and the organizer has turned the feed on.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { userId } = await auth();
    const { eventId } = await params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, vibezEnabled: true, startsAt: true, organizerId: true },
    });

    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }
    if (!event.vibezEnabled) {
      return NextResponse.json(NOT_ENABLED, { status: 403 });
    }
    if (new Date(event.startsAt) > new Date()) {
      return NextResponse.json(NOT_STARTED, { status: 403 });
    }

    const access = userId
      ? await vibezAccess(eventId, userId, await callerEmail())
      : ("none" as const);

    if (access === "none" || access === "banned") {
      return NextResponse.json(
        { message: "Only attendees can view the VIBEZ feed" },
        { status: 403 }
      );
    }

    // Moderators also see what they have pulled, so they can put it back.
    const posts = await prisma.vibezPost.findMany({
      where: { eventId, ...(canModerate(access) ? {} : VISIBLE_ONLY) },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ posts, canModerate: canModerate(access) });
  } catch (error) {
    console.error("VIBEZ GET error:", error);
    return NextResponse.json({ message: "Failed to load feed" }, { status: 500 });
  }
}

/**
 * POST /api/events/[eventId]/vibez
 * Create a vibez post. Attendees only, only after the event starts, and only
 * while the organizer has the feed on. Rate- and volume-capped so one person
 * (or one bot) cannot flood the event's storage.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { userId } = await auth();
    const { eventId } = await params;

    if (!userId) {
      return NextResponse.json(
        { message: "Sign in to post to the feed" },
        { status: 401 }
      );
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, vibezEnabled: true, startsAt: true, organizerId: true },
    });

    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }
    if (!event.vibezEnabled) {
      return NextResponse.json(NOT_ENABLED, { status: 403 });
    }
    if (new Date(event.startsAt) > new Date()) {
      return NextResponse.json(
        { message: "You can only post once the event has started" },
        { status: 403 }
      );
    }

    const access = await vibezAccess(eventId, userId, await callerEmail());
    if (access === "banned") {
      return NextResponse.json(
        { message: "You can't post in this feed." },
        { status: 403 }
      );
    }
    if (!canPost(access)) {
      return NextResponse.json(
        { message: "Only attendees can post to the VIBEZ feed" },
        { status: 403 }
      );
    }

    const budget = await postBudget(eventId, userId);
    if (!budget.allowed) {
      return NextResponse.json({ message: budget.reason }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl : null;

    if (!imageUrl || !isOurImage(imageUrl)) {
      return NextResponse.json(
        { message: "That image could not be used" },
        { status: 400 }
      );
    }

    // Who someone is comes from the database, never from the request body.
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, imageUrl: true },
    });
    const name =
      [dbUser?.firstName, dbUser?.lastName].filter(Boolean).join(" ") || "Guest";

    const post = await prisma.vibezPost.create({
      data: {
        eventId,
        userId,
        authorName: name.slice(0, 200),
        authorImageUrl: dbUser?.imageUrl ?? undefined,
        imageUrl,
      },
    });

    return NextResponse.json({ post });
  } catch (error) {
    console.error("VIBEZ POST error:", error);
    return NextResponse.json({ message: "Failed to post" }, { status: 500 });
  }
}

/**
 * DELETE /api/events/[eventId]/vibez
 * Take a post down. An author can always remove their own; a moderator can
 * remove anyone's. The file is deleted from storage and the row kept, so a
 * removed post leaves the feed but stays countable and auditable.
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

    const body = await req.json().catch(() => ({}));
    const postId = typeof body.postId === "string" ? body.postId : null;
    if (!postId) {
      return NextResponse.json({ message: "postId is required" }, { status: 400 });
    }

    const post = await prisma.vibezPost.findUnique({
      where: { id: postId },
      select: { id: true, eventId: true, userId: true, imageUrl: true, removedAt: true },
    });

    if (!post || post.eventId !== eventId) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }

    // Already gone; removing twice is not an error, it just has to be safe.
    if (post.removedAt) {
      return NextResponse.json({ post: { id: post.id, removedAt: post.removedAt } });
    }

    const access = await vibezAccess(eventId, userId, await callerEmail());
    const isAuthor = post.userId === userId;

    if (!isAuthor && !canModerate(access)) {
      return NextResponse.json({ message: "Not allowed" }, { status: 403 });
    }

    const updated = await prisma.vibezPost.update({
      where: { id: post.id },
      data: {
        removedAt: new Date(),
        removedBy: userId,
        removedReason: isAuthor && !canModerate(access) ? "author" : "moderator",
      },
      select: { id: true, removedAt: true },
    });

    // Best effort: the post is already out of the feed either way.
    await deleteStoredFile(post.imageUrl).catch((e) =>
      console.error("VIBEZ storage delete failed:", e)
    );

    return NextResponse.json({ post: updated });
  } catch (error) {
    console.error("VIBEZ DELETE error:", error);
    return NextResponse.json({ message: "Failed to remove post" }, { status: 500 });
  }
}

/**
 * PATCH /api/events/[eventId]/vibez
 * Put a removed post back. Moderators only — an author who deleted their own
 * post does not get to un-delete it, because the file is gone from storage.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { userId } = await auth();
    const { eventId } = await params;

    if (!userId) {
      return NextResponse.json({ message: "Sign in first" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const postId = typeof body.postId === "string" ? body.postId : null;
    if (!postId) {
      return NextResponse.json({ message: "postId is required" }, { status: 400 });
    }

    const access = await vibezAccess(eventId, userId, await callerEmail());
    if (!canModerate(access)) {
      return NextResponse.json({ message: "Not allowed" }, { status: 403 });
    }

    const post = await prisma.vibezPost.findUnique({
      where: { id: postId },
      select: { id: true, eventId: true, removedAt: true },
    });
    if (!post || post.eventId !== eventId) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }
    if (!post.removedAt) {
      return NextResponse.json({ message: "That post is already live" }, { status: 400 });
    }

    const restored = await prisma.vibezPost.update({
      where: { id: post.id },
      data: { removedAt: null, removedBy: null, removedReason: null },
      select: { id: true, removedAt: true },
    });

    return NextResponse.json({ post: restored });
  } catch (error) {
    console.error("VIBEZ PATCH error:", error);
    return NextResponse.json({ message: "Failed to restore post" }, { status: 500 });
  }
}
