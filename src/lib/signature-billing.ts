import { Plan, SubscriptionStatus } from "@prisma/client"
import { prisma } from "./prisma"
import { ACCESS_STATUSES, type SubscriptionSnapshot } from "./axxes-payments"

/** Signature plans sold through AXXES Payments, by Stripe lookup key. */
export const SIGNATURE_LOOKUP_KEYS: Partial<Record<Plan, string>> = {
  SIGNATURE_30D: "afters_signature_30d",
  SIGNATURE_180D: "afters_signature_180d",
  SIGNATURE_360D: "afters_signature_360d",
}

const STATUS: Record<SubscriptionSnapshot["status"], SubscriptionStatus> = {
  active: "ACTIVE",
  trialing: "TRIALING",
  past_due: "PAST_DUE",
  unpaid: "PAST_DUE",
  paused: "PAST_DUE",
  incomplete: "INCOMPLETE",
  incomplete_expired: "CANCELLED",
  canceled: "CANCELLED",
}

export function planFromSnapshot(s: Pick<SubscriptionSnapshot, "status" | "interval" | "interval_count">): Plan {
  if (!ACCESS_STATUSES.includes(s.status)) return "FREE"
  if (s.status === "trialing") return "SIGNATURE_TRIAL_7D"
  if (s.interval === "year") return "SIGNATURE_360D"
  if (s.interval === "month" && (s.interval_count ?? 1) >= 6) return "SIGNATURE_180D"
  return "SIGNATURE_30D"
}

const date = (seconds: number | null) => (seconds ? new Date(seconds * 1000) : null)

/**
 * Applies the current Payments subscription state to an organizer. Snapshots are
 * read from Stripe at delivery time, so applying them in any order converges.
 * The snapshot's reference is the organizer profile ID we sent at checkout.
 */
export async function applySignatureSnapshot(snapshot: SubscriptionSnapshot) {
  if (snapshot.product !== "afters") return
  const organizerProfileId = snapshot.reference
  const existing = await prisma.subscription.findUnique({ where: { organizerProfileId } })
  const profile = existing ? true : await prisma.organizerProfile.findUnique({ where: { id: organizerProfileId }, select: { id: true } })
  if (!profile) return
  // A lapsed old subscription must not override a newer one, or a manual Friends & Family grant.
  if (existing?.plan === "SIGNATURE_FF") return
  if (existing?.stripeSubscriptionId && existing.stripeSubscriptionId !== snapshot.id && !ACCESS_STATUSES.includes(snapshot.status)) return

  const plan = planFromSnapshot(snapshot)
  const data = {
    stripeSubscriptionId: snapshot.id,
    stripePriceId: snapshot.price,
    plan,
    status: STATUS[snapshot.status],
    trialEndsAt: date(snapshot.trial_end),
    currentPeriodEnd: date(snapshot.current_period_end),
    cancelAtPeriodEnd: snapshot.cancel_at_period_end,
  }
  await prisma.subscription.upsert({ where: { organizerProfileId }, create: { organizerProfileId, ...data }, update: data })
  // Matches the previous Stripe-webhook behaviour: staff seats close when Signature ends.
  if (plan === "FREE" && existing && existing.plan !== "FREE") {
    await prisma.staffMember.updateMany({ where: { organizerProfileId }, data: { status: "SUSPENDED" } })
  }
}

/** Purchase UI is off until the owner ends the free beta (billing page promises notice before pricing changes). */
export const signatureSalesOpen = () => process.env.AFTERS_SIGNATURE_SALES === "on"
