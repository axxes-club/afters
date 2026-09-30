import { createHash, randomBytes, timingSafeEqual } from "node:crypto"

/**
 * "Continue with AXXES" — afters is an OIDC client of Handshake
 * (handshake.axxes.club), which holds the AXXES account. afters keeps Clerk for
 * its own sessions: the AXXES identity is matched to a Clerk user by verified
 * email, and Clerk signs them in with a one-time sign-in token.
 *
 * Authorization-code flow with PKCE, the same shape as qortr's client
 * (qortr/src/lib/axxes.ts). The callback URL is derived from the host the
 * person arrived on, and Handshake holds every afters host in its exact-match
 * redirect allowlist.
 */

export const HANDSHAKE_URL = (process.env.HANDSHAKE_URL || "https://handshake.axxes.club").replace(/\/$/, "")
const AUTHORIZE = `${HANDSHAKE_URL}/api/auth/oauth2/authorize`
const TOKEN = `${HANDSHAKE_URL}/api/auth/oauth2/token`
const USERINFO = `${HANDSHAKE_URL}/api/auth/oauth2/userinfo`

export const AXXES_CLIENT_ID = process.env.AFTERS_OIDC_CLIENT_ID || "afters"
export const STATE_COOKIE = "afters_axxes_state"
export const VERIFIER_COOKIE = "afters_axxes_verifier"
export const COOKIE_PATH = "/api/auth/axxes"

export type AxxesIdentity = {
  sub: string
  email: string
  emailVerified: boolean
  firstName: string
  lastName: string
}

export function newPkce() {
  const verifier = randomBytes(32).toString("base64url")
  const challenge = createHash("sha256").update(verifier).digest("base64url")
  return { verifier, challenge }
}

function secret(): string {
  const value = process.env.AFTERS_OIDC_CLIENT_SECRET
  if (!value) throw new Error("AFTERS_OIDC_CLIENT_SECRET is not set")
  return value
}

/** Is "Continue with AXXES" configured on this deployment? */
export function axxesEnabled(): boolean {
  return Boolean(process.env.AFTERS_OIDC_CLIENT_SECRET)
}

export function authorizeUrl(origin: string, state: string, challenge: string) {
  const url = new URL(AUTHORIZE)
  url.searchParams.set("client_id", AXXES_CLIENT_ID)
  url.searchParams.set("redirect_uri", `${origin}/api/auth/axxes/callback`)
  url.searchParams.set("response_type", "code")
  url.searchParams.set("scope", "openid email profile")
  url.searchParams.set("state", state)
  url.searchParams.set("code_challenge", challenge)
  url.searchParams.set("code_challenge_method", "S256")
  return url
}

/**
 * Swap the code for the person's identity. The secret goes as both Basic auth
 * and a body field: Handshake advertises both, and sending the one it does not
 * expect fails with an error that reads like a bad code.
 */
export async function exchangeCode(code: string, verifier: string, origin: string): Promise<AxxesIdentity | null> {
  const clientSecret = secret()
  const res = await fetch(TOKEN, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${AXXES_CLIENT_ID}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: `${origin}/api/auth/axxes/callback`,
      code_verifier: verifier,
      client_id: AXXES_CLIENT_ID,
      client_secret: clientSecret,
    }).toString(),
    cache: "no-store",
  })
  if (!res.ok) {
    // Server log only: the body can echo parts of the request.
    console.error("AXXES token exchange failed", { status: res.status, body: await res.text().catch(() => "") })
    return null
  }
  const tokens = (await res.json()) as { access_token?: string }
  if (!tokens.access_token) return null

  const info = await fetch(USERINFO, { headers: { Authorization: `Bearer ${tokens.access_token}` }, cache: "no-store" })
  if (!info.ok) return null
  const claims = (await info.json()) as Record<string, unknown>
  const sub = typeof claims.sub === "string" ? claims.sub : null
  const email = typeof claims.email === "string" ? claims.email.trim().toLowerCase() : null
  if (!sub || !email) return null

  const name = typeof claims.name === "string" ? claims.name.trim() : ""
  const [firstName, ...rest] = name.split(/\s+/)
  return {
    sub,
    email,
    emailVerified: claims.email_verified === true,
    firstName: typeof claims.given_name === "string" ? claims.given_name : firstName ?? "",
    lastName: typeof claims.family_name === "string" ? claims.family_name : rest.join(" "),
  }
}

/** Constant-time compare, so the state check cannot be timed. */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB)
}
