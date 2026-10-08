import { afterAll, beforeEach, describe, expect, it, vi } from "vitest"
import Stripe from "stripe"
import { randomUUID } from "node:crypto"

// Only CI's disposable database may run this suite; no production datasource is used.
const state = vi.hoisted(() => ({
  databaseUrl: process.env.AFTERS_TEST_DATABASE_URL,
  scheduled: [] as Array<() => Promise<unknown>>,
}))
vi.mock("@/lib/prisma", async () => {
  const { PrismaClient } = await import("@prisma/client")
  const { PrismaPg } = await import("@prisma/adapter-pg")
  const connectionString = state.databaseUrl || "postgresql://test:test@localhost:5432/afters_test"
  const url = new URL(connectionString)
  if (!['localhost', '127.0.0.1'].includes(url.hostname) || url.pathname !== '/afters_test') {
    throw new Error("Concurrency tests require a disposable local afters_test database")
  }
  return { prisma: new PrismaClient({ adapter: new PrismaPg({ connectionString, max: 10 }) }) }
})
vi.mock("@/lib/auth/session", () => ({ getUserId: async () => null, currentUser: async () => null }))
vi.mock("next/server", async (original) => ({
  ...await original<typeof import("next/server")>(),
  after: (task: () => Promise<unknown>) => state.scheduled.push(task),
}))
vi.mock("@/lib/stripe", async (original) => ({
  ...await original<typeof import("@/lib/stripe")>(),
  stripe: new Stripe("sk_test_fixture"),
}))
vi.mock("@/lib/pdf-ticket", () => ({ generateTicketPDF: async () => Buffer.from("pdf") }))
vi.mock("@/lib/apple-wallet", () => ({ isAppleWalletConfigured: () => false }))
vi.mock("@/lib/email", () => ({ sendEmail: async () => {}, generateTicketEmailHtml: () => "", generateOrganizerSaleEmailHtml: () => "" }))
vi.mock("@/lib/push", () => ({ notifyTicketSale: async () => {} }))

import { prisma } from "@/lib/prisma"
import { POST as createOrder } from "@/app/api/orders/route"
import { POST as webhook } from "@/app/api/webhooks/stripe/route"
import { POST as confirmFree } from "@/app/api/orders/[orderId]/confirm-free/route"

const fixtures: Array<{ userId: string; organizerId: string; eventId: string }> = []
let eventId: string, tierId: string
function reserve() {
  return createOrder(new Request("https://afters.am/api/orders", {
    method: "POST", body: JSON.stringify({ eventId, email: "buyer@example.test", guestName: "Buyer", items: [{ ticketTierId: tierId, quantity: 1 }] }),
  }))
}
function paid(orderId: string) {
  const body = JSON.stringify({ id: "evt_fixture", object: "event", type: "payment_intent.succeeded", livemode: false,
    account: "acct_fixture", data: { object: { id: "pi_" + orderId, amount: 1199, amount_received: 1199,
      currency: "usd", latest_charge: "ch_fixture", metadata: { orderId } } },
  })
  const signature = Stripe.webhooks.generateTestHeaderString({ payload: body, secret: "whsec_fixture" })
  return webhook(new Request("https://afters.am/api/webhooks/stripe", { method: "POST", body, headers: { "stripe-signature": signature } }))
}

