import type Stripe from "stripe"
import { beforeEach, describe, expect, it, vi } from "vitest"

const state = vi.hoisted(() => ({
  order: {} as Record<string, unknown>,
  intent: null as Pick<Stripe.PaymentIntent, "id" | "amount" | "status" | "client_secret"> | null,
  retrievalFails: false,
  chargesEnabled: true,
  creates: [] as Array<{ data: Stripe.PaymentIntentCreateParams; options: Stripe.RequestOptions }>,
}))
vi.mock("@/lib/prisma", () => ({ prisma: { order: {
  findUnique: async () => state.order,
  updateMany: async ({ data }: { data: Record<string, unknown> }) => { Object.assign(state.order, data); return { count: 1 } },
} } }))
vi.mock("@/lib/stripe", () => ({ stripe: {
  accounts: { retrieve: async () => ({
    charges_enabled: state.chargesEnabled,
    controller: { stripe_dashboard: { type: "none" }, fees: { payer: "account" }, losses: { payments: "stripe" }, requirement_collection: "stripe" },
  }) },
  paymentIntents: {
    retrieve: async () => {
      if (state.retrievalFails) throw new Error("Stripe unavailable")
      return state.intent
    },
    create: async (data: Stripe.PaymentIntentCreateParams, options: Stripe.RequestOptions) => {
      state.creates.push({ data, options })
      return { id: "pi_new", client_secret: "pi_new_secret" }
    },
  },
} }))
import { POST } from "@/app/api/stripe/checkout/route"

const checkout = (email = "buyer@example.test") => POST(new Request("https://afters.am/api/stripe/checkout", {
  method: "POST", body: JSON.stringify({ orderId: "order-1", email }),
}))
beforeEach(() => {
  state.order = {
    id: "order-1", status: "PENDING", createdAt: new Date(), email: "buyer@example.test",
    total: 1299, platformFee: 299, eventId: "event-1", stripePaymentIntentId: null,
    event: { title: "Event", organizerId: "org-1", organizer: { stripeAccountId: "acct_organizer" } },
  }
  state.intent = null
  state.retrievalFails = false
  state.chargesEnabled = true
  state.creates = []
})
describe("paid checkout", () => {
  it("creates a direct charge with the buyer's fee and organizer account", async () => {
    const response = await checkout()
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ stripeAccount: "acct_organizer", clientSecret: "pi_new_secret" })
    expect(state.creates[0]).toMatchObject({
      data: { amount: 1299, application_fee_amount: 299, currency: "usd", receipt_email: "buyer@example.test" },
      options: { stripeAccount: "acct_organizer", idempotencyKey: "afters-order:order-1:first" },
    })
    expect(state.creates[0].data.transfer_data).toBeUndefined()
    expect(state.order.stripePaymentIntentId).toBe("pi_new")
  })
  it("does not expose a payment to a caller with the wrong email", async () => {
    expect((await checkout("other@example.test")).status).toBe(403)
    expect(state.creates).toHaveLength(0)
  })
  it("blocks an organizer that cannot accept charges", async () => {
    state.chargesEnabled = false
    expect((await checkout()).status).toBe(400)
    expect(state.creates).toHaveLength(0)
  })
  it.each(["requires_payment_method", "processing", "succeeded"])("reuses an existing %s payment without charging again", async (status) => {
    state.order.stripePaymentIntentId = "pi_existing"
    state.intent = { id: "pi_existing", amount: 1299, status: status as Stripe.PaymentIntent.Status, client_secret: "pi_existing_secret" }
    const response = await checkout()
    expect(response.status).toBe(200)
    expect(state.creates).toHaveLength(0)
    expect(state.order.stripePaymentIntentId).toBe("pi_existing")
  })
  it("never creates another charge when retrieving the existing payment fails", async () => {
    state.order.stripePaymentIntentId = "pi_existing"
    state.retrievalFails = true
    expect((await checkout()).status).toBe(500)
    expect(state.creates).toHaveLength(0)
    expect(state.order.stripePaymentIntentId).toBe("pi_existing")
  })
})
