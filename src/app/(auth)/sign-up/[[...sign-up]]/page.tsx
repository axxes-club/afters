"use client"

import { SignUp } from "@clerk/nextjs"
import Link from "next/link"
import { dark } from "@clerk/themes"

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,20,147,0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,20,147,0.5) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-24 h-24">
        <div className="absolute top-4 left-4 w-12 h-[2px] bg-[#ff1493]/50" />
        <div className="absolute top-4 left-4 w-[2px] h-12 bg-[#ff1493]/50" />
      </div>
      <div className="absolute top-0 right-0 w-24 h-24">
        <div className="absolute top-4 right-4 w-12 h-[2px] bg-[#ff1493]/50" />
        <div className="absolute top-4 right-4 w-[2px] h-12 bg-[#ff1493]/50" />
      </div>
      <div className="absolute bottom-0 left-0 w-24 h-24">
        <div className="absolute bottom-4 left-4 w-12 h-[2px] bg-[#ff1493]/50" />
        <div className="absolute bottom-4 left-4 w-[2px] h-12 bg-[#ff1493]/50" />
      </div>
      <div className="absolute bottom-0 right-0 w-24 h-24">
        <div className="absolute bottom-4 right-4 w-12 h-[2px] bg-[#ff1493]/50" />
        <div className="absolute bottom-4 right-4 w-[2px] h-12 bg-[#ff1493]/50" />
      </div>

      {/* Logo */}
      <Link href="/" className="mb-8 relative z-10">
        <h1 className="text-4xl font-bold tracking-tight text-white font-mono">
          AFTERS<span className="text-[#ff1493]">.</span>
        </h1>
      </Link>

      {/* Sign Up Component */}
      <div className="relative z-10 w-full max-w-md">
        <SignUp
          forceRedirectUrl="/onboarding"
          appearance={{
            baseTheme: dark,
            variables: {
              colorPrimary: "#ff1493",
              colorBackground: "#000000",
              colorInputBackground: "#0a0a0a",
              colorInputText: "#ffffff",
              colorTextOnPrimaryBackground: "#000000",
              colorTextSecondary: "#888888",
              borderRadius: "0px",
              fontFamily: "ui-monospace, monospace",
            },
            elements: {
              rootBox: "w-full",
              card: "bg-black border border-white/10 shadow-2xl shadow-[#ff1493]/5",
              headerTitle: "text-white font-mono text-xl tracking-wider",
              headerSubtitle: "text-white/50 font-mono text-sm",
              socialButtonsBlockButton: "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#ff1493]/30 transition-all font-mono",
              socialButtonsBlockButtonText: "text-white font-mono",
              dividerLine: "bg-white/10",
              dividerText: "text-white/30 font-mono text-xs",
              formFieldLabel: "text-white/50 font-mono text-xs uppercase tracking-wider",
              formFieldInput: "bg-black border-white/10 text-white font-mono focus:border-[#ff1493] focus:ring-[#ff1493]/20",
              formButtonPrimary: "bg-[#ff1493] hover:bg-[#ff1493]/90 text-black font-mono font-bold uppercase tracking-wider",
              footerActionLink: "text-[#ff1493] hover:text-[#ff1493]/80 font-mono",
              identityPreviewEditButton: "text-[#ff1493]",
              formFieldAction: "text-[#ff1493] font-mono text-xs",
              alert: "bg-red-500/10 border border-red-500/30 text-red-400",
              alertText: "text-red-400 font-mono text-sm",
              otpCodeFieldInput: "bg-black border-white/20 text-white font-mono",
            },
          }}
        />
      </div>

      {/* Footer text */}
      <p className="mt-8 text-white/20 text-xs font-mono relative z-10">
        Join the underground. Create unforgettable nights.
      </p>
    </div>
  )
}
