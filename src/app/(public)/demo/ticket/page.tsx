"use client"

import { Suspense, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { QRCodeSVG } from "qrcode.react"
import { MapPin, Calendar, Ticket, Check } from "lucide-react"

interface TicketData {
  id: string
  e: string // event name
  v: string // venue
  c: string // city
  d: string // date
  t: string // tier name
  p: number // price
  h: string // holder name
  n: string // ticket number
}

function TicketView() {
  const params = useSearchParams()
  const [data, setData] = useState<TicketData | null>(null)
  const [error, setError] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const d = params.get("d")
    if (!d) {
      setError(true)
      return
    }
    try {
      const parsed = JSON.parse(atob(d)) as TicketData
      setData(parsed)
      // Stagger entrance
      setTimeout(() => setReady(true), 100)
    } catch {
      setError(true)
    }
  }, [params])

  if (error) {
    return (
      <div className="min-h-dvh bg-black flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="font-headline text-3xl text-white mb-2">
            Invalid Ticket
          </h1>
          <p className="text-white/40 font-body text-sm">
            This ticket link is invalid or has expired.
          </p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-dvh bg-black flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#ff1493]/30 border-t-[#ff1493] rounded-full animate-spin" />
      </div>
    )
  }

  const qrUrl = typeof window !== "undefined" ? window.location.href : ""

  return (
    <div className="min-h-dvh bg-black relative overflow-hidden">
      {/* Grid bg */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,20,147,0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,20,147,0.5) 1px, transparent 1px)
            `,
            backgroundSize: "80px 80px",
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center px-5 py-8 safe-area-top safe-area-bottom min-h-dvh">
        {/* Header */}
        <div
          className={`text-center mb-6 transition-all duration-700 ${
            ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
        >
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 bg-[#ff1493] animate-pulse" />
            <span className="text-[10px] font-mono tracking-[0.3em] text-white/30 uppercase">
              Your Ticket
            </span>
            <div className="w-1.5 h-1.5 bg-[#ff1493] animate-pulse" />
          </div>
          <h1 className="font-headline text-3xl text-white tracking-wide">
            AFTERS<span className="text-[#ff1493]">.</span>
          </h1>
        </div>

        {/* Ticket Card */}
        <div
          className={`w-full max-w-sm transition-all duration-700 delay-150 ${
            ready ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-6 scale-[0.97]"
          }`}
        >
          <div className="bg-[#0a0a0a] border border-white/10 overflow-hidden">
            {/* Top accent */}
            <div className="h-1.5 bg-gradient-to-r from-[#ff1493] to-[#ff69b4]" />

            <div className="p-6">
              {/* Event Name */}
              <h2 className="font-headline text-4xl sm:text-5xl text-white tracking-wide leading-[0.95] mb-5">
                {data.e.toUpperCase()}
              </h2>

              {/* Details */}
              <div className="space-y-2.5 mb-5">
                <div className="flex items-center gap-2.5 text-white/50 text-sm font-body">
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-[#ff1493]/60" />
                  <span>
                    {data.v} &middot; {data.c}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-white/50 text-sm font-body">
                  <Calendar className="w-3.5 h-3.5 shrink-0 text-[#ff1493]/60" />
                  <span>{data.d}</span>
                </div>
                <div className="flex items-center gap-2.5 text-white/50 text-sm font-body">
                  <Ticket className="w-3.5 h-3.5 shrink-0 text-[#ff1493]/60" />
                  <span>
                    {data.t} &middot; ${data.p}
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-dashed border-white/10 my-6" />

              {/* QR Code */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="bg-white p-4 inline-block">
                    <QRCodeSVG value={qrUrl} size={200} level="M" />
                  </div>
                  {/* Corner accents */}
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-[#ff1493]" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-[#ff1493]" />
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-[#ff1493]" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-[#ff1493]" />
                </div>
              </div>

              {/* Attendee row */}
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-[10px] font-mono text-white/20 mb-0.5 tracking-wider">
                    ATTENDEE
                  </div>
                  <div className="text-sm font-body text-white">
                    {data.h}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-mono text-white/20 mb-0.5 tracking-wider">
                    TICKET
                  </div>
                  <div className="text-sm font-mono text-[#ff1493]">
                    {data.n}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-white/[0.06] px-6 py-3 flex items-center justify-between">
              <span className="text-[10px] font-mono text-white/20 tracking-wider">
                POWERED BY AFTERS
              </span>
              <div className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-green-400" />
                <span className="text-[10px] font-mono text-green-400/80 tracking-wider">
                  VALID
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer instructions */}
        <div
          className={`mt-8 text-center transition-all duration-700 delay-300 ${
            ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
        >
          <p className="text-white/25 font-mono text-[10px] tracking-wider leading-relaxed max-w-[260px] mx-auto">
            Present this QR code at the door for check-in.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function DemoTicketPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-black flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-[#ff1493]/30 border-t-[#ff1493] rounded-full animate-spin" />
        </div>
      }
    >
      <TicketView />
    </Suspense>
  )
}
