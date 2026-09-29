import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { VibezAccess } from "@/lib/vibez"
import { canView } from "@/lib/vibez"
import { isVibezFilterId } from "@/lib/vibez-filters"
import { publicSettings } from "@/lib/vibez-settings"
import {
  budgetLimits,
  canModerate,
  canPost,
  feedState,
  postBudget,
  resolveAccess,
} from "@/lib/vibez-identity"
// NOTE: no storage import here. This route used to delete the image on removal,
// which is what made "restore" restore a row pointing at a deleted file. Removal
// now only hides the post; the file is deleted by /api/cron/vibez-purge after a
// grace period. See the DELETE handler below and VibezPost.filePurgedAt.

/** A removed post is invisible to everyone except the people moderating. */
const VISIBLE_ONLY = { removedAt: null } as const;

/** Only accept images we host. Anything else is a hotlink to someone else's
 *  bandwidth, or a script pretending to be a photo. */
function isOurImage(url: string): boolean {
  return /^https:\/\/[^/]*ufs\.sh\//i.test(url) || /^https:\/\/utfs\.io\//i.test(url);
}

/** What the client needs to render the right controls, in one payload. */
function viewerPayload(access: VibezAccess, subject: string | null, isGuest: boolean) {
  return {
    canModerate: canModerate(access),
    canPost: canPost(access),
    subject,
    isGuest,
  }
}

