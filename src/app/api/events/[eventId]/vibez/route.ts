import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Check if the current user is an attendee (or staff) for the event.
 * Attendees: have a valid ticket (userId or order email), RSVP (email), guestlist (email), or are staff for the organizer.
 */
async function isAttendeeOrStaff(
  eventId: string,
  userId: string,
  userEmail: string | null
): Promise<boolean> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { organizerId: true },
  });
  if (!event) return false;

  // Staff for this event's organizer
  const staff = await prisma.staffMember.findFirst({
    where: {
      userId,
      organizerProfileId: event.organizerId,
      status: "ACTIVE",
    },
  });
  if (staff) return true;

  // Ticket: by userId or by order email
  const ticketByUser = await prisma.ticket.findFirst({
    where: {
      eventId,
      userId,
      status: { in: ["VALID", "CHECKED_IN"] },
    },
  });
  if (ticketByUser) return true;

  if (userEmail) {
    const ticketByEmail = await prisma.ticket.findFirst({
      where: {
        eventId,
        status: { in: ["VALID", "CHECKED_IN"] },
        order: { email: { equals: userEmail, mode: "insensitive" } },
      },
    });
    if (ticketByEmail) return true;

    const rsvp = await prisma.rsvp.findFirst({
      where: {
        eventId,
        email: { equals: userEmail, mode: "insensitive" },
        status: { in: ["CONFIRMED", "CHECKED_IN"] },
      },
    });
    if (rsvp) return true;

    const guestlist = await prisma.guestlistEntry.findFirst({
      where: {
        eventId,
        email: { equals: userEmail, mode: "insensitive" },
      },
    });
    if (guestlist) return true;
  }

  return false;
}

/**
 * GET /api/events/[eventId]/vibez
 * List vibez posts. Only for attendees (or organizer/staff). Feed only available when event has started and vibez is enabled.
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
      select: {
        id: true,
        vibezEnabled: true,
        startsAt: true,
        organizerId: true,
      },
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

    const now = new Date();
    const eventStarted = new Date(event.startsAt) <= now;
    if (!eventStarted) {
      return NextResponse.json(
        { message: "VIBEZ feed is only available after the event starts" },
        { status: 403 }
      );
    }

    // Organizer can always see (no auth required for organizer in dashboard - but this API is also used by guest page)
    let canAccess = false;
    if (userId) {
      const profile = await prisma.organizerProfile.findUnique({
        where: { userId },
      });
      if (profile && event.organizerId === profile.id) {
        canAccess = true;
      }
      if (!canAccess) {
        const user = await currentUser();
        const userEmail = user?.emailAddresses?.[0]?.emailAddress ?? null;
        canAccess = await isAttendeeOrStaff(eventId, userId, userEmail);
      }
    }

    if (!canAccess) {
      return NextResponse.json(
        { message: "Only attendees can view the VIBEZ feed" },
        { status: 403 }
      );
    }

    const posts = await prisma.vibezPost.findMany({
      where: { eventId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("VIBEZ GET error:", error);
    return NextResponse.json(
      { message: "Failed to load feed" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/events/[eventId]/vibez
 * Create a vibez post. Only for attendees. Only when event has started and vibez is enabled.
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

    const user = await currentUser();
    const userEmail = user?.emailAddresses?.[0]?.emailAddress ?? null;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        vibezEnabled: true,
        startsAt: true,
        organizerId: true,
      },
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

    const now = new Date();
    const eventStarted = new Date(event.startsAt) <= now;
    if (!eventStarted) {
      return NextResponse.json(
        { message: "You can only post once the event has started" },
        { status: 403 }
      );
    }

    const canPost = await isAttendeeOrStaff(eventId, userId, userEmail);
    if (!canPost) {
      return NextResponse.json(
        { message: "Only attendees can post to the VIBEZ feed" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { imageUrl, authorName, authorImageUrl } = body;

    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json(
        { message: "imageUrl is required" },
        { status: 400 }
      );
    }

    // Resolve display name and avatar from DB user if we have one
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, imageUrl: true },
    });
    const name =
      authorName?.trim() ||
      [dbUser?.firstName, dbUser?.lastName].filter(Boolean).join(" ") ||
      "Guest";
    const image = authorImageUrl ?? dbUser?.imageUrl ?? null;

    const post = await prisma.vibezPost.create({
      data: {
        eventId,
        userId,
        authorName: name.slice(0, 200),
        authorImageUrl: image ?? undefined,
        imageUrl,
      },
    });

    return NextResponse.json({ post });
  } catch (error) {
    console.error("VIBEZ POST error:", error);
    return NextResponse.json(
      { message: "Failed to post" },
      { status: 500 }
    );
  }
}
