import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
      {/* Gradient mesh background */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full opacity-20 blur-[120px]"
          style={{ background: 'radial-gradient(circle, #ff1493 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] rounded-full opacity-15 blur-[100px]"
          style={{ background: 'radial-gradient(circle, #ff69b4 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-10 blur-[150px]"
          style={{ background: 'radial-gradient(circle, #ff1493 0%, transparent 60%)' }}
        />
      </div>

      {/* Noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E')]" />

      {/* Grid lines (subtle) */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '100px 100px'
        }}
      />

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center gap-8 relative z-10 px-6">
        {/* Logo with glow */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
          <h1
            className="text-6xl md:text-8xl lg:text-9xl font-bold font-mono tracking-tighter text-glow-pink"
            style={{ textShadow: '0 0 60px rgba(255, 20, 147, 0.5), 0 0 120px rgba(255, 20, 147, 0.3)' }}
          >
            AFTERS<span className="text-[#ff1493]">.</span>
          </h1>
        </div>

        {/* Tagline */}
        <p
          className="text-sm md:text-base text-white/40 tracking-[0.3em] uppercase font-mono animate-fade-in-up"
          style={{ animationDelay: '0.3s', opacity: 0 }}
        >
          The after party starts here
        </p>

        {/* Status indicator */}
        <div
          className="flex items-center gap-3 px-5 py-2.5 rounded-full border border-white/10 bg-white/[0.02] backdrop-blur-sm animate-fade-in-up"
          style={{ animationDelay: '0.5s', opacity: 0 }}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff1493] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff1493]"></span>
          </span>
          <span className="text-xs text-white/50 font-mono tracking-wider">BUILDING SOMETHING BIG</span>
        </div>

        {/* CTA buttons */}
        <div
          className="flex flex-col sm:flex-row items-center gap-4 mt-4 animate-fade-in-up"
          style={{ animationDelay: '0.7s', opacity: 0 }}
        >
          <Link
            href="/events"
            className="group relative px-8 py-3 rounded-full font-bold text-sm tracking-wide overflow-hidden transition-all hover:scale-105"
            style={{ backgroundColor: '#ff1493' }}
          >
            <span className="relative z-10">Explore Parties</span>
            <div className="absolute inset-0 bg-gradient-to-r from-[#ff1493] to-[#ff69b4] opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
          <Link
            href="/dashboard"
            className="px-8 py-3 rounded-full font-bold text-sm tracking-wide border border-white/20 text-white/70 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all"
          >
            Host a Party
          </Link>
        </div>
      </main>

      {/* Minimal footer */}
      <footer className="relative z-10 border-t border-white/5 py-6 px-6">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-white/30 font-mono">
            &copy; {new Date().getFullYear()} AFTERS
          </p>
          <div className="flex items-center gap-6">
            <Link href="/radio" className="text-xs text-white/30 hover:text-[#ff1493] transition-colors font-mono">
              Radio
            </Link>
            <Link href="/status" className="text-xs text-white/30 hover:text-[#ff1493] transition-colors font-mono">
              Status
            </Link>
            <span className="text-xs text-white/30 font-mono">
              made with{" "}
              <a
                href="https://crativo.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#ff1493] hover:text-[#ff69b4] transition-colors"
              >
                love
              </a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
