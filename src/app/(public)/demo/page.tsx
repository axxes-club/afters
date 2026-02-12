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
  | "tiers"
  | "lead-name"
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
  tiers: { name: string; price: number }[]
  leadName: string
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

function encodeTicket(ev: DemoEvent): string {
  return btoa(
    JSON.stringify({
      id: ev.ticketId,
      e: ev.name,
      v: ev.venue,
      c: ev.city,
      d: ev.date,
      t: ev.tiers[0]?.name || "General",
      p: ev.tiers[0]?.price || 0,
      h: ev.leadName,
      n: ev.ticketNumber,
    })
  )
}

function ticketUrl(ev: DemoEvent): string {
  const origin = typeof window !== "undefined" ? window.location.origin : ""
  return `${origin}/demo/ticket?d=${encodeTicket(ev)}`
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
      {/* Logo */}
      <div className="mb-10 animate-fade-in">
        <div className="inline-flex items-center gap-2.5 mb-5">
          <div className="w-2 h-2 bg-[#ff1493] animate-pulse" />
          <span className="text-[10px] font-mono tracking-[0.4em] text-white/30 uppercase">
            Live Demo
          </span>
          <div className="w-2 h-2 bg-[#ff1493] animate-pulse" />
        </div>

        <h1 className="font-headline text-7xl sm:text-8xl text-white tracking-wide leading-none">
          AFTERS<span className="text-[#ff1493]">.</span>
        </h1>

        <p className="mt-5 text-white/40 font-body text-sm max-w-[280px] mx-auto leading-relaxed">
          See how we power the best events — tickets, scanning, and check-in. All in one.
        </p>
      </div>

      {/* Start */}
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

/* ---------- Venue Input ---------- */
function VenueInput({
  onSubmit,
}: {
  onSubmit: (venue: string, city: string) => void
}) {
  const [venue, setVenue] = useState("")
  const [city, setCity] = useState("")
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    ref.current?.focus()
  }, [])

  const submit = () => {
    if (venue.trim() && city.trim()) onSubmit(venue.trim(), city.trim())
  }

  return (
    <div className="p-4 space-y-2 animate-fade-in-up" style={{ animationDuration: "0.25s" }}>
      <input
        ref={ref}
        type="text"
        value={venue}
        onChange={(e) => setVenue(e.target.value)}
        placeholder="Venue name..."
        className="w-full bg-white/[0.04] border border-white/10 px-4 py-3.5 text-white text-sm font-body placeholder:text-white/25 focus:outline-none focus:border-[#ff1493] transition-colors"
      />
      <div className="flex gap-2">
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="City..."
          className="flex-1 bg-white/[0.04] border border-white/10 px-4 py-3.5 text-white text-sm font-body placeholder:text-white/25 focus:outline-none focus:border-[#ff1493] transition-colors"
        />
        <button
          onClick={submit}
          disabled={!venue.trim() || !city.trim()}
          className="p-3.5 bg-[#ff1493] text-black disabled:opacity-20 disabled:bg-white/5 disabled:text-white/20 transition-all active:scale-95"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

/* ---------- Tier Selector ---------- */
function TierSelector({
  onSubmit,
}: {
  onSubmit: (tiers: { name: string; price: number }[]) => void
}) {
  const [sel, setSel] = useState<number[]>([0, 1])
  const toggle = (i: number) =>
    setSel((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]))

  return (
    <div className="p-4 space-y-3 animate-fade-in-up" style={{ animationDuration: "0.25s" }}>
      <div className="grid grid-cols-3 gap-2">
        {TIER_PRESETS.map((tier, i) => (
          <button
            key={i}
            onClick={() => toggle(i)}
            className={`p-3 border text-center transition-all active:scale-[0.97] ${
              sel.includes(i)
                ? "bg-[#ff1493]/10 border-[#ff1493] text-[#ff1493]"
                : "bg-white/[0.02] border-white/10 text-white/40"
            }`}
          >
            <div className="text-[10px] font-mono font-bold leading-tight">
              {tier.name}
            </div>
            <div className="text-xl font-headline mt-1">${tier.price}</div>
          </button>
        ))}
      </div>
      <button
        onClick={() => {
          const tiers = sel
            .sort((a, b) => a - b)
            .map((i) => TIER_PRESETS[i])
          if (tiers.length) onSubmit(tiers)
        }}
        disabled={sel.length === 0}
        className="w-full py-3.5 bg-[#ff1493] text-black font-mono text-xs tracking-widest disabled:opacity-20 transition-all active:scale-[0.98]"
      >
        CONFIRM TIERS
      </button>
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
    `Setting up ${event.name}...`,
    "Creating ticket tiers...",
    "Generating QR code...",
  ]

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      {/* Scan line */}
      <div
        className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#ff1493]/60 to-transparent"
        style={{ animation: "genScan 2s ease-in-out infinite" }}
      />
      <div className="text-center space-y-5 px-8">
        {lines.map((text, i) => (
          <div
            key={i}
            className={`font-mono text-sm tracking-wider transition-all duration-500 flex items-center justify-center gap-2 ${
              line > i
                ? "text-[#ff1493]"
                : line === i
                  ? "text-white/60"
                  : "text-white/0"
            }`}
          >
            <span>{text}</span>
            {line > i && (
              <Check className="w-3.5 h-3.5 text-[#ff1493] animate-scale-in" />
            )}
          </div>
        ))}
        {/* Progress bar */}
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

/* ---------- Ticket Overlay ---------- */
function TicketOverlay({
  event,
  onScanner,
}: {
  event: DemoEvent
  onScanner: () => void
}) {
  const url = ticketUrl(event)
  const [copied, setCopied] = useState(false)
  const [canShare, setCanShare] = useState(false)

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && !!navigator.share)
  }, [])

  async function share() {
    try {
      await navigator.share({
        title: `${event.name} — Ticket`,
        text: `Your ticket to ${event.name}`,
        url,
      })
    } catch {
      copyLink()
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative z-20 flex-1 overflow-y-auto safe-area-bottom">
      <div className="flex flex-col items-center px-5 py-6 min-h-full">
        {/* Ticket Card */}
        <div className="w-full max-w-sm animate-scale-in">
          <div className="bg-[#0a0a0a] border border-white/10 overflow-hidden relative">
            {/* Top accent */}
            <div className="h-1 bg-gradient-to-r from-[#ff1493] to-[#ff69b4]" />

            <div className="p-6">
              {/* Badge */}
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1.5 h-1.5 bg-[#ff1493]" />
                <span className="text-[10px] font-mono tracking-[0.3em] text-white/35 uppercase">
                  AFTERS Demo Ticket
                </span>
              </div>

              {/* Event Name */}
              <h2 className="font-headline text-4xl sm:text-5xl text-white tracking-wide leading-[0.95] mb-5">
                {event.name.toUpperCase()}
              </h2>

              {/* Details */}
              <div className="space-y-2 mb-5">
                <div className="flex items-center gap-2 text-white/45 text-sm font-body">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {event.venue} &middot; {event.city}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-white/45 text-sm font-body">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center gap-2 text-white/45 text-sm font-body">
                  <Ticket className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {event.tiers[0]?.name} &middot; ${event.tiers[0]?.price}
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-dashed border-white/10 my-5" />

              {/* QR Code */}
              <div className="flex justify-center mb-5">
                <div className="bg-white p-3 inline-block">
                  <QRCodeSVG value={url} size={180} level="M" />
                </div>
              </div>

              {/* Footer row */}
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-[10px] font-mono text-white/25 mb-0.5 tracking-wider">
                    ATTENDEE
                  </div>
                  <div className="text-sm font-body text-white">
                    {event.leadName}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-mono text-white/25 mb-0.5 tracking-wider">
                    TICKET
                  </div>
                  <div className="text-sm font-mono text-[#ff1493]">
                    {event.ticketNumber}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="w-full max-w-sm mt-5 space-y-3 pb-4">
          {canShare ? (
            <button
              onClick={share}
              className="w-full py-4 bg-[#ff1493] text-black font-mono text-xs tracking-widest flex items-center justify-center gap-2.5 active:scale-[0.98] transition-transform btn-premium"
            >
              <Share2 className="w-4 h-4" />
              AIRDROP / SHARE TICKET
            </button>
          ) : (
            <button
              onClick={copyLink}
              className="w-full py-4 bg-[#ff1493] text-black font-mono text-xs tracking-widest flex items-center justify-center gap-2.5 active:scale-[0.98] transition-transform btn-premium"
            >
              {copied ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copied ? "LINK COPIED!" : "COPY TICKET LINK"}
            </button>
          )}

          <button
            onClick={onScanner}
            className="w-full py-4 border border-[#ff1493]/40 text-[#ff1493] font-mono text-xs tracking-widest flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all hover:border-[#ff1493]"
          >
            <Camera className="w-4 h-4" />
            OPEN SCANNER
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------- Scanner Overlay ---------- */
function ScannerOverlay({
  onScan,
  onClose,
}: {
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
      onScan("demo-simulate")
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
            {/* Scan line */}
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
      <div
        className={`text-center transition-all duration-700 ease-out ${
          show ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 translate-y-4"
        }`}
      >
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
          <p className="text-white font-body text-lg">{event.leadName}</p>
          <p className="text-white/45 font-body text-sm">
            {event.tiers[0]?.name} &middot; {event.name}
          </p>
          <p className="text-white/25 font-mono text-xs">
            {event.ticketNumber}
          </p>
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
    tiers: [],
    leadName: "",
    ticketNumber: genTicketNumber(),
    ticketId: `demo-${Date.now()}`,
  })
  const [typing, setTyping] = useState(false)
  const [overlay, setOverlay] = useState<
    "ticket" | "scanner" | "result" | null
  >(null)
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

  // ─── Step Handlers ───

  async function startDemo() {
    await botSay("Let's build your event in 60 seconds.", 500)
    await wait(300)
    await botSay("What's your event called?", 400)
    setStep("event-name")
  }

  async function onEventName(name: string) {
    addMsg("user", name)
    setEvent((p) => ({ ...p, name }))
    await botSay(`"${name}" — love it. Where's it happening?`, 500)
    setStep("venue")
  }

  async function onVenue(venue: string, city: string) {
    addMsg("user", `${venue}, ${city}`)
    setEvent((p) => ({ ...p, venue, city }))
    await botSay("Pick your ticket tiers.", 500)
    setStep("tiers")
  }

  async function onTiers(tiers: { name: string; price: number }[]) {
    addMsg(
      "user",
      tiers.map((t) => `${t.name} $${t.price}`).join(" / ")
    )
    setEvent((p) => ({ ...p, tiers }))
    await botSay("Almost done — who should I make this ticket out to?", 500)
    setStep("lead-name")
  }

  async function onLeadName(name: string) {
    addMsg("user", name)
    setEvent((p) => ({ ...p, leadName: name }))
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
    // Accept any scan as valid for the demo
    try {
      const u = new URL(raw)
      if (u.searchParams.get("d")) {
        setOverlay("result")
        setStep("scan-result")
        return
      }
    } catch {
      /* not a URL */
    }
    // Fallback: accept any value for demo
    setOverlay("result")
    setStep("scan-result")
  }

  async function onComplete() {
    setOverlay(null)
    await botSay(
      "That's AFTERS. Tickets, scanners, check-in — all in one platform.",
      300
    )
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
      tiers: [],
      leadName: "",
      ticketNumber: genTicketNumber(),
      ticketId: `demo-${Date.now()}`,
    })
    setTyping(false)
    setOverlay(null)
  }

  // ─── Render ───

  const showChat = !overlay
  const showInput =
    !overlay &&
    !typing &&
    ["event-name", "venue", "tiers", "lead-name"].includes(step)

  return (
    <div className="fixed inset-0 bg-black overflow-hidden flex flex-col">
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

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] safe-area-top">
        <div className="flex items-center gap-2">
          <span className="font-headline text-xl text-white tracking-wide">
            AFTERS<span className="text-[#ff1493]">.</span>
          </span>
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
                  <div
                    className={`max-w-[85%] px-4 py-3 ${
                      msg.role === "bot"
                        ? "bg-white/[0.04] border border-white/[0.08] text-white/85"
                        : "bg-[#ff1493] text-black"
                    }`}
                  >
                    <p className="text-sm font-body leading-relaxed">
                      {msg.text}
                    </p>
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
            <div className="max-w-lg mx-auto mt-8 animate-fade-in-up">
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
            <TextInput
              placeholder="e.g. MIDNIGHT SESSIONS"
              onSubmit={onEventName}
            />
          )}
          {step === "venue" && <VenueInput onSubmit={onVenue} />}
          {step === "tiers" && <TierSelector onSubmit={onTiers} />}
          {step === "lead-name" && (
            <TextInput placeholder="Their name..." onSubmit={onLeadName} />
          )}
        </div>
      )}

      {/* Overlays */}
      {overlay === "ticket" && (
        <TicketOverlay event={event} onScanner={openScanner} />
      )}
      {overlay === "scanner" && (
        <ScannerOverlay
          onScan={onScanResult}
          onClose={() => {
            setOverlay("ticket")
            setStep("ticket-ready")
          }}
        />
      )}
      {overlay === "result" && (
        <CheckInResult event={event} onDone={onComplete} />
      )}

      {/* Custom keyframes */}
      <style jsx>{`
        @keyframes dotBounce {
          0%,
          60%,
          100% {
            opacity: 0.3;
            transform: translateY(0);
          }
          30% {
            opacity: 1;
            transform: translateY(-4px);
          }
        }
        @keyframes genScan {
          0% {
            top: 20%;
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            top: 80%;
            opacity: 0;
          }
        }
        @keyframes viewfinderLine {
          0%,
          100% {
            top: 8px;
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          50% {
            top: calc(100% - 10px);
          }
        }
        @keyframes pinkFlash {
          0% {
            opacity: 0.7;
          }
          100% {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
