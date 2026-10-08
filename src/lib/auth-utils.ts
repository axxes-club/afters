import { getUserId } from "@/lib/auth/session";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { UserRole } from "@prisma/client";
import { ensureUserSynced } from "./sync-user";
import { SignJWT, jwtVerify } from "jose";

const GHOST_COOKIE = "afters-ghost-user";
const GHOST_ADMIN_COOKIE = "afters-ghost-admin";

function getSecret() {
  const secret = process.env.SCANNER_JWT_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("SCANNER_JWT_SECRET or JWT_SECRET environment variable is required for ghost user functionality");
  }
  return new TextEncoder().encode(secret);
}

export interface GhostUserPayload {
  userId: string;
  adminId: string;
  createdAt: number;
  expiresAt: number;
}

export async function createGhostUserToken(
  userId: string,
  adminId: string,
  maxAgeSeconds: number = 14400 // 4 hours
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({
    userId,
    adminId,
    createdAt: now,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(now + maxAgeSeconds)
    .sign(getSecret());
}

export async function verifyGhostUserToken(token: string): Promise<GhostUserPayload | null> {
  try {
    const { payload } = await jwtVerify<GhostUserPayload>(token, getSecret());
    return payload;
  } catch {
    return null;
  }
}

// Check if currently ghosting and return the ghost user ID
export async function getGhostUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const ghostToken = cookieStore.get(GHOST_COOKIE)?.value;
    const adminToken = cookieStore.get(GHOST_ADMIN_COOKIE)?.value;

    // Both tokens must exist and be valid
    if (!ghostToken || !adminToken) {
      return null;
    }

    const ghostPayload = await verifyGhostUserToken(ghostToken);
    const adminPayload = await verifyGhostUserToken(adminToken);

    // Only return ghost user if both payloads are valid and adminId matches
    if (ghostPayload && adminPayload && ghostPayload.adminId === adminPayload.userId) {
      return ghostPayload.userId;
    }
    return null;
  } catch {
    return null;
  }
}

// Get the real admin user ID when ghosting
export async function getRealAdminId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get(GHOST_ADMIN_COOKIE)?.value;

    if (!adminToken) {
      return null;
    }

    const adminPayload = await verifyGhostUserToken(adminToken);
    return adminPayload?.userId || null;
  } catch {
    return null;
  }
}

// Get the ghost user payload (for advanced checks)
export async function getGhostUserPayload(): Promise<GhostUserPayload | null> {
  try {
    const cookieStore = await cookies();
    const ghostToken = cookieStore.get(GHOST_COOKIE)?.value;

    if (!ghostToken) {
      return null;
    }

    return await verifyGhostUserToken(ghostToken);
  } catch {
    return null;
  }
}

// Set ghost user cookies with JWT tokens
export async function setGhostUser(
  userId: string,
  adminId: string,
  maxAgeSeconds: number = 14400 // 4 hours
): Promise<void> {
  const cookieStore = await cookies();
  const ghostToken = await createGhostUserToken(userId, adminId, maxAgeSeconds);
  const adminToken = await createGhostUserToken(adminId, adminId, maxAgeSeconds);

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    maxAge: maxAgeSeconds,
    path: "/",
  };

  cookieStore.set(GHOST_COOKIE, ghostToken, cookieOptions);
  cookieStore.set(GHOST_ADMIN_COOKIE, adminToken, cookieOptions);
}

// Clear ghost user cookies
export async function clearGhostUser(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(GHOST_COOKIE);
  cookieStore.delete(GHOST_ADMIN_COOKIE);
}

// Get the effective user ID (ghost user if ghosting, real user otherwise)
export async function getEffectiveUserId(): Promise<string | null> {
  const userId = await getUserId();
  if (!userId) return null;

  // Check if ghosting - if so, return the ghost user instead
  const ghostUserId = await getGhostUserId();
  return ghostUserId || userId;
}

export async function getSessionUser() {
  const userId = await getUserId();
  if (!userId) return null;

  // Auto-sync: ensure this person has an afters User row
  await ensureUserSynced(userId);

  // Check if ghosting - if so, return the ghost user instead
  const ghostUserId = await getGhostUserId();
  const effectiveUserId = ghostUserId || userId;

  const user = await prisma.user.findUnique({
    where: { id: effectiveUserId },
    include: {
      organizerProfile: true,
      artistProfile: true,
      personalProfile: true,
    },
  });

  return user;
}

// Get the actual authenticated user (ignoring ghost mode)
// Use this for permission checks that should always use the real admin
export async function getRealSessionUser() {
  const userId = await getUserId();
  if (!userId) return null;

  // Auto-sync: ensure this person has an afters User row
  await ensureUserSynced(userId);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      organizerProfile: true,
      artistProfile: true,
      personalProfile: true,
    },
  });

  return user;
}

export async function isSuperAdmin() {
  // Always check the real user for superadmin status (not ghost)
  const user = await getRealSessionUser();
  return user?.role === UserRole.SUPERADMIN;
}

export async function isAdmin() {
  // Always check the real user for admin status (not ghost)
  const user = await getRealSessionUser();
  return user?.role === UserRole.SUPERADMIN;
}

export async function isOrganizer() {
  const user = await getSessionUser();
  return (
    user?.role === UserRole.ORGANIZER || user?.role === UserRole.SUPERADMIN
  );
}

export async function isArtist() {
  const user = await getSessionUser();
  return user?.role === UserRole.ARTIST || user?.role === UserRole.SUPERADMIN;
}

export async function isPersonal() {
  const user = await getSessionUser();
  return (
    user?.role === UserRole.PERSONAL ||
    user?.role === UserRole.USER ||
    user?.role === UserRole.SUPERADMIN
  );
}

// Profile type checks (for sidebar display) - returns actual profile type only
export async function hasOrganizerProfile() {
  const user = await getSessionUser();
  return user?.role === UserRole.ORGANIZER;
}

export async function hasArtistProfile() {
  const user = await getSessionUser();
  return user?.role === UserRole.ARTIST;
}

export async function hasPersonalProfile() {
  const user = await getSessionUser();
  return user?.role === UserRole.PERSONAL || user?.role === UserRole.USER;
}

export async function requireSuperAdmin() {
  // Always check the real user for superadmin access (not ghost)
  const user = await getRealSessionUser();
  if (user?.role !== UserRole.SUPERADMIN) {
    throw new Error("Unauthorized: Superadmin access required");
  }
  return user;
}

export async function requireAdmin() {
  // Always check the real user for admin access (not ghost)
  const user = await getRealSessionUser();
  if (user?.role !== UserRole.SUPERADMIN) {
    throw new Error("Unauthorized: Admin access required");
  }
  return user;
}

export async function requireOrganizer() {
  const user = await getSessionUser();
  if (user?.role !== UserRole.ORGANIZER && user?.role !== UserRole.SUPERADMIN) {
    throw new Error("Unauthorized: Organizer access required");
  }
  return user;
}

export async function requireArtist() {
  const user = await getSessionUser();
  if (user?.role !== UserRole.ARTIST && user?.role !== UserRole.SUPERADMIN) {
    throw new Error("Unauthorized: Artist access required");
  }
  return user;
}

export async function requirePersonal() {
  const user = await getSessionUser();
  if (
    user?.role !== UserRole.PERSONAL &&
    user?.role !== UserRole.USER &&
    user?.role !== UserRole.SUPERADMIN
  ) {
    throw new Error("Unauthorized: Personal access required");
  }
  return user;
}
