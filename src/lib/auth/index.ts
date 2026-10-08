import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { APIError } from "better-auth/api"
import { hashPassword, verifyPassword } from "better-auth/crypto"
import { nextCookies } from "better-auth/next-js"
import { captcha, emailOTP } from "better-auth/plugins"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { axxesSignIn } from "./axxes-plugin"
import { CLERK_PENDING_PREFIX, verifyWithClerk } from "./clerk-bridge"
import { sendAuthCodeEmail } from "./emails"

/**
 * afters sign-in (Better Auth). Replaces Clerk.
 *
 * - Email + password, email codes (sign-in, verification, password reset) and
 *   "Continue with AXXES" (Handshake OIDC, see ./axxes-plugin.ts).
 * - Sessions live in afters' own database (`auth_*` tables). The afters profile
 *   stays in `User`, with the same id; src/lib/sync-user.ts creates it on first
 *   sign-in.
 * - People moved over from Clerk kept their Clerk ids and passwords: an
 *   imported bcrypt hash is checked here, and an account still marked
 *   `clerk:<id>` is checked against Clerk once, then stored here.
 */

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://afters.am").replace(/\/$/, "")

const TRUSTED_ORIGINS = [
  APP_URL,
  "https://afters.am",
  "https://www.afters.am",
  "https://afters.xxx",
  "https://www.afters.xxx",
  "https://vbz.afters.am",
  ...(process.env.NODE_ENV === "production" ? [] : ["http://localhost:3000"]),
]

async function verify({ hash, password }: { hash: string; password: string }): Promise<boolean> {
  if (hash.startsWith(CLERK_PENDING_PREFIX)) {
    const clerkUserId = hash.slice(CLERK_PENDING_PREFIX.length)
    if (!(await verifyWithClerk(clerkUserId, password))) return false
    // Moved: from now on the password is checked here and Clerk is not asked again.
    await prisma.authAccount.updateMany({
      where: { providerId: "credential", password: hash },
      data: { password: await hashPassword(password) },
    })
    return true
  }
  // bcrypt, as exported from Clerk.
  if (/^\$2[aby]\$/.test(hash)) return bcrypt.compare(password, hash)
  return verifyPassword({ hash, password })
}

export const auth = betterAuth({
  appName: "afters",
  baseURL: APP_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: TRUSTED_ORIGINS,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  user: { modelName: "authUser", additionalFields: { banned: { type: "boolean", required: false, input: false, defaultValue: false } } },
  session: { modelName: "authSession", expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 },
  account: { modelName: "authAccount" },
  verification: { modelName: "authVerification" },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    revokeSessionsOnPasswordReset: true,
    password: { hash: hashPassword, verify },
  },
  emailVerification: { autoSignInAfterVerification: true },
  advanced: {
    // Behind the load balancer the client address is in X-Forwarded-For.
    ipAddress: { ipAddressHeaders: ["x-forwarded-for"] },
  },
  rateLimit: { enabled: process.env.NODE_ENV === "production", window: 60, max: 30 },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const user = await prisma.authUser.findUnique({ where: { id: session.userId }, select: { banned: true } })
          if (user?.banned) throw new APIError("FORBIDDEN", { message: "This account has been suspended." })
        },
      },
    },
  },
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 600,
      allowedAttempts: 5,
      // Codes only for people who already have an account; sign-up asks for a password.
      disableSignUp: true,
      overrideDefaultEmailVerification: true,
      sendVerificationOnSignUp: true,
      sendVerificationOTP: async ({ email, otp, type }) => {
        await sendAuthCodeEmail(email, otp, type)
      },
    }),
    ...(process.env.TURNSTILE_SECRET_KEY
      ? [captcha({ provider: "cloudflare-turnstile", secretKey: process.env.TURNSTILE_SECRET_KEY, endpoints: ["/sign-up/email"] })]
      : []),
    axxesSignIn(),
    nextCookies(),
  ],
})

export type Session = typeof auth.$Infer.Session
