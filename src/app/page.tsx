import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
      {/* Atmospheric background - deep, moody gradients */}
      <div className="absolute inset-0">
        {/* Primary atmospheric gradient - subtle, no glow */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% 100%, rgba(255, 20, 147, 0.08) 0%, transparent 50%)'
          }}
        />
        {/* Secondary ambient light */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 60% 40% at 100% 0%, rgba(139, 0, 78, 0.06) 0%, transparent 50%)'
          }}
        />
      </div>

      {/* Fine grain texture */}
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />

      {/* Vertical line accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute left-[15%] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/[0.03] to-transparent" />
        <div className="absolute left-[85%] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/[0.03] to-transparent" />
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center gap-8 relative z-10 px-6">
        {/* Logo mark - clean, no glow */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0s', opacity: 0 }}>
          <div className="flex flex-col items-center gap-1">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-mono tracking-[-0.02em] text-white">
              AFTERS<span className="text-[#ff1493]">.</span>
            </h1>
          </div>
        </div>

        {/* Tagline - refined typography */}
        <div
          className="animate-fade-in-up flex flex-col items-center gap-6"
          style={{ animationDelay: '0.15s', opacity: 0 }}
        >
          <p className="text-[10px] md:text-xs text-white/30 tracking-[0.4em] uppercase font-mono">
            The after party starts here
          </p>

          {/* Minimal divider */}
          <div className="w-12 h-px bg-gradient-to-r from-transparent via-[#ff1493]/40 to-transparent" />
        </div>

        {/* Status pill - cleaner */}
        <div
          className="animate-fade-in-up flex items-center gap-3 px-5 py-2 border border-white/[0.06] bg-white/[0.01]"
          style={{ animationDelay: '0.3s', opacity: 0 }}
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff1493] opacity-60"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#ff1493]"></span>
          </span>
          <span className="text-[10px] text-white/40 font-mono tracking-[0.2em] uppercase">Building something big</span>
        </div>

        {/* Single CTA - Host a Party */}
        <div
          className="animate-fade-in-up mt-2"
          style={{ animationDelay: '0.45s', opacity: 0 }}
        >
          <Link
            href="/dashboard"
            className="group relative inline-flex items-center gap-2 px-8 py-3.5 font-mono text-xs tracking-[0.15em] uppercase text-white/70 border border-white/10 hover:border-[#ff1493]/50 hover:text-white transition-all duration-300"
          >
            <span>Host a Party</span>
            <svg
              className="w-3 h-3 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </main>

      {/* Minimal footer */}
      <footer className="relative z-10 py-8 px-6">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[10px] text-white/20 font-mono tracking-wider">
            &copy; {new Date().getFullYear()} AFTERS
          </p>
          <div className="flex items-center gap-8">
            <Link
              href="/status"
              className="text-[10px] text-white/20 hover:text-[#ff1493] transition-colors font-mono tracking-wider uppercase"
            >
              Status
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
