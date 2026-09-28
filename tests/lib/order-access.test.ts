import { describe, it, expect, beforeEach } from "vitest"
import { createOrderAccessToken, verifyOrderAccessToken } from "@/lib/order-access"

describe("order access tokens", () => {
  beforeEach(() => {
    process.env.WALLET_LINK_SECRET = "test-secret"
  })

  it("verifies a token only for its own order", () => {
    const token = createOrderAccessToken("order-1")!
    expect(verifyOrderAccessToken("order-1", token)).toBe(true)
    expect(verifyOrderAccessToken("order-2", token)).toBe(false)
    expect(verifyOrderAccessToken("order-1", "nope")).toBe(false)
    expect(verifyOrderAccessToken("order-1", undefined)).toBe(false)
  })

  it("is distinct from the wallet link token for the same id", async () => {
    const { createWalletToken } = await import("@/lib/apple-wallet")
    expect(createOrderAccessToken("x")).not.toBe(createWalletToken("x"))
  })

  it("denies access when no secret is configured", () => {
    const saved = { w: process.env.WALLET_LINK_SECRET, s: process.env.SCANNER_JWT_SECRET }
    delete process.env.WALLET_LINK_SECRET
    delete process.env.SCANNER_JWT_SECRET
    try {
      expect(createOrderAccessToken("order-1")).toBeNull()
      expect(verifyOrderAccessToken("order-1", "anything")).toBe(false)
    } finally {
      if (saved.w) process.env.WALLET_LINK_SECRET = saved.w
      if (saved.s) process.env.SCANNER_JWT_SECRET = saved.s
    }
  })
})
