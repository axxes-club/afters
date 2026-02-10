export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Centered logo + tagline */}
      <main className="flex-1 flex flex-col items-center justify-center gap-4">
        <h1 className="text-3xl font-bold font-display tracking-tight">
          AFTERS<span className="text-[#ff1493]">.</span>
        </h1>
        <p className="text-sm text-white/40 tracking-widest uppercase">
          We&apos;re working on something big
        </p>
      </main>

      {/* Minimal footer */}
      <footer className="border-t border-white/10 py-6 px-6">
        <div className="container mx-auto flex justify-between items-center">
          <p className="text-xs text-white/30">
            &copy; {new Date().getFullYear()} Afters
          </p>
          <p className="text-xs text-white/30">
            made with{" "}
            <a
              href="https://crativo.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#ff1493] hover:text-[#ff69b4] transition-colors"
            >
              love
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
