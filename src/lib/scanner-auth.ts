import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

const SCANNER_SESSION_COOKIE = "afters-scanner-session"

function getSecret() {
  const secret = process.env.SCANNER_JWT_SECRET
  if (!secret) {
    throw new Error("SCANNER_JWT_SECRET environment variable is required")
  }
  return new TextEncoder().encode(secret)
}

export interface ScannerSession {
  scannerId: string
  eventId: string
  name: string
}

export function generateScannerCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function createScannerToken(
  scannerId: string,
  eventId: string,
  name: string
): Promise<string> {
  return new SignJWT({ scannerId, eventId, name })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(getSecret())
}

export async function verifyScannerToken(
  token: string
): Promise<ScannerSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as unknown as ScannerSession
  } catch {
    return null
  }
}

export async function getScannerSession(): Promise<ScannerSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SCANNER_SESSION_COOKIE)?.value
  if (!token) return null
  return verifyScannerToken(token)
}

export async function setScannerSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(SCANNER_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 12,
    path: "/",
  })
}

export async function clearScannerSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SCANNER_SESSION_COOKIE)
}

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(
  identifier: string,
  maxAttempts = 10,
  windowMs = 60000
): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(identifier)

  if (!record || now > record.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (record.count >= maxAttempts) {
    return false
  }

  record.count++
  return true
}
