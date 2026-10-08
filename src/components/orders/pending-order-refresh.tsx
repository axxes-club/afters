"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

/** Refresh the signed confirmation URL until Stripe's webhook issues tickets. */
export function PendingOrderRefresh({ pending }: { pending: boolean }) {
  const { refresh } = useRouter()
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    if (!pending) return
    let attempts = 0
    const interval = setInterval(() => {
      refresh()
      if (++attempts >= 60) {
        clearInterval(interval)
        setTimedOut(true)
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [pending, refresh])

  if (!pending || !timedOut) return null
  return (
    <div className="mt-3 text-sm text-white/50">
      <p>Payment confirmation is taking longer than usual. Your tickets will appear here when it completes.</p>
      <button type="button" className="mt-2 underline" onClick={() => refresh()}>
        Check payment status
      </button>
    </div>
  )
}
