import { SignUp } from "@clerk/nextjs"
import Link from "next/link"

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <Link href="/" className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-white font-mono">
          AFTERS<span className="text-[#ff1493]">.</span>
        </h1>
      </Link>

      {/* Sign Up Component */}
      <div className="w-full max-w-md">
        <SignUp 
          forceRedirectUrl="/onboarding"
          signInUrl="/sign-in"
        />
      </div>

      {/* Footer text */}
      <p className="mt-8 text-white/20 text-xs font-mono text-center">
        Join the underground. Create unforgettable nights.
      </p>
    </div>
  )
}
