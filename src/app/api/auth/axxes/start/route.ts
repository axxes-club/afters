import { NextResponse, type NextRequest } from "next/server"
import { COOKIE_PATH, STATE_COOKIE, VERIFIER_COOKIE, authorizeUrl, axxesEnabled, newPkce } from "@/lib/axxes"

export const dynamic = "force-dynamic"

// GET /api/auth/axxes/start — hands off to Handshake. The state and the PKCE
// verifier live in httpOnly cookies, so the page can neither read nor edit them.
export async function GET(req: NextRequest) {
  if (!axxesEnabled()) return NextResponse.redirect(new URL("/sign-in", req.url))

  const state = crypto.randomUUID()
  const { verifier, challenge } = newPkce()
  const res = NextResponse.redirect(authorizeUrl(req.nextUrl.origin, state, challenge))
  const cookie = {
    httpOnly: true,
    secure: req.nextUrl.protocol === "https:",
    sameSite: "lax" as const,
    path: COOKIE_PATH,
    maxAge: 600,
  }
  res.cookies.set(STATE_COOKIE, state, cookie)
  res.cookies.set(VERIFIER_COOKIE, verifier, cookie)
  return res
}
