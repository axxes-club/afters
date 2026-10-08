import { securityRateLimit } from "./security-rate-limit";
import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { hasPermission } from "@/lib/subscription"
import { randomInt } from "crypto"

export const SCANNER_SESSION_COOKIE = "afters-scanner-session"

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
  // Use cryptographically secure random number generator
  // randomInt is inclusive of min, exclusive of max
  return randomInt(100000, 1000000).toString()
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
  const session = await verifyScannerToken(token)
  if (!session) return null
  if (session.scannerId.startsWith("organizer-")) {
    const userId = session.scannerId.slice("organizer-".length)
    const event = await prisma.event.findUnique({ where: { id: session.eventId }, select: { organizerId: true } })
    if (!event || !await hasPermission(userId, event.organizerId, "tickets.scan")) return null
  }
  return session
}

export function getScannerCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 12,
    path: "/",
  }
}

export async function setScannerSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(SCANNER_SESSION_COOKIE, token, getScannerCookieOptions())
}

export async function clearScannerSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SCANNER_SESSION_COOKIE)
}

export async function checkRateLimit(identifier: string, maxAttempts=10, windowMs=60000): Promise<boolean> {
 return (await securityRateLimit(`scanner:${identifier}`,maxAttempts,windowMs)).allowed;
}
