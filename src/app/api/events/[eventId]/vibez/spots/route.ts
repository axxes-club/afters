import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { createSpot, deleteSpot, listSpots, spotUrl } from "@/lib/vibez-spots";

/** Where the printed codes point. Read from the deployment, not hardcoded, so a
 *  staging QR code cannot quietly point at production and a production one can
 *  never point at localhost. */
function baseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") || "https://afters.am"
  );
}

/** Organizer or their active staff. A printed code is a credential, so minting
 *  one is an organizer action, not an attendee one. */
async function requireOrganizer(eventId: string) {
  const { userId } = await auth();
  if (!userId) return false;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      slug: true,
      organizerId: true,
      organizer: { select: { userId: true } },
    },
  });
  if (!event) return false;
  if (event.organizer.userId === userId) return true;

  const staff = await prisma.staffMember.findFirst({
    where: { userId, organizerProfileId: event.organizerId, status: "ACTIVE" },
    select: { id: true },
  });
  return !!staff;
}

/**
 * GET /api/events/[eventId]/vibez/spots
 * The printed codes for this event, each with the URL its QR should encode.
 *
 * The token is returned to organizers only — it is the unguessable half of the
 * credential, and handing it to anyone else turns a sticker on a wall into a
 * link that can be forwarded.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    if (!(await requireOrganizer(eventId))) {
      return NextResponse.json({ message: "Not allowed" }, { status: 403 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { slug: true },
    });
    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    const spots = await listSpots(eventId);
    return NextResponse.json({
      spots: spots.map((s) => ({
        ...s,
        url: spotUrl(baseUrl(), event.slug, s.token),
      })),
    });
  } catch (error) {
    console.error("VIBEZ spots GET error:", error);
    return NextResponse.json({ message: "Failed to load spots" }, { status: 500 });
  }
}

/**
 * POST /api/events/[eventId]/vibez/spots
 * Print another one. Every event gets its first spot automatically when the
 * feed is switched on, so this is for the second, third and "the bar, not the
 * door" cases.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    if (!(await requireOrganizer(eventId))) {
      return NextResponse.json({ message: "Not allowed" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const label = typeof body.label === "string" ? body.label : "";
    const spot = await createSpot(eventId, label);

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { slug: true },
    });

    return NextResponse.json(
      {
        spot: { ...spot, url: event ? spotUrl(baseUrl(), event.slug, spot.token) : null },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("VIBEZ spots POST error:", error);
    return NextResponse.json({ message: "Failed to create spot" }, { status: 500 });
  }
}

/**
 * DELETE /api/events/[eventId]/vibez/spots
 * Take a printed code out of service.
 *
 * Photos that came in through it survive: VibezPost.spotId is ON DELETE SET NULL,
 * so tidying up a sticker does not delete anybody's pictures of the night.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    if (!(await requireOrganizer(eventId))) {
      return NextResponse.json({ message: "Not allowed" }, { status: 403 });
    }

    const spotId = new URL(req.url).searchParams.get("spotId");
    if (!spotId) {
      return NextResponse.json({ message: "spotId is required" }, { status: 400 });
    }

    // eventId comes from the route, never the query, so this cannot reach
    // another event's spot.
    await deleteSpot(eventId, spotId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("VIBEZ spots DELETE error:", error);
    return NextResponse.json({ message: "Failed to delete spot" }, { status: 500 });
  }
}
