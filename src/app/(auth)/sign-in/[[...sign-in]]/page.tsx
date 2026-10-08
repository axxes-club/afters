import { Suspense } from "react"
import Link from "next/link"
import { AuthCard } from "@/components/auth/AuthCard"
import { axxesEnabled } from "@/lib/axxes"

/** Why a "Continue with AXXES" attempt came back here. */
const AXXES_ERRORS: Record<string, string> = {
  cancelled: "AXXES sign-in was cancelled.",
  expired: "That AXXES sign-in took too long. Try again.",
  failed: "AXXES sign-in didn't work this time. Try again, or sign in below.",
  unverified: "Your AXXES account's email isn't verified yet. Verify it on AXXES, or sign in below.",
  "unverified-afters": "An afters account uses this email but hasn't verified it. Sign in below with a code to verify it first.",
  suspended: "This account has been suspended.",
}

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ axxes?: string }> }) {
  const { axxes } = await searchParams

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8" aria-label="afters home">
        <span className="text-5xl font-headline text-[#ff1493]">.</span>
      </Link>

      <Suspense>
        <AuthCard mode="sign-in" axxesEnabled={axxesEnabled()} notice={axxes ? AXXES_ERRORS[axxes] : undefined} />
      </Suspense>

      <p className="mt-8 text-white/20 text-xs font-mono text-center">
        Underground events. Curated experiences.
      </p>
    </div>
  )
}
