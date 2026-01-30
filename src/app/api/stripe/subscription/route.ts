import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

// POST - Create checkout session for Signature subscription
export async function POST() {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.organizerProfile.findUnique({
    where: { userId },
    include: { user: { select: { email: true } }, subscription: true },
  });

  if (!profile) {
    return NextResponse.json(
      { error: "Organizer profile required" },
      { status: 404 }
    );
  }

  // Already subscribed?
  if (
    profile.subscription?.plan === "SIGNATURE" &&
    (profile.subscription.status === "ACTIVE" ||
      profile.subscription.status === "TRIALING")
  ) {
    return NextResponse.json(
      { error: "Already on Signature plan" },
      { status: 400 }
    );
  }

  // Get or create Stripe customer
  let customerId = profile.subscription?.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile.user.email,
      metadata: {
        organizerProfileId: profile.id,
        userId,
      },
    });
    customerId = customer.id;
  }

  // Create checkout session with 7-day trial
  let priceId = process.env.STRIPE_SIGNATURE_PRICE_ID;

  if (!priceId) {
    // Create the price dynamically if not set
    const product = await stripe.products.create({
      name: "Afters Signature",
      description:
        "Priority placement, reduced fees, staff management, and more",
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: 4500, // $45.00
      currency: "usd",
      recurring: { interval: "month" },
    });

    // Log for manual .env update
    console.log(
      `Created Stripe Price: ${price.id} - Add STRIPE_SIGNATURE_PRICE_ID=${price.id} to .env`
    );

    priceId = price.id;
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "subscription",
    subscription_data: {
      trial_period_days: 7,
      metadata: {
        organizerProfileId: profile.id,
      },
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?subscription=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?subscription=cancelled`,
    metadata: {
      organizerProfileId: profile.id,
      userId,
    },
  });

  return NextResponse.json({ url: session.url });
}

// GET - Get current subscription status
export async function GET() {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.organizerProfile.findUnique({
    where: { userId },
    include: { subscription: true },
  });

  if (!profile) {
    return NextResponse.json(
      { error: "No organizer profile" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    plan: profile.subscription?.plan || "FREE",
    status: profile.subscription?.status || "ACTIVE",
    trialEndsAt: profile.subscription?.trialEndsAt,
    currentPeriodEnd: profile.subscription?.currentPeriodEnd,
    cancelAtPeriodEnd: profile.subscription?.cancelAtPeriodEnd || false,
  });
}