/**
 * GET /api/events/[eventId]/vibez
 * List vibez posts. Attendees (or organizer/staff) only, and only once the
 * event has started and the organizer has turned the feed on.
 *
 * A guest holding a redeemed ticket is an attendee. Previously the only way in
 * was a Clerk session, so the people most likely to be standing in the room —
 * the ones who bought a ticket as a guest and never signed up — were the ones
 * the feed refused.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;

    const state = await feedState(eventId);
    if (!state.ok) {
      return NextResponse.json({ message: state.message }, { status: state.status });
    }

    const { viewer, access, settings } = await resolveAccess(eventId);

    if (!canView(access)) {
      return NextResponse.json(
        { message: "Only attendees can view the VIBEZ feed" },
        { status: 403 }
      );
    }

    const moderator = canModerate(access);

    // Moderators also see what they have pulled, and what is waiting for review,
    // so they can put a photo back or approve it. Everyone else sees only posts
    // that are both approved and not removed — an 'approve' feed would otherwise
    // show a guest's photo to the room the instant it was taken.
    const posts = await prisma.vibezPost.findMany({
      where: {
        eventId,
        ...(moderator
          ? {}
          : { ...VISIBLE_ONLY, moderationStatus: "approved" }),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // reactionSubjects is the list of identities that stopped one person
    // inflating a count. It is an array of subjects, so it is stripped before the
    // payload leaves the server — the client gets the number and a yes/no.
    const sanitised = posts.map(({ reactionSubjects, ...post }) => ({
      ...post,
      iReacted: viewer.subject ? reactionSubjects.includes(viewer.subject) : false,
    }));

    return NextResponse.json({
      posts: sanitised,
      settings: publicSettings(settings),
      ...viewerPayload(access, viewer.subject, viewer.isGuest),
    });
  } catch (error) {
    console.error("VIBEZ GET error:", error);
    return NextResponse.json({ message: "Failed to load feed" }, { status: 500 });
  }
}

/**
 * POST /api/events/[eventId]/vibez
 * Create a vibez post. Attendees only — a signed-in attendee or a guest holding
 * a redeemed ticket — only after the event starts, and only while the organizer
 * has the feed on. Rate- and volume-capped so one person (or one bot) cannot
 * flood the event's storage.
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

    const { viewer, access, settings } = await resolveAccess(eventId);

    if (access === "banned") {
      return NextResponse.json(
        { message: "You can't post in this feed." },
        { status: 403 }
      );
    }
    if (!canPost(access)) {
      // One message for both "sign in" and "you don't have a ticket", because
      // telling a stranger precisely which of the two is wrong is a free oracle
      // for finding out whether an email address is on the guestlist.
      return NextResponse.json(
        {
          message: viewer.subject
            ? "Only attendees can post to the VIBEZ feed"
            : "Show the QR code on your ticket to join this feed",
        },
        { status: 403 }
      );
    }

    const budget = await postBudget(
      eventId,
      viewer.userId ?? "",
      viewer.subject,
      budgetLimits(settings)
    );
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

    // A guest may say what to call themselves. Trimmed and capped, because this
    // string is rendered on the feed and is not HTML-escaped by everyone who
    // reads it later.
    const caption =
      typeof body.caption === "string" && body.caption.trim()
        ? body.caption.trim().slice(0, 140)
        : null;

    // Who someone is comes from the session or the ticket, never the body.
    // A guest's display name is the one thing they are allowed to choose, and
    // only for this post.
    let authorName: string;
    let authorImageUrl: string | undefined;

    if (viewer.userId) {
      const dbUser = await prisma.user.findUnique({
        where: { id: viewer.userId },
        select: { firstName: true, lastName: true, imageUrl: true },
      });
      authorName = [dbUser?.firstName, dbUser?.lastName].filter(Boolean).join(" ");
      authorImageUrl = dbUser?.imageUrl ?? undefined;
    } else {
      const claimed = typeof body.authorName === "string" ? body.authorName.trim() : "";
      authorName = claimed.slice(0, 40);
    }

    if (!authorName) authorName = "Guest";

    // Which filter produced these bytes. Only recorded when the organizer
    // actually allows a choice — otherwise the client sending one is ignored and
    // the post is filed under the event's own look, which is what actually
    // happened to the pixels.
    const filterId =
      settings.allowFilterChoice && isVibezFilterId(body.filterId)
        ? body.filterId
        : settings.defaultFilterId;

    const post = await prisma.vibezPost.create({
      data: {
        eventId,
        userId: viewer.userId,
        authorSubject: viewer.subject!,
        authorName: authorName.slice(0, 200),
        authorImageUrl,
        imageUrl,
        caption: settings.allowCaptions ? caption : null,
        filterId,
        // The client claims whether it drew a watermark. It is only ever true when
        // the organizer has one switched on, so trusting the flag cannot be used
        // to claim a branded photo on an unbranded feed.
        watermarkApplied: settings.watermarkEnabled && body.watermarkApplied === true,
        // Which door the photo came through, for the scan stats.
        spotId: viewer.spotId,
        // 'approve' mode parks it out of the live feed until a moderator looks.
        moderationStatus: settings.moderationMode === "approve" ? "pending" : "approved",
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
 * remove anyone's.
 *
 * The file is NOT deleted here. It used to be, and PATCH then let a moderator
 * restore the row — which put a row pointing at a deleted file back in front of
 * the room as a broken image. Removal now only hides the post; the file is
 * deleted by the purge job once the removal is old enough that nobody is going
 * to change their mind, and `filePurgedAt` records that it happened.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;

    const { viewer, access } = await resolveAccess(eventId);
    if (!viewer.subject) {
      return NextResponse.json({ message: "Sign in first" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const postId = typeof body.postId === "string" ? body.postId : null;
    if (!postId) {
      return NextResponse.json({ message: "postId is required" }, { status: 400 });
    }

    const post = await prisma.vibezPost.findUnique({
      where: { id: postId },
      select: {
        id: true,
        eventId: true,
        authorSubject: true,
        userId: true,
        imageUrl: true,
        removedAt: true,
      },
    });

    if (!post || post.eventId !== eventId) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }

    // Already gone; removing twice is not an error, it just has to be safe.
    if (post.removedAt) {
      return NextResponse.json({ post: { id: post.id, removedAt: post.removedAt } });
    }

    // Authorship is by subject, so a guest can take down their own photo without
    // ever having had an account.
    const isAuthor = post.authorSubject === viewer.subject || post.userId === viewer.subject;

    if (!isAuthor && !canModerate(access)) {
      return NextResponse.json({ message: "Not allowed" }, { status: 403 });
    }

    const updated = await prisma.vibezPost.update({
      where: { id: post.id },
      data: {
        removedAt: new Date(),
        removedBy: viewer.userId,
        removedReason: isAuthor && !canModerate(access) ? "author" : "moderator",
      },
      select: { id: true, removedAt: true },
    });

    return NextResponse.json({ post: updated });
  } catch (error) {
    console.error("VIBEZ DELETE error:", error);
    return NextResponse.json({ message: "Failed to remove post" }, { status: 500 });
  }
}

/**
 * PATCH /api/events/[eventId]/vibez
 * Put a removed post back. Moderators only.
 *
 * If the file has already been purged the row cannot be shown as a working
 * image, so this says so rather than silently restoring something that will
 * render as a broken tile.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;

    const { viewer, access } = await resolveAccess(eventId);
    if (!viewer.subject) {
      return NextResponse.json({ message: "Sign in first" }, { status: 401 });
    }
    if (!canModerate(access)) {
      return NextResponse.json({ message: "Not allowed" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const postId = typeof body.postId === "string" ? body.postId : null;
    if (!postId) {
      return NextResponse.json({ message: "postId is required" }, { status: 400 });
    }

    const post = await prisma.vibezPost.findUnique({
      where: { id: postId },
      select: { id: true, eventId: true, removedAt: true, filePurgedAt: true },
    });
    if (!post || post.eventId !== eventId) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }
    if (!post.removedAt) {
      return NextResponse.json({ message: "That post is already live" }, { status: 400 });
    }
    if (post.filePurgedAt) {
      return NextResponse.json(
        { message: "That photo is past the point where it can be restored" },
        { status: 409 }
      );
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
