"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    setMounted(true)
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
      {/* Dynamic gradient that follows mouse */}
      {mounted && (
        <div
          className="pointer-events-none fixed w-[600px] h-[600px] rounded-full opacity-20 blur-[150px] transition-all duration-700 ease-out"
          style={{
            background: 'radial-gradient(circle, #ff1493 0%, transparent 70%)',
            left: mousePos.x - 300,
            top: mousePos.y - 300,
          }}
        />
      )}

      {/* Ambient glow orbs */}
      <div className="fixed top-1/4 -left-32 w-64 h-64 bg-[#ff1493]/10 rounded-full blur-[100px] animate-pulse-slow" />
      <div className="fixed bottom-1/4 -right-32 w-80 h-80 bg-[#ff1493]/5 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />

      {/* Subtle grid overlay */}
      <div className="fixed inset-0 opacity-[0.02]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,20,147,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,20,147,0.3) 1px, transparent 1px)
            `,
            backgroundSize: "80px 80px",
          }}
        />
      </div>

      {/* Scanning line animation */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#ff1493]/30 to-transparent animate-scan"
        />
      </div>

      {/* Grain texture */}
      <div className="fixed inset-0 pointer-events-none opacity-30 mix-blend-overlay grain" />

      {/* Header */}
      <header className="relative z-20 px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="font-headline text-xl tracking-wider">
            AFTERS<span className="text-[#ff1493]">.</span>
          </div>
          <Link
            href="/d"
            className="text-[10px] tracking-[0.2em] uppercase text-white/40 hover:text-white transition-colors"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        {/* Badge */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1.5 h-1.5 bg-[#ff1493] rounded-full animate-pulse" />
          <span className="font-mono text-[9px] text-white/30 tracking-[0.4em] uppercase">
            The First of Its Kind
          </span>
          <div className="w-1.5 h-1.5 bg-[#ff1493] rounded-full animate-pulse" />
        </div>

        {/* Main headline */}
        <div className="text-center max-w-4xl mb-6">
          <h1 className="font-headline text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight leading-[0.9] mb-6">
            <span className="text-white">Event management</span>
            <br />
            <span className="text-white/40">for the</span>{" "}
            <span className="relative inline-block">
              <span className="relative z-10" style={{ color: '#ff1493', textShadow: '0 0 40px #ff149380, 0 0 80px #ff149340' }}>
                after party
              </span>
            </span>
          </h1>
        </div>

        {/* Subheadline */}
        <p className="text-center text-white/40 max-w-xl mb-12 text-sm md:text-base leading-relaxed">
          The world&apos;s first platform built exclusively for underground events,
          secret pop-ups, and late-night gatherings. Where exclusivity meets simplicity.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-12 max-w-2xl">
          {[
            "Secret Locations",
            "RSVP & Tickets",
            "Guestlist Management",
            "QR Check-in",
            "Zero Platform Fees",
          ].map((feature, i) => (
            <div
              key={feature}
              className="px-4 py-2 border border-white/10 text-[10px] font-mono tracking-wider text-white/50 hover:border-[#ff1493]/30 hover:text-white/70 transition-all cursor-default"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              {feature}
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link
              href="/d"
              className="group flex items-center gap-3 px-8 py-4 bg-[#ff1493] text-black text-xs tracking-[0.2em] uppercase font-bold hover:bg-white transition-all"
            >
              <span>Host Your Event</span>
              <svg
                className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              href="/beta"
              className="px-8 py-4 border border-white/20 text-xs tracking-[0.2em] uppercase text-white/60 hover:border-white/40 hover:text-white transition-all"
            >
              Join Waitlist
            </Link>
          </div>
          <Link
            href="/scan"
            className="flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase text-white/30 hover:text-[#ff1493] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            Scan Tickets
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-3 gap-8 md:gap-16">
          {[
            { value: "0%", label: "Platform Fee" },
            { value: "24/7", label: "Support" },
            { value: "100%", label: "Underground" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-headline text-2xl md:text-3xl" style={{ color: '#ff1493' }}>
                {stat.value}
              </div>
              <div className="font-mono text-[9px] tracking-[0.2em] text-white/30 uppercase mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Bottom section */}
      <section className="relative z-10 border-t border-white/5 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20">
            {/* Left - Ticketed Events */}
            <div className="group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 border border-[#ff1493]/30 flex items-center justify-center">
                  <svg className="w-4 h-4 text-[#ff1493]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
                <h3 className="font-headline text-xl tracking-wide">Ticketed Events</h3>
              </div>
              <p className="text-white/40 text-sm leading-relaxed mb-4">
                Sell tickets with instant payouts. Multiple tiers, early bird pricing,
                and seamless Stripe integration. Keep 100% of your revenue.
              </p>
              <div className="flex flex-wrap gap-2">
                {["Multiple Tiers", "Instant Payouts", "QR Tickets"].map((tag) => (
                  <span key={tag} className="text-[9px] font-mono tracking-wider text-white/30 px-2 py-1 border border-white/5">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Right - RSVP Events */}
            <div className="group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 border border-[#ff1493]/30 flex items-center justify-center">
                  <svg className="w-4 h-4 text-[#ff1493]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-headline text-xl tracking-wide">RSVP Only</h3>
              </div>
              <p className="text-white/40 text-sm leading-relaxed mb-4">
                Free events with controlled access. Manage capacity, allow +1s,
                and maintain that exclusive guest-list-only energy.
              </p>
              <div className="flex flex-wrap gap-2">
                {["Capacity Control", "+1 Options", "Guest Management"].map((tag) => (
                  <span key={tag} className="text-[9px] font-mono tracking-wider text-white/30 px-2 py-1 border border-white/5">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-6 border-t border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[10px] text-white/20 tracking-wider uppercase font-mono">
            &copy; {new Date().getFullYear()} Afters &mdash; Built for the underground
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/status"
              className="text-[10px] text-white/20 hover:text-white/40 transition-colors tracking-wider uppercase font-mono"
            >
              Status
            </Link>
            <a
              href="https://afters.am"
              className="text-[10px] text-white/20 hover:text-white/40 transition-colors tracking-wider uppercase font-mono"
            >
              afters.am
            </a>
          </div>
        </div>
      </footer>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes scan {
          0%, 100% {
            top: 0%;
            opacity: 0;
          }
          5% {
            opacity: 1;
          }
          45% {
            top: 100%;
            opacity: 1;
          }
          50%, 100% {
            opacity: 0;
          }
        }

        @keyframes pulseSlow {
          0%, 100% {
            opacity: 0.1;
            transform: scale(1);
          }
          50% {
            opacity: 0.2;
            transform: scale(1.05);
          }
        }

        .animate-scan {
          animation: scan 6s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulseSlow 8s ease-in-out infinite;
        }

        .grain {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
        }
      `}</style>
    </div>
  )
}
