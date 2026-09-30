import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ cookies: vi.fn(), user: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), permission: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: mocks.cookies }));
vi.mock("@/lib/auth-utils", () => ({ getEffectiveUserId: mocks.user }));
vi.mock("@/lib/prisma", () => ({ prisma: { organizerProfile: { findUnique: mocks.findUnique, findFirst: mocks.findFirst } } }));
vi.mock("@/lib/subscription", () => ({ hasPermission: mocks.permission }));
import { getOrganizerContext, organizerWhere } from "@/lib/organizer-context";
const own = { id: "own", userId: "member" };
const other = { id: "other", userId: "owner" };
beforeEach(() => { vi.resetAllMocks(); mocks.user.mockResolvedValue("member"); mocks.cookies.mockResolvedValue({ get: () => ({ value: "other" }) }); mocks.findUnique.mockResolvedValue(own); mocks.permission.mockResolvedValue(false); });
describe("organizer workspace authorization", () => {
  it("uses an active staff workspace without granting ownership", async () => {
    mocks.findFirst.mockResolvedValue(other);
    expect(await getOrganizerContext()).toEqual({ profile: other, userId: "member", isOwner: false });
    expect(mocks.findFirst).toHaveBeenCalledWith({ where: { id: "other", staffMembers: { some: { userId: "member", status: "ACTIVE" } } } });
    expect(await getOrganizerContext("owner")).toBeNull();
  });
  it("revoked, suspended or foreign selections fall back to own workspace", async () => {
    mocks.findFirst.mockResolvedValue(null);
    expect((await getOrganizerContext())?.profile.id).toBe("own");
  });
  it("denies a staff operation lacking its permission", async () => {
    mocks.findFirst.mockResolvedValue(other);
    expect(await getOrganizerContext("events.delete")).toBeNull();
    expect(await organizerWhere("events.delete")).toEqual({ id: "__no_authorized_organizer__" });
    expect(mocks.permission).toHaveBeenCalledWith("member", "other", "events.delete");
  });
  it("honors a granted staff permission in selected workspace", async () => {
    mocks.findFirst.mockResolvedValue(other); mocks.permission.mockResolvedValue(true);
    expect(await organizerWhere("events.edit")).toEqual({ id: "other" });
  });
  it("does not query organizers when signed out", async () => {
    mocks.user.mockResolvedValue(null);
    expect(await getOrganizerContext()).toBeNull(); expect(mocks.findUnique).not.toHaveBeenCalled();
  });
  it("denies all access after revocation when user owns no workspace", async () => {
    mocks.findUnique.mockResolvedValue(null); mocks.findFirst.mockResolvedValue(null);
    expect(await getOrganizerContext()).toBeNull();
  });
});
