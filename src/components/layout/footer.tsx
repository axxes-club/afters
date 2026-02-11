import Link from "next/link"

export function Footer() {
  return (
    <footer className="relative border-t border-white/5 bg-black">
      {/* Subtle gradient accent */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255, 20, 147, 0.5), transparent)' }}
      />

      <div className="container mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          {/* Brand */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <Link href="/" className="group flex items-center gap-1">
              <span className="text-xl font-bold font-mono tracking-tight text-white group-hover:text-glow-pink transition-all">
                AFTERS
              </span>
              <span className="text-[#ff1493] text-xl font-bold">.</span>
            </Link>
            <p className="text-xs text-white/30 font-mono max-w-[240px] text-center md:text-left">
              Nightlife ticketing with the lowest fees
            </p>
          </div>

          {/* Links */}
          <div className="flex items-center gap-8">
            <Link
              href="/radio"
              className="text-sm text-white/40 hover:text-[#ff1493] transition-colors font-mono"
            >
              Radio
            </Link>
            <Link
              href="/dashboard"
              className="text-sm text-white/40 hover:text-[#ff1493] transition-colors font-mono"
            >
              Dashboard
            </Link>
            <Link
              href="/status"
              className="text-sm text-white/40 hover:text-[#ff1493] transition-colors font-mono"
            >
              Status
            </Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-white/20 font-mono">
            &copy; {new Date().getFullYear()} Afters
          </p>
          <p className="text-xs text-white/20 font-mono">
            made with{" "}
            <a
              href="https://crativo.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#ff1493]/70 hover:text-[#ff1493] transition-colors"
            >
              love
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
