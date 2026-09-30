import { getEffectiveUserId } from "@/lib/auth-utils";
import { organizerWhere } from "@/lib/organizer-context";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export interface VenueSuggestion {
  venueName: string;
  venueAddress: string;
  city: string;
  state: string | null;
  count: number; // How many times this venue was used
}

export async function GET() {
  try {
    const userId = await getEffectiveUserId();

    if (!userId) {
      return NextResponse.json<VenueSuggestion[]>([]);
    }

    const profile = await prisma.organizerProfile.findUnique({
      where: await organizerWhere("events.edit"),
      select: { id: true },
    });

    if (!profile) {
      return NextResponse.json<VenueSuggestion[]>([]);
    }

    // Fetch unique venues from user's events, ordered by most recently used
    const events = await prisma.event.findMany({
      where: { organizerId: profile.id },
      select: {
        venueName: true,
        venueAddress: true,
        city: true,
        state: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Group by venue to get unique venues with count
    const venueMap = new Map<string, VenueSuggestion>();

    for (const event of events) {
      // Create a key from venue name + address for uniqueness
      const key = `${event.venueName.toLowerCase()}|${event.venueAddress.toLowerCase()}`;

      if (venueMap.has(key)) {
        const existing = venueMap.get(key)!;
        existing.count++;
      } else {
        venueMap.set(key, {
          venueName: event.venueName,
          venueAddress: event.venueAddress,
          city: event.city,
          state: event.state,
          count: 1,
        });
      }
    }

    // Convert to array and sort by count (most used first)
    const venues = Array.from(venueMap.values()).sort((a, b) => b.count - a.count);

    return NextResponse.json<VenueSuggestion[]>(venues);
  } catch (error) {
    console.error("Error fetching venue history:", error);
    return NextResponse.json<VenueSuggestion[]>([]);
  }
}
