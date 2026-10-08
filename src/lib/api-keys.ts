import { securityRateLimit } from "./security-rate-limit";
import { createHash, randomBytes } from "crypto"
import { prisma } from "./prisma"

// API Key format: aftr_<32 random chars>
const API_KEY_PREFIX = "aftr_"
const KEY_LENGTH = 32

// Available scopes for API keys
export const API_SCOPES = {
  // Event scopes
  "events:read": "Read event details",
  "events:write": "Create and update events",
  "events:delete": "Delete events",
  // Order scopes
  "orders:read": "Read order details",
  // Ticket scopes
  "tickets:read": "Read ticket details",
  "tickets:checkin": "Check in tickets",
  // Guestlist scopes
  "guestlist:read": "Read guestlist entries",
  "guestlist:write": "Manage guestlist entries",
  // Analytics scopes
  "analytics:read": "Read event analytics",
  // Scanner scopes
  "scanners:read": "Read scanner details",
  "scanners:write": "Manage scanners",
} as const

export type ApiScope = keyof typeof API_SCOPES

// Generate a cryptographically secure API key
export function generateApiKey(): { key: string; prefix: string; hash: string } {
  const randomPart = randomBytes(KEY_LENGTH).toString("base64url").slice(0, KEY_LENGTH)
  const key = `${API_KEY_PREFIX}${randomPart}`
  const prefix = key.slice(0, 12) // "aftr_" + first 7 chars
  const hash = hashApiKey(key)

  return { key, prefix, hash }
}

// Hash an API key for secure storage
export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex")
}

// Validate an API key and return the associated user if valid
export async function validateApiKey(key: string): Promise<{
  valid: boolean
  userId?: string
  scopes?: string[]
  keyId?: string
  error?: string
}> {
  if (!key || !key.startsWith(API_KEY_PREFIX)) {
    return { valid: false, error: "Invalid API key format" }
  }

  const hash = hashApiKey(key)

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash: hash },
    select: {
      id: true,
      userId: true,
      scopes: true,
      expiresAt: true,
      revokedAt: true,
    },
  })

  if (!apiKey) {
    return { valid: false, error: "API key not found" }
  }

  if (apiKey.revokedAt) {
    return { valid: false, error: "API key has been revoked" }
  }

  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return { valid: false, error: "API key has expired" }
  }

  // Update last used timestamp (fire and forget)
  prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  }).catch(() => {
    // Ignore errors updating last used - don't block the request
  })

  return {
    valid: true,
    userId: apiKey.userId,
    scopes: apiKey.scopes,
    keyId: apiKey.id,
  }
}

// Check if an API key has a specific scope
export function hasScope(scopes: string[], requiredScope: ApiScope): boolean {
  return scopes.includes(requiredScope)
}

// Check if an API key has any of the required scopes
export function hasAnyScope(scopes: string[], requiredScopes: ApiScope[]): boolean {
  return requiredScopes.some((scope) => scopes.includes(scope))
}

// Check if an API key has all of the required scopes
export function hasAllScopes(scopes: string[], requiredScopes: ApiScope[]): boolean {
  return requiredScopes.every((scope) => scopes.includes(scope))
}

export async function checkApiRateLimit(keyId: string,maxRequests=100,windowMs=60000) {
 return securityRateLimit(`api:${keyId}`,maxRequests,windowMs);
}
