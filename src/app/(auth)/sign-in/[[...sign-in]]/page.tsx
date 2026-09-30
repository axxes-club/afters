import { SignIn } from "@clerk/nextjs"
import Link from "next/link"
import { axxesEnabled } from "@/lib/axxes"

/** Why a "Continue with AXXES" attempt came back here. */
const AXXES_ERRORS: Record<string, string> = {
  cancelled: "AXXES sign-in was cancelled.",
  expired: "That AXXES sign-in took too long. Try again.",
  failed: "AXXES sign-in didn't work this time. Try again, or sign in below.",
  unverified: "Verify your email on your AXXES account first, then try again.",
  "unverified-afters": "An afters account uses this email but hasn't verified it. Sign in below and verify it first.",
}

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ axxes?: string }> }) {
  const { axxes } = await searchParams
  const error = axxes ? AXXES_ERRORS[axxes] : undefined

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <Link href="/" className="mb-8">
        <span className="text-5xl font-headline text-[#ff1493]">.</span>
      </Link>

      {axxesEnabled() && (
        <div className="w-full max-w-md mb-6 flex flex-col items-center gap-3">
          {/* A plain link: the start route redirects to Handshake. */}
          <a
            href="/api/auth/axxes/start"
            className="w-full rounded-md border border-white/15 bg-white/5 px-4 py-3 text-center text-sm font-medium text-white hover:bg-white/10 transition-colors"
          >
            Continue with AXXES
          </a>
          {error && <p role="alert" className="text-center text-sm text-[#ff1493]">{error}</p>}
          <p className="text-white/30 text-xs font-mono">or</p>
        </div>
      )}

      {/* Sign In Component — also redeems the one-time ticket AXXES sign-in returns with. */}
      <div className="w-full max-w-md">
        <SignIn
          forceRedirectUrl="/b"
          signUpUrl="/sign-up"
        />
      </div>

      {/* Footer text */}
      <p className="mt-8 text-white/20 text-xs font-mono text-center">
        Underground events. Curated experiences.
      </p>
    </div>
  )
}
