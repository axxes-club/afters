import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ user: vi.fn(), first: vi.fn(), many: vi.fn(), context: vi.fn() }));
vi.mock("@/lib/auth-utils", () => ({ getEffectiveUserId: m.user }));
vi.mock("@/lib/prisma", () => ({ prisma: { organizerProfile: { findFirst: m.first, findMany: m.many } } }));
vi.mock("@/lib/organizer-context", () => ({ ORGANIZER_COOKIE: "afters-organizer", getOrganizerContext: m.context }));
import { GET, POST } from "@/app/api/organizer/workspaces/route";
const request = (id: unknown) => new Request("http://localhost/api/organizer/workspaces", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
beforeEach(() => { vi.resetAllMocks(); m.user.mockResolvedValue("member"); });
describe("organizer workspace switch", () => {
  it("rejects unauthenticated callers without any membership query", async () => { m.user.mockResolvedValue(null); expect((await POST(request("other"))).status).toBe(401); expect(m.first).not.toHaveBeenCalled(); });
  it("rejects foreign or inactive memberships and never sets a cookie", async () => {
    m.first.mockResolvedValue(null); const response = await POST(request("foreign"));
    expect(response.status).toBe(403); expect(response.headers.get("set-cookie")).toBeNull();
    expect(m.first).toHaveBeenCalledWith({ where: { id: "foreign", OR: [{ userId: "member" }, { staffMembers: { some: { userId: "member", status: "ACTIVE" } } }] } });
  });
  it("sets an HttpOnly context cookie only after authorization", async () => { m.first.mockResolvedValue({ id: "allowed" }); const response = await POST(request("allowed")); expect(response.status).toBe(200); expect(response.headers.get("set-cookie")).toContain("afters-organizer=allowed"); expect(response.headers.get("set-cookie")).toContain("HttpOnly"); });
  it("rejects malformed ids", async () => { expect((await POST(request(42))).status).toBe(400); expect(m.first).not.toHaveBeenCalled(); });
  it("lists only owner and active staff workspaces", async () => { m.many.mockResolvedValue([{ id: "own", displayName: "Own", userId: "member" }, { id: "shared", displayName: "Shared", userId: "owner" }]); m.context.mockResolvedValue({ profile: { id: "shared" } }); const response = await GET(); expect(await response.json()).toEqual({ currentId: "shared", workspaces: [{ id: "own", displayName: "Own", role: "Owner" }, { id: "shared", displayName: "Shared", role: "Staff" }] }); expect(m.many.mock.calls[0][0].where).toEqual({ OR: [{ userId: "member" }, { staffMembers: { some: { userId: "member", status: "ACTIVE" } } }] }); });
});
