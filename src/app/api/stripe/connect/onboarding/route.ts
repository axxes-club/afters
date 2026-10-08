import { getEffectiveUserId } from "@/lib/auth-utils"
import { organizerWhere } from "@/lib/organizer-context"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { onboardingLink } from "@/lib/payouts"
import { publicOrigin } from "@/lib/public-origin"

/**
 * POST /api/stripe/connect/onboarding — Stripe's verification form for the
 * organizer's payout account (identity and bank). Owner only: payouts decide
 * where the money goes.
 */
export async function POST(req: Request) {
  try {
    const userId = await getEffectiveUserId()
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const profile = await prisma.organizerProfile.findUnique({
      where: await organizerWhere("owner"),
      select: { id: true, displayName: true, stripeAccountId: true, user: { select: { email: true } } },
    })
    if (!profile) {
      return NextResponse.json({ message: "Only the organizer's owner can set up payouts" }, { status: 403 })
    }

    const url = await onboardingLink(profile, publicOrigin(req))
    return NextResponse.json({ url })
  } catch (error) {
    console.error("Error creating payout onboarding link:", error)
    return NextResponse.json({ message: "Couldn't open payout setup. Try again." }, { status: 500 })
  }
}
