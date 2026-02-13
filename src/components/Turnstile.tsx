"use client"

import { useEffect, useRef, useState } from "react"

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
        // In development without key, auto-verify
        if (process.env.NODE_ENV === "development") {
          onVerify("dev-bypass-token")
        }
        return
      }

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey,
        callback: onVerify,
        "error-callback": onError,
        "expired-callback": onExpire,
        theme: "dark",
        size: "normal",
      })
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
      document.head.appendChild(script)
    } else if (window.turnstile) {
      setIsLoaded(true)
      renderWidget()
    } else {
      // Script exists but not loaded yet
      script.onload = () => {
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
  }, [onVerify, onError, onExpire])

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

  if (!secretKey) {
    // In development without key, accept bypass token
    if (process.env.NODE_ENV === "development" && token === "dev-bypass-token") {
      return true
    }
    console.warn("Turnstile secret key not configured")
    return true // Allow in development
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
