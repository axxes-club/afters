import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth-utils";
import { Plan } from "@prisma/client";
import { PLAN_LABELS } from "@/lib/subscription";

// POST - Superadmin: set an organizer's plan (primarily for Friends & Family)
export async function POST(req: NextRequest) {
  try {
    await requireSuperAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const { organizerProfileId, plan, reason } = body as {
    organizerProfileId: string;
    plan: Plan;
    reason?: string;
  };

  if (!organizerProfileId || !plan) {
    return NextResponse.json(
      { error: "organizerProfileId and plan are required" },
      { status: 400 }
    );
  }

  // Validate plan
  const validPlans: Plan[] = [
    "FREE",
    "SIGNATURE_TRIAL_7D",
    "SIGNATURE_30D",
    "SIGNATURE_180D",
    "SIGNATURE_360D",
    "SIGNATURE_FF",
  ];
  if (!validPlans.includes(plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  // Verify the organizer exists
  const profile = await prisma.organizerProfile.findUnique({
    where: { id: organizerProfileId },
    include: { user: { select: { email: true, firstName: true, lastName: true } } },
  });

  if (!profile) {
    return NextResponse.json({ error: "Organizer not found" }, { status: 404 });
  }

  // Upsert subscription
  const isSignature = plan !== "FREE";
  const sub = await prisma.subscription.upsert({
    where: { organizerProfileId },
    create: {
      organizerProfileId,
      plan,
      status: isSignature ? "ACTIVE" : "ACTIVE",
      // F&F has no expiry
      ...(plan === "SIGNATURE_FF"
        ? {}
        : plan === "SIGNATURE_TRIAL_7D"
        ? { trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
        : {}),
    },
    update: {
      plan,
      status: "ACTIVE",
      cancelAtPeriodEnd: false,
      // Clear Stripe fields for non-Stripe plans
      ...(plan === "SIGNATURE_FF" || plan === "FREE"
        ? {
            stripeSubscriptionId: null,
            stripePriceId: null,
            trialEndsAt: null,
            currentPeriodStart: null,
            currentPeriodEnd: null,
          }
        : {}),
    },
  });

  // If downgrading to FREE, suspend staff
  if (plan === "FREE") {
    await prisma.staffMember.updateMany({
      where: { organizerProfileId },
      data: { status: "SUSPENDED" },
    });
  }

  // If upgrading to any Signature, reactivate suspended staff
  if (isSignature) {
    await prisma.staffMember.updateMany({
      where: { organizerProfileId, status: "SUSPENDED" },
      data: { status: "ACTIVE" },
    });
  }

  return NextResponse.json({
    success: true,
    subscription: sub,
    label: PLAN_LABELS[plan],
    organizer: {
      id: profile.id,
      displayName: profile.displayName,
      email: profile.user.email,
    },
    reason: reason || null,
  });
}

// GET - Superadmin: list all subscriptions
export async function GET() {
  try {
    await requireSuperAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const subscriptions = await prisma.subscription.findMany({
    include: {
      organizerProfile: {
        select: {
          id: true,
          displayName: true,
          slug: true,
          user: {
            select: { email: true, firstName: true, lastName: true },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({
    subscriptions: subscriptions.map((s) => ({
      ...s,
      label: PLAN_LABELS[s.plan],
    })),
  });
}
