import { Suspense } from "react"
import Link from "next/link"
import { AuthCard } from "@/components/auth/AuthCard"
import { axxesEnabled } from "@/lib/axxes"

export const dynamic = "force-dynamic"

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8" aria-label="afters home">
        <span className="text-5xl font-headline text-[#ff1493]">.</span>
      </Link>

      <Suspense>
        <AuthCard mode="sign-up" axxesEnabled={axxesEnabled()} turnstileSiteKey={process.env.TURNSTILE_SECRET_KEY ? process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY : undefined} />
      </Suspense>

      <p className="mt-8 text-white/20 text-xs font-mono text-center">
        Join the underground. Create unforgettable nights.
      </p>
    </div>
  )
}
