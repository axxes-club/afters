import { getEffectiveUserId } from "@/lib/auth-utils";
import { organizerWhere } from "@/lib/organizer-context";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPortalSession } from "@/lib/axxes-payments";
import { publicOrigin } from "@/lib/public-origin";

// POST - Manage (cancel, update card) a Signature subscription in the AXXES Payments billing portal.
// Cancellation happens at period end there and arrives back as a signed Payments event.
export async function POST(request: Request) {
  const userId = await getEffectiveUserId();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.organizerProfile.findUnique({
    where: await organizerWhere("owner"),
    include: { subscription: true },
  });
  const subscriptionId = profile?.subscription?.stripeSubscriptionId;
  if (!subscriptionId) {
    return NextResponse.json({ error: "No active subscription" }, { status: 400 });
  }
  try {
    const portal = await createPortalSession(subscriptionId, `${publicOrigin(request)}/b/settings/billing`);
    return NextResponse.json({ url: portal.url });
  } catch {
    return NextResponse.json({ error: "Subscription management is unavailable" }, { status: 502 });
  }
}
