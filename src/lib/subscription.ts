import { prisma } from "./prisma";

// Permission definitions per role
export const STAFF_PERMISSIONS = {
  ADMIN: [
    "events.create",
    "events.edit",
    "events.delete",
    "events.publish",
    "tickets.scan",
    "tickets.view",
    "analytics.view",
    "analytics.export",
    "finance.view",
    "messaging.send",
    "staff.manage",
    "settings.edit",
  ],
  SCANNER: ["tickets.scan", "tickets.view"],
  EDITOR: ["events.create", "events.edit", "events.publish"],
  SUPPORT: ["messaging.send", "tickets.view", "analytics.view"],
  FINANCE: ["analytics.view", "analytics.export", "finance.view"],
} as const;

export type Permission =
  (typeof STAFF_PERMISSIONS)[keyof typeof STAFF_PERMISSIONS][number];

// Check if an organizer has Signature plan (active or trialing)
export async function hasSignaturePlan(
  organizerProfileId: string
): Promise<boolean> {
  const sub = await prisma.subscription.findUnique({
    where: { organizerProfileId },
  });

  if (!sub) return false;
  if (sub.plan !== "SIGNATURE") return false;

  // Check if active or in valid trial
  if (sub.status === "ACTIVE") return true;
  if (
    sub.status === "TRIALING" &&
    sub.trialEndsAt &&
    sub.trialEndsAt > new Date()
  )
    return true;

  return false;
}

// Check if staff features are available
export async function canUseStaff(
  organizerProfileId: string
): Promise<boolean> {
  return hasSignaturePlan(organizerProfileId);
}

// Get organizer's subscription
export async function getSubscription(organizerProfileId: string) {
  return prisma.subscription.findUnique({
    where: { organizerProfileId },
  });
}

// Get or create subscription (defaults to FREE)
export async function getOrCreateSubscription(organizerProfileId: string) {
  let sub = await prisma.subscription.findUnique({
    where: { organizerProfileId },
  });

  if (!sub) {
    sub = await prisma.subscription.create({
      data: {
        organizerProfileId,
        plan: "FREE",
        status: "ACTIVE",
      },
    });
  }

  return sub;
}

// Check if a user has a specific permission for an organizer
export async function hasPermission(
  userId: string,
  organizerProfileId: string,
  permission: string
): Promise<boolean> {
  // Check if user is the organizer themselves
  const profile = await prisma.organizerProfile.findUnique({
    where: { id: organizerProfileId },
  });
  if (profile?.userId === userId) return true; // Owner has all permissions

  // Check staff membership
  const staff = await prisma.staffMember.findUnique({
    where: {
      organizerProfileId_userId: {
        organizerProfileId,
        userId,
      },
    },
  });

  if (!staff || staff.status !== "ACTIVE") return false;

  // Check custom permissions first, then role defaults
  if (staff.customPermissions.length > 0) {
    return staff.customPermissions.includes(permission);
  }

  const rolePerms = STAFF_PERMISSIONS[staff.role] as readonly string[];
  return rolePerms.includes(permission);
}

// Get staff count for an organizer
export async function getStaffCount(
  organizerProfileId: string
): Promise<number> {
  return prisma.staffMember.count({
    where: {
      organizerProfileId,
      status: "ACTIVE",
    },
  });
}
