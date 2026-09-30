import { getEffectiveUserId } from "@/lib/auth-utils";
import { organizerWhere } from "@/lib/organizer-context";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canUseStaff } from "@/lib/subscription";

// POST - Send a staff invite
export async function POST(req: NextRequest) {
  const userId = await getEffectiveUserId();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { email, role } = body;

  if (!email || !role) {
    return NextResponse.json(
      { error: "Email and role required" },
      { status: 400 }
    );
  }

  const profile = await prisma.organizerProfile.findUnique({
    where: await organizerWhere("staff.manage"),
  });

  if (!profile) {
    return NextResponse.json(
      { error: "Organizer profile required" },
      { status: 404 }
    );
  }

  const canUse = await canUseStaff(profile.id);
  if (!canUse) {
    return NextResponse.json(
      { error: "Signature plan required" },
      { status: 403 }
    );
  }

  // Check if user is already staff
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const existingStaff = await prisma.staffMember.findUnique({
      where: {
        organizerProfileId_userId: {
          organizerProfileId: profile.id,
          userId: existingUser.id,
        },
      },
    });
    if (existingStaff) {
      return NextResponse.json(
        { error: "User is already a staff member" },
        { status: 400 }
      );
    }
  }

  // Check for existing pending invite
  const existingInvite = await prisma.staffInvite.findFirst({
    where: {
      organizerProfileId: profile.id,
      email,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (existingInvite) {
    return NextResponse.json(
      { error: "Invite already pending for this email" },
      { status: 400 }
    );
  }

  // Create invite (expires in 7 days)
  const invite = await prisma.staffInvite.create({
    data: {
      organizerProfileId: profile.id,
      email,
      role,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return NextResponse.json({
    invite,
    inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL}/invite/${invite.token}`,
  });
}

// DELETE - Revoke an invite
export async function DELETE(req: NextRequest) {
  const userId = await getEffectiveUserId();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const inviteId = searchParams.get("id");

  if (!inviteId) {
    return NextResponse.json(
      { error: "Invite ID required" },
      { status: 400 }
    );
  }

  const profile = await prisma.organizerProfile.findUnique({
    where: await organizerWhere("staff.manage"),
  });

  if (!profile) {
    return NextResponse.json(
      { error: "Organizer profile required" },
      { status: 404 }
    );
  }

  await prisma.staffInvite.delete({
    where: { id: inviteId, organizerProfileId: profile.id },
  });

  return NextResponse.json({ success: true });
}
