"use client"

import { use, useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Scanner } from "@yudiel/react-qr-scanner"
import {
  CheckCircle,
  XCircle,
  LogIn,
  LogOut,
  Search,
  QrCode,
  AlertTriangle,
  Users,
  Keyboard,
  ChevronLeft,
  X,
  Hash,
  User,
  Ticket,
  Clock,
  Zap,
  LayoutDashboard,
  Calendar,
  ScanLine,
  Smartphone,
  Share,
} from "lucide-react"
import { toast } from "sonner"

type ViewMode = "home" | "scan" | "guestlist" | "manual"

interface ScannerInfo {
  id: string
  name: string
  eventId: string
  eventTitle: string
  hasGuestlist?: boolean
  scannerSound?: string
  accentColor?: string
}

interface CheckInResult {
  message?: string
  error?: string
  valid: boolean
  result?: string
  ticket?: {
    ticketNumber: string
    tierName: string
    holderName?: string
    checkedInAt?: string
    isTestTicket?: boolean
  }
}

interface GuestlistEntry {
  id: string
  name: string
  plusOnes: number
  checkedIn: boolean
  checkedInAt?: string
}

// Sound playback for scanner feedback
function playScannerSound(soundId: string = "basic") {
  try {
    // Use audio files for farts, pewpew, and lasersword
    if (soundId === "farts" || soundId === "pewpew" || soundId === "lasersword") {
      const filename = soundId === "farts" ? "fart" : soundId
      const audio = new Audio(`/sounds/${filename}.mp3`)
      audio.volume = 0.7
      audio.play().catch(() => {})
      return
    }

    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const now = ctx.currentTime

    switch (soundId) {
      case "basic": {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.value = 880
        osc.type = "sine"
        gain.gain.setValueAtTime(0.3, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15)
        osc.start(now)
        osc.stop(now + 0.15)
        break
      }
      case "ding": {
        const osc = ctx.createOscillator()
        const osc2 = ctx.createOscillator()
        const gain = ctx.createGain()
        const gain2 = ctx.createGain()
        osc.connect(gain)
        osc2.connect(gain2)
        gain.connect(ctx.destination)
        gain2.connect(ctx.destination)
        osc.type = "sine"
        osc.frequency.value = 830
        osc2.type = "sine"
        osc2.frequency.value = 1660
        gain.gain.setValueAtTime(0.4, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8)
        gain2.gain.setValueAtTime(0.2, now)
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.4)
        osc.start(now)
        osc2.start(now)
        osc.stop(now + 0.8)
        osc2.stop(now + 0.4)
        break
      }
      case "cashregister": {
        const noise = ctx.createBufferSource()
        const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate)
        const noiseData = noiseBuffer.getChannelData(0)
        for (let i = 0; i < noiseData.length; i++) {
          noiseData[i] = (Math.random() * 2 - 1) * (1 - i / noiseData.length)
        }
        noise.buffer = noiseBuffer
        const noiseFilter = ctx.createBiquadFilter()
        noiseFilter.type = "highpass"
        noiseFilter.frequency.value = 1000
        const noiseGain = ctx.createGain()
        noiseGain.gain.value = 0.3
        noise.connect(noiseFilter)
        noiseFilter.connect(noiseGain)
        noiseGain.connect(ctx.destination)
        noise.start(now)

        const bell1 = ctx.createOscillator()
        const bell2 = ctx.createOscillator()
        const bellGain1 = ctx.createGain()
        const bellGain2 = ctx.createGain()
        bell1.type = "sine"
        bell1.frequency.value = 2000
        bell2.type = "sine"
        bell2.frequency.value = 2500
        bell1.connect(bellGain1)
        bell2.connect(bellGain2)
        bellGain1.connect(ctx.destination)
        bellGain2.connect(ctx.destination)
        bellGain1.gain.setValueAtTime(0.3, now + 0.05)
        bellGain1.gain.exponentialRampToValueAtTime(0.01, now + 0.5)
        bellGain2.gain.setValueAtTime(0.15, now + 0.05)
        bellGain2.gain.exponentialRampToValueAtTime(0.01, now + 0.3)
        bell1.start(now + 0.05)
        bell2.start(now + 0.05)
        bell1.stop(now + 0.5)
        bell2.stop(now + 0.3)
        break
      }
    }

    setTimeout(() => ctx.close(), 1000)
  } catch {
    // Audio context not available
  }
}

