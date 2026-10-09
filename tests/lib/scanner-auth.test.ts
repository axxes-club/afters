import { beforeEach, describe, expect, it, vi } from "vitest"
import { SignJWT } from "jose"
const mocks = vi.hoisted(() => ({ token: "", scanner: vi.fn(), event: vi.fn(), permission: vi.fn() }))
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => ({ value: mocks.token }) }) }))
vi.mock("@/lib/prisma", () => ({ prisma: { eventScanner: { findUnique: mocks.scanner }, event: { findUnique: mocks.event } } }))
vi.mock("@/lib/subscription", () => ({ hasPermission: mocks.permission }))
vi.mock("@/lib/security-rate-limit", () => ({ securityRateLimit: vi.fn() }))
import { createScannerToken, getScannerSession, verifyScannerToken } from "@/lib/scanner-auth"

describe("scanner session live authority", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    process.env.SCANNER_JWT_SECRET = "isolated-test-scanner-secret"
    mocks.token = await createScannerToken("scanner-1", "event-1", "Door")
    mocks.scanner.mockResolvedValue({ eventId: "event-1", isActive: true })
    mocks.event.mockResolvedValue({ organizerId: "org-1" })
    mocks.permission.mockResolvedValue(true)
  })
  it("preserves active scanner sessions", async () => { expect(await getScannerSession()).toMatchObject({ scannerId: "scanner-1", eventId: "event-1" }) })
  it.each([null, { eventId: "event-1", isActive: false }, { eventId: "event-2", isActive: true }])("rejects removed, disabled or reassigned scanners: %j", async scanner => {
    mocks.scanner.mockResolvedValue(scanner)
    expect(await getScannerSession()).toBeNull()
  })
  it("does not authenticate when the scanner store fails", async () => {
    mocks.scanner.mockRejectedValue(new Error("offline"))
    await expect(getScannerSession()).rejects.toThrow("offline")
  })
  it("rechecks organizer authority", async () => {
    mocks.token = await createScannerToken("organizer-user-1", "event-1", "Organizer")
    expect(await getScannerSession()).not.toBeNull()
    mocks.permission.mockResolvedValue(false)
    expect(await getScannerSession()).toBeNull()
  })
  it.each([{ scannerId: 1, eventId: "event-1", name: "Door" }, { scannerId: "scanner-1", eventId: "", name: "Door" }, { scannerId: "scanner-1", eventId: "event-1" }])("rejects malformed signed claims: %j", async payload => {
    const token = await new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setExpirationTime("1h").sign(new TextEncoder().encode(process.env.SCANNER_JWT_SECRET))
    expect(await verifyScannerToken(token)).toBeNull()
  })
})
