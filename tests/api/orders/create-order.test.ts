import { beforeEach, describe, expect, it, vi } from "vitest"

const state = vi.hoisted(() => ({
  reserved: 0,
  stale: [] as Array<{ id: string; stripePaymentIntentId: string | null }>,
  order: null as Record<string, unknown> | null,
  cancelled: [] as string[],
  intentStatus: "requires_payment_method",
}))
vi.mock("@/lib/auth/session", () => ({ getUserId: async () => null, currentUser: async () => null }))
vi.mock("@/lib/prisma", () => {
  const db = {
    $queryRaw: async () => [{ id: "event-1" }],
    $queryRawUnsafe: async () => [{ count: 1, reset_at: new Date(Date.now()+60000) }],
    event: { findUnique: async () => ({ id: "event-1", isPublished: true,
      organizer: { stripeAccountId: "acct_organizer" },
      ticketTiers: [{ id: "tier-1", name: "General", price: 1000, quantity: 2, quantitySold: 0, minPerOrder: 1, maxPerOrder: 2, isVisible: true }],
    }) },
    order: {
      findMany: async () => state.stale,
      updateMany: async ({ where }: { where: { id: string } }) => {
        state.stale = state.stale.filter(order => order.id !== where.id)
        state.reserved = 0
        return { count: 1 }
      },
      create: async ({ data }: { data: Record<string, unknown> }) => {
        state.order = { ...data, id: "order-1" }
        return state.order
      },
    },
    orderItem: { groupBy: async () => [{ ticketTierId: "tier-1", _sum: { quantity: state.reserved } }] },
  }
  return { prisma: { ...db, $transaction: async (work: (tx: typeof db) => Promise<unknown>) => work(db) } }
})
vi.mock("@/lib/stripe", async (original) => ({
  ...await original<typeof import("@/lib/stripe")>(),
  stripe: { paymentIntents: {
    retrieve: async () => ({ id: "pi_old", status: state.intentStatus }),
    cancel: async (id: string) => { state.cancelled.push(id) },
  } },
}))
import { POST } from "@/app/api/orders/route"
const create = (items: unknown) => POST(new Request("https://afters.am/api/orders", {
  method: "POST", body: JSON.stringify({ eventId: "event-1", email: "buyer@example.test", guestName: "Buyer", items }),
}))
beforeEach(() => { state.reserved = 0; state.order = null; state.stale = []; state.cancelled = []; state.intentStatus = "requires_payment_method" })
describe("ticket order validation and reservations", () => {
  it.each([0, -1, 1.5, "1"])("rejects invalid quantity %s before creating an order", async (quantity) => {
    expect((await create([{ ticketTierId: "tier-1", quantity }])).status).toBe(400)
    expect(state.order).toBeNull()
  })
  it("rejects duplicate tiers so buyers cannot bypass per-order limits", async () => {
    expect((await create([{ ticketTierId: "tier-1", quantity: 1 }, { ticketTierId: "tier-1", quantity: 1 }])).status).toBe(400)
    expect(state.order).toBeNull()
  })
  it("reserves inventory held by pending purchases before accepting another order", async () => {
    state.reserved = 2
    expect((await create([{ ticketTierId: "tier-1", quantity: 1 }])).status).toBe(400)
    expect(state.order).toBeNull()
  })
  it("cancels an expired unconfirmed payment before releasing its tickets", async () => {
    state.reserved = 2
    state.stale = [{ id: "old-order", stripePaymentIntentId: "pi_old" }]
    expect((await create([{ ticketTierId: "tier-1", quantity: 1 }])).status).toBe(200)
    expect(state.cancelled).toEqual(["pi_old"])
    expect(state.order).toMatchObject({ total: 1199 })
  })
  it.each(["succeeded", "processing"])("does not release an expired %s payment's inventory", async (status) => {
    state.reserved = 2
    state.intentStatus = status
    state.stale = [{ id: "old-order", stripePaymentIntentId: "pi_old" }]
    expect((await create([{ ticketTierId: "tier-1", quantity: 1 }])).status).toBe(400)
    expect(state.cancelled).toEqual([])
    expect(state.order).toBeNull()
  })
})
