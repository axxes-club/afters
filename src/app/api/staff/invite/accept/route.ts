import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json(
      { error: "Must be logged in" },
      { status: 401 }
    );

  const body = await req.json();
  const { token } = body;

  if (!token) {
    return NextResponse.json(
      { error: "Invite token required" },
      { status: 400 }
    );
  }

  const invite = await prisma.staffInvite.findUnique({
    where: { token },
    include: { organizerProfile: true },
  });

  if (!invite) {
    return NextResponse.json({ error: "Invalid invite" }, { status: 404 });
  }

  if (invite.acceptedAt) {
    return NextResponse.json(
      { error: "Invite already accepted" },
      { status: 400 }
    );
  }

  if (invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invite expired" }, { status: 400 });
  }

  // Verify the accepting user exists
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Create staff member and mark invite as accepted
  const [staffMember] = await prisma.$transaction([
    prisma.staffMember.create({
      data: {
        organizerProfileId: invite.organizerProfileId,
        userId,
        role: invite.role,
        invitedBy: invite.organizerProfile.userId,
      },
    }),
    prisma.staffInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date(), acceptedBy: userId },
    }),
  ]);

  return NextResponse.json({
    success: true,
    staffMember,
    organizerName: invite.organizerProfile.displayName,
  });
}
