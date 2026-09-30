import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEffectiveUserId } from "@/lib/auth-utils";
import { getOrganizerContext, ORGANIZER_COOKIE } from "@/lib/organizer-context";

export async function GET() {
  const userId = await getEffectiveUserId();
  if (!userId) return NextResponse.json({}, { status: 401 });
  const workspaces = await prisma.organizerProfile.findMany({
    where: { OR: [{ userId }, { staffMembers: { some: { userId, status: "ACTIVE" } } }] },
    select: { id: true, displayName: true, userId: true },
    orderBy: { displayName: "asc" },
  });
  const context = await getOrganizerContext();
  return NextResponse.json({ currentId: context?.profile.id, workspaces: workspaces.map(({ userId: ownerId, ...w }) => ({ ...w, role: ownerId === userId ? "Owner" : "Staff" })) });
}
export async function POST(request: Request) {
  const userId = await getEffectiveUserId();
  if (!userId) return NextResponse.json({}, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({}, { status: 400 }); }
  const id = body && typeof body === "object" ? (body as { id?: unknown }).id : undefined;
  if (typeof id !== "string") return NextResponse.json({}, { status: 400 });
  const profile = await prisma.organizerProfile.findFirst({ where: { id, OR: [{ userId }, { staffMembers: { some: { userId, status: "ACTIVE" } } }] } });
  if (!profile) return NextResponse.json({}, { status: 403 });
  const response = NextResponse.json({ success: true });
  response.cookies.set(ORGANIZER_COOKIE, profile.id, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 31536000 });
  return response;
}