describe.skipIf(!state.databaseUrl)("paid tickets with real Postgres transactions", () => {
  beforeEach(async () => {
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_fixture")
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_fixture")
    state.scheduled = []
    const key = randomUUID()
    const user = await prisma.user.create({ data: { id: key, email: `${key}@example.test` } })
    const organizer = await prisma.organizerProfile.create({ data: { userId: user.id, slug: key, displayName: "Test", stripeAccountId: `acct_${key}` } })
    const event = await prisma.event.create({ data: {
      organizerId: organizer.id, slug: key, title: "Test", startsAt: new Date("2027-01-01T20:00:00Z"),
      venueName: "Test", venueAddress: "Test", city: "Test", isPublished: true,
      ticketTiers: { create: { name: "General", price: 1000, quantity: 1 } },
    }, include: { ticketTiers: true } })
    eventId = event.id; tierId = event.ticketTiers[0].id
    fixtures.push({ userId: user.id, organizerId: organizer.id, eventId })
  })
  afterAll(async () => {
    for (const fixture of fixtures) {
      await prisma.ticket.deleteMany({ where: { eventId: fixture.eventId } })
      await prisma.order.deleteMany({ where: { eventId: fixture.eventId } })
      await prisma.event.delete({ where: { id: fixture.eventId } })
      await prisma.organizerProfile.delete({ where: { id: fixture.organizerId } })
      await prisma.user.delete({ where: { id: fixture.userId } })
    }
    await prisma.$disconnect()
  })
  it("allows only one of two concurrent buyers to reserve the last ticket", async () => {
    const responses = await Promise.all([reserve(), reserve()])
    expect(responses.map(r => r.status).sort()).toEqual([200, 400])
    expect(await prisma.order.count({ where: { eventId, status: "PENDING" } })).toBe(1)
  })
  it("fulfils simultaneous webhook retries once, including inventory and delivery scheduling", async () => {
    const order = await (await reserve()).json()
    await prisma.order.update({ where: { id: order.id }, data: { stripePaymentIntentId: "pi_" + order.id } })
    const event = await prisma.event.findUniqueOrThrow({ where: { id: eventId } })
    await prisma.organizerProfile.update({ where: { id: event.organizerId }, data: { stripeAccountId: "acct_fixture" } })
    const responses = await Promise.all(Array.from({ length: 6 }, () => paid(order.id)))
    expect(responses.map(r => r.status)).toEqual([200, 200, 200, 200, 200, 200])
    expect(await prisma.ticket.count({ where: { orderId: order.id } })).toBe(1)
    expect((await prisma.ticketTier.findUniqueOrThrow({ where: { id: tierId } })).quantitySold).toBe(1)
    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("PAID")
    expect(state.scheduled).toHaveLength(1)
  })
  it("keeps sold plus reserved inventory consistent when fulfillment races a new reservation", async () => {
    await prisma.ticketTier.update({ where: { id: tierId }, data: { quantity: 2 } })
    const first = await (await reserve()).json()
    await prisma.order.update({ where: { id: first.id }, data: { stripePaymentIntentId: "pi_" + first.id } })
    const event = await prisma.event.findUniqueOrThrow({ where: { id: eventId } })
    await prisma.organizerProfile.update({ where: { id: event.organizerId }, data: { stripeAccountId: "acct_fixture" } })
    const [confirmation, second] = await Promise.all([paid(first.id), reserve()])
    expect(confirmation.status).toBe(200)
    expect(second.status).toBe(200)
    expect((await reserve()).status).toBe(400)
    expect((await prisma.ticketTier.findUniqueOrThrow({ where: { id: tierId } })).quantitySold).toBe(1)
    expect(await prisma.order.count({ where: { eventId, status: "PENDING" } })).toBe(1)
  })
  it("issues a free order once when its confirmation requests race", async () => {
    await prisma.ticketTier.update({ where: { id: tierId }, data: { price: 0 } })
    const order = await (await reserve()).json()
    const confirm = () => confirmFree(new Request("https://afters.am/api/orders/confirm-free", {
      method: "POST", body: JSON.stringify({ email: "buyer@example.test" }),
    }), { params: Promise.resolve({ orderId: order.id }) })
    const responses = await Promise.all([confirm(), confirm()])
    expect(responses.filter(r => r.status === 200)).toHaveLength(1)
    expect(await prisma.ticket.count({ where: { orderId: order.id } })).toBe(1)
    expect((await prisma.ticketTier.findUniqueOrThrow({ where: { id: tierId } })).quantitySold).toBe(1)
  })
})
