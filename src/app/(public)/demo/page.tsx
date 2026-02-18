"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { QRCodeSVG } from "qrcode.react"
import dynamic from "next/dynamic"
import {
  Send,
  Share2,
  Check,
  MapPin,
  Ticket,
  X,
  Copy,
  Camera,
  RotateCcw,
  ChevronRight,
  Zap,
  Calendar,
  Users,
  BarChart3,
  Smartphone,
} from "lucide-react"

const QrScanner = dynamic(
  () => import("@yudiel/react-qr-scanner").then((m) => m.Scanner),
  { ssr: false }
)

// ─── Types ───────────────────────────────────────────

type DemoStep =
  | "welcome"
  | "event-name"
  | "venue"
  | "city"
  | "tier-select"
  | "generating"
  | "ticket-ready"
  | "scanner"
  | "scan-result"
  | "complete"

interface DemoEvent {
  name: string
  venue: string
  city: string
  date: string
  tier: { name: string; price: number }
  ticketNumber: string
  ticketId: string
}

interface ChatMsg {
  id: number
  role: "bot" | "user"
  text: string
}

// ─── Constants & Helpers ─────────────────────────────

const TIER_PRESETS = [
  { name: "General Admission", price: 30 },
  { name: "VIP", price: 75 },
  { name: "Table Service", price: 200 },
]

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

function getNextSaturday(): string {
  const d = new Date()
  d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7))
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
}

