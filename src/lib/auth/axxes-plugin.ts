import type { BetterAuthPlugin, User } from "better-auth"
import { createAuthEndpoint } from "better-auth/api"
import { setSessionCookie } from "better-auth/cookies"
import { COOKIE_PATH, STATE_COOKIE, VERIFIER_COOKIE, authorizeUrl, axxesEnabled, exchangeCode, newPkce, safeEqual } from "@/lib/axxes"
import { publicOrigin } from "@/lib/public-origin"
import { safeReturnPath } from "./redirect"

const RETURN_COOKIE = "afters_axxes_return"

/**
 * "Continue with AXXES" inside Better Auth, at the URLs Handshake already
 * allows: /api/auth/axxes/start and /api/auth/axxes/callback.
 *
 * - Only a VERIFIED AXXES email is trusted, so nobody can claim an afters
 *   account by registering its email on AXXES.
 * - An afters account that holds the email but has not verified it is not
 *   handed to whoever controls the AXXES account.
 * - The AXXES subject is linked as an `axxes` account, so a later email
 *   change on AXXES still lands on the same afters account.
 */
export function axxesSignIn() {
  return {
    id: "axxes-sign-in",
    endpoints: {
      axxesStart: createAuthEndpoint("/axxes/start", { method: "GET" }, async (ctx) => {
        const origin = ctx.request ? publicOrigin(ctx.request) : ctx.context.baseURL
        if (!axxesEnabled()) throw ctx.redirect(`${origin}/sign-in`)

        const state = crypto.randomUUID()
        const { verifier, challenge } = newPkce()
        const cookie = { httpOnly: true, secure: origin.startsWith("https:"), sameSite: "lax" as const, path: COOKIE_PATH, maxAge: 600 }
        ctx.setCookie(STATE_COOKIE, state, cookie)
        ctx.setCookie(VERIFIER_COOKIE, verifier, cookie)
        const returnTo = new URL(ctx.request?.url ?? `${origin}/`).searchParams.get("redirect_url")
        ctx.setCookie(RETURN_COOKIE, safeReturnPath(returnTo), cookie)
        throw ctx.redirect(authorizeUrl(origin, state, challenge).toString())
      }),

      axxesCallback: createAuthEndpoint("/axxes/callback", { method: "GET" }, async (ctx) => {
        const origin = ctx.request ? publicOrigin(ctx.request) : ctx.context.baseURL
        const clear = () => {
          ctx.setCookie(STATE_COOKIE, "", { path: COOKIE_PATH, maxAge: 0 })
          ctx.setCookie(VERIFIER_COOKIE, "", { path: COOKIE_PATH, maxAge: 0 })
          ctx.setCookie(RETURN_COOKIE, "", { path: COOKIE_PATH, maxAge: 0 })
        }
        // Back to the sign-in page with a reason it can explain.
        const fail = (reason: string) => {
          clear()
          return ctx.redirect(`${origin}/sign-in?axxes=${reason}`)
        }

        const params = new URL(ctx.request?.url ?? `${origin}/`).searchParams
        if (params.get("error")) throw fail("cancelled")

        const code = params.get("code")
        const state = params.get("state")
        const expected = ctx.getCookie(STATE_COOKIE)
        const verifier = ctx.getCookie(VERIFIER_COOKIE)
        if (!code || !state || !expected || !verifier || !safeEqual(state, expected)) throw fail("expired")

        const identity = await exchangeCode(code, verifier, origin).catch((error) => {
          console.error("AXXES sign-in failed", error)
          return null
        })
        if (!identity) throw fail("failed")
        if (!identity.emailVerified) throw fail("unverified")

        let user: User | null = null
        try {
          const { internalAdapter, adapter } = ctx.context
          const linked = await adapter.findOne<{ userId: string }>({
            model: "account",
            where: [
              { field: "providerId", value: "axxes" },
              { field: "accountId", value: identity.sub },
            ],
          })
          if (linked) user = await internalAdapter.findUserById(linked.userId)

          if (!user) {
            const found = await internalAdapter.findUserByEmail(identity.email)
            if (found && !found.user.emailVerified) throw fail("unverified-afters")
            user =
              found?.user ??
              (await internalAdapter.createUser({
                email: identity.email,
                name: [identity.firstName, identity.lastName].filter(Boolean).join(" ") || identity.email.split("@")[0],
                emailVerified: true,
              }, { method: "oauth", oauth: { providerId: "axxes" } }))
            await internalAdapter.linkAccount({ userId: user.id, providerId: "axxes", accountId: identity.sub })
          }

          const session = await internalAdapter.createSession(user.id)
          await setSessionCookie(ctx, { session, user })
        } catch (error) {
          // A redirect thrown above (e.g. unverified-afters) passes straight through.
          if (error instanceof Response || (error as { status?: string })?.status === "FOUND") throw error
          console.error("AXXES sign-in: session step failed", error)
          throw fail((error as { status?: string })?.status === "FORBIDDEN" ? "suspended" : "failed")
        }

        const returnTo = safeReturnPath(ctx.getCookie(RETURN_COOKIE))
        clear()
        throw ctx.redirect(`${origin}${returnTo}`)
      }),
    },
  } satisfies BetterAuthPlugin
}
