import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-mono">
      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center gap-8 px-6">
        {/* Logo */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
          AFTERS<span className="text-[#ff1493]">.</span>
        </h1>

        {/* Tagline */}
        <div className="flex flex-col items-center gap-6">
          <p className="text-[10px] text-white/30 tracking-[0.3em] uppercase">
            The after party starts here
          </p>
          <div className="w-8 h-px bg-white/10" />
        </div>

        {/* Status */}
        <div className="flex items-center gap-3 px-4 py-2 border border-white/5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff1493] opacity-60"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#ff1493]"></span>
          </span>
          <span className="text-[10px] text-white/30 tracking-[0.15em] uppercase">Building something big</span>
        </div>

        {/* CTA */}
        <Link
          href="/dashboard"
          className="group flex items-center gap-2 px-6 py-3 text-xs tracking-wider uppercase text-white/50 border border-white/10 hover:border-[#ff1493]/50 hover:text-white transition-all"
        >
          <span>Host a Party</span>
          <svg
            className="w-3 h-3 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </main>

      {/* Footer */}
      <footer className="py-6 px-6 border-t border-white/5">
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
    </div>
  )
}