function genTicketNumber() {
  return `TK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
}

// Encode ticket data into the ticketId so scanner can read it
function genTicketId(ev: DemoEvent): string {
  const data = btoa(JSON.stringify({
    n: ev.ticketNumber,
    t: ev.tier.name,
    e: ev.name,
  }))
  return `demo-${Date.now()}-${data}`
}

// ─── Sub-components ──────────────────────────────────

function TypingDots() {
  return (
    <div className="flex justify-start animate-fade-in">
      <div className="bg-white/[0.04] border border-white/[0.08] px-4 py-3 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 bg-[#ff1493] rounded-full"
            style={{
              animation: "dotBounce 1.2s ease-in-out infinite",
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70dvh] text-center px-4">
      <div className="mb-10 animate-fade-in">
        <div className="inline-flex items-center gap-2.5 mb-5">
          <div className="w-2 h-2 bg-[#ff1493] animate-pulse" />
          <span className="text-[10px] font-mono tracking-[0.4em] text-white/30 uppercase">
            Live Demo
          </span>
          <div className="w-2 h-2 bg-[#ff1493] animate-pulse" />
        </div>

        <h1 className="font-headline text-8xl sm:text-9xl text-[#ff1493] leading-none">
          .
        </h1>

        <p className="mt-5 text-white/40 font-body text-sm max-w-[280px] mx-auto leading-relaxed">
          The complete event platform. Create events, sell tickets, scan at the door.
        </p>
      </div>

      {/* Feature highlights */}
      <div className="grid grid-cols-3 gap-4 mb-10 max-w-xs">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-2 border border-white/10 flex items-center justify-center">
            <Ticket className="w-5 h-5 text-[#ff1493]" />
          </div>
          <span className="text-[10px] font-mono text-white/40">TICKETS</span>
        </div>
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-2 border border-white/10 flex items-center justify-center">
            <Camera className="w-5 h-5 text-[#ff1493]" />
          </div>
          <span className="text-[10px] font-mono text-white/40">SCANNER</span>
        </div>
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-2 border border-white/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-[#ff1493]" />
          </div>
          <span className="text-[10px] font-mono text-white/40">GUESTLIST</span>
        </div>
      </div>

      <button
        onClick={onStart}
        className="group px-10 py-4 bg-[#ff1493] text-black font-mono text-sm tracking-widest uppercase active:scale-[0.97] transition-all animate-fade-in-up stagger-2 btn-glow"
      >
        START DEMO
        <ChevronRight className="inline w-4 h-4 ml-1 transition-transform group-active:translate-x-1" />
      </button>
    </div>
  )
}

/* ---------- Text Input ---------- */
function TextInput({
  placeholder,
  onSubmit,
}: {
  placeholder: string
  onSubmit: (v: string) => void
}) {
  const [value, setValue] = useState("")
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    ref.current?.focus()
  }, [])

  const submit = () => {
    const v = value.trim()
    if (v) {
      onSubmit(v)
      setValue("")
    }
  }

  return (
    <div className="flex items-center gap-2 p-4 animate-fade-in-up" style={{ animationDuration: "0.25s" }}>
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder={placeholder}
        className="flex-1 bg-white/[0.04] border border-white/10 px-4 py-3.5 text-white text-sm font-body placeholder:text-white/25 focus:outline-none focus:border-[#ff1493] transition-colors"
      />
      <button
        onClick={submit}
        disabled={!value.trim()}
        className="p-3.5 bg-[#ff1493] text-black disabled:opacity-20 disabled:bg-white/5 disabled:text-white/20 transition-all active:scale-95"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  )
}

/* ---------- Tier Selector ---------- */
function TierSelector({
  onSubmit,
}: {
  onSubmit: (tier: { name: string; price: number }) => void
}) {
  return (
    <div className="p-4 space-y-3 animate-fade-in-up" style={{ animationDuration: "0.25s" }}>
      <div className="space-y-2">
        {TIER_PRESETS.map((tier, i) => (
          <button
            key={i}
            onClick={() => onSubmit(tier)}
            className="w-full p-4 border border-white/10 bg-white/[0.02] flex items-center justify-between hover:border-[#ff1493]/50 hover:bg-white/[0.04] transition-all active:scale-[0.98]"
          >
            <span className="text-sm font-mono text-white">{tier.name}</span>
            <span className="text-lg font-headline text-[#ff1493]">${tier.price}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ---------- Generating Sequence ---------- */
function GeneratingSequence({ event }: { event: DemoEvent }) {
  const [line, setLine] = useState(0)
  useEffect(() => {
    const t = [
      setTimeout(() => setLine(1), 500),
      setTimeout(() => setLine(2), 1100),
      setTimeout(() => setLine(3), 1700),
    ]
    return () => t.forEach(clearTimeout)
  }, [])

  const lines = [
    `Creating ${event.name}...`,
    "Setting up ticket tier...",
    "Generating QR code...",
  ]

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#ff1493]/60 to-transparent"
        style={{ animation: "genScan 2s ease-in-out infinite" }}
      />
      <div className="text-center space-y-5 px-8">
        {lines.map((text, i) => (
          <div
            key={i}
            className={`font-mono text-sm tracking-wider transition-all duration-500 flex items-center justify-center gap-2 ${line > i ? "text-[#ff1493]" : line === i ? "text-white/60" : "text-white/0"}`}
          >
            <span>{text}</span>
            {line > i && (
              <Check className="w-3.5 h-3.5 text-[#ff1493] animate-scale-in" />
            )}
          </div>
        ))}
        <div className="w-48 h-[2px] bg-white/10 mx-auto mt-6 overflow-hidden">
          <div
            className="h-full bg-[#ff1493] transition-all duration-[2200ms] ease-out"
            style={{ width: line >= 3 ? "100%" : `${(line / 3) * 80}%` }}
          />
        </div>
      </div>
    </div>
  )
}

/* ---------- Ticket Overlay (matches PDF design) ---------- */
function TicketOverlay({
  event,
  onScanner,
}: {
  event: DemoEvent
  onScanner: () => void
}) {
  const [copied, setCopied] = useState(false)
  const [canShare, setCanShare] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCanShare(typeof navigator !== "undefined" && !!navigator.share)
  }, [])

  async function share() {
    try {
      await navigator.share({
        title: `${event.name} — Ticket`,
        text: `Ticket to ${event.name}`,
        url: window.location.href,
      })
    } catch {
      copyTicketNumber()
    }
  }

  function copyTicketNumber() {
    navigator.clipboard.writeText(event.ticketNumber)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative z-20 flex-1 overflow-y-auto safe-area-bottom">
      <div className="flex flex-col items-center px-5 py-6 min-h-full">
        {/* Ticket Card - matches PDF design */}
        <div className="w-full max-w-sm animate-scale-in">
          <div className="bg-[#0a0a0a] border border-white/10 overflow-hidden relative">
            {/* Hot pink header bar with logo */}
            <div className="h-14 bg-[#ff1493] flex items-center px-5">
              <span className="font-headline text-2xl text-black">.</span>
            </div>

            <div className="p-5">
              {/* Event Title */}
              <h2 className="font-headline text-2xl text-white tracking-wide leading-tight mb-1">
                {event.name.toUpperCase()}
              </h2>

              {/* Tier */}
              <div className="inline-block text-sm font-mono text-[#ff1493] mb-5">
                {event.tier.name}
              </div>

              {/* Event Details */}
              <div className="space-y-4 mb-5">
                <div>
                  <div className="text-[10px] font-mono text-white/40 tracking-wider mb-1">
                    DATE
                  </div>
                  <div className="text-sm font-mono text-white">
                    {event.date}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-white/40 tracking-wider mb-1">
                    VENUE
                  </div>
                  <div className="text-sm font-mono text-white">
                    {event.venue}
                  </div>
                  <div className="text-xs font-mono text-white/50">
                    {event.city}
                  </div>
                </div>
              </div>

              {/* Dashed tear line */}
              <div className="border-t border-dashed border-white/20 my-5" />

              {/* QR Code - just encodes ticketId */}
              <div className="flex justify-center mb-4">
                <div className="bg-black p-3 inline-block border border-white/10">
                  <QRCodeSVG
                    value={event.ticketId}
                    size={160}
                    level="M"
                    bgColor="#000000"
                    fgColor="#ffffff"
                  />
                </div>
              </div>

              {/* Ticket number */}
              <div className="text-center mb-4">
                <div className="text-xs font-mono text-white/40 mb-1">
                  #{event.ticketNumber}
                </div>
              </div>

              {/* Footer */}
              <div className="text-center">
                <p className="text-[10px] font-mono text-white/30">
                  Scan QR code at the door
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="w-full max-w-sm mt-5 space-y-3 pb-4">
          {canShare ? (
            <button
              onClick={share}
              className="w-full py-4 bg-[#ff1493] text-black font-mono text-xs tracking-widest flex items-center justify-center gap-2.5 active:scale-[0.98] transition-transform"
            >
              <Share2 className="w-4 h-4" />
              SHARE TICKET
            </button>
          ) : (
            <button
              onClick={copyTicketNumber}
              className="w-full py-4 bg-[#ff1493] text-black font-mono text-xs tracking-widest flex items-center justify-center gap-2.5 active:scale-[0.98] transition-transform"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "COPIED!" : "COPY TICKET NUMBER"}
            </button>
          )}

          <button
            onClick={onScanner}
            className="w-full py-4 border border-[#ff1493]/40 text-[#ff1493] font-mono text-xs tracking-widest flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all hover:border-[#ff1493]"
          >
            <Camera className="w-4 h-4" />
            TRY THE SCANNER
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------- Scanner Overlay ---------- */
function ScannerOverlay({
  event,
  onScan,
  onClose,
}: {
  event: DemoEvent
  onScan: (v: string) => void
  onClose: () => void
}) {
  const [scanned, setScanned] = useState(false)

  function handleDetect(codes: { rawValue: string }[]) {
    if (codes.length > 0 && !scanned) {
      setScanned(true)
      onScan(codes[0].rawValue)
    }
  }

  function simulate() {
    if (!scanned) {
      setScanned(true)
      // Scan our own ticket
      onScan(event.ticketId)
    }
  }

  return (
    <div className="relative z-20 flex-1 flex flex-col bg-black animate-fade-in">
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-30 p-2.5 bg-black/60 backdrop-blur-sm text-white"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Camera */}
      <div className="flex-1 relative overflow-hidden">
        <QrScanner
          onScan={handleDetect}
          styles={{
            container: {
              width: "100%",
              height: "100%",
              position: "relative",
            },
            video: {
              objectFit: "cover" as const,
            },
          }}
        />

        {/* Viewfinder */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-60 h-60 relative">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#ff1493]" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#ff1493]" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#ff1493]" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#ff1493]" />
            <div
              className="absolute left-2 right-2 h-[2px] bg-[#ff1493]/70"
              style={{ animation: "viewfinderLine 2.5s ease-in-out infinite" }}
            />
          </div>
        </div>

        {/* Label */}
        <div className="absolute bottom-6 inset-x-0 text-center">
          <span className="text-white/60 font-mono text-xs tracking-wider bg-black/50 backdrop-blur-sm px-4 py-2 inline-block">
            Point at the ticket QR code
          </span>
        </div>
      </div>

      {/* Simulate fallback */}
      <div className="p-4 safe-area-bottom">
        <button
          onClick={simulate}
          className="w-full py-3 border border-white/15 text-white/40 font-mono text-[10px] tracking-widest active:scale-[0.98] transition-all"
        >
          SIMULATE SCAN (DEMO)
        </button>
      </div>
    </div>
  )
}

/* ---------- Check-In Result ---------- */
function CheckInResult({
  event,
  onDone,
}: {
  event: DemoEvent
  onDone: () => void
}) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 350)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="relative z-20 flex-1 flex flex-col items-center justify-center px-6">
      {/* Flash */}
      <div
        className="absolute inset-0 bg-[#ff1493] pointer-events-none"
        style={{ animation: "pinkFlash 0.6s ease-out forwards" }}
      />

      {/* Content */}
      <div className={`text-center transition-all duration-700 ease-out ${show ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 translate-y-4"}`}>
        {/* Checkmark */}
        <div className="w-20 h-20 border-2 border-[#ff1493] flex items-center justify-center mx-auto mb-8 glow-pink">
          <Check className="w-10 h-10 text-[#ff1493]" />
        </div>

        <h2 className="font-headline text-5xl sm:text-6xl text-white tracking-wider mb-2">
          CHECKED IN
        </h2>
        <p className="text-[#ff1493] font-mono text-xs tracking-[0.3em] mb-10">
          ADMISSION GRANTED
        </p>

        <div className="space-y-1.5 mb-12">
          <p className="text-white font-body text-lg">{event.tier.name}</p>
          <p className="text-white/45 font-body text-sm">{event.name}</p>
          <p className="text-white/25 font-mono text-xs">{event.ticketNumber}</p>
        </div>

        <button
          onClick={onDone}
          className="px-10 py-4 bg-[#ff1493] text-black font-mono text-xs tracking-widest active:scale-[0.97] transition-transform"
        >
          COMPLETE DEMO
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────

export default function DemoPage() {
  const [step, setStep] = useState<DemoStep>("welcome")
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [event, setEvent] = useState<DemoEvent>({
    name: "",
    venue: "",
    city: "",
    date: getNextSaturday(),
    tier: TIER_PRESETS[0],
    ticketNumber: genTicketNumber(),
    ticketId: "",
  })
  const [typing, setTyping] = useState(false)
  const [overlay, setOverlay] = useState<"ticket" | "scanner" | "result" | null>(null)
  const idRef = useRef(0)
  const chatEnd = useRef<HTMLDivElement>(null)

  // Auto-scroll
  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, typing])

  const addMsg = useCallback((role: "bot" | "user", text: string) => {
    idRef.current += 1
    const id = idRef.current
    setMessages((m) => [...m, { id, role, text }])
  }, [])

  const botSay = useCallback(
    async (text: string, ms = 600) => {
      setTyping(true)
      await wait(ms)
      setTyping(false)
      addMsg("bot", text)
    },
    [addMsg]
  )

  // ─── Step Handlers (one question at a time) ───

  async function startDemo() {
    await botSay("Let's create your event.", 500)
    await wait(300)
    await botSay("What's your event called?", 400)
    setStep("event-name")
  }

  async function onEventName(name: string) {
    addMsg("user", name)
    setEvent((p) => ({ ...p, name }))
    await botSay("Where's the venue?", 500)
    setStep("venue")
  }

  async function onVenue(venue: string) {
    addMsg("user", venue)
    setEvent((p) => ({ ...p, venue }))
    await botSay("What city?", 400)
    setStep("city")
  }

  async function onCity(city: string) {
    addMsg("user", city)
    setEvent((p) => ({ ...p, city }))
    await botSay("Pick a ticket tier:", 500)
    setStep("tier-select")
  }

  async function onTier(tier: { name: string; price: number }) {
    addMsg("user", `${tier.name} — $${tier.price}`)
    const ticketNumber = genTicketNumber()
    const updatedEvent = { ...event, tier, ticketNumber }
    updatedEvent.ticketId = genTicketId(updatedEvent)
    setEvent(updatedEvent)
    setStep("generating")
    await wait(2400)
    setOverlay("ticket")
    setStep("ticket-ready")
  }

  function openScanner() {
    setOverlay("scanner")
    setStep("scanner")
  }

  function onScanResult(raw: string) {
    // Accept demo tickets or any ticket-like value
    if (raw.startsWith("demo-") || raw.includes("TK-")) {
      setOverlay("result")
      setStep("scan-result")
      return
    }
    // Fallback: accept any value for demo
    setOverlay("result")
    setStep("scan-result")
  }

  async function onComplete() {
    setOverlay(null)
    await botSay("That's AFTERS — tickets, scanning, guestlists, analytics. All in one platform.", 300)
    setStep("complete")
  }

  function reset() {
    setStep("welcome")
    setMessages([])
    setEvent({
      name: "",
      venue: "",
      city: "",
      date: getNextSaturday(),
      tier: TIER_PRESETS[0],
      ticketNumber: genTicketNumber(),
      ticketId: "",
    })
    setTyping(false)
    setOverlay(null)
  }

  // ─── Render ───

  const showChat = !overlay
  const showInput = !overlay && !typing && ["event-name", "venue", "city", "tier-select"].includes(step)

  return (
    <div className="fixed inset-0 bg-black overflow-hidden flex flex-col">
      {/* Grid bg */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(255,20,147,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,20,147,0.5) 1px, transparent 1px)`,
            backgroundSize: "80px 80px",
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] safe-area-top">
        <div className="flex items-center gap-2">
          <span className="font-headline text-2xl text-[#ff1493]">.</span>
        </div>
        <div className="flex items-center gap-3">
          {step !== "welcome" && (
            <button
              onClick={reset}
              className="p-1.5 text-white/25 hover:text-white/60 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-[#ff1493] rounded-full animate-pulse" />
            <span className="text-[10px] font-mono tracking-[0.2em] text-white/25 uppercase">
              Demo
            </span>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      {showChat && (
        <div className="relative z-10 flex-1 overflow-y-auto px-5 py-5">
          {step === "welcome" && <WelcomeScreen onStart={startDemo} />}

          {step !== "welcome" && (
            <div className="space-y-3.5 max-w-lg mx-auto">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in-up`}
                  style={{ animationDuration: "0.3s" }}
                >
                  <div className={`max-w-[85%] px-4 py-3 ${msg.role === "bot" ? "bg-white/[0.04] border border-white/[0.08] text-white/85" : "bg-[#ff1493] text-black"}`}>
                    <p className="text-sm font-body leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              ))}

              {typing && <TypingDots />}
              <div ref={chatEnd} />
            </div>
          )}

          {/* Generating overlay */}
          {step === "generating" && <GeneratingSequence event={event} />}

          {/* Complete */}
          {step === "complete" && (
            <div className="max-w-lg mx-auto mt-8 space-y-4 animate-fade-in-up">
              {/* Feature summary */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="border border-white/10 p-4 text-center">
                  <Ticket className="w-6 h-6 mx-auto mb-2 text-[#ff1493]" />
                  <span className="text-xs font-mono text-white/50">TICKETS</span>
                </div>
                <div className="border border-white/10 p-4 text-center">
                  <Camera className="w-6 h-6 mx-auto mb-2 text-[#ff1493]" />
                  <span className="text-xs font-mono text-white/50">SCANNER</span>
                </div>
                <div className="border border-white/10 p-4 text-center">
                  <Users className="w-6 h-6 mx-auto mb-2 text-[#ff1493]" />
                  <span className="text-xs font-mono text-white/50">GUESTLIST</span>
                </div>
                <div className="border border-white/10 p-4 text-center">
                  <BarChart3 className="w-6 h-6 mx-auto mb-2 text-[#ff1493]" />
                  <span className="text-xs font-mono text-white/50">ANALYTICS</span>
                </div>
              </div>

              <button
                onClick={reset}
                className="w-full py-4 bg-[#ff1493] text-black font-mono text-xs tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                <Zap className="w-4 h-4" />
                RUN ANOTHER DEMO
              </button>
            </div>
          )}
        </div>
      )}

      {/* Input Area */}
      {showInput && (
        <div className="relative z-10 border-t border-white/[0.06] bg-black/80 backdrop-blur-sm">
          {step === "event-name" && (
            <TextInput placeholder="e.g. MIDNIGHT SESSIONS" onSubmit={onEventName} />
          )}
          {step === "venue" && (
            <TextInput placeholder="Venue name..." onSubmit={onVenue} />
          )}
          {step === "city" && (
            <TextInput placeholder="City..." onSubmit={onCity} />
          )}
          {step === "tier-select" && <TierSelector onSubmit={onTier} />}
        </div>
      )}

      {/* Overlays */}
      {overlay === "ticket" && (
        <TicketOverlay event={event} onScanner={openScanner} />
      )}
      {overlay === "scanner" && (
        <ScannerOverlay event={event} onScan={onScanResult} onClose={() => { setOverlay("ticket"); setStep("ticket-ready") }} />
      )}
      {overlay === "result" && (
        <CheckInResult event={event} onDone={onComplete} />
      )}

      {/* Custom keyframes */}
      <style jsx>{`
        @keyframes dotBounce {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-4px); }
        }
        @keyframes genScan {
          0% { top: 20%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 80%; opacity: 0; }
        }
        @keyframes viewfinderLine {
          0%, 100% { top: 8px; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          50% { top: calc(100% - 10px); }
        }
        @keyframes pinkFlash {
          0% { opacity: 0.7; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