export default function ScannerPage({
  params,
}: {
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = use(params)
  const [authenticated, setAuthenticated] = useState(false)
  const [scanner, setScanner] = useState<ScannerInfo | null>(null)
  const [code, setCode] = useState("")
  const [verifying, setVerifying] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("home")
  const [result, setResult] = useState<CheckInResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [manualId, setManualId] = useState("")
  const [isPunchedIn, setIsPunchedIn] = useState(false)
  const [punchLoading, setPunchLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [isOrganizer, setIsOrganizer] = useState(false)
  const [guestlistSearch, setGuestlistSearch] = useState("")
  const [guestlistEntries, setGuestlistEntries] = useState<GuestlistEntry[]>([])
  const [stats, setStats] = useState({ scanned: 0, total: 0 })

  useEffect(() => {
    checkExistingSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function checkExistingSession() {
    try {
      const res = await fetch("/api/scan/session")
      const data = await res.json()
      if (data.authenticated && data.scanner.eventId === eventId) {
        setScanner({
          id: data.scanner.scannerId,
          name: data.scanner.name,
          eventId: data.scanner.eventId,
          eventTitle: data.scanner.eventTitle || "",
          hasGuestlist: data.scanner.hasGuestlist || false,
          scannerSound: data.scanner.scannerSound || "basic",
          accentColor: data.scanner.accentColor || "#ff1493",
        })
        setAuthenticated(true)
        setStats(data.stats || { scanned: 0, total: 0 })

        // Organizers are automatically "punched in" - no shift tracking needed
        if (data.isOrganizer) {
          setIsOrganizer(true)
          setIsPunchedIn(true)
        } else {
          // Check shift status for staff scanners
          const shiftRes = await fetch("/api/scan/punch")
          if (shiftRes.ok) {
            const shiftData = await shiftRes.json()
            setIsPunchedIn(shiftData.isPunchedIn)
          }
        }
      }
    } catch {
      // No active session
    } finally {
      setCheckingSession(false)
    }
  }

  async function verifyCode() {
    if (!code || code.length !== 6) {
      toast.error("Please enter a 6-digit code")
      return
    }

    setVerifying(true)
    try {
      const res = await fetch("/api/scan/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, code }),
      })

      const data = await res.json()

      if (data.valid) {
        setScanner(data.scanner)
        setAuthenticated(true)
        setStats(data.stats || { scanned: 0, total: 0 })
        toast.success(`Welcome, ${data.scanner.name}!`)
      } else {
        toast.error(data.error || "Invalid code")
      }
    } catch {
      toast.error("Verification failed")
    } finally {
      setVerifying(false)
    }
  }

  const checkIn = useCallback(
    async (ticketId: string) => {
      if (loading) return
      setLoading(true)

      try {
        const res = await fetch("/api/scan/check-in", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticketId }),
        })

        const data: CheckInResult = await res.json()
        setResult(data)

        if (data.valid) {
          // Play success sound
          playScannerSound(scanner?.scannerSound || "basic")
          toast.success(data.message)
          setStats(prev => ({ ...prev, scanned: prev.scanned + 1 }))
        } else {
          toast.error(data.error)
        }
      } catch {
        toast.error("Check-in failed")
        setResult({ error: "Check-in failed", valid: false })
      } finally {
        setLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loading]
  )

  async function togglePunch() {
    setPunchLoading(true)
    try {
      const action = isPunchedIn ? "out" : "in"
      const res = await fetch("/api/scan/punch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })

      const data = await res.json()
      if (res.ok) {
        setIsPunchedIn(!isPunchedIn)
        toast.success(data.message)
        if (action === "out") {
          // Reset on punch out
          setAuthenticated(false)
          setScanner(null)
          setCode("")
        }
      } else {
        toast.error(data.error)
      }
    } catch {
      toast.error("Punch action failed")
    } finally {
      setPunchLoading(false)
    }
  }

  function handleScan(detectedCodes: { rawValue: string }[]) {
    if (detectedCodes.length > 0 && !loading && !result) {
      const ticketId = detectedCodes[0].rawValue
      checkIn(ticketId)
    }
  }

  function handleManualCheck() {
    if (manualId.trim()) {
      checkIn(manualId.trim())
    }
  }

  function resetAndGoHome() {
    setResult(null)
    setManualId("")
    setViewMode("home")
  }

  function scanAnother() {
    setResult(null)
  }

  async function fetchGuestlist(search: string = "") {
    try {
      const res = await fetch(`/api/scan/guestlist?search=${encodeURIComponent(search)}`)
      if (res.ok) {
        const data = await res.json()
        setGuestlistEntries(data.entries || [])
      }
    } catch (_error) {
      console.error("Failed to fetch guestlist:", _error)
    }
  }

  async function checkInGuestlistEntry(entry: GuestlistEntry) {
    try {
      const res = await fetch("/api/scan/guestlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId: entry.id }),
      })
      
      const data = await res.json()
      
      if (data.valid) {
        // Play success sound
        playScannerSound(scanner?.scannerSound || "basic")
        toast.success(data.message)
        setGuestlistEntries(prev =>
          prev.map(e => e.id === entry.id ? { ...e, checkedIn: true, checkedInAt: new Date().toISOString() } : e)
        )
      } else {
        toast.error(data.error || "Check-in failed")
      }
    } catch {
      toast.error("Check-in failed")
    }
  }

  // Fetch guestlist when entering guestlist mode
  useEffect(() => {
    if (viewMode === "guestlist" && authenticated) {
      fetchGuestlist(guestlistSearch)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, authenticated])

  // Debounced search for guestlist
  useEffect(() => {
    if (viewMode === "guestlist" && authenticated) {
      const timeout = setTimeout(() => {
        fetchGuestlist(guestlistSearch)
      }, 300)
      return () => clearTimeout(timeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guestlistSearch])

  // Loading state
  if (checkingSession) {
    return (
      <div className="fixed inset-0 bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[#ff1493]/30 border-t-[#ff1493] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/40 text-sm font-display tracking-wider">LOADING...</p>
        </div>
      </div>
    )
  }

  // Code entry screen
  if (!authenticated) {
    return (
      <div className="fixed inset-0 bg-black text-white flex flex-col overflow-hidden">
        {/* Animated grid background */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,20,147,0.5) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,20,147,0.5) 1px, transparent 1px)
              `,
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        {/* Scanning line animation */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#ff1493]/30 to-transparent"
            style={{
              animation: "scanLine 4s ease-in-out infinite",
            }}
          />
        </div>

        {/* Corner bracket accents */}
        <div className="absolute top-0 left-0 w-16 h-16 pointer-events-none">
          <div className="absolute top-3 left-3 w-8 h-[2px] bg-[#ff1493]/40" />
          <div className="absolute top-3 left-3 w-[2px] h-8 bg-[#ff1493]/40" />
        </div>
        <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none">
          <div className="absolute top-3 right-3 w-8 h-[2px] bg-[#ff1493]/40" />
          <div className="absolute top-3 right-3 w-[2px] h-8 bg-[#ff1493]/40" />
        </div>
        <div className="absolute bottom-0 left-0 w-16 h-16 pointer-events-none">
          <div className="absolute bottom-3 left-3 w-8 h-[2px] bg-[#ff1493]/40" />
          <div className="absolute bottom-3 left-3 w-[2px] h-8 bg-[#ff1493]/40" />
        </div>
        <div className="absolute bottom-0 right-0 w-16 h-16 pointer-events-none">
          <div className="absolute bottom-3 right-3 w-8 h-[2px] bg-[#ff1493]/40" />
          <div className="absolute bottom-3 right-3 w-[2px] h-8 bg-[#ff1493]/40" />
        </div>

        {/* Desktop Message Overlay */}
        <div className="hidden md:flex fixed inset-0 z-50 bg-black flex-col items-center justify-center p-8">
          <div className="max-w-md text-center">
            <div className="w-20 h-20 border-2 border-[#ff1493]/30 bg-[#ff1493]/5 flex items-center justify-center mx-auto mb-6">
              <Smartphone className="w-10 h-10 text-[#ff1493]" />
            </div>
            <h2 className="text-2xl font-headline tracking-wide text-white mb-4">
              MOBILE DEVICE REQUIRED
            </h2>
            <p className="text-white/50 font-mono text-sm mb-8">
              Scanning tickets requires a mobile device with a camera. Open this page on your phone to start scanning.
            </p>
            <div className="border border-white/10 bg-white/[0.02] p-6 space-y-4">
              <div className="flex items-center gap-3 text-left">
                <div className="w-8 h-8 bg-[#ff1493]/10 border border-[#ff1493]/30 flex items-center justify-center flex-shrink-0">
                  <Share className="w-4 h-4 text-[#ff1493]" />
                </div>
                <div>
                  <p className="text-white font-mono text-sm">AirDrop this link</p>
                  <p className="text-white/40 font-mono text-xs">Share directly to your iPhone</p>
                </div>
              </div>
              <div className="pt-4 border-t border-white/10">
                <p className="text-[10px] font-mono text-white/30 mb-2">SCANNER URL</p>
                <code className="block w-full px-3 py-2 bg-black border border-white/10 text-[#ff1493] font-mono text-sm break-all" suppressHydrationWarning>
                  {typeof window !== 'undefined' ? window.location.href : `/scan/${eventId}`}
                </code>
              </div>
            </div>
            <Link
              href="/d"
              className="inline-flex items-center gap-2 mt-8 text-white/40 hover:text-white font-mono text-xs transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              Go to Dashboard
            </Link>
          </div>
        </div>

        {/* CSS for animations */}
        <style jsx>{`
          @keyframes scanLine {
            0%, 100% {
              top: 0%;
              opacity: 0;
            }
            10% {
              opacity: 1;
            }
            50% {
              top: 100%;
              opacity: 1;
            }
            60% {
              opacity: 0;
            }
          }
          @keyframes scanLaser {
            0%, 100% {
              top: 0%;
              opacity: 0.3;
            }
            50% {
              top: calc(100% - 2px);
              opacity: 1;
            }
          }
        `}</style>

        {/* Safe area top - mobile only */}
        <div className="safe-area-top md:hidden" />

        {/* Main content - mobile only */}
        <div className="flex-1 flex items-center justify-center p-6 relative z-10 md:hidden">
          <div className="w-full max-w-sm">
            {/* Logo */}
            <div className="text-center mb-12">
              <p className="text-5xl font-headline text-[#ff1493]">
                .
              </p>
              <p className="text-xs tracking-[0.3em] text-white/40 font-mono mt-2">
                SCANNER
              </p>
            </div>

            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#ff1493]/10 border border-[#ff1493]/30 flex items-center justify-center mx-auto mb-4">
                  <QrCode className="w-8 h-8 text-[#ff1493]" />
                </div>
                <h1 className="text-xl font-bold font-display">SCANNER ACCESS</h1>
                <p className="text-sm text-white/40 mt-2">
                  Enter your 6-digit access code
                </p>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={(e) => e.key === "Enter" && verifyCode()}
                  className="w-full px-4 py-5 bg-white/[0.03] border border-white/10 text-white text-4xl text-center tracking-[0.5em] font-display placeholder:text-white/10 focus:outline-none focus:border-[#ff1493] transition-colors rounded-none"
                  autoFocus
                />
                <button
                  onClick={verifyCode}
                  disabled={verifying || code.length !== 6}
                  className="w-full py-5 bg-[#ff1493] text-black text-lg font-bold font-display tracking-wider hover:bg-[#ff69b4] transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  {verifying ? "VERIFYING..." : "START SCANNING"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Safe area bottom - mobile only */}
        <div className="safe-area-bottom md:hidden" />
      </div>
    )
  }

  // Get accent color from scanner info (fallback to default pink)
  const accentColor = scanner?.accentColor || "#ff1493"
  
  // Helper to convert hex to RGB for rgba usage
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}` : "255,20,147"
  }
  const accentRgb = hexToRgb(accentColor)

  // Main Scanner Interface - Full viewport
  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col overflow-hidden" style={{ ['--accent' as string]: accentColor, ['--accent-rgb' as string]: accentRgb }}>
      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(${accentRgb},0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(${accentRgb},0.5) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Scanning line animation */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-[5]">
        <div
          className="absolute left-0 right-0 h-[2px]"
          style={{
            animation: "scanLine 4s ease-in-out infinite",
            background: `linear-gradient(to right, transparent, rgba(${accentRgb},0.3), transparent)`,
          }}
        />
      </div>

      {/* Corner bracket accents */}
      <div className="absolute top-0 left-0 w-16 h-16 pointer-events-none z-[5]">
        <div className="absolute top-3 left-3 w-8 h-[2px]" style={{ backgroundColor: `rgba(${accentRgb},0.4)` }} />
        <div className="absolute top-3 left-3 w-[2px] h-8" style={{ backgroundColor: `rgba(${accentRgb},0.4)` }} />
      </div>
      <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none z-[5]">
        <div className="absolute top-3 right-3 w-8 h-[2px]" style={{ backgroundColor: `rgba(${accentRgb},0.4)` }} />
        <div className="absolute top-3 right-3 w-[2px] h-8" style={{ backgroundColor: `rgba(${accentRgb},0.4)` }} />
      </div>
      <div className="absolute bottom-0 left-0 w-16 h-16 pointer-events-none z-[5]">
        <div className="absolute bottom-3 left-3 w-8 h-[2px]" style={{ backgroundColor: `rgba(${accentRgb},0.4)` }} />
        <div className="absolute bottom-3 left-3 w-[2px] h-8" style={{ backgroundColor: `rgba(${accentRgb},0.4)` }} />
      </div>
      <div className="absolute bottom-0 right-0 w-16 h-16 pointer-events-none z-[5]">
        <div className="absolute bottom-3 right-3 w-8 h-[2px]" style={{ backgroundColor: `rgba(${accentRgb},0.4)` }} />
        <div className="absolute bottom-3 right-3 w-[2px] h-8" style={{ backgroundColor: `rgba(${accentRgb},0.4)` }} />
      </div>

      {/* Desktop Message Overlay */}
      <div className="hidden md:flex fixed inset-0 z-50 bg-black flex-col items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 border-2 border-[#ff1493]/30 bg-[#ff1493]/5 flex items-center justify-center mx-auto mb-6">
            <Smartphone className="w-10 h-10 text-[#ff1493]" />
          </div>
          <h2 className="text-2xl font-headline tracking-wide text-white mb-4">
            MOBILE DEVICE REQUIRED
          </h2>
          <p className="text-white/50 font-mono text-sm mb-8">
            Scanning tickets requires a mobile device with a camera. Open this page on your phone to start scanning.
          </p>
          <div className="border border-white/10 bg-white/[0.02] p-6 space-y-4">
            <div className="flex items-center gap-3 text-left">
              <div className="w-8 h-8 bg-[#ff1493]/10 border border-[#ff1493]/30 flex items-center justify-center flex-shrink-0">
                <Share className="w-4 h-4 text-[#ff1493]" />
              </div>
              <div>
                <p className="text-white font-mono text-sm">AirDrop this link</p>
                <p className="text-white/40 font-mono text-xs">Share directly to your iPhone</p>
              </div>
            </div>
            <div className="pt-4 border-t border-white/10">
              <p className="text-[10px] font-mono text-white/30 mb-2">SCANNER URL</p>
              <code className="block w-full px-3 py-2 bg-black border border-white/10 text-[#ff1493] font-mono text-sm break-all">
                {typeof window !== 'undefined' ? window.location.href : `/scan/${eventId}`}
              </code>
            </div>
          </div>
          <Link
            href="/d"
            className="inline-flex items-center gap-2 mt-8 text-white/40 hover:text-white font-mono text-xs transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            Go to Dashboard
          </Link>
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes scanLine {
          0%, 100% {
            top: 0%;
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          50% {
            top: 100%;
            opacity: 1;
          }
          60% {
            opacity: 0;
          }
        }
        @keyframes scanLaser {
          0%, 100% {
            top: 0%;
            opacity: 0.3;
          }
          50% {
            top: calc(100% - 2px);
            opacity: 1;
          }
        }
      `}</style>

      {/* Safe area top */}
      <div className="bg-black safe-area-top md:hidden" />

      {/* Header - mobile only */}
      <header className="flex-shrink-0 px-4 py-3 border-b border-white/10 bg-black/80 backdrop-blur-sm md:hidden">
        <div className="flex items-center justify-between relative">
          {/* Left side - back button */}
          <div className="w-10 flex-shrink-0">
            {viewMode !== "home" ? (
              <button
                onClick={resetAndGoHome}
                className="p-2 -ml-2 hover:bg-white/5 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            ) : isOrganizer ? (
              <Link
                href="/scan"
                className="flex items-center justify-center w-8 h-8 border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>
            ) : null}
          </div>

          {/* Center - Event title */}
          <div className="absolute left-1/2 -translate-x-1/2 text-center">
            <p className="text-sm font-headline tracking-wide truncate max-w-[200px]">
              {scanner?.eventTitle || "SCANNER"}
            </p>
            {viewMode !== "home" && (
              <p className="text-[10px] font-mono text-white/40 tracking-wider">
                {viewMode === "scan" ? "SCAN MODE" : viewMode === "guestlist" ? "GUESTLIST" : "MANUAL"}
              </p>
            )}
          </div>

          {/* Right side - Shift Status */}
          <div className="flex-shrink-0">
            {isOrganizer ? (
              <div className="flex items-center gap-2 px-3 py-2 text-xs font-display tracking-wider" style={{ backgroundColor: `rgba(${accentRgb},0.1)`, borderWidth: 1, borderColor: `rgba(${accentRgb},0.3)`, color: accentColor }}>
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: accentColor }} />
                <span className="hidden sm:inline">ORGANIZER</span>
              </div>
            ) : (
              <button
                onClick={togglePunch}
                disabled={punchLoading}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-display tracking-wider transition-all ${isPunchedIn ? "bg-green-500/10 border border-green-500/30 text-green-400" : "bg-white/5 border border-white/10 text-white/60"}`}
              >
                {isPunchedIn ? (
                  <>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="hidden sm:inline">ON SHIFT</span>
                    <LogOut className="w-3.5 h-3.5 sm:hidden" />
                  </>
                ) : (
                  <>
                    <LogIn className="w-3.5 h-3.5" />
                    <span>PUNCH IN</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content - mobile only */}
      <main className="flex-1 overflow-hidden flex flex-col md:hidden">
        {viewMode === "home" ? (
          /* Home Screen with Action Buttons */
          <div className={`flex-1 flex flex-col p-4 ${isOrganizer ? "pb-24" : "pb-8"}`}>
            {/* Stats Bar */}
            <div className="flex gap-3 mb-6">
              <div className="flex-1 bg-white/[0.03] border border-white/10 p-4 text-center">
                <p className="text-3xl font-bold font-display text-[#ff1493]">{stats.scanned}</p>
                <p className="text-xs text-white/40 mt-1">CHECKED IN</p>
              </div>
              <div className="flex-1 bg-white/[0.03] border border-white/10 p-4 text-center">
                <p className="text-3xl font-bold font-display">{stats.total}</p>
                <p className="text-xs text-white/40 mt-1">TOTAL TICKETS</p>
              </div>
            </div>

            {/* Main Action Buttons */}
            <div className="flex-1 flex flex-col gap-4">
              {/* Scan Button - Primary */}
              <button
                onClick={() => setViewMode("scan")}
                disabled={!isPunchedIn}
                className="flex-1 min-h-[120px] text-black flex flex-col items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ backgroundColor: accentColor }}
              >
                <QrCode className="w-12 h-12" />
                <span className="text-2xl font-bold font-display tracking-wider">SCAN</span>
              </button>

              <div className="flex gap-4">
                {/* Guestlist Button - Conditional */}
                {scanner?.hasGuestlist && (
                  <button
                    onClick={() => setViewMode("guestlist")}
                    disabled={!isPunchedIn}
                    className="flex-1 min-h-[100px] bg-white/[0.03] border border-white/10 flex flex-col items-center justify-center gap-2 hover:bg-white/[0.05] transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ ['--tw-border-opacity' as string]: 1 }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = `rgba(${accentRgb},0.5)`)}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = '')}
                  >
                    <Users className="w-8 h-8" style={{ color: accentColor }} />
                    <span className="text-lg font-bold font-display tracking-wider">GUESTLIST</span>
                  </button>
                )}

                {/* Manual Entry Button */}
                <button
                  onClick={() => setViewMode("manual")}
                  disabled={!isPunchedIn}
                  className="flex-1 min-h-[100px] bg-white/[0.03] border border-white/10 flex flex-col items-center justify-center gap-2 hover:bg-white/[0.05] transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Keyboard className="w-8 h-8 text-white/60" />
                  <span className="text-lg font-bold font-display tracking-wider">MANUAL</span>
                </button>
              </div>
            </div>

            {/* Punch In Reminder */}
            {!isPunchedIn && (
              <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-yellow-400">Punch in to start</p>
                  <p className="text-xs text-white/40">You must be on shift to scan tickets</p>
                </div>
              </div>
            )}
          </div>
        ) : viewMode === "scan" ? (
          /* QR Scanner View */
          <div className="flex-1 flex flex-col">
            {result ? (
              /* Result Screen */
              <div className={`flex-1 flex flex-col items-center justify-center p-6 ${isOrganizer ? "pb-24" : ""}`}>
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${
                  result.valid 
                    ? "bg-green-500/20" 
                    : result.result === "ALREADY_CHECKED_IN" 
                      ? "bg-yellow-500/20" 
                      : "bg-red-500/20"
                }`}>
                  {result.valid ? (
                    <CheckCircle className="w-14 h-14 text-green-400" />
                  ) : result.result === "ALREADY_CHECKED_IN" ? (
                    <AlertTriangle className="w-14 h-14 text-yellow-400" />
                  ) : (
                    <XCircle className="w-14 h-14 text-red-400" />
                  )}
                </div>

                <p className="text-2xl font-bold font-display mb-2">
                  {result.valid 
                    ? "CHECKED IN" 
                    : result.result === "ALREADY_CHECKED_IN" 
                      ? "ALREADY SCANNED" 
                      : "INVALID"}
                </p>
                <p className="text-white/40 text-center">
                  {result.message || result.error}
                </p>

                {/* Test Ticket Warning */}
                {result.ticket?.isTestTicket && (
                  <div className="mt-4 px-4 py-2 bg-orange-500/20 border border-orange-500/40 rounded-lg">
                    <p className="text-orange-400 text-sm font-display tracking-wider">⚠️ TEST TICKET</p>
                  </div>
                )}

                {result.ticket && (
                  <div className="w-full max-w-sm mt-6 bg-white/[0.02] border border-white/10 divide-y divide-white/10">
                    <div className="flex items-center gap-3 p-4">
                      <Hash className="w-4 h-4 text-white/40" />
                      <div className="flex-1">
                        <p className="text-xs text-white/40">Ticket Number</p>
                        <p className="font-mono">{result.ticket.ticketNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4">
                      <Ticket className="w-4 h-4 text-white/40" />
                      <div className="flex-1">
                        <p className="text-xs text-white/40">Ticket Type</p>
                        <p>{result.ticket.tierName}</p>
                      </div>
                    </div>
                    {result.ticket.holderName && (
                      <div className="flex items-center gap-3 p-4">
                        <User className="w-4 h-4 text-white/40" />
                        <div className="flex-1">
                          <p className="text-xs text-white/40">Name</p>
                          <p>{result.ticket.holderName}</p>
                        </div>
                      </div>
                    )}
                    {result.ticket.checkedInAt && (
                      <div className="flex items-center gap-3 p-4">
                        <Clock className="w-4 h-4 text-white/40" />
                        <div className="flex-1">
                          <p className="text-xs text-white/40">Checked In At</p>
                          <p>{new Date(result.ticket.checkedInAt).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="w-full max-w-sm mt-8 space-y-3">
                  <button
                    onClick={scanAnother}
                    className="w-full py-4 text-black text-lg font-bold font-display tracking-wider transition-all active:scale-[0.98]"
                    style={{ backgroundColor: accentColor }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Zap className="w-5 h-5" />
                      SCAN NEXT
                    </div>
                  </button>
                  <button
                    onClick={resetAndGoHome}
                    className="w-full py-3 bg-white/5 border border-white/10 text-white font-display tracking-wider hover:bg-white/10 transition-all"
                  >
                    BACK TO HOME
                  </button>
                </div>
              </div>
            ) : (
              /* Camera View */
              <div className="flex-1 relative">
                <div className="absolute inset-0">
                  <Scanner
                    onScan={handleScan}
                    onError={(error: unknown) => console.error(error)}
                    constraints={{ facingMode: "environment" }}
                    styles={{
                      container: { width: "100%", height: "100%" },
                      video: {
                        width: "100%",
                        height: "100%",
                        objectFit: "cover" as const,
                      },
                    }}
                  />
                </div>
                
                {/* Scan overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50" />

                  {/* Center crosshair with scanning animation */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-64 h-64 relative overflow-hidden">
                      {/* Corner brackets */}
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2" style={{ borderColor: accentColor }} />
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2" style={{ borderColor: accentColor }} />
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2" style={{ borderColor: accentColor }} />
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2" style={{ borderColor: accentColor }} />

                      {/* Animated scanning laser line */}
                      <div
                        className="absolute left-0 right-0 h-0.5"
                        style={{
                          animation: "scanLaser 2s ease-in-out infinite",
                          background: `linear-gradient(to right, transparent, ${accentColor}, transparent)`,
                          boxShadow: `0 0 10px ${accentColor}, 0 0 20px ${accentColor}`,
                        }}
                      />

                      {/* Subtle grid overlay */}
                      <div
                        className="absolute inset-2 opacity-20"
                        style={{
                          backgroundImage: `
                            linear-gradient(rgba(${accentRgb},0.3) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(${accentRgb},0.3) 1px, transparent 1px)
                          `,
                          backgroundSize: "20px 20px",
                        }}
                      />
                    </div>
                  </div>

                  {/* Scan status indicator */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-40">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-sm" style={{ borderWidth: 1, borderColor: `rgba(${accentRgb},0.3)` }}>
                      <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: accentColor }} />
                      <span className="text-[10px] font-mono tracking-wider" style={{ color: accentColor }}>SCANNING</span>
                    </div>
                  </div>
                </div>

                {/* Loading overlay */}
                {loading && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full animate-spin mx-auto mb-4" style={{ borderWidth: 2, borderColor: `rgba(${accentRgb},0.3)`, borderTopColor: accentColor }} />
                      <p className="text-white/60 font-display tracking-wider">CHECKING IN...</p>
                    </div>
                  </div>
                )}

                {/* Quick manual entry at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/90 to-transparent pt-12">
                  <button
                    onClick={() => setViewMode("manual")}
                    className="w-full py-3 bg-white/10 border border-white/20 text-white font-display tracking-wider text-sm flex items-center justify-center gap-2"
                  >
                    <Keyboard className="w-4 h-4" />
                    ENTER MANUALLY
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : viewMode === "manual" ? (
          /* Manual Entry View */
          <div className="flex-1 flex flex-col p-4">
            {result ? (
              /* Result Screen */
              <div className={`flex-1 flex flex-col items-center justify-center ${isOrganizer ? "pb-24" : ""}`}>
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${
                  result.valid
                    ? "bg-green-500/20"
                    : result.result === "ALREADY_CHECKED_IN"
                      ? "bg-yellow-500/20"
                      : "bg-red-500/20"
                }`}>
                  {result.valid ? (
                    <CheckCircle className="w-14 h-14 text-green-400" />
                  ) : result.result === "ALREADY_CHECKED_IN" ? (
                    <AlertTriangle className="w-14 h-14 text-yellow-400" />
                  ) : (
                    <XCircle className="w-14 h-14 text-red-400" />
                  )}
                </div>

                <p className="text-2xl font-bold font-display mb-2">
                  {result.valid
                    ? "CHECKED IN"
                    : result.result === "ALREADY_CHECKED_IN"
                      ? "ALREADY SCANNED"
                      : "INVALID"}
                </p>
                <p className="text-white/40 text-center mb-8">
                  {result.message || result.error}
                </p>

                <div className="w-full max-w-sm space-y-3">
                  <button
                    onClick={() => { setResult(null); setManualId(""); }}
                    className="w-full py-4 text-black text-lg font-bold font-display tracking-wider transition-all active:scale-[0.98]"
                    style={{ backgroundColor: accentColor }}
                  >
                    ENTER ANOTHER
                  </button>
                  <button
                    onClick={resetAndGoHome}
                    className="w-full py-3 bg-white/5 border border-white/10 text-white font-display tracking-wider hover:bg-white/10 transition-all"
                  >
                    BACK TO HOME
                  </button>
                </div>
              </div>
            ) : (
              /* Input Form */
              <div className="flex-1 flex flex-col">
                <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center mx-auto mb-4">
                      <Keyboard className="w-8 h-8 text-white/60" />
                    </div>
                    <p className="text-white/40 text-sm">
                      Enter ticket ID or ticket number
                    </p>
                  </div>

                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Ticket ID or Number"
                      value={manualId}
                      onChange={(e) => setManualId(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleManualCheck()}
                      className="w-full px-4 py-5 bg-white/[0.03] border border-white/10 text-white text-xl text-center font-display placeholder:text-white/20 focus:outline-none transition-colors"
                      style={{ ['--tw-ring-color' as string]: accentColor }}
                      autoFocus
                    />
                    <button
                      onClick={handleManualCheck}
                      disabled={loading || !manualId.trim()}
                      className="w-full py-5 text-black text-lg font-bold font-display tracking-wider transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98]"
                      style={{ backgroundColor: accentColor }}
                    >
                      {loading ? "CHECKING..." : "CHECK IN"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : viewMode === "guestlist" ? (
          /* Guestlist View */
          <div className="flex-1 flex flex-col">
            {/* Search */}
            <div className="p-4 border-b border-white/10">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  placeholder="Search guestlist..."
                  value={guestlistSearch}
                  onChange={(e) => setGuestlistSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-[#ff1493] transition-colors"
                  autoFocus
                />
                {guestlistSearch && (
                  <button 
                    onClick={() => setGuestlistSearch("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-5 h-5 text-white/40" />
                  </button>
                )}
              </div>
            </div>

            {/* Guestlist Entries */}
            <div className="flex-1 overflow-y-auto">
              {guestlistEntries.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <Users className="w-12 h-12 text-white/20 mb-4" />
                  <p className="text-white/40">No guestlist entries</p>
                  <p className="text-white/20 text-sm mt-1">Add guests from the organizer dashboard</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {guestlistEntries
                    .filter(e => e.name.toLowerCase().includes(guestlistSearch.toLowerCase()))
                    .map((entry) => (
                      <div 
                        key={entry.id}
                        className={`flex items-center gap-4 p-4 ${entry.checkedIn ? 'opacity-50' : ''}`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          entry.checkedIn ? 'bg-green-500/20' : 'bg-white/[0.03]'
                        }`}>
                          {entry.checkedIn ? (
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          ) : (
                            <User className="w-5 h-5 text-white/40" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-display truncate">{entry.name}</p>
                          {entry.plusOnes > 0 && (
                            <p className="text-xs text-white/40">+{entry.plusOnes} guest{entry.plusOnes > 1 ? 's' : ''}</p>
                          )}
                        </div>
                        {!entry.checkedIn && (
                          <button
                            onClick={() => checkInGuestlistEntry(entry)}
                            className="px-4 py-2 text-black text-sm font-bold font-display tracking-wider active:scale-95"
                            style={{ backgroundColor: accentColor }}
                          >
                            CHECK IN
                          </button>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </main>

      {/* Mobile Toolbar for Organizers */}
      {isOrganizer && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-lg border-t border-white/10 safe-area-bottom">
          <div className="flex items-center justify-around h-16 px-2">
            <Link
              href="/d"
              className="flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[4.5rem] text-white/40"
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-[10px] font-mono tracking-wider">CONTROL</span>
            </Link>
            <Link
              href="/d/events"
              className="flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[4.5rem] text-white/40"
            >
              <Calendar className="w-5 h-5" />
              <span className="text-[10px] font-mono tracking-wider">EVENTS</span>
            </Link>
            <div className="flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[4.5rem]" style={{ color: accentColor }}>
              <ScanLine className="w-5 h-5" />
              <span className="text-[10px] font-mono tracking-wider">SCANNER</span>
            </div>
          </div>
        </nav>
      )}

      {/* Safe area bottom - mobile only */}
      {!isOrganizer && <div className="bg-black safe-area-bottom md:hidden" />}
    </div>
  )
}
