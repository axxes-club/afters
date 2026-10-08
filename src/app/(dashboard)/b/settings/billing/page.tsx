"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Sparkles, Check, CreditCard, Crown } from "lucide-react"

const BETA_FEATURES = [
  "Unlimited events",
  "Unlimited tickets",
  "Aftie AI assistant",
  "Real-time analytics",
  "QR code scanners",
  "Guestlist management",
  "Custom event pages",
  "Email notifications",
]

type Status = {
  plan: string
  status: string
  label: string
  isSignature: boolean
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  salesOpen: boolean
}

const SIGNATURE_OPTIONS = [
  { plan: "SIGNATURE_30D", price: "$45", period: "/month", note: "7-day free trial for new organizers" },
  { plan: "SIGNATURE_180D", price: "$225", period: "/6 months", note: "$37.50 a month" },
  { plan: "SIGNATURE_360D", price: "$396", period: "/year", note: "$33 a month" },
]

const RETURN_MESSAGES: Record<string, string> = {
  success: "Payment confirmed. Signature is active.",
  processing: "Your payment is still being confirmed. This page updates once it clears.",
  incomplete: "Checkout was not completed. You have not been charged.",
}

// Signature is paid through AXXES Payments (payments.axxes.app). Purchase options appear only
// when the owner opens sales (AFTERS_SIGNATURE_SALES=on); until then afters.am stays free in beta.
function SignatureBilling() {
  const params = useSearchParams()
  const [status, setStatus] = useState<Status | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const returned = params.get("subscription")

  useEffect(() => {
    fetch("/api/stripe/subscription").then((r) => (r.ok ? r.json() : null)).then(setStatus).catch(() => setStatus(null))
  }, [])

  async function go(path: string, body?: object, key = path) {
    setBusy(key)
    setError(null)
    try {
      const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body ?? {}) })
      const data = await response.json()
      if (!response.ok || !data.url) throw new Error(data.error || "Something went wrong")
      window.location.href = data.url
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
      setBusy(null)
    }
  }

  if (!status) return null
  if (!status.salesOpen && !status.isSignature) return <BetaPlan />
  const manageable = status.isSignature && ["SIGNATURE_30D", "SIGNATURE_180D", "SIGNATURE_360D", "SIGNATURE_TRIAL_7D"].includes(status.plan)
  return (
    <>
      {returned && RETURN_MESSAGES[returned] && (
        <p role="status" className="border border-white/10 bg-white/[0.02] px-4 py-3 text-sm font-mono text-white/70">{RETURN_MESSAGES[returned]}</p>
      )}
      {error && <p role="alert" className="text-sm font-mono text-red-400">{error}</p>}
      {manageable && (
        <div className="border border-primary/30 bg-white/[0.02]">
          <div className="px-4 py-2 border-b border-white/10 flex items-center gap-1.5">
            <Crown className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-mono text-white/40 tracking-widest">SUBSCRIPTION</span>
          </div>
          <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-mono font-bold">{status.label}</p>
              {status.currentPeriodEnd && (
                <p className="text-sm text-white/40 mt-1">
                  {status.cancelAtPeriodEnd ? "Ends" : "Renews"} {new Date(status.currentPeriodEnd).toLocaleDateString()}
                  {status.status === "PAST_DUE" && " · Payment failed, update your card"}
                </p>
              )}
            </div>
            <button
              onClick={() => go("/api/stripe/subscription/cancel")}
              disabled={busy !== null}
              className="border border-white/20 px-4 py-2 text-sm font-mono hover:bg-white/5 disabled:opacity-50"
            >
              {busy ? "Opening…" : "Manage subscription"}
            </button>
          </div>
        </div>
      )}
      {!status.isSignature && status.salesOpen && (
        <p className="text-sm font-mono text-white/50">Current plan: Free</p>
      )}
      {!status.isSignature && status.salesOpen && (
        <div className="border border-white/10 bg-white/[0.02]">
          <div className="px-4 py-2 border-b border-white/10">
            <span className="text-[10px] font-mono text-white/40 tracking-widest">AFTERS SIGNATURE</span>
          </div>
          <div className="p-4 grid sm:grid-cols-3 gap-3">
            {SIGNATURE_OPTIONS.map((o) => (
              <div key={o.plan} className="border border-white/10 p-4 flex flex-col gap-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-mono font-bold">{o.price}</span>
                  <span className="text-white/40 font-mono text-xs">{o.period}</span>
                </div>
                <p className="text-xs text-white/40">{o.note}</p>
                <button
                  onClick={() => go("/api/stripe/subscription", { plan: o.plan }, o.plan)}
                  disabled={busy !== null}
                  className="mt-auto bg-primary text-primary-foreground px-4 py-2 text-sm font-mono disabled:opacity-50"
                >
                  {busy === o.plan ? "Opening checkout…" : "Choose"}
                </button>
              </div>
            ))}
          </div>
          <p className="px-4 pb-4 text-xs text-white/30">Payments are processed by AXXES Payments.</p>
        </div>
      )}
    </>
  )
}

/** Shown while Signature sales are closed: afters.am is free in beta. */
function BetaPlan() {
  return (
    <>
      {/* Current Plan */}
      <div className="border border-primary/30 bg-white/[0.02]">
        <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between">
          <span className="text-[10px] font-mono text-white/40 tracking-widest">CURRENT PLAN</span>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-mono text-primary">BETA</span>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-4xl font-mono font-bold">$0</span>
            <span className="text-white/40 font-mono text-sm">/month</span>
          </div>
          <p className="text-sm text-white/40 mb-6">Free during beta • No credit card required</p>

          <div className="grid sm:grid-cols-2 gap-2">
            {BETA_FEATURES.map((feature, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5">
                <Check className="w-3.5 h-3.5 text-primary" />
                <span className="text-sm text-white/60">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* What's Coming */}
      <div className="border border-white/10 bg-white/[0.02]">
        <div className="px-4 py-2 border-b border-white/10">
          <span className="text-[10px] font-mono text-white/40 tracking-widest">COMING SOON</span>
        </div>
        <div className="p-4">
          <p className="text-sm text-white/40">
            We&apos;ll notify you before any pricing changes. Beta users get early access perks.
          </p>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="border border-white/10 bg-white/[0.02]">
        <div className="px-4 py-2 border-b border-white/10">
          <span className="text-[10px] font-mono text-white/40 tracking-widest">PAYMENT METHODS</span>
        </div>
        <div className="p-12 text-center">
          <CreditCard className="w-8 h-8 mx-auto text-white/10 mb-3" />
          <p className="text-white/40 font-mono text-sm">No payment required</p>
          <p className="text-white/20 text-xs mt-1">Available when beta ends</p>
        </div>
      </div>
    </>
  )
}

export default function BillingPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-mono font-bold tracking-tight">BILLING</h1>
        <p className="text-white/40 text-sm font-mono mt-1">Subscription & payments</p>
      </div>

      <Suspense fallback={null}>
        <SignatureBilling />
      </Suspense>

    </div>
  )
}
