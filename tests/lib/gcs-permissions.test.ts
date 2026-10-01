import { it, expect, vi } from "vitest";
const state = vi.hoisted(() => ({
  session: null as any,
  post: null as any,
  access: "guest",
  super: false,
  queries: [] as any[],
  staffContext: null as any,
  staffActive: false,
  publishedLineup: false,
  eventQueries: [] as any[],
}));
vi.mock("@/lib/auth-utils", () => ({
  isSuperAdmin: async () => state.super,
  getSessionUser: async () => state.session,
}));
vi.mock("@/lib/organizer-context", () => ({
  getOrganizerContext: async () => state.staffContext,
}));
vi.mock("@clerk/nextjs/server", () => ({
  auth: async () => ({ userId: null }),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    event: {
      findFirst: async (query: any) => {
        state.eventQueries.push(query);
        return state.publishedLineup && query.where.isPublished === true
          ? { id: "published" }
          : null;
      },
    },
    staffMember: {
      findFirst: async () => (state.staffActive ? { id: "staff" } : null),
    },
    organizerProfile: { findFirst: async () => null },
    feedback: { findFirst: async () => null },
    user: { findFirst: async () => ({ id: "avatar-owner" }) },
    vibezPost: {
      findFirst: async (query: any) => {
        state.queries.push(query);
        return state.post;
      },
    },
  },
}));
vi.mock("@/lib/vibez-identity", () => ({
  resolveViewer: async () => ({
    subject: "viewer",
    userId: null,
    email: null,
    isGuest: true,
    spotIds: [],
  }),
}));
vi.mock("@/lib/vibez-settings", () => ({
  getVibezSettings: async () => ({ accessMode: "public" }),
}));
vi.mock("@/lib/vibez", () => ({
  canView: (access: string) => access !== "banned",
  vibezAccess: async () => state.access,
}));
import { authorizeAssetRead } from "@/lib/gcs/permissions";
it("copied user avatars require self/admin or readable feed reference", async () => {
  const request = new Request("https://afters.am"),
    context = { record: null, urls: ["synthetic-avatar"] };
  state.session = null;
  state.post = null;
  expect(await authorizeAssetRead(request, context)).toBe(false);
  state.session = { id: "avatar-owner", role: "USER" };
  expect(await authorizeAssetRead(request, context)).toBe(true);
  state.session = null;
  state.post = {
    eventId: "event-a",
    moderationStatus: "approved",
    removedAt: null,
    authorSubject: "other",
  };
  expect(await authorizeAssetRead(request, context)).toBe(true);
  expect(state.queries.at(-1).where.OR).toContainEqual({
    authorImageUrl: { in: ["synthetic-avatar"] },
  });
  state.access = "banned";
  expect(await authorizeAssetRead(request, context)).toBe(false);
  state.access = "guest";
  state.post.moderationStatus = "pending";
  expect(await authorizeAssetRead(request, context)).toBe(false);
});

it("staff avatar requires current staff.manage workspace and active membership; artist avatar requires published lineup reference", async () => {
  state.session = { id: "manager", role: "USER" };
  state.post = null;
  state.access = "guest";
  state.staffContext = null;
  state.staffActive = true;
  const request = new Request("https://afters.am"),
    context = { record: null, urls: ["synthetic-avatar"] };
  expect(await authorizeAssetRead(request, context)).toBe(false);
  state.staffContext = { profile: { id: "workspace" } };
  expect(await authorizeAssetRead(request, context)).toBe(true);
  state.staffActive = false;
  expect(await authorizeAssetRead(request, context)).toBe(false);
  state.session = null;
  state.publishedLineup = true;
  expect(await authorizeAssetRead(request, context)).toBe(true);
  expect(state.eventQueries.at(-1).where).toMatchObject({ isPublished: true });
  expect(state.eventQueries.at(-1).where.OR).toContainEqual({
    lineup: { array_contains: [{ imageUrl: "synthetic-avatar" }] },
  });
  state.publishedLineup = false;
  state.staffContext = null;
});
