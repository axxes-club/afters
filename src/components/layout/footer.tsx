import Link from "next/link"

export function Footer() {
  return (
    <footer className="relative border-t border-white/[0.04] bg-black">
      {/* Subtle gradient accent line */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255, 20, 147, 0.3), transparent)' }}
      />

      <div className="container mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          {/* Brand */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <Link href="/" className="group flex items-center gap-0.5">
              <span className="text-lg font-bold font-mono tracking-tight text-white/80 group-hover:text-white transition-colors">
                AFTERS
              </span>
              <span className="text-[#ff1493] text-lg font-bold">.</span>
            </Link>
            <p className="text-[10px] text-white/25 font-mono max-w-[220px] text-center md:text-left tracking-wide">
              Nightlife ticketing with the lowest fees
            </p>
          </div>

          {/* Links */}
          <div className="flex items-center gap-8">
            <Link
              href="/b"
              className="text-[11px] text-white/30 hover:text-[#ff1493] transition-colors font-mono tracking-wider uppercase"
            >
              Dashboard
            </Link>
            <Link
              href="/status"
              className="text-[11px] text-white/30 hover:text-[#ff1493] transition-colors font-mono tracking-wider uppercase"
            >
              Status
            </Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-white/[0.04] flex justify-center">
          <p className="text-[10px] text-white/15 font-mono tracking-wider">
            &copy; {new Date().getFullYear()} Afters
          </p>
        </div>
      </div>
    </footer>
  )
}
