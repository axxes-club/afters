import { beforeEach, expect, it, vi } from "vitest"
const state = vi.hoisted(() => ({ signedIn: true, owner: true, sent: null as Record<string, unknown> | null }))
vi.mock("@/lib/auth-utils", () => ({ getEffectiveUserId: async () => state.signedIn ? "owner-1" : null }))
vi.mock("@/lib/organizer-context", () => ({ organizerWhere: async (permission: string) => {
  if (permission !== "owner") throw new Error("financial sessions require ownership")
  return { id: state.owner ? "org-1" : "__no_authorized_organizer__" }
} }))
vi.mock("@/lib/prisma", () => ({ prisma: { organizerProfile: { findUnique: async ({ where }: { where: { id: string } }) =>
  where.id === "org-1" ? { id: "org-1", stripeAccountId: "acct_owner", displayName: "Owner", user: { email: "owner@example.test" } } : null,
} } }))
vi.mock("@/lib/payouts", () => ({ ensurePayoutAccount: async () => "acct_owner" }))
vi.mock("@/lib/stripe", () => ({ stripe: { accountSessions: { create: async (params: Record<string, unknown>) => {
  state.sent = params
  return { client_secret: "session_secret" }
} } } }))
import { POST } from "@/app/api/stripe/connect/session/route"
beforeEach(() => { state.signedIn = true; state.owner = true; state.sent = null })
it("requires sign-in before delegating financial account access", async () => {
  state.signedIn = false
  expect((await POST()).status).toBe(401)
  expect(state.sent).toBeNull()
})
it("refuses staff even if they can edit events", async () => {
  state.owner = false
  expect((await POST()).status).toBe(403)
  expect(state.sent).toBeNull()
})
it("scopes the session to the owner's payout account and enables the six required financial surfaces", async () => {
  const response = await POST()
  expect(response.status).toBe(200)
  expect(response.headers.get("cache-control")).toBe("no-store")
  expect(await response.json()).toEqual({ clientSecret: "session_secret" })
  expect(state.sent).toMatchObject({ account: "acct_owner", components: {
    account_management: { enabled: true, features: { external_account_collection: true } }, notification_banner: { enabled: true },
    payouts: { enabled: true }, payments: { enabled: true, features: { refund_management: true, dispute_management: true } },
    balances: { enabled: true }, documents: { enabled: true },
  } })
})
