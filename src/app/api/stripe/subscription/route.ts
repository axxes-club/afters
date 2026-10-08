import { getEffectiveUserId } from "@/lib/auth-utils";
import { organizerWhere } from "@/lib/organizer-context";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSignaturePlan, PLAN_LABELS } from "@/lib/subscription";
import { createCheckout, PaymentsError } from "@/lib/axxes-payments";
import { SIGNATURE_LOOKUP_KEYS, signatureSalesOpen } from "@/lib/signature-billing";
import { publicOrigin } from "@/lib/public-origin";
import { Plan } from "@prisma/client";

// POST - Start a Signature subscription on AXXES Payments (payments.axxes.app)
export async function POST(req: NextRequest) {
  const userId = await getEffectiveUserId();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!signatureSalesOpen())
    return NextResponse.json({ error: "Signature is free during beta" }, { status: 403 });

  let body: { plan?: string } = {};
  try {
    body = await req.json();
  } catch {
    // empty body = default plan
  }
  const requestedPlan = (body.plan as Plan) || "SIGNATURE_30D";
  const lookupKey = SIGNATURE_LOOKUP_KEYS[requestedPlan];
  if (!lookupKey) {
    return NextResponse.json(
      { error: "Invalid plan. Use SIGNATURE_30D, SIGNATURE_180D, or SIGNATURE_360D" },
      { status: 400 }
    );
  }

  const profile = await prisma.organizerProfile.findUnique({
    where: await organizerWhere("owner"),
    include: { user: { select: { email: true } }, subscription: true },
  });
  if (!profile) {
    return NextResponse.json({ error: "Organizer profile required" }, { status: 404 });
  }
  if (
    profile.subscription &&
    isSignaturePlan(profile.subscription.plan) &&
    ["ACTIVE", "TRIALING", "PAST_DUE"].includes(profile.subscription.status)
  ) {
    return NextResponse.json({ error: "Already on a Signature plan" }, { status: 400 });
  }

  // One 7-day trial per organizer, monthly plan only.
  const hadTrial = profile.subscription?.plan === "SIGNATURE_TRIAL_7D" || !!profile.subscription?.trialEndsAt;
  const trialDays = requestedPlan === "SIGNATURE_30D" && !hadTrial ? 7 : undefined;

  try {
    const checkout = await createCheckout({
      product: "afters",
      purchase: "subscription",
      lookupKey,
      trialDays,
      reference: profile.id,
      // A fresh key per attempt; Payments checkouts expire on their own if abandoned.
      idempotencyKey: `afters-sig-${profile.id}-${requestedPlan}-${Date.now()}`.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 100),
      returnUrl: `${publicOrigin(req)}/api/axxes-payments/return`,
      email: profile.user.email ?? undefined,
    });
    return NextResponse.json({ url: checkout.checkout_url });
  } catch (error) {
    console.error("Signature checkout failed:", error instanceof PaymentsError ? error.status : error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 502 });
  }
}

// GET - Get current subscription status
export async function GET() {
  const userId = await getEffectiveUserId();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.organizerProfile.findUnique({
    where: await organizerWhere("owner"),
    include: { subscription: true },
  });

  if (!profile) {
    return NextResponse.json(
      { error: "No organizer profile" },
      { status: 404 }
    );
  }

  const sub = profile.subscription;

  return NextResponse.json({
    plan: sub?.plan || "FREE",
    status: sub?.status || "ACTIVE",
    label: PLAN_LABELS[sub?.plan || "FREE"],
    isSignature: sub ? isSignaturePlan(sub.plan) : false,
    trialEndsAt: sub?.trialEndsAt,
    currentPeriodEnd: sub?.currentPeriodEnd,
    cancelAtPeriodEnd: sub?.cancelAtPeriodEnd || false,
    salesOpen: signatureSalesOpen(),
  });
}
