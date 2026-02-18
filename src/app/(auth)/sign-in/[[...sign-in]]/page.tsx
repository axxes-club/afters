import { SignIn } from "@clerk/nextjs"
import Link from "next/link"

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <Link href="/" className="mb-8">
        <span className="text-5xl font-headline text-[#ff1493]">.</span>
      </Link>

      {/* Sign In Component */}
      <div className="w-full max-w-md">
        <SignIn 
          forceRedirectUrl="/overview"
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
