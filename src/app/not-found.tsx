import Link from "next/link"
import { ArrowLeft, Radio } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden">
      {/* Subtle grid background */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 20, 147, 1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 20, 147, 1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
      
      {/* Glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#ff1493]/5 blur-[150px] rounded-full pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 text-center px-6">
        {/* Status indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-2 h-2 bg-[#ff1493] rounded-full animate-pulse" />
          <span className="text-[10px] font-mono text-[#ff1493] tracking-[0.3em]">SIGNAL LOST</span>
        </div>

        {/* 404 */}
        <div className="relative mb-6">
          <h1 className="text-[8rem] sm:text-[12rem] font-mono font-bold leading-none tracking-tighter text-white/5">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl sm:text-8xl font-mono font-bold text-[#ff1493]">404</span>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-3 mb-10">
          <h2 className="text-xl sm:text-2xl font-mono font-bold tracking-wide">
            PAGE NOT FOUND
          </h2>
          <p className="text-white/40 font-mono text-sm max-w-md mx-auto">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        {/* Action */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#ff1493] text-black font-mono font-bold text-sm tracking-wider hover:bg-[#ff1493]/90 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          BACK TO HOME
        </Link>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 flex items-center gap-2 text-white/20">
        <Radio className="w-3 h-3" />
        <span className="text-[10px] font-mono tracking-widest">AFTERS.XXX</span>
      </div>
    </div>
  )
}
