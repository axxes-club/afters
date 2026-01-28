import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organizerId } = await req.json();

    if (!organizerId) {
      return NextResponse.json({ error: "Organizer ID is required" }, { status: 400 });
    }

    // Check if following exists
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: organizerId,
        },
      },
    });

    if (existingFollow) {
      // Unfollow
      await prisma.follow.delete({
        where: {
          id: existingFollow.id,
        },
      });
      return NextResponse.json({ following: false });
    } else {
      // Follow
      await prisma.follow.create({
        data: {
          followerId: userId,
          followingId: organizerId,
        },
      });
      return NextResponse.json({ following: true });
    }
  } catch (error) {
    console.error("Error in follow toggle:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
