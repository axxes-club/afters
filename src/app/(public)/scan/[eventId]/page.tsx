"use client"

import { use, useState, useEffect, useCallback } from "react"
import { Scanner } from "@yudiel/react-qr-scanner"
import {
  CheckCircle,
  XCircle,
  LogIn,
  LogOut,
  Search,
  QrCode,
  AlertTriangle,
} from "lucide-react"
import { toast } from "sonner"

interface ScannerInfo {
  id: string
  name: string
  eventId: string
  eventTitle: string
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
  const [scanning, setScanning] = useState(true)
  const [result, setResult] = useState<CheckInResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [manualId, setManualId] = useState("")
  const [isPunchedIn, setIsPunchedIn] = useState(false)
  const [punchLoading, setPunchLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    checkExistingSession()
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
          eventTitle: "",
        })
        setAuthenticated(true)
        // Check shift status
        const shiftRes = await fetch("/api/scan/punch")
        if (shiftRes.ok) {
          const shiftData = await shiftRes.json()
          setIsPunchedIn(shiftData.isPunchedIn)
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
        setScanning(false)

        if (data.valid) {
          toast.success(data.message)
        } else {
          toast.error(data.error)
        }
      } catch {
        toast.error("Check-in failed")
        setResult({ error: "Check-in failed", valid: false })
        setScanning(false)
      } finally {
        setLoading(false)
      }
    },
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
    if (detectedCodes.length > 0 && !loading) {
      const ticketId = detectedCodes[0].rawValue
      checkIn(ticketId)
    }
  }

  function handleManualCheck() {
    if (manualId.trim()) {
      checkIn(manualId.trim())
      setManualId("")
    }
  }

  function resetScanner() {
    setResult(null)
    setScanning(true)
  }

  // Loading state
  if (checkingSession) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#ff1493]/30 border-t-[#ff1493] rounded-full animate-spin" />
      </div>
    )
  }

  // Code entry screen
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-10">
            <p className="text-2xl font-bold font-display">
              AFTERS<span className="text-[#ff1493]">.</span>
            </p>
            <p className="text-xs tracking-widest text-white/40 mt-1">
              SCANNER
            </p>
          </div>

          <div className="border border-white/10 p-6">
            <div className="text-center mb-6">
              <QrCode className="w-10 h-10 text-[#ff1493] mx-auto mb-3" />
              <h1 className="text-xl font-bold font-display">SCANNER ACCESS</h1>
              <p className="text-sm text-white/40 mt-1">
                Enter your 6-digit code to start scanning
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
                className="w-full px-4 py-4 bg-white/[0.03] border border-white/10 text-white text-3xl text-center tracking-[0.5em] font-display placeholder:text-white/10 focus:outline-none focus:border-[#ff1493] transition-colors"
              />
              <button
                onClick={verifyCode}
                disabled={verifying || code.length !== 6}
                className="w-full py-4 bg-[#ff1493] text-black font-bold font-display tracking-wider hover:bg-[#ff69b4] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {verifying ? "VERIFYING..." : "START SCANNING"}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Scanner interface
  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-lg mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xl font-bold font-display">
              AFTERS<span className="text-[#ff1493]">.</span>{" "}
              <span className="text-sm text-white/40">SCANNER</span>
            </p>
            {scanner && (
              <p className="text-sm text-white/60">{scanner.name}</p>
            )}
          </div>
          <button
            onClick={togglePunch}
            disabled={punchLoading}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-display tracking-wider transition-all ${
              isPunchedIn
                ? "bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20"
                : "bg-[#ff1493]/10 border border-[#ff1493]/30 text-[#ff1493] hover:bg-[#ff1493]/20"
            }`}
          >
            {isPunchedIn ? (
              <LogOut className="w-4 h-4" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            {punchLoading
              ? "..."
              : isPunchedIn
                ? "PUNCH OUT"
                : "PUNCH IN"}
          </button>
        </div>

        {/* Shift indicator */}
        {isPunchedIn && (
          <div className="flex items-center gap-2 px-3 py-2 bg-green-500/5 border border-green-500/20 text-green-400 text-xs font-display tracking-widest">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            SHIFT ACTIVE
          </div>
        )}

        {/* QR Scanner */}
        <div className="border border-white/10">
          <div className="px-4 py-3 border-b border-white/10">
            <p className="text-sm font-display tracking-wider">SCAN TICKET</p>
          </div>

          {scanning && !result ? (
            <div className="aspect-square bg-black overflow-hidden">
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
          ) : result ? (
            <div className="p-6 text-center">
              {result.valid ? (
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              ) : result.result === "ALREADY_CHECKED_IN" ? (
                <AlertTriangle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              ) : (
                <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              )}

              <p className="text-lg font-bold font-display mb-1">
                {result.valid ? "CHECKED IN" : result.result === "ALREADY_CHECKED_IN" ? "ALREADY SCANNED" : "INVALID"}
              </p>
              <p className="text-sm text-white/40">
                {result.message || result.error}
              </p>

              {result.ticket && (
                <div className="mt-4 p-4 bg-white/[0.02] border border-white/10 text-left space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/40">Ticket</span>
                    <span className="font-mono">
                      {result.ticket.ticketNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Type</span>
                    <span>{result.ticket.tierName}</span>
                  </div>
                  {result.ticket.holderName && (
                    <div className="flex justify-between">
                      <span className="text-white/40">Name</span>
                      <span>{result.ticket.holderName}</span>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={resetScanner}
                className="mt-6 w-full py-3 bg-[#ff1493] text-black font-bold font-display tracking-wider hover:bg-[#ff69b4] transition-all"
              >
                SCAN NEXT
              </button>
            </div>
          ) : null}
        </div>

        {/* Manual Entry */}
        <div className="border border-white/10">
          <div className="px-4 py-3 border-b border-white/10">
            <p className="text-sm font-display tracking-wider">MANUAL ENTRY</p>
          </div>
          <div className="p-4 flex gap-2">
            <input
              placeholder="Enter ticket ID"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleManualCheck()}
              className="flex-1 px-3 py-2 bg-white/[0.03] border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#ff1493] transition-colors"
            />
            <button
              onClick={handleManualCheck}
              disabled={loading || !manualId.trim()}
              className="px-4 py-2 bg-white/5 border border-white/10 hover:border-[#ff1493] transition-colors disabled:opacity-30"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
