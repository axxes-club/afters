import { getEffectiveUserId } from "@/lib/auth-utils";
import { organizerWhere } from "@/lib/organizer-context";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export interface SidebarEvent {
  id: string;
  title: string;
  slug: string;
  startsAt: string;
  isPublished: boolean;
  flyerUrl: string | null;
}

export interface SidebarEventsResponse {
  upcoming: SidebarEvent[];
  past: SidebarEvent[];
  total: number;
}

export async function GET() {
  try {
    const userId = await getEffectiveUserId();

    if (!userId) {
      return NextResponse.json<SidebarEventsResponse>({
        upcoming: [],
        past: [],
        total: 0,
      });
    }

    const profile = await prisma.organizerProfile.findUnique({
      where: await organizerWhere(),
      select: { id: true },
    });

    if (!profile) {
      return NextResponse.json<SidebarEventsResponse>({
        upcoming: [],
        past: [],
        total: 0,
      });
    }

    const now = new Date();

    // Fetch upcoming events (startsAt > now), sorted soonest first
    const upcoming = await prisma.event.findMany({
      where: {
        organizerId: profile.id,
        startsAt: { gt: now },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        startsAt: true,
        isPublished: true,
        flyerUrl: true,
      },
      orderBy: { startsAt: "asc" },
      take: 15,
    });

    // Fetch past events (startsAt <= now), sorted most recent first
    const past = await prisma.event.findMany({
      where: {
        organizerId: profile.id,
        startsAt: { lte: now },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        startsAt: true,
        isPublished: true,
        flyerUrl: true,
      },
      orderBy: { startsAt: "desc" },
      take: 15,
    });

    // Get total count
    const total = await prisma.event.count({
      where: { organizerId: profile.id },
    });

    // Transform dates to ISO strings for JSON serialization
    const transformEvent = (event: typeof upcoming[number]): SidebarEvent => ({
      id: event.id,
      title: event.title,
      slug: event.slug,
      startsAt: event.startsAt.toISOString(),
      isPublished: event.isPublished,
      flyerUrl: event.flyerUrl,
    });

    return NextResponse.json<SidebarEventsResponse>({
      upcoming: upcoming.map(transformEvent),
      past: past.map(transformEvent),
      total,
    });
  } catch (error) {
    console.error("Error fetching sidebar events:", error);
    return NextResponse.json<SidebarEventsResponse>({
      upcoming: [],
      past: [],
      total: 0,
    });
  }
}
