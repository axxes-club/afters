/**
 * The one thing afters still asks Clerk, until everyone has signed in once.
 *
 * Clerk does not hand out password hashes through its API, so accounts moved
 * over from Clerk (scripts/auth/import-clerk-users.mjs) start with the
 * password `clerk:<clerk user id>`. On that person's first password sign-in,
 * Clerk checks the password, and src/lib/auth/index.ts stores afters' own hash
 * in its place. Once no `clerk:` passwords are left, this file, the
 * CLERK_SECRET_KEY secret and the Clerk app can all go.
 */

export const CLERK_PENDING_PREFIX = "clerk:"

export async function verifyWithClerk(clerkUserId: string, password: string): Promise<boolean> {
  const key = process.env.CLERK_SECRET_KEY
  if (!key || !/^user_[A-Za-z0-9]+$/.test(clerkUserId)) return false
  try {
    const res = await fetch(`https://api.clerk.com/v1/users/${clerkUserId}/verify_password`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return false
    const body = (await res.json()) as { verified?: boolean }
    return body.verified === true
  } catch (error) {
    console.error("Clerk password check failed", error)
    return false
  }
}
