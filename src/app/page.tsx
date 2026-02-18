"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
            <span className="text-[#ff1493]">.</span>
          </div>
          <Link
            href="/b"
            className="text-[10px] tracking-[0.2em] uppercase text-white/40 hover:text-white transition-colors"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">

        {/* Two buttons: Host or Scan */}
        <div className="flex items-center gap-6">
          <Link
            href="/b"
            className="group flex items-center gap-3 px-10 py-5 bg-[#ff1493] text-black text-sm tracking-[0.2em] uppercase font-bold hover:bg-white transition-all"
          >
            <span>Host</span>
          </Link>
          <Link
            href="/scan"
            className="group flex items-center gap-3 px-10 py-5 border border-white/20 text-white text-sm tracking-[0.2em] uppercase font-bold hover:border-[#ff1493] hover:text-[#ff1493] transition-all"
          >
            <span>Scan</span>
          </Link>
        </div>

      </main>

      {/* Footer */}
      <footer className="py-6 px-6 border-t border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[10px] text-white/20 tracking-wider uppercase font-mono">
            &copy; {new Date().getFullYear()} Afters
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/status"
              className="text-[10px] text-white/20 hover:text-white/40 transition-colors tracking-wider uppercase font-mono"
            >
              Status
            </Link>
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
