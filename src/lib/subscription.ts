import { prisma } from "./prisma";
import { Plan } from "@prisma/client";

// ─── Plan helpers ───

/** All plans that grant Signature-level access */
const SIGNATURE_PLANS: Plan[] = [
  "SIGNATURE_TRIAL_7D",
  "SIGNATURE_30D",
  "SIGNATURE_180D",
  "SIGNATURE_360D",
  "SIGNATURE_FF",
];

/** Plans that are paid via Stripe (need a subscription ID) */
export const PAID_PLANS: Plan[] = [
  "SIGNATURE_30D",
  "SIGNATURE_180D",
  "SIGNATURE_360D",
];

/** Human-readable labels */
export const PLAN_LABELS: Record<Plan, string> = {
  FREE: "Free",
  SIGNATURE_TRIAL_7D: "Signature (Trial)",
  SIGNATURE_30D: "Signature (Monthly)",
  SIGNATURE_180D: "Signature (6-Month)",
  SIGNATURE_360D: "Signature (Annual)",
  SIGNATURE_FF: "Signature (Friends & Family)",
};

/** Billing interval in days for each paid plan */
export const PLAN_INTERVAL_DAYS: Partial<Record<Plan, number>> = {
  SIGNATURE_30D: 30,
  SIGNATURE_180D: 180,
  SIGNATURE_360D: 360,
};

/** Stripe recurring interval for each paid plan */
export const PLAN_STRIPE_INTERVAL: Partial<
  Record<Plan, { interval: "month" | "year"; interval_count: number }>
> = {
  SIGNATURE_30D: { interval: "month", interval_count: 1 },
  SIGNATURE_180D: { interval: "month", interval_count: 6 },
  SIGNATURE_360D: { interval: "year", interval_count: 1 },
};

/** Monthly price in cents for each paid plan */
export const PLAN_PRICES: Partial<Record<Plan, number>> = {
  SIGNATURE_30D: 4500, // $45/mo
  SIGNATURE_180D: 22500, // $225 / 6mo ($37.50/mo — save 17%)
  SIGNATURE_360D: 39600, // $396 / yr ($33/mo — save 27%)
};

export function isSignaturePlan(plan: Plan): boolean {
  return SIGNATURE_PLANS.includes(plan);
}

export function isPaidPlan(plan: Plan): boolean {
  return PAID_PLANS.includes(plan);
}

// ─── Permission definitions per role ───

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

// ─── Subscription checks ───

/**
 * Check if an organizer has any active Signature plan.
 * 
 * NOTE: Paywall removed — all organizers now have full access to all features.
 * This function always returns true regardless of subscription status.
 */
export async function hasSignaturePlan(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _organizerProfileId: string
): Promise<boolean> {
  // Paywall removed: all organizers get full access
  return true;
}

/**
 * Check if staff features are available.
 * 
 * NOTE: Paywall removed — all organizers can use staff features.
 */
export async function canUseStaff(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _organizerProfileId: string
): Promise<boolean> {
  // Paywall removed: all organizers get staff features
  return true;
}

/** Get organizer's subscription */
export async function getSubscription(organizerProfileId: string) {
  return prisma.subscription.findUnique({
    where: { organizerProfileId },
  });
}

/** Get or create subscription (defaults to FREE) */
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

/** Check if a user has a specific permission for an organizer */
export async function hasPermission(
  userId: string,
  organizerProfileId: string,
  permission: string
): Promise<boolean> {
  const profile = await prisma.organizerProfile.findUnique({
    where: { id: organizerProfileId },
  });
  if (profile?.userId === userId) return true;

  const staff = await prisma.staffMember.findUnique({
    where: {
      organizerProfileId_userId: {
        organizerProfileId,
        userId,
      },
    },
  });

  if (!staff || staff.status !== "ACTIVE") return false;

  if (staff.customPermissions.length > 0) {
    return staff.customPermissions.includes(permission);
  }

  const rolePerms = STAFF_PERMISSIONS[staff.role] as readonly string[];
  return rolePerms.includes(permission);
}

/** Get staff count for an organizer */
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
