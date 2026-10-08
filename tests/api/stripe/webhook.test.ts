import { beforeEach, describe, expect, it, vi } from "vitest"
import Stripe from "stripe"

const state = vi.hoisted(() => ({
  order: {} as Record<string, unknown>,
  tickets: [] as Record<string, unknown>[],
  sold: 0,
  tasks: [] as Array<() => Promise<unknown>>,
  failTicket: false,
  successWhileWaiting: false,
  signature: "",
}))
vi.mock("next/server", async (original) => ({
  ...await original<typeof import("next/server")>(),
  after: (task: () => Promise<unknown>) => state.tasks.push(task),
}))
vi.mock("next/headers", () => ({ headers: async () => new Headers(state.signature ? { "stripe-signature": state.signature } : {}) }))
vi.mock("@/lib/stripe", async () => {
  const { default: Stripe } = await import("stripe")
  return { stripe: new Stripe("sk_test_fixture") }
})
vi.mock("@/lib/prisma", () => {
  const db = {
    $queryRaw: async () => { if (state.successWhileWaiting) { state.order.status = "PAID"; state.tickets.push({ status: "VALID" }); state.successWhileWaiting = false }; return [] },
    order: {
      findUnique: async () => structuredClone(state.order),
      update: async ({ data }: { data: Record<string, unknown> }) => Object.assign(state.order, data),
      updateMany: async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
        if (state.order.id !== where.id || !(typeof where.status === "object" ? (where.status as { in: unknown[] }).in.includes(state.order.status) : state.order.status === where.status) ||
          (where.stripePaymentIntentId && state.order.stripePaymentIntentId !== where.stripePaymentIntentId)) return { count: 0 }
        Object.assign(state.order, data)
        return { count: 1 }
      },
    },
    ticket: { updateMany: async () => { state.tickets.forEach(ticket => { ticket.status = "REFUNDED" }); return { count: state.tickets.length } }, create: async ({ data }: { data: Record<string, unknown> }) => {
      if (state.failTicket) throw new Error("ticket write failed")
      const ticket = { ...data, id: `ticket-${state.tickets.length + 1}` }
      state.tickets.push(ticket)
      return ticket
    } },
    ticketTier: { update: async ({ data }: { data: { quantitySold: { increment: number } } }) => { state.sold += data.quantitySold.increment } },
    organizerProfile: { findUnique: async () => null, findFirst: async () => null },
  }
  return { prisma: { ...db, $transaction: async (work: (tx: typeof db) => Promise<unknown>) => {
    const snapshot = { order: { ...state.order }, tickets: [...state.tickets], sold: state.sold }
    try { return await work(db) } catch (error) { Object.assign(state, snapshot); throw error }
  } } }
})
vi.mock("@/lib/pdf-ticket", () => ({ generateTicketPDF: async () => Buffer.from("pdf") }))
vi.mock("@/lib/apple-wallet", () => ({ isAppleWalletConfigured: () => false }))
vi.mock("@/lib/email", () => ({ sendEmail: async () => {}, generateTicketEmailHtml: () => "", generateOrganizerSaleEmailHtml: () => "" }))
vi.mock("@/lib/push", () => ({ notifyTicketSale: async () => {} }))

import { POST } from "@/app/api/webhooks/stripe/route"

function paymentEvent(overrides: { type?: string } = {}) {
  return {
    id: "evt_fixture", object: "event", type: "payment_intent.succeeded", livemode: false,
    account: "acct_organizer",
    data: { object: {
      id: "pi_order", object: "payment_intent", amount: 1299, amount_received: 1299,
      currency: "usd", status: "succeeded", latest_charge: "ch_order",
      metadata: { orderId: "order-1", organizerProfileId: "organizer-1" },
    } }, ...overrides,
  }
}
async function deliver(event = paymentEvent(), secret = "whsec_platform") {
  const body = JSON.stringify(event)
  const signature = Stripe.webhooks.generateTestHeaderString({ payload: body, secret })
  state.signature = signature
  return POST(new Request("https://afters.am/api/webhooks/stripe", {
    method: "POST", body, headers: { "stripe-signature": signature },
  }))
}

