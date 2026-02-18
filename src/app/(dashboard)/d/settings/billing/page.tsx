"use client"

import { Sparkles, Check, CreditCard } from "lucide-react"

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

export default function BillingPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-mono font-bold tracking-tight">BILLING</h1>
        <p className="text-white/40 text-sm font-mono mt-1">Subscription & payments</p>
      </div>

      {/* Current Plan */}
      <div className="border border-[#ff1493]/30 bg-white/[0.02]">
        <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between">
          <span className="text-[10px] font-mono text-white/40 tracking-widest">CURRENT PLAN</span>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[#ff1493]" />
            <span className="text-[10px] font-mono text-[#ff1493]">BETA</span>
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
                <Check className="w-3.5 h-3.5 text-[#ff1493]" />
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
    </div>
  )
}
