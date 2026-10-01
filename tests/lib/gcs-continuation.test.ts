import { it, expect, vi } from "vitest";
const state = vi.hoisted(() => ({ access: "attendee", budget: true }));
vi.mock("@/lib/vibez", () => ({
  canPost: (access: string) => access === "attendee",
  vibezAccess: async () => state.access,
  uploadBudget: async () => ({
    allowed: state.budget,
    reason: "Quota reached",
  }),
}));
vi.mock("@/lib/vibez-identity", () => ({
  resolveViewer: async () => ({
    subject: "guest-a",
    isGuest: true,
    userId: null,
    email: null,
    spotIds: [],
    spotId: undefined,
  }),
}));
vi.mock("@/lib/vibez-settings", () => ({
  getVibezSettings: async () => ({
    accessMode: "public",
    maxPerGuestPerHour: 1,
  }),
}));
import { ourFileRouter } from "@/lib/uploadthing";
import { compileRouter } from "@/lib/gcs/router.mjs";
import { mintTicket } from "@/lib/vibez-ticket";
it("actual Afters middleware admits fresh ticket once and reauthorizes delayed continuation/replay without resetting admission quota", async () => {
  vi.useFakeTimers();
  vi.stubEnv("VIBEZ_UPLOAD_SECRET", "synthetic-test-ticket-secret");
  vi.setSystemTime(new Date("2026-10-01T00:00:00Z"));
  state.access = "attendee";
  state.budget = true;
  try {
    const routes = compileRouter(ourFileRouter, {
      eventFlyer: "public",
      eventGallery: "public",
      feedbackScreenshot: "private",
      customLogo: "public",
      vibezPost: "private",
    });
    const input = {
      eventId: "event-a",
      ticket: mintTicket("guest-a", "event-a"),
    };
    const request = new Request("https://afters.am/api/storage");
    const admitted = await routes.vibezPost.authorize(request, input, {
      phase: "init",
    });
    vi.advanceTimersByTime(10 * 60000);
    state.budget = false;
    expect(
      await routes.vibezPost.authorize(request, input, { phase: "continue" }),
    ).toEqual(admitted);
    expect(
      await routes.vibezPost.authorize(request, input, { phase: "replay" }),
    ).toEqual(admitted);
    await expect(
      routes.vibezPost.authorize(request, input, { phase: "init" }),
    ).rejects.toThrow(/expired/);
    state.access = "banned";
    await expect(
      routes.vibezPost.authorize(request, input, { phase: "replay" }),
    ).rejects.toThrow(/Banned/);
  } finally {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  }
});