beforeEach(() => {
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_platform")
  vi.stubEnv("STRIPE_CONNECT_WEBHOOK_SECRET", "whsec_connect")
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_fixture")
  state.order = {
    id: "order-1", orderNumber: "ORDER-1", status: "PENDING", total: 1299,
    stripePaymentIntentId: "pi_order", eventId: "event-1", userId: null,
    email: "buyer@example.test", guestName: "Buyer", user: null,
    items: [{ quantity: 2, ticketTierId: "tier-1", ticketTier: { name: "General" } }],
    event: {
      organizerId: "organizer-1", organizer: { stripeAccountId: "acct_organizer" },
      title: "Test event", startsAt: new Date("2026-10-12T20:00:00Z"), timezone: "UTC",
      venueName: "Venue", venueAddress: "Street", city: "City",
    },
  }
  state.tickets = []
  state.sold = 0
  state.tasks = []
  state.failTicket = false
  state.successWhileWaiting = false
  state.signature = ""
})

describe("paid ticket webhook", () => {
  it("accepts the Connect signing secret and fulfils the paid order", async () => {
    expect((await deliver(paymentEvent(), "whsec_connect")).status).toBe(200)
    expect(state.order.status).toBe("PAID")
    expect(state.tickets).toHaveLength(2)
    expect(state.sold).toBe(2)
  })
  it("issues tickets and counts sales once when Stripe retries", async () => {
    await deliver()
    await deliver()
    expect(state.order.status).toBe("PAID")
    expect(state.tickets).toHaveLength(2)
    expect(state.sold).toBe(2)
    expect(state.tasks).toHaveLength(1)
  })
  it.each([
    ["account", "acct_other"], ["intent", "pi_other"], ["amount", 1], ["currency", "eur"],
  ])("rejects a payment with mismatched %s without issuing tickets", async (field, value) => {
    const event = paymentEvent()
    if (field === "account") event.account = value as string
    else if (field === "intent") event.data.object.id = value as string
    else if (field === "amount") event.data.object.amount = value as number
    else event.data.object.currency = value as string
    expect((await deliver(event)).status).toBeGreaterThanOrEqual(400)
    expect(state.order.status).toBe("PENDING")
    expect(state.tickets).toHaveLength(0)
    expect(state.sold).toBe(0)
  })
  it("keeps a declined payment pending so the buyer can retry", async () => {
    expect((await deliver(paymentEvent({ type: "payment_intent.payment_failed" }))).status).toBe(200)
    expect(state.order.status).toBe("PENDING")
    expect(state.tickets).toHaveLength(0)
  })
  it("does not cancel an already paid order when a failure arrives late", async () => {
    await deliver()
    await deliver(paymentEvent({ type: "payment_intent.payment_failed" }))
    expect(state.order.status).toBe("PAID")
    expect(state.tickets).toHaveLength(2)
  })
  it("rolls back payment status and sales if ticket issuance fails, then succeeds on retry", async () => {
    state.failTicket = true
    expect((await deliver()).status).toBe(500)
    expect(state.order.status).toBe("PENDING")
    expect(state.sold).toBe(0)
    state.failTicket = false
  state.successWhileWaiting = false
    expect((await deliver()).status).toBe(200)
    expect(state.tickets).toHaveLength(2)
  })
  it("ignores test events arriving at a live endpoint", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_live_fixture")
    expect((await deliver()).status).toBe(200)
    expect(state.order.status).toBe("PENDING")
    expect(state.tickets).toHaveLength(0)
  })
  it("rejects an unsigned request", async () => {
    expect((await POST(new Request("https://afters.am/api/webhooks/stripe", { method: "POST", body: "{}" }))).status).toBe(400)
  })
})

function refunded() {
  return { id: "evt_refund", object: "event", type: "charge.refunded", livemode: false, account: "acct_organizer",
    data: { object: { id: "ch_order", payment_intent: "pi_order", amount: 1299, amount_refunded: 1299, refunded: true } },
  }
}
it("voids tickets and marks a full refund once", async () => {
  await deliver()
  expect((await deliver(refunded() as unknown as ReturnType<typeof paymentEvent>)).status).toBe(200)
  expect(state.order.status).toBe("REFUNDED")
  expect(state.tickets.every(ticket => ticket.status === "REFUNDED")).toBe(true)
})
it("does not issue tickets if a full refund webhook arrives before payment success", async () => {
  await deliver(refunded() as unknown as ReturnType<typeof paymentEvent>)
  await deliver()
  expect(state.order.status).toBe("REFUNDED")
  expect(state.tickets).toHaveLength(0)
})

it("voids tickets when payment succeeds while the refund waits for the event lock", async () => {
  state.successWhileWaiting = true
  await deliver(refunded() as unknown as ReturnType<typeof paymentEvent>)
  expect(state.order.status).toBe("REFUNDED")
  expect(state.tickets.every(ticket => ticket.status === "REFUNDED")).toBe(true)
})
