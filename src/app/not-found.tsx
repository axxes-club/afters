import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Home, Music2 } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-black text-white relative overflow-hidden font-display">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#ff1493]/10 via-black to-black opacity-50" />
      <div className="absolute inset-0 noise" />
      
      {/* Glitch Effect 404 */}
      <div className="relative z-10 mb-8 text-center">
        <h1 className="text-[12rem] font-bold leading-none tracking-tighter text-transparent stroke-white select-none relative animate-pulse">
          <span className="absolute inset-0 text-stroke-2 text-stroke-white opacity-20 blur-sm transform translate-x-1 translate-y-1">404</span>
          <span className="bg-clip-text bg-gradient-to-b from-white to-gray-500 text-transparent relative z-10">404</span>
          <span className="absolute inset-0 text-[#ff1493] opacity-30 blur-xl animate-pulse">404</span>
        </h1>
        
        {/* Decorative Lines */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-[#ff1493] transform -rotate-12 opacity-50 blur-[2px]" />
        <div className="absolute top-1/2 left-0 w-full h-1 bg-white transform rotate-12 opacity-20 blur-[1px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center space-y-8 max-w-lg px-6">
        <div className="space-y-4">
          <h2 className="text-4xl font-bold uppercase tracking-widest text-[#ff1493] text-glow-pink">
            Lost in the Sauce?
          </h2>
          <p className="text-gray-400 text-lg font-light tracking-wide">
            Looks like you took a wrong turn at the after party. 
            This page is ghosting you.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
          <Button 
            asChild 
            size="lg" 
            className="bg-[#ff1493] hover:bg-[#ff69b4] text-black font-bold tracking-wider hover-glow transition-all w-full sm:w-auto"
          >
            <Link href="/" className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              BACK TO BASE
            </Link>
          </Button>
          
          <Button 
            asChild 
            variant="outline" 
            size="lg"
            className="border-white/20 hover:border-[#ff1493] hover:text-[#ff1493] tracking-wider transition-all w-full sm:w-auto bg-transparent"
          >
            <Link href="/events" className="flex items-center gap-2">
              <Music2 className="w-4 h-4" />
              FIND EVENTS
            </Link>
          </Button>
        </div>
      </div>

      {/* Footer Text */}
      <div className="absolute bottom-10 text-white/20 text-xs tracking-[0.5em] uppercase animate-pulse">
        System Error • ID-10-T • Party Not Found
      </div>
    </div>
  )
}
