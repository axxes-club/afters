"use client"

import { Suspense, useCallback, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Check, Landmark, Loader2, AlertCircle } from "lucide-react"
import { toast } from "sonner"

type Status = {
  connected: boolean
  detailsSubmitted: boolean
  chargesEnabled: boolean
  payoutsEnabled: boolean
  requirementsDue: string[]
  disabledReason: string | null
  isOwner: boolean
}

/**
 * Settings → Payouts. Where an organizer connects the bank account their ticket
 * money goes to. The organizer only ever sees afters and Stripe's one-time
 * verification form; there is no separate Stripe dashboard to learn.
 */
function Payouts() {
  const params = useSearchParams()
  const [status, setStatus] = useState<Status | null>(null)
  const [loading, setLoading] = useState(true)
  const [opening, setOpening] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/stripe/connect/status", { cache: "no-store" })
      setStatus(res.ok ? await res.json() : null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (params.get("onboarding") === "done") toast.success("Details saved. Stripe may take a moment to confirm them.")
  }, [params])

  async function openSetup() {
    setOpening(true)
    try {
      const res = await fetch("/api/stripe/connect/onboarding", { method: "POST" })
      const body = await res.json().catch(() => null)
      if (!res.ok || !body?.url) throw new Error(body?.message || "Couldn't open payout setup")
      window.location.assign(body.url)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't open payout setup")
      setOpening(false)
    }
  }

  const ready = Boolean(status?.chargesEnabled && status?.payoutsEnabled)
  const canSell = Boolean(status?.chargesEnabled)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-mono font-bold tracking-tight">PAYOUTS</h1>
        <p className="text-white/40 text-sm font-mono mt-1">Where your ticket money goes</p>
      </div>

      <div className="border border-white/10 bg-white/[0.02]">
        <div className="px-4 py-2 border-b border-white/10">
          <span className="text-[10px] font-mono text-white/40 tracking-widest">STATUS</span>
        </div>
        <div className="p-4">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-white/30" />
          ) : !status ? (
            <p className="text-sm font-mono text-white/50">Couldn&apos;t read payout status. Reload to try again.</p>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 flex items-center justify-center ${ready ? "bg-green-500/10" : "bg-primary/10"}`}>
                  {ready ? <Check className="w-4 h-4 text-green-400" /> : canSell ? <AlertCircle className="w-4 h-4 text-primary" /> : <Landmark className="w-4 h-4 text-primary" />}
                </div>
                <div>
                  <p className="text-sm font-mono">
                    {ready
                      ? "Ready. Paid tickets are on sale and payouts go to your bank."
                      : canSell
                        ? "You can sell paid tickets. Stripe needs a little more before paying out."
                        : status.detailsSubmitted
                          ? "Stripe is reviewing your details."
                          : status.connected
                            ? "Setup isn't finished yet."
                            : "Not set up. Free tickets work; paid tickets need this."}
                  </p>
                  {status.requirementsDue.length > 0 && (
                    <p className="text-xs text-white/40 mt-1">
                      Stripe still needs {status.requirementsDue.length} detail{status.requirementsDue.length === 1 ? "" : "s"} from you.
                    </p>
                  )}
                </div>
              </div>
              {status.isOwner ? (
                <button
                  onClick={openSetup}
                  disabled={opening}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-black text-xs font-mono font-bold tracking-wider hover:bg-primary/90 disabled:opacity-60"
                >
                  {opening && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {!status.connected ? "SET UP PAYOUTS" : status.detailsSubmitted && status.requirementsDue.length === 0 ? "UPDATE BANK OR DETAILS" : "FINISH SETUP"}
                </button>
              ) : (
                <p className="text-xs font-mono text-white/40">Only the organizer&apos;s owner can change payouts.</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="border border-white/10 bg-white/[0.02]">
        <div className="px-4 py-2 border-b border-white/10">
          <span className="text-[10px] font-mono text-white/40 tracking-widest">HOW IT WORKS</span>
        </div>
        <ul className="p-4 space-y-2 text-xs font-mono text-white/50">
          <li>Setup is a one-time identity and bank form, required by law. It takes a few minutes.</li>
          <li>Buyers pay the ticket price plus an afters service fee (10% + $0.99 per ticket).</li>
          <li>Stripe&apos;s card processing fee comes out of the ticket price. The rest is yours.</li>
          <li>Stripe pays out to your bank automatically. Refunds and card disputes come out of your balance, like any card payment.</li>
        </ul>
      </div>
    </div>
  )
}

export default function PayoutsPage() {
  return (
    <Suspense>
      <Payouts />
    </Suspense>
  )
}
