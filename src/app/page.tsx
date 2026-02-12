"use client"

import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-mono relative overflow-hidden">
      {/* Animated grid background */}
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

      {/* Scanning line animation */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#ff1493]/40 to-transparent animate-scan-line"
        />
      </div>

      {/* Corner bracket accents */}
      <div className="absolute top-0 left-0 w-24 h-24">
        <div className="absolute top-6 left-6 w-12 h-[2px] bg-[#ff1493]/50" />
        <div className="absolute top-6 left-6 w-[2px] h-12 bg-[#ff1493]/50" />
      </div>
      <div className="absolute top-0 right-0 w-24 h-24">
        <div className="absolute top-6 right-6 w-12 h-[2px] bg-[#ff1493]/50" />
        <div className="absolute top-6 right-6 w-[2px] h-12 bg-[#ff1493]/50" />
      </div>
      <div className="absolute bottom-0 left-0 w-24 h-24">
        <div className="absolute bottom-6 left-6 w-12 h-[2px] bg-[#ff1493]/50" />
        <div className="absolute bottom-6 left-6 w-[2px] h-12 bg-[#ff1493]/50" />
      </div>
      <div className="absolute bottom-0 right-0 w-24 h-24">
        <div className="absolute bottom-6 right-6 w-12 h-[2px] bg-[#ff1493]/50" />
        <div className="absolute bottom-6 right-6 w-[2px] h-12 bg-[#ff1493]/50" />
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center gap-8 px-6 relative z-10">
        {/* Status badge */}
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-[#ff1493] animate-pulse" />
          <span className="text-[10px] text-white/40 tracking-[0.3em] uppercase">
            System Online
          </span>
          <div className="w-2 h-2 bg-[#ff1493] animate-pulse" />
        </div>

        {/* Logo */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-headline tracking-wide">
          AFTERS<span className="text-[#ff1493]">.</span>
        </h1>

        {/* Tagline */}
        <div className="flex flex-col items-center gap-4">
          <p className="text-[10px] text-white/30 tracking-[0.3em] uppercase">
            The after party starts here
          </p>
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-[#ff1493]/30 to-transparent" />
        </div>

        {/* CTA Button */}
        <Link
          href="/d"
          className="group flex items-center gap-3 px-8 py-4 bg-[#ff1493] text-black text-xs tracking-[0.2em] uppercase font-bold hover:bg-[#ff1493]/90 transition-all mt-4"
        >
          <span>Host a Party</span>
          <svg
            className="w-4 h-4 group-hover:translate-x-1 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </main>

      {/* Footer */}
      <footer className="py-6 px-6 border-t border-white/5 relative z-10">
        <div className="container mx-auto flex justify-between items-center">
          <p className="text-[10px] text-white/20 tracking-wider uppercase">
            &copy; {new Date().getFullYear()} Afters
          </p>
          <Link
            href="/status"
            className="text-[10px] text-white/20 hover:text-white/40 transition-colors tracking-wider uppercase"
          >
            Status
          </Link>
        </div>
      </footer>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes scanLine {
          0%, 100% {
            top: 0%;
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          50% {
            top: 100%;
            opacity: 1;
          }
          60% {
            opacity: 0;
          }
        }

        .animate-scan-line {
          animation: scanLine 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
