import { NextResponse } from "next/server"
import { getEffectiveUserId } from "@/lib/auth-utils"
import { organizerWhere } from "@/lib/organizer-context"
import { prisma } from "@/lib/prisma"
import { ensurePayoutAccount } from "@/lib/payouts"
import { stripe } from "@/lib/stripe"

/** Owner-only access to the financial screens required by Stripe's dashboard-free accounts. */
export async function POST() {
  try {
    if (!await getEffectiveUserId()) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    const profile = await prisma.organizerProfile.findUnique({
      where: await organizerWhere("owner"),
      select: { id: true, displayName: true, stripeAccountId: true, user: { select: { email: true } } },
    })
    if (!profile) return NextResponse.json({ message: "Only the organizer's owner can manage payments" }, { status: 403 })
    const account = await ensurePayoutAccount(profile)
    const session = await stripe.accountSessions.create({ account, components: {
      notification_banner: { enabled: true },
      account_management: { enabled: true, features: { external_account_collection: true } },
      payouts: { enabled: true },
      payments: { enabled: true, features: { refund_management: true, dispute_management: true, capture_payments: false } },
      balances: { enabled: true },
      documents: { enabled: true },
    } })
    return NextResponse.json({ clientSecret: session.client_secret }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("Error opening payout financial session:", error)
    return NextResponse.json({ message: "Couldn't open payment management. Try again." }, { status: 500 })
  }
}
