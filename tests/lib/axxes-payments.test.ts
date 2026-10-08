// @vitest-environment node
import { it, expect, vi, beforeEach } from "vitest";
import { createHmac } from "node:crypto";

const db = vi.hoisted(() => ({
  existing: null as null | { plan: string; stripeSubscriptionId: string | null },
  upserts: [] as unknown[],
  suspended: 0,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    subscription: {
      findUnique: async () => db.existing,
      upsert: async (args: unknown) => { db.upserts.push(args); },
    },
    organizerProfile: { findUnique: async () => ({ id: "org_1" }) },
    staffMember: { updateMany: async () => { db.suspended++; } },
  },
}));

import { verifyPaymentsEvent, type SubscriptionSnapshot } from "@/lib/axxes-payments";
import { applySignatureSnapshot, planFromSnapshot } from "@/lib/signature-billing";

const SECRET = "e".repeat(64);
const snap = (patch: Partial<SubscriptionSnapshot> = {}): SubscriptionSnapshot => ({
  id: "sub_new12345", status: "active", product: "afters", reference: "org_1", price: "price_x", interval: "month", interval_count: 1,
  current_period_end: 1_900_000_000, cancel_at_period_end: false, trial_end: null, canceled_at: null, ended_at: null, ...patch,
});

beforeEach(() => {
  db.existing = null; db.upserts = []; db.suspended = 0;
  process.env.AXXES_PAYMENTS_EVENT_SECRET = SECRET;
});

it("maps Payments subscription intervals to Signature plans", () => {
  expect(planFromSnapshot(snap())).toBe("SIGNATURE_30D");
  expect(planFromSnapshot(snap({ interval_count: 6 }))).toBe("SIGNATURE_180D");
  expect(planFromSnapshot(snap({ interval: "year" }))).toBe("SIGNATURE_360D");
  expect(planFromSnapshot(snap({ status: "trialing" }))).toBe("SIGNATURE_TRIAL_7D");
  expect(planFromSnapshot(snap({ status: "past_due" }))).toBe("SIGNATURE_30D");
  for (const status of ["canceled", "incomplete", "incomplete_expired", "unpaid", "paused"] as const)
    expect(planFromSnapshot(snap({ status }))).toBe("FREE");
});

it("accepts only correctly signed, fresh Payments events", () => {
  const body = JSON.stringify({ id: "evt_1", product: "afters" });
  const t = 1_800_000_000;
  const v1 = createHmac("sha256", SECRET).update(`${t}.${body}`).digest("hex");
  expect(verifyPaymentsEvent(body, `t=${t},v1=${v1}`, t + 5)?.id).toBe("evt_1");
  expect(verifyPaymentsEvent(body + " ", `t=${t},v1=${v1}`, t)).toBeNull();
  expect(verifyPaymentsEvent(body, `t=${t},v1=${v1}`, t + 301)).toBeNull();
  expect(verifyPaymentsEvent(body, null, t)).toBeNull();
});

it("a cancellation of an older subscription cannot remove a newer plan", async () => {
  db.existing = { plan: "SIGNATURE_30D", stripeSubscriptionId: "sub_new12345" };
  await applySignatureSnapshot(snap({ id: "sub_old12345", status: "canceled" }));
  expect(db.upserts).toHaveLength(0);
});

it("ending the current subscription returns the organizer to Free and suspends staff", async () => {
  db.existing = { plan: "SIGNATURE_30D", stripeSubscriptionId: "sub_new12345" };
  await applySignatureSnapshot(snap({ status: "canceled" }));
  expect((db.upserts[0] as { update: { plan: string } }).update.plan).toBe("FREE");
  expect(db.suspended).toBe(1);
});

it("Friends & Family grants and other products' events are left alone", async () => {
  db.existing = { plan: "SIGNATURE_FF", stripeSubscriptionId: null };
  await applySignatureSnapshot(snap({ status: "canceled" }));
  db.existing = null;
  await applySignatureSnapshot(snap({ product: "qortr" }));
  expect(db.upserts).toHaveLength(0);
});
