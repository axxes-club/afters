import { NextResponse, type NextRequest } from "next/server"
import { clerkClient } from "@clerk/nextjs/server"
import { COOKIE_PATH, STATE_COOKIE, VERIFIER_COOKIE, exchangeCode, safeEqual } from "@/lib/axxes"

export const dynamic = "force-dynamic"

/** Back to the sign-in page with a reason it can explain. */
function fail(req: NextRequest, reason: string) {
  const res = NextResponse.redirect(new URL(`/sign-in?axxes=${reason}`, req.url))
  res.cookies.set(STATE_COOKIE, "", { path: COOKIE_PATH, maxAge: 0 })
  res.cookies.set(VERIFIER_COOKIE, "", { path: COOKIE_PATH, maxAge: 0 })
  return res
}

/**
 * GET /api/auth/axxes/callback — Handshake sends the person back here.
 *
 * The AXXES identity becomes an afters (Clerk) session:
 * - only a VERIFIED AXXES email is trusted; anything else is turned away, so
 *   nobody can claim an afters account by registering its email on AXXES;
 * - the Clerk user with that email signs in; if there is none, one is created;
 * - Clerk issues a one-time sign-in token, which the <SignIn> page redeems
 *   (the __clerk_ticket parameter), so Clerk stays the only session afters has.
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  if (params.get("error")) return fail(req, "cancelled")

  const code = params.get("code")
  const state = params.get("state")
  const expected = req.cookies.get(STATE_COOKIE)?.value
  const verifier = req.cookies.get(VERIFIER_COOKIE)?.value
  if (!code || !state || !expected || !verifier || !safeEqual(state, expected)) return fail(req, "expired")

  const identity = await exchangeCode(code, verifier, req.nextUrl.origin).catch(error => {
    console.error("AXXES sign-in failed", error)
    return null
  })
  if (!identity) return fail(req, "failed")
  if (!identity.emailVerified) return fail(req, "unverified")

  try {
    const clerk = await clerkClient()
    const { data: matches } = await clerk.users.getUserList({ emailAddress: [identity.email], limit: 2 })

    let user = matches.find(candidate =>
      candidate.emailAddresses.some(
        address => address.emailAddress.toLowerCase() === identity.email && address.verification?.status === "verified"
      )
    )
    // An afters account holds this email but has not verified it: do not hand
    // it to whoever controls the AXXES account.
    if (!user && matches.length > 0) return fail(req, "unverified-afters")

    if (!user) {
      user = await clerk.users.createUser({
        emailAddress: [identity.email],
        firstName: identity.firstName || undefined,
        lastName: identity.lastName || undefined,
        skipPasswordRequirement: true,
        privateMetadata: { axxesSub: identity.sub },
      })
    } else if (user.privateMetadata?.axxesSub !== identity.sub) {
      await clerk.users.updateUserMetadata(user.id, { privateMetadata: { axxesSub: identity.sub } })
    }

    const ticket = await clerk.signInTokens.createSignInToken({ userId: user.id, expiresInSeconds: 120 })
    const res = NextResponse.redirect(new URL(`/sign-in?__clerk_ticket=${encodeURIComponent(ticket.token)}`, req.url))
    res.cookies.set(STATE_COOKIE, "", { path: COOKIE_PATH, maxAge: 0 })
    res.cookies.set(VERIFIER_COOKIE, "", { path: COOKIE_PATH, maxAge: 0 })
    return res
  } catch (error) {
    console.error("AXXES sign-in: Clerk step failed", error)
    return fail(req, "failed")
  }
}
