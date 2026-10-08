import { beforeEach, describe, expect, it, vi } from "vitest"

const state = vi.hoisted(() => ({
  tasks: [] as Array<() => Promise<unknown>>,
  delivered: [] as Array<{ to: string; attachments?: Array<{ content: Buffer }> }>,
  pdfStarted: false,
  order: {} as Record<string, unknown>,
}))

// The scheduler is the hosting boundary; keep the real route and response.
vi.mock("next/server", async (original) => ({
  ...await original<typeof import("next/server")>(),
  after: (task: () => Promise<unknown>) => state.tasks.push(task),
}))
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "stripe-signature": "test-signature" }) }))
vi.mock("@/lib/prisma", () => {
  const db = {
    $queryRaw: async () => [],
    order: {
      findUnique: async () => state.order,
      update: async () => state.order,
      updateMany: async () => ({ count: 1 }),
    },
    ticket: { create: async () => ({ id: "ticket-1", ticketNumber: "AFT-TEST" }) },
    ticketTier: { update: async () => ({}) },
    organizerProfile: { findFirst: async () => null },
  }
  return { prisma: { ...db, $transaction: async (work: (tx: typeof db) => Promise<unknown>) => work(db) } }
})
vi.mock("@/lib/stripe", () => ({ stripe: { webhooks: { constructEvent: () => ({
  type: "payment_intent.succeeded", livemode: false,
  data: { object: { id: "pi-1", amount: 0, amount_received: 0, currency: "usd", metadata: { orderId: "order-1" }, latest_charge: "charge-1" } },
}) } } }))
vi.mock("@/lib/pdf-ticket", () => ({ generateTicketPDF: async () => {
  state.pdfStarted = true
  return Buffer.from("ticket-pdf")
} }))
vi.mock("@/lib/apple-wallet", () => ({ isAppleWalletConfigured: () => false, getWalletPassUrl: () => "" }))
vi.mock("@/lib/email", () => ({
  sendEmail: async (mail: typeof state.delivered[number]) => { state.delivered.push(mail) },
  generateTicketEmailHtml: () => "<p>Your ticket</p>",
  generateOrganizerSaleEmailHtml: () => "<p>Ticket sale</p>",
}))
vi.mock("@/lib/push", () => ({ notifyTicketSale: async () => {} }))

import { POST as confirmFree } from "@/app/api/orders/[orderId]/confirm-free/route"
import { POST as stripeWebhook } from "@/app/api/webhooks/stripe/route"

beforeEach(() => {
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec-test")
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_fixture")
  state.tasks.length = 0
  state.delivered.length = 0
  state.pdfStarted = false
  state.order = {
    id: "order-1", orderNumber: "ORDER-TEST", email: "buyer@example.test",
    createdAt: new Date(), status: "PENDING", total: 0, stripePaymentIntentId: "pi-1",
    eventId: "event-1", userId: null, user: null, guestName: "Buyer",
    items: [{ quantity: 1, ticketTierId: "tier-1", unitPrice: 0, ticketTier: { name: "General" } }],
    event: {
      title: "Test event", startsAt: new Date("2026-10-01T20:00:00Z"),
      timezone: "UTC", venueName: "Venue", venueAddress: "123 Street",
      city: "City", state: "", organizerId: "organizer-1",
    },
  }
})

describe("ticket delivery on a Node hosting lifecycle", () => {
  it.each(["free order", "Stripe webhook"])("returns %s confirmation before PDF/email work and delivers after response", async (kind) => {
    const response = kind === "free order"
      ? await confirmFree(new Request("https://afters.am/api/orders/order-1/confirm-free", {
        method: "POST", body: JSON.stringify({ email: "buyer@example.test" }),
      }), { params: Promise.resolve({ orderId: "order-1" }) })
      : await stripeWebhook(new Request("https://afters.am/api/webhooks/stripe", { method: "POST", body: "signed-event", headers: { "stripe-signature": "test-signature" } }))

    expect(response.status).toBe(200)
    expect(state.pdfStarted).toBe(false)
    expect(state.delivered).toEqual([])
    for (const task of state.tasks) await task()
    expect(state.delivered).toHaveLength(1)
    expect(state.delivered[0].to).toBe("buyer@example.test")
    expect(state.delivered[0].attachments?.[0].content.toString()).toBe("ticket-pdf")
  })
})
