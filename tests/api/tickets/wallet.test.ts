import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { execFileSync } from "child_process"
import { mkdtempSync, readFileSync } from "fs"
import { tmpdir } from "os"
import path from "path"

const { mockPrisma, mockAuth } = vi.hoisted(() => ({
  mockPrisma: { ticket: { findUnique: vi.fn() } },
  mockAuth: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }))
vi.mock("@/lib/auth/session", () => ({ getUserId: async () => (await mockAuth())?.userId ?? null }))

import { GET } from "@/app/api/tickets/[ticketId]/wallet/route"
import { createWalletToken, verifyWalletToken, getAppleWalletConfig } from "@/lib/apple-wallet"

const WALLET_ENV = [
  "APPLE_PASS_TYPE_ID",
  "APPLE_TEAM_ID",
  "APPLE_WALLET_SIGNER_CERT",
  "APPLE_WALLET_SIGNER_KEY",
  "APPLE_WALLET_WWDR",
] as const
const walletEnv: Record<string, string> = {}

// Throwaway self-signed cert so passes can actually be signed in tests
beforeAll(() => {
  const dir = mkdtempSync(path.join(tmpdir(), "wallet-test-"))
  execFileSync("openssl", [
    "req", "-x509", "-newkey", "rsa:2048", "-nodes", "-days", "1",
    "-keyout", path.join(dir, "key.pem"), "-out", path.join(dir, "cert.pem"),
    "-subj", "/CN=Pass Type ID: pass.test.afters",
  ], { stdio: "ignore" })
  const cert = readFileSync(path.join(dir, "cert.pem"), "utf8")
  Object.assign(walletEnv, {
    APPLE_PASS_TYPE_ID: "pass.test.afters",
    APPLE_TEAM_ID: "TEAM123456",
    APPLE_WALLET_SIGNER_CERT: cert,
    APPLE_WALLET_SIGNER_KEY: readFileSync(path.join(dir, "key.pem")).toString("base64"),
    APPLE_WALLET_WWDR: cert.replace(/\n/g, "\\n"),
  })
  process.env.WALLET_LINK_SECRET = "test-wallet-secret"
})

function setWalletEnv(enabled: boolean) {
  for (const key of WALLET_ENV) {
    if (enabled) process.env[key] = walletEnv[key]
    else delete process.env[key]
  }
}

function makeTicket(overrides: Record<string, unknown> = {}) {
  return {
    id: "ticket-123",
    ticketNumber: "TK-ABC123",
    userId: null,
    status: "VALID",
    isTestTicket: false,
    ticketTier: { name: "General Admission" },
    order: { orderNumber: "ORD-1", guestName: "Sam", userId: null, status: "PAID" },
    event: {
      title: "Warehouse Night",
      slug: "warehouse-night",
      startsAt: new Date("2026-10-10T03:00:00Z"),
      endsAt: null,
      timezone: "America/New_York",
      venueName: "The Spot",
      venueAddress: "1 Main St",
      city: "Brooklyn",
      state: "NY",
      accentColor: "#ff1493",
      ageRestriction: 21,
      mapLat: null,
      mapLng: null,
      organizer: { displayName: "Crew" },
    },
    ...overrides,
  }
}

function request(token?: string) {
  const url = new URL("http://localhost:3000/api/tickets/ticket-123/wallet")
  if (token) url.searchParams.set("token", token)
  return new NextRequest(url)
}

const params = { params: Promise.resolve({ ticketId: "ticket-123" }) }

describe("wallet link tokens", () => {
  it("verifies a token for the same ticket only", () => {
    const token = createWalletToken("ticket-123")
    expect(verifyWalletToken("ticket-123", token)).toBe(true)
    expect(verifyWalletToken("ticket-456", token)).toBe(false)
    expect(verifyWalletToken("ticket-123", "bogus")).toBe(false)
    expect(verifyWalletToken("ticket-123", null)).toBe(false)
  })
})

describe("getAppleWalletConfig", () => {
  it("is null until every credential is set", () => {
    setWalletEnv(false)
    expect(getAppleWalletConfig()).toBeNull()
    setWalletEnv(true)
    expect(getAppleWalletConfig()).not.toBeNull()
  })

  it("is null without a link secret, so pages never render unsignable links", () => {
    setWalletEnv(true)
    const saved = { w: process.env.WALLET_LINK_SECRET, s: process.env.SCANNER_JWT_SECRET }
    delete process.env.WALLET_LINK_SECRET
    delete process.env.SCANNER_JWT_SECRET
    try {
      expect(getAppleWalletConfig()).toBeNull()
      expect(verifyWalletToken("ticket-123", "anything")).toBe(false)
    } finally {
      if (saved.w) process.env.WALLET_LINK_SECRET = saved.w
      if (saved.s) process.env.SCANNER_JWT_SECRET = saved.s
    }
  })
})

describe("GET /api/tickets/[ticketId]/wallet", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setWalletEnv(true)
    mockAuth.mockResolvedValue({ userId: null })
    mockPrisma.ticket.findUnique.mockResolvedValue(makeTicket())
  })

  it("returns 501 when Apple Wallet is not configured", async () => {
    setWalletEnv(false)
    const res = await GET(request(createWalletToken("ticket-123")), params)
    expect(res.status).toBe(501)
  })

  it("returns 401 for guests without a valid token", async () => {
    const res = await GET(request("bad-token"), params)
    expect(res.status).toBe(401)
  })

  it("returns 404 for unknown tickets", async () => {
    mockPrisma.ticket.findUnique.mockResolvedValue(null)
    const res = await GET(request(createWalletToken("ticket-123")), params)
    expect(res.status).toBe(404)
  })

  it("rejects tickets that are no longer valid", async () => {
    mockPrisma.ticket.findUnique.mockResolvedValue(makeTicket({ status: "REFUNDED" }))
    const res = await GET(request(createWalletToken("ticket-123")), params)
    expect(res.status).toBe(400)
  })

  it("serves a signed .pkpass for a guest with a valid token", async () => {
    const res = await GET(request(createWalletToken("ticket-123")), params)
    expect(res.status).toBe(200)
    expect(res.headers.get("Content-Type")).toBe("application/vnd.apple.pkpass")
    const body = Buffer.from(await res.arrayBuffer())
    expect(body.subarray(0, 2).toString()).toBe("PK") // zip archive
    expect(body.includes(Buffer.from("pass.json"))).toBe(true)
    expect(body.includes(Buffer.from("signature"))).toBe(true)
  })

  it("serves the pass to the signed-in owner without a token", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1" })
    mockPrisma.ticket.findUnique.mockResolvedValue(
      makeTicket({ order: { orderNumber: "ORD-1", guestName: null, userId: "user-1", status: "PAID" } })
    )
    const res = await GET(request(), params)
    expect(res.status).toBe(200)
  })

  it("does not serve another user's ticket without a token", async () => {
    mockAuth.mockResolvedValue({ userId: "someone-else" })
    const res = await GET(request(), params)
    expect(res.status).toBe(401)
  })
})
