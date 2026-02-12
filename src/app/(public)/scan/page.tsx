"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Radio, Lock, Zap, AlertCircle, Calendar, MapPin, ChevronRight, User } from "lucide-react"
import { toast } from "sonner"

interface OrganizerEvent {
  id: string
  title: string
  slug: string
  startsAt: string
  venueName: string
  isPublished: boolean
  ticketCount: number
}

export default function ScannerEntryPage() {
  const router = useRouter()
  const [code, setCode] = useState(["", "", "", "", "", ""])
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState("")
  const [shakeError, setShakeError] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Organizer auth state
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [isOrganizer, setIsOrganizer] = useState(false)
  const [organizerName, setOrganizerName] = useState("")
  const [organizerEvents, setOrganizerEvents] = useState<OrganizerEvent[]>([])
  const [selectingEvent, setSelectingEvent] = useState<string | null>(null)

  // Check if user is logged in as organizer
  useEffect(() => {
    checkOrganizerAuth()
  }, [])

  async function checkOrganizerAuth() {
    try {
      const res = await fetch("/api/scan/organizer-auth")
      const data = await res.json()

      if (data.authenticated && data.isOrganizer && data.events.length > 0) {
        setIsOrganizer(true)
        setOrganizerName(data.organizerName)
        setOrganizerEvents(data.events)

        // Auto-select if only one event
        if (data.events.length === 1) {
          selectEvent(data.events[0].id)
          return
        }
      }
    } catch {
      // Not authenticated or error, show normal code entry
    } finally {
      setCheckingAuth(false)
    }
  }

  async function selectEvent(eventId: string) {
    setSelectingEvent(eventId)
    try {
      const res = await fetch("/api/scan/organizer-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      })

      const data = await res.json()

      if (data.valid) {
        toast.success(`Scanner ready for ${data.scanner.eventTitle}`)
        router.push(`/scan/${eventId}`)
      } else {
        toast.error(data.error || "Failed to access scanner")
        setSelectingEvent(null)
      }
    } catch {
      toast.error("Connection failed")
      setSelectingEvent(null)
    }
  }

  // Focus first input on mount (only if showing code entry)
  useEffect(() => {
    if (!checkingAuth && !isOrganizer) {
      inputRefs.current[0]?.focus()
    }
  }, [checkingAuth, isOrganizer])

  // Auto-submit when all 6 digits entered
  useEffect(() => {
    const fullCode = code.join("")
    if (fullCode.length === 6 && code.every((d) => d !== "")) {
      verifyCode(fullCode)
    }
  }, [code])

  async function verifyCode(fullCode: string) {
    setVerifying(true)
    setError("")

    try {
      const res = await fetch("/api/scan/find-by-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: fullCode }),
      })

      const data = await res.json()

      if (data.valid) {
        toast.success(`Welcome, ${data.scanner.name}!`)
        // Redirect to the event scanner
        router.push(`/scan/${data.scanner.eventId}`)
      } else {
        setError(data.error || "Invalid code")
        triggerShake()
        // Clear the code
        setCode(["", "", "", "", "", ""])
        inputRefs.current[0]?.focus()
      }
    } catch {
      setError("Connection failed")
      triggerShake()
    } finally {
      setVerifying(false)
    }
  }

  function triggerShake() {
    setShakeError(true)
    setTimeout(() => setShakeError(false), 500)
  }

  function handleInput(index: number, value: string) {
    // Only allow digits
    const digit = value.replace(/\D/g, "").slice(-1)

    const newCode = [...code]
    newCode[index] = digit
    setCode(newCode)

    // Auto-advance to next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      // Move to previous input on backspace
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (pasted.length === 6) {
      setCode(pasted.split(""))
    }
  }

  const isComplete = code.every((d) => d !== "")

  // Loading state while checking auth
  if (checkingAuth) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[#ff1493]/30 border-t-[#ff1493] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/40 text-sm font-mono tracking-wider">LOADING...</p>
        </div>
      </div>
    )
  }

  // Organizer event selection view
  if (isOrganizer && organizerEvents.length > 0) {
    return (
      <div className="fixed inset-0 bg-black overflow-hidden">
        {/* Animated grid background */}
        <div className="absolute inset-0 opacity-[0.03]">
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

        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-24 h-24">
          <div className="absolute top-4 left-4 w-12 h-[2px] bg-[#ff1493]/50" />
          <div className="absolute top-4 left-4 w-[2px] h-12 bg-[#ff1493]/50" />
        </div>
        <div className="absolute top-0 right-0 w-24 h-24">
          <div className="absolute top-4 right-4 w-12 h-[2px] bg-[#ff1493]/50" />
          <div className="absolute top-4 right-4 w-[2px] h-12 bg-[#ff1493]/50" />
        </div>

        {/* Main content */}
        <div className="relative z-10 min-h-screen flex flex-col px-6 py-12 safe-area-top safe-area-bottom">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-3 h-3 bg-[#ff1493] animate-pulse" />
              <span className="text-xs tracking-[0.4em] text-white/40 font-mono uppercase">
                Door Access
              </span>
              <div className="w-3 h-3 bg-[#ff1493] animate-pulse" />
            </div>

            <h1 className="text-5xl sm:text-6xl font-headline tracking-wide text-white">
              AFTERS<span className="text-[#ff1493]">.</span>
            </h1>

            <div className="mt-4 flex items-center justify-center gap-2 text-white/30">
              <Radio className="w-4 h-4" />
              <span className="text-xs font-mono tracking-wider">SCANNER TERMINAL</span>
            </div>
          </div>

          {/* Organizer greeting */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-[#ff1493]/30 bg-[#ff1493]/5 mb-4">
              <User className="w-7 h-7 text-[#ff1493]" />
            </div>
            <p className="text-white/60 font-mono text-sm">
              Welcome back, <span className="text-[#ff1493]">{organizerName}</span>
            </p>
            <p className="text-white/40 font-mono text-xs mt-1">
              Select an event to start scanning
            </p>
          </div>

          {/* Event list */}
          <div className="flex-1 max-w-md mx-auto w-full space-y-3 overflow-y-auto">
            {organizerEvents.map((event) => {
              const isSelecting = selectingEvent === event.id
              const eventDate = new Date(event.startsAt)
              const isToday = eventDate.toDateString() === new Date().toDateString()

              return (
                <button
                  key={event.id}
                  onClick={() => selectEvent(event.id)}
                  disabled={selectingEvent !== null}
                  className={`
                    w-full p-4 border text-left transition-all
                    ${isSelecting
                      ? "border-[#ff1493] bg-[#ff1493]/10"
                      : "border-white/10 bg-white/[0.02] hover:border-[#ff1493]/50 hover:bg-white/[0.04]"
                    }
                    ${selectingEvent !== null && !isSelecting ? "opacity-50" : ""}
                    disabled:cursor-not-allowed
                  `}
                >
                  <div className="flex items-center gap-4">
                    {/* Date block */}
                    <div className={`
                      w-14 h-14 flex flex-col items-center justify-center flex-shrink-0
                      ${isToday ? "bg-[#ff1493]/20 border border-[#ff1493]/40" : "bg-white/5"}
                    `}>
                      <span className="text-[10px] font-mono text-white/40">
                        {eventDate.toLocaleDateString("en-US", { month: "short" }).toUpperCase()}
                      </span>
                      <span className={`text-xl font-mono font-bold ${isToday ? "text-[#ff1493]" : ""}`}>
                        {eventDate.getDate()}
                      </span>
                    </div>

                    {/* Event info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-mono font-medium text-white truncate">{event.title}</p>
                        {isToday && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 bg-[#ff1493] text-black">
                            TODAY
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-white/40 font-mono">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{event.venueName}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {eventDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>

                    {/* Arrow / Loading */}
                    <div className="flex-shrink-0">
                      {isSelecting ? (
                        <div className="w-5 h-5 border-2 border-[#ff1493]/30 border-t-[#ff1493] rounded-full animate-spin" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-white/30" />
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Staff code entry link */}
          <div className="mt-8 text-center">
            <button
              onClick={() => setIsOrganizer(false)}
              className="text-white/30 font-mono text-xs hover:text-white/50 transition-colors"
            >
              Or enter a staff access code
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Default code entry view
  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-[0.03]">
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
          className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#ff1493]/40 to-transparent"
          style={{
            animation: "scanLine 4s ease-in-out infinite",
          }}
        />
      </div>

      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-24 h-24">
        <div className="absolute top-4 left-4 w-12 h-[2px] bg-[#ff1493]/50" />
        <div className="absolute top-4 left-4 w-[2px] h-12 bg-[#ff1493]/50" />
      </div>
      <div className="absolute top-0 right-0 w-24 h-24">
        <div className="absolute top-4 right-4 w-12 h-[2px] bg-[#ff1493]/50" />
        <div className="absolute top-4 right-4 w-[2px] h-12 bg-[#ff1493]/50" />
      </div>
      <div className="absolute bottom-0 left-0 w-24 h-24">
        <div className="absolute bottom-4 left-4 w-12 h-[2px] bg-[#ff1493]/50" />
        <div className="absolute bottom-4 left-4 w-[2px] h-12 bg-[#ff1493]/50" />
      </div>
      <div className="absolute bottom-0 right-0 w-24 h-24">
        <div className="absolute bottom-4 right-4 w-12 h-[2px] bg-[#ff1493]/50" />
        <div className="absolute bottom-4 right-4 w-[2px] h-12 bg-[#ff1493]/50" />
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12">
        {/* Logo section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-[#ff1493] animate-pulse" />
            <span className="text-xs tracking-[0.4em] text-white/40 font-mono uppercase">
              Door Access
            </span>
            <div className="w-3 h-3 bg-[#ff1493] animate-pulse" />
          </div>

          <h1 className="text-6xl sm:text-7xl font-headline tracking-wide text-white">
            AFTERS<span className="text-[#ff1493]">.</span>
          </h1>

          <div className="mt-4 flex items-center justify-center gap-2 text-white/30">
            <Radio className="w-4 h-4" />
            <span className="text-xs font-mono tracking-wider">SCANNER TERMINAL</span>
          </div>
        </div>

        {/* Code entry section */}
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-[#ff1493]/30 bg-[#ff1493]/5 mb-4">
              <Lock className="w-7 h-7 text-[#ff1493]" />
            </div>
            <p className="text-white/60 font-mono text-sm">
              Enter your 6-digit access code
            </p>
          </div>

          {/* Code input grid */}
          <div
            className={`transition-transform ${shakeError ? "animate-shake" : ""}`}
            onPaste={handlePaste}
          >
            <div className="flex justify-center gap-2 sm:gap-3 mb-6">
              {code.map((digit, index) => (
                <div key={index} className="relative">
                  <input
                    ref={(el) => {
                      inputRefs.current[index] = el
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleInput(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    disabled={verifying}
                    className={`
                      w-12 h-16 sm:w-14 sm:h-20
                      bg-white/[0.03] border-2
                      text-white text-2xl sm:text-3xl font-mono font-bold text-center
                      focus:outline-none transition-all duration-200
                      disabled:opacity-50
                      ${digit ? "border-[#ff1493] bg-[#ff1493]/5" : "border-white/10"}
                      ${error && !verifying ? "border-red-500/50" : ""}
                      focus:border-[#ff1493] focus:bg-[#ff1493]/10
                    `}
                    style={{ caretColor: "#ff1493" }}
                  />
                  {/* Active indicator */}
                  {digit && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-[2px] bg-[#ff1493]" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Error message */}
          {error && !verifying && (
            <div className="flex items-center justify-center gap-2 text-red-400 mb-6">
              <AlertCircle className="w-4 h-4" />
              <span className="font-mono text-sm">{error}</span>
            </div>
          )}

          {/* Loading state */}
          {verifying && (
            <div className="flex flex-col items-center justify-center py-4 mb-6">
              <div className="flex items-center gap-3 text-[#ff1493]">
                <div className="w-2 h-2 bg-current animate-pulse" />
                <span className="font-mono text-sm tracking-wider">VERIFYING</span>
                <div className="w-2 h-2 bg-current animate-pulse" style={{ animationDelay: "150ms" }} />
              </div>
            </div>
          )}

          {/* Submit button (hidden until complete, shown for visual feedback) */}
          <button
            onClick={() => verifyCode(code.join(""))}
            disabled={!isComplete || verifying}
            className={`
              w-full py-4 font-mono text-sm tracking-widest
              transition-all duration-300
              ${isComplete && !verifying
                ? "bg-[#ff1493] text-black hover:bg-[#ff69b4]"
                : "bg-white/5 text-white/20 cursor-not-allowed"
              }
            `}
          >
            {verifying ? (
              <span className="flex items-center justify-center gap-2">
                <Zap className="w-4 h-4 animate-pulse" />
                CONNECTING...
              </span>
            ) : (
              "ACCESS SCANNER"
            )}
          </button>
        </div>

        {/* Footer info */}
        <div className="mt-16 text-center">
          <p className="text-white/20 font-mono text-xs">
            Contact your event organizer for access codes
          </p>
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

        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          10%, 30%, 50%, 70%, 90% {
            transform: translateX(-4px);
          }
          20%, 40%, 60%, 80% {
            transform: translateX(4px);
          }
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  )
}
