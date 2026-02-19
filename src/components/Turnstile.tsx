"use client"

import { useEffect, useRef, useState, useCallback } from "react"

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string
          callback: (token: string) => void
          "error-callback"?: () => void
          "expired-callback"?: () => void
          theme?: "light" | "dark" | "auto"
          size?: "normal" | "compact"
        }
      ) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
  }
}

interface TurnstileProps {
  onVerify: (token: string) => void
  onError?: () => void
  onExpire?: () => void
  className?: string
}

export function Turnstile({ onVerify, onError, onExpire, className }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasFailed, setHasFailed] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  // Memoize callbacks to prevent unnecessary re-renders
  const handleVerify = useCallback((token: string) => {
    onVerify(token)
  }, [onVerify])

  const handleError = useCallback(() => {
    console.warn("Turnstile verification failed")
    setHasFailed(true)
    onError?.()
  }, [onError])

  const handleExpire = useCallback(() => {
    console.warn("Turnstile verification expired")
    onExpire?.()
  }, [onExpire])

  useEffect(() => {
    // Load Turnstile script if not already loaded
    const scriptId = "turnstile-script"
    let script = document.getElementById(scriptId) as HTMLScriptElement | null

    const renderWidget = () => {
      if (!containerRef.current || !window.turnstile) return

      // Remove existing widget if any
      if (widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch {
          // Widget might already be removed
        }
      }

      const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
      if (!sitekey) {
        console.warn("Turnstile site key not configured")
        // Auto-verify when key is not configured (allows form submission)
        handleVerify("bypass-not-configured")
        return
      }

      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey,
          callback: handleVerify,
          "error-callback": handleError,
          "expired-callback": handleExpire,
          theme: "dark",
          size: "normal",
        })
      } catch (error) {
        console.error("Failed to render Turnstile widget:", error)
        setHasFailed(true)
      }
    }

    if (!script) {
      script = document.createElement("script")
      script.id = scriptId
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js"
      script.async = true
      script.defer = true
      script.onload = () => {
        setIsLoaded(true)
        renderWidget()
      }
      script.onerror = () => {
        console.error("Failed to load Turnstile script")
        setHasFailed(true)
      }
      document.head.appendChild(script)
    } else if (window.turnstile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoaded(true)
      renderWidget()
    } else {
      // Script exists but not loaded yet
      const existingOnload = script.onload
      const currentScript = script
      currentScript.onload = (event) => {
        if (typeof existingOnload === 'function') {
          existingOnload.call(currentScript, event)
        }
        setIsLoaded(true)
        renderWidget()
      }
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch {
          // Ignore cleanup errors
        }
      }
    }
  }, [handleVerify, handleError, handleExpire, retryCount])

  const handleRetry = () => {
    setHasFailed(false)
    setRetryCount(c => c + 1)
  }

  // Show error state with retry option
  if (hasFailed) {
    return (
      <div className={className}>
        <div className="min-h-[65px] flex flex-col items-center justify-center gap-2 border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-white/50 text-xs font-mono text-center">
            Verification unavailable
          </p>
          {retryCount >= 2 ? (
            <p className="text-white/30 text-[10px] font-mono text-center max-w-[250px]">
              Try disabling ad blockers or using a different browser
            </p>
          ) : null}
          <button
            type="button"
            onClick={handleRetry}
            className="text-primary text-xs font-mono hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div ref={containerRef} />
      {!isLoaded && (
        <div className="h-[65px] flex items-center justify-center text-white/30 text-xs font-mono">
          Loading verification...
        </div>
      )}
    </div>
  )
}

// Server-side verification helper
export async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY

  // Accept bypass tokens when Turnstile is not configured
  if (token === "bypass-not-configured" || token === "dev-bypass-token") {
    if (!secretKey) {
      return true // Allow when Turnstile isn't set up
    }
    // If secret key IS configured but client sent bypass, reject
    console.warn("Bypass token received but Turnstile is configured")
    return false
  }

  if (!secretKey) {
    console.warn("Turnstile secret key not configured")
    return true // Allow when not configured
  }

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: secretKey,
          response: token,
        }),
      }
    )

    const data = await res.json()
    return data.success === true
  } catch (error) {
    console.error("Turnstile verification error:", error)
    return false
  }
}
