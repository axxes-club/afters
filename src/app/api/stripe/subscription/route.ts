import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

// Helper to get the app base URL from the request (works in both dev and prod)
function getBaseUrl(req: NextRequest): string {
  // Use Vercel URL in production, or the request origin
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl && !appUrl.includes("localhost")) return appUrl;

  // Fallback: derive from request headers
  const host = req.headers.get("host") || "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") || "http";
  return `${proto}://${host}`;
}

// POST - Create checkout session for Signature subscription
export async function POST(req: NextRequest) {
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

  try {
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

    // Get or create the Signature price
    let priceId = process.env.STRIPE_SIGNATURE_PRICE_ID;

    if (!priceId) {
      // Search for existing product first to avoid duplicates
      const existingProducts = await stripe.products.search({
        query: "name:'Afters Signature'",
      });

      let productId: string;
      if (existingProducts.data.length > 0) {
        productId = existingProducts.data[0].id;
        // Find active price for this product
        const prices = await stripe.prices.list({
          product: productId,
          active: true,
          type: "recurring",
          limit: 1,
        });
        if (prices.data.length > 0) {
          priceId = prices.data[0].id;
        }
      }

      if (!priceId) {
        // Create product if needed
        if (!existingProducts.data.length) {
          const product = await stripe.products.create({
            name: "Afters Signature",
            description:
              "Priority placement, reduced fees, staff management, and more",
          });
          productId = product.id;
        }

        const price = await stripe.prices.create({
          product: productId!,
          unit_amount: 4500, // $45.00
          currency: "usd",
          recurring: { interval: "month" },
        });

        priceId = price.id;
        console.log(
          `Created Stripe Price: ${price.id} - Add STRIPE_SIGNATURE_PRICE_ID=${price.id} to .env`
        );
      }
    }

    const baseUrl = getBaseUrl(req);

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
      success_url: `${baseUrl}/dashboard/settings?subscription=success`,
      cancel_url: `${baseUrl}/dashboard/settings?subscription=cancelled`,
      metadata: {
        organizerProfileId: profile.id,
        userId,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe subscription error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
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
