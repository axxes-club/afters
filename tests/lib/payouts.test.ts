import { beforeEach, expect, it, vi } from "vitest"
const state = vi.hoisted(() => ({ key: "", stored: null as string | null }))
vi.mock("@/lib/prisma", () => ({ prisma: {
  organizerProfile: {
    update: async ({ data }: { data: { stripeAccountId: string } }) => { state.stored = data.stripeAccountId },
    updateMany: async ({ data }: { data: { stripeAccountId: string } }) => {
      if (state.stored) return { count: 0 }
      state.stored = data.stripeAccountId
      return { count: 1 }
    },
    findUnique: async () => ({ stripeAccountId: state.stored }),
  },
} }))
vi.mock("@/lib/stripe", () => ({ stripe: { accounts: {
  create: async (_data: unknown, options?: { idempotencyKey: string }) => {
    state.key = options?.idempotencyKey ?? ""
    return { id: state.key ? "acct_same" : "acct_racing" }
  },
} } }))
import { ensurePayoutAccount } from "@/lib/payouts"
beforeEach(() => { state.key = ""; state.stored = null })
it("uses one idempotent payout account for simultaneous initial setup requests", async () => {
  const profile = { id: "org-1", displayName: "Organizer", stripeAccountId: null, user: { email: "owner@example.test" } }
  const ids = await Promise.all([ensurePayoutAccount(profile), ensurePayoutAccount(profile)])
  expect(state.key).toBe("afters-payout:org-1:new")
  expect(ids).toEqual(["acct_same", "acct_same"])
  expect(state.stored).toBe("acct_same")
})
