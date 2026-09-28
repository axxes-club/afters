import { createHmac, timingSafeEqual } from "crypto"

// Signed access to the order confirmation page. Most buyers check out as guests,
// so the checkout flow carries this token instead of relying on a Clerk session.

function getSecret(): string | undefined {
  return process.env.WALLET_LINK_SECRET || process.env.SCANNER_JWT_SECRET || undefined
}

export function createOrderAccessToken(orderId: string): string | null {
  const secret = getSecret()
  if (!secret) return null
  return createHmac("sha256", secret).update(`order-access:${orderId}`).digest("base64url")
}

export function verifyOrderAccessToken(orderId: string, token: string | null | undefined): boolean {
  if (!token) return false
  const expected = createOrderAccessToken(orderId)
  if (!expected) return false
  const a = Buffer.from(expected)
  const b = Buffer.from(token)
  return a.length === b.length && timingSafeEqual(a, b)
}
