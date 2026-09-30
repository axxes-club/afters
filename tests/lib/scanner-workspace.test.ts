import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ cookies: vi.fn(), event: vi.fn(), permission: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: m.cookies }));
vi.mock("@/lib/prisma", () => ({ prisma: { event: { findUnique: m.event } } }));
vi.mock("@/lib/subscription", () => ({ hasPermission: m.permission }));
import { createScannerToken, getScannerSession } from "@/lib/scanner-auth";
beforeEach(() => { vi.resetAllMocks(); process.env.SCANNER_JWT_SECRET = "scanner-test-secret"; });
describe("staff scanner session revocation", () => {
  it("rejects a signed token when staff scanning permission is revoked", async () => {
    const token = await createScannerToken("organizer-staff", "event", "Staff"); m.cookies.mockResolvedValue({ get: () => ({ value: token }) }); m.event.mockResolvedValue({ organizerId: "workspace" }); m.permission.mockResolvedValue(false);
    expect(await getScannerSession()).toBeNull(); expect(m.permission).toHaveBeenCalledWith("staff", "workspace", "tickets.scan");
  });
  it("accepts an authorized staff token for its event workspace", async () => {
    const token = await createScannerToken("organizer-staff", "event", "Staff"); m.cookies.mockResolvedValue({ get: () => ({ value: token }) }); m.event.mockResolvedValue({ organizerId: "workspace" }); m.permission.mockResolvedValue(true);
    expect((await getScannerSession())?.eventId).toBe("event");
  });
  it("rejects organizer tokens for removed events", async () => {
    const token = await createScannerToken("organizer-staff", "removed", "Staff"); m.cookies.mockResolvedValue({ get: () => ({ value: token }) }); m.event.mockResolvedValue(null);
    expect(await getScannerSession()).toBeNull();
  });
});
