import { getEffectiveUserId } from "@/lib/auth-utils"
import { getOrganizerContext } from "@/lib/organizer-context"
import { NextResponse } from "next/server"
import { syncPayoutAccount } from "@/lib/payouts"

/** GET or POST /api/stripe/connect/status — the payout account's state, read from Stripe now. */
async function handler() {
  try {
    const userId = await getEffectiveUserId()
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }
    const context = await getOrganizerContext()
    if (!context) {
      return NextResponse.json({ message: "Organizer profile not found" }, { status: 404 })
    }
    const status = await syncPayoutAccount(context.profile.id)
    return NextResponse.json({ ...status, isOwner: context.isOwner })
  } catch (error) {
    console.error("Error syncing payout status:", error)
    return NextResponse.json({ message: "Couldn't read payout status" }, { status: 500 })
  }
}

export const GET = handler
export const POST = handler
