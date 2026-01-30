import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canUseStaff } from "@/lib/subscription";

// GET - List staff members for the organizer
export async function GET() {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.organizerProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    return NextResponse.json(
      { error: "Organizer profile required" },
      { status: 404 }
    );
  }

  // Check Signature plan
  const canUse = await canUseStaff(profile.id);
  if (!canUse) {
    return NextResponse.json(
      {
        error: "Staff management requires Signature plan",
        requiresUpgrade: true,
      },
      { status: 403 }
    );
  }

  const staff = await prisma.staffMember.findMany({
    where: { organizerProfileId: profile.id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          imageUrl: true,
          username: true,
        },
      },
    },
    orderBy: { addedAt: "desc" },
  });

  const invites = await prisma.staffInvite.findMany({
    where: {
      organizerProfileId: profile.id,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ staff, invites });
}

// PATCH - Update a staff member's role
export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { staffId, role, status } = body;

  const profile = await prisma.organizerProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    return NextResponse.json(
      { error: "Organizer profile required" },
      { status: 404 }
    );
  }

  // Verify this staff member belongs to the organizer
  const staffMember = await prisma.staffMember.findFirst({
    where: { id: staffId, organizerProfileId: profile.id },
  });

  if (!staffMember) {
    return NextResponse.json(
      { error: "Staff member not found" },
      { status: 404 }
    );
  }

  const updated = await prisma.staffMember.update({
    where: { id: staffId },
    data: {
      ...(role && { role }),
      ...(status && { status }),
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          imageUrl: true,
        },
      },
    },
  });

  return NextResponse.json(updated);
}

// DELETE - Remove a staff member
export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const staffId = searchParams.get("id");

  if (!staffId) {
    return NextResponse.json(
      { error: "Staff ID required" },
      { status: 400 }
    );
  }

  const profile = await prisma.organizerProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    return NextResponse.json(
      { error: "Organizer profile required" },
      { status: 404 }
    );
  }

  await prisma.staffMember.delete({
    where: { id: staffId, organizerProfileId: profile.id },
  });

  return NextResponse.json({ success: true });
}
