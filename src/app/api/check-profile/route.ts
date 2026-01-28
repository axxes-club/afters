import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ hasProfile: false }, { status: 401 });
    }

    const profile = await prisma.organizerProfile.findUnique({
      where: { userId },
    });

    return NextResponse.json({ hasProfile: !!profile }, { status: 200 });
  } catch (error) {
    console.error("Error checking organizer profile:", error);
    return NextResponse.json({ hasProfile: false }, { status: 500 });
  }
}