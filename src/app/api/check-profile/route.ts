import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureUserSynced } from "@/lib/sync-user";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ hasProfile: false }, { status: 401 });
    }

    // Ensure the user exists in our database before checking profile
    await ensureUserSynced(userId);

    const profile = await prisma.organizerProfile.findUnique({
      where: { userId },
    });

    return NextResponse.json({ hasProfile: !!profile }, { status: 200 });
  } catch (error) {
    console.error("Error checking organizer profile:", error);
    return NextResponse.json({ hasProfile: false }, { status: 500 });
  }
}