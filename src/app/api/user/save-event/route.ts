import { getUserId } from "@/lib/auth/session";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await req.json();

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }

    // Check if saved event exists
    const existingSave = await prisma.savedEvent.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });

    if (existingSave) {
      // Unsave
      await prisma.savedEvent.delete({
        where: {
          id: existingSave.id,
        },
      });
      return NextResponse.json({ saved: false });
    } else {
      // Save
      await prisma.savedEvent.create({
        data: {
          userId,
          eventId,
        },
      });
      return NextResponse.json({ saved: true });
    }
  } catch (error) {
    console.error("Error in save event toggle:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
