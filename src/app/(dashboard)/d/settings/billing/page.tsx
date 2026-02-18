"use client"

import { CreditCard, Sparkles, Check, Zap } from "lucide-react"

const BETA_FEATURES = [
  "Unlimited events",
  "Unlimited ticket sales",
  "Aftie AI assistant",
  "Real-time analytics",
  "QR code scanners",
  "Guestlist management",
  "Custom event pages",
  "Email notifications",
]

export default function BillingPage() {
  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden border border-white/10 bg-gradient-to-br from-amber-900/10 via-black to-orange-900/10">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0" style={{
            backgroundImage: `conic-gradient(from 180deg at 50% 50%, rgba(245,158,11,0.05) 0deg, transparent 60deg, rgba(245,158,11,0.05) 120deg, transparent 180deg, rgba(245,158,11,0.05) 240deg, transparent 300deg, rgba(245,158,11,0.05) 360deg)`,
          }} />
        </div>
        
        <div className="relative p-8 md:p-12">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <CreditCard className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="font-headline text-4xl md:text-5xl tracking-wide">
                BILLING<span className="text-amber-400">.</span>
              </h1>
              <p className="text-white/40 font-mono text-sm mt-2">SUBSCRIPTION & PAYMENTS</p>
            </div>
          </div>
        </div>
      </div>

      {/* Current Plan */}
      <div className="border-2 border-[#ff1493]/30 bg-gradient-to-br from-[#ff1493]/5 to-transparent relative overflow-hidden">
        {/* Animated glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#ff1493]/20 rounded-full blur-3xl" />
        
        <div className="p-4 border-b border-[#ff1493]/20 flex items-center justify-between relative">
          <h2 className="font-mono text-xs tracking-widest text-[#ff1493]/60">CURRENT PLAN</h2>
          <div className="flex items-center gap-2 px-3 py-1 bg-[#ff1493]/20 rounded-full">
            <Sparkles className="w-3 h-3 text-[#ff1493]" />
            <span className="text-xs font-mono text-[#ff1493]">BETA ACCESS</span>
          </div>
        </div>
        
        <div className="p-8 relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-headline text-6xl text-white">$0</span>
                <span className="text-white/40 font-mono">/month</span>
              </div>
              <p className="text-white/50 mt-2">Free during beta • No credit card required</p>
            </div>
            <div className="px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full inline-flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-sm font-mono">ACTIVE</span>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {BETA_FEATURES.map((feature, i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <div className="w-5 h-5 rounded-full bg-[#ff1493]/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-[#ff1493]" />
                </div>
                <span className="text-white/70 text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* What's Coming */}
      <div className="border border-white/10 bg-white/[0.02]">
        <div className="p-4 border-b border-white/10">
          <h2 className="font-mono text-xs tracking-widest text-white/40">WHAT&apos;S COMING</h2>
        </div>
        <div className="p-6">
          <p className="text-white/50 text-sm mb-6">
            We&apos;re building something special. When we launch paid plans, you&apos;ll get early access perks 
            as a beta user. We&apos;ll notify you before any changes.
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: Zap, title: "Pro Tools", desc: "Advanced analytics & insights" },
              { icon: CreditCard, title: "Payments", desc: "Accept credit cards & more" },
              { icon: Sparkles, title: "AI Pro", desc: "Enhanced Aftie capabilities" },
            ].map((item, i) => (
              <div key={i} className="p-4 bg-white/[0.02] border border-white/5 rounded-lg">
                <item.icon className="w-5 h-5 text-white/30 mb-3" />
                <h3 className="font-mono text-xs tracking-wider text-white mb-1">{item.title}</h3>
                <p className="text-white/30 text-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="border border-white/10 bg-white/[0.02]">
        <div className="p-4 border-b border-white/10">
          <h2 className="font-mono text-xs tracking-widest text-white/40">PAYMENT METHODS</h2>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <CreditCard className="w-8 h-8 text-white/20" />
          </div>
          <p className="text-white/40 font-mono text-sm mb-1">No payment required</p>
          <p className="text-white/20 text-xs">Payment setup will be available when beta ends</p>
        </div>
      </div>
    </div>
  )
}
