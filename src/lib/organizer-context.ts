import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getEffectiveUserId } from "@/lib/auth-utils";
import { hasPermission, type Permission } from "@/lib/subscription";

export const ORGANIZER_COOKIE = "afters-organizer";

/** A remembered selection never substitutes for current ownership/membership. */
export async function getOrganizerContext(permission?: Permission | "owner") {
  const userId = await getEffectiveUserId();
  if (!userId) return null;
  const selectedId = (await cookies()).get(ORGANIZER_COOKIE)?.value;
  const owner = await prisma.organizerProfile.findUnique({ where: { userId } });
  const selected = selectedId && selectedId !== owner?.id
    ? await prisma.organizerProfile.findFirst({ where: { id: selectedId, staffMembers: { some: { userId, status: "ACTIVE" } } } })
    : owner;
  // Revocation removes access immediately; invalid cookies fall back to own workspace.
  const profile = selected || owner;
  if (!profile) return null;
  const isOwner = profile.userId === userId;
  if (permission === "owner" && !isOwner) return null;
  if (permission && permission !== "owner" && !await hasPermission(userId, profile.id, permission)) return null;
  return { profile, userId, isOwner };
}

export async function organizerWhere(permission?: Permission | "owner") {
  const context = await getOrganizerContext(permission);
  // An absent/forbidden context cannot accidentally become an unscoped query.
  return { id: context?.profile.id ?? "__no_authorized_organizer__" };
}
