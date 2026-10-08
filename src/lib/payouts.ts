import type Stripe from "stripe"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"

/**
 * How every organizer's payout account is set up (same model as AXXES Pay /
 * Tollbooth, owner decision 2026-10-08).
 *
 * The organizer never sees Stripe: no Stripe dashboard (`none`), afters is the
 * whole interface. Stripe carries the risk: it bills its processing fee to the
 * organizer's account (`fees.payer`), covers negative balances and chargebacks
 * (`losses`), and decides what identity and bank details the law requires
 * (`requirement_collection`). afters' service fee is an application fee on top,
 * paid by the buyer. Ticket sales are direct charges on the organizer's account.
 * Never destination charges or Express accounts: those make afters pay Stripe's
 * fees and carry chargebacks.
 */
export const PAYOUT_ACCOUNT_CONTROLLER = {
  stripe_dashboard: { type: "none" },
  fees: { payer: "account" },
  losses: { payments: "stripe" },
  requirement_collection: "stripe",
} as const satisfies Stripe.AccountCreateParams.Controller

/** True when an account was created with the controller above; it can't be changed afterwards. */
export function hasPayoutController(remote: Pick<Stripe.Account, "controller">): boolean {
  const c = remote.controller
  return (
    c?.stripe_dashboard?.type === "none" &&
    c?.fees?.payer === "account" &&
    c?.losses?.payments === "stripe" &&
    c?.requirement_collection === "stripe"
  )
}

export type PayoutStatus = {
  connected: boolean
  detailsSubmitted: boolean
  chargesEnabled: boolean
  payoutsEnabled: boolean
  requirementsDue: string[]
  disabledReason: string | null
}

type Profile = { id: string; displayName: string; stripeAccountId: string | null; user: { email: string } }

async function soldAnything(organizerProfileId: string): Promise<boolean> {
  const paid = await prisma.order.findFirst({
    where: { status: { in: ["PAID", "REFUNDED"] }, total: { gt: 0 }, event: { organizerId: organizerProfileId } },
    select: { id: true },
  })
  return Boolean(paid)
}

/**
 * The organizer's payout account, created on first use. A stored account that
 * this platform can't see, or that was set up another way and never took a
 * payment, is replaced: the controller can only be set when an account is created.
 */
export async function ensurePayoutAccount(profile: Profile): Promise<string> {
  if (profile.stripeAccountId) {
    const remote = await stripe.accounts.retrieve(profile.stripeAccountId).catch((err: { code?: string }) => {
      if (err?.code === "resource_missing" || err?.code === "account_invalid") return null
      throw err
    })
    if (remote && (hasPayoutController(remote) || (await soldAnything(profile.id)))) return profile.stripeAccountId
  }

  const created = await stripe.accounts.create({
    controller: PAYOUT_ACCOUNT_CONTROLLER,
    country: "US",
    email: profile.user.email,
    business_profile: { name: profile.displayName, product_description: "Event tickets sold on afters.am" },
    capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
    metadata: { organizerProfileId: profile.id, source: "afters" },
  })
  await prisma.organizerProfile.update({
    where: { id: profile.id },
    data: { stripeAccountId: created.id, stripeOnboardingComplete: false, stripeChargesEnabled: false, stripePayoutsEnabled: false },
  })
  return created.id
}

const settingsUrls = (base: string) => ({
  refresh_url: `${base}/b/settings/payouts?onboarding=retry`,
  return_url: `${base}/b/settings/payouts?onboarding=done`,
})

/** Stripe's verification form for the organizer's payout account, creating the account if needed. */
export async function onboardingLink(profile: Profile, base: string): Promise<string> {
  const accountId = await ensurePayoutAccount(profile)
  const remote = await stripe.accounts.retrieve(accountId)
  const link = await stripe.accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    // A finished account opens the same form with its saved details, to change the bank or address.
    ...(remote.details_submitted ? { collection_options: { fields: "eventually_due" as const } } : {}),
    ...settingsUrls(base),
  })
  return link.url
}

function statusOf(account: Stripe.Account): PayoutStatus {
  return {
    connected: true,
    detailsSubmitted: account.details_submitted ?? false,
    chargesEnabled: account.charges_enabled ?? false,
    payoutsEnabled: account.payouts_enabled ?? false,
    requirementsDue: account.requirements?.currently_due ?? [],
    disabledReason: account.requirements?.disabled_reason ?? null,
  }
}

/** Reads the account from Stripe now and stores what afters needs to decide whether paid tickets can sell. */
export async function syncPayoutAccount(organizerProfileId: string): Promise<PayoutStatus> {
  const profile = await prisma.organizerProfile.findUnique({ where: { id: organizerProfileId }, select: { stripeAccountId: true } })
  if (!profile?.stripeAccountId) {
    return { connected: false, detailsSubmitted: false, chargesEnabled: false, payoutsEnabled: false, requirementsDue: [], disabledReason: null }
  }
  const account = await stripe.accounts.retrieve(profile.stripeAccountId)
  await recordAccount(account)
  return statusOf(account)
}

/** Stores a Stripe account's state on the organizer that owns it (also used by the `account.updated` webhook). */
export async function recordAccount(account: Stripe.Account) {
  await prisma.organizerProfile.updateMany({
    where: { stripeAccountId: account.id },
    data: {
      stripeOnboardingComplete: account.details_submitted ?? false,
      stripeChargesEnabled: account.charges_enabled ?? false,
      stripePayoutsEnabled: account.payouts_enabled ?? false,
    },
  })
}

/** afters can only take money for an organizer whose payout account can accept charges. */
export function canSellPaidTickets(profile: { stripeAccountId: string | null; stripeChargesEnabled: boolean }): boolean {
  return Boolean(profile.stripeAccountId && profile.stripeChargesEnabled)
}
