"use client"

import { Button } from "@/components/ui/button"
import { Shield, Key, Smartphone, ExternalLink, Check } from "lucide-react"

const SECURITY_TIPS = [
  "Use a strong, unique password",
  "Enable two-factor authentication",
  "Never share your API keys publicly",
  "Revoke unused API keys",
]

export default function SecurityPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-mono font-bold tracking-tight">SECURITY</h1>
        <p className="text-white/40 text-sm font-mono mt-1">Authentication & access</p>
      </div>

      {/* Auth Status */}
      <div className="border border-white/10 bg-white/[0.02]">
        <div className="px-4 py-2 border-b border-white/10">
          <span className="text-[10px] font-mono text-white/40 tracking-widest">AUTHENTICATION</span>
        </div>
        <div className="divide-y divide-white/5">
          {/* Password */}
          <div className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center bg-white/5">
                <Key className="w-4 h-4 text-white/40" />
              </div>
              <div>
                <p className="text-sm font-mono">Password</p>
                <p className="text-xs text-white/40">Managed via Clerk</p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild className="text-xs">
              <a href="https://accounts.clerk.dev/user" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3 h-3 mr-1.5" />
                Manage
              </a>
            </Button>
          </div>

          {/* 2FA */}
          <div className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center bg-white/5">
                <Smartphone className="w-4 h-4 text-white/40" />
              </div>
              <div>
                <p className="text-sm font-mono">Two-Factor Auth</p>
                <p className="text-xs text-white/40">Extra account security</p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-white/30 px-2 py-1 bg-white/5">VIA CLERK</span>
          </div>
        </div>
      </div>

      {/* Sessions */}
      <div className="border border-white/10 bg-white/[0.02]">
        <div className="px-4 py-2 border-b border-white/10">
          <span className="text-[10px] font-mono text-white/40 tracking-widest">SESSIONS</span>
        </div>
        <div className="p-4 flex items-center justify-between gap-4">
          <p className="text-sm text-white/40">Manage active sessions via Clerk</p>
          <Button variant="outline" size="sm" asChild className="text-xs">
            <a href="https://accounts.clerk.dev/user" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3 h-3 mr-1.5" />
              View
            </a>
          </Button>
        </div>
      </div>

      {/* Tips */}
      <div className="border border-white/10 bg-white/[0.02]">
        <div className="px-4 py-2 border-b border-white/10 flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-white/30" />
          <span className="text-[10px] font-mono text-white/40 tracking-widest">BEST PRACTICES</span>
        </div>
        <div className="p-4 space-y-2">
          {SECURITY_TIPS.map((tip, i) => (
            <div key={i} className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-[#ff1493]" />
              <span className="text-sm text-white/60">{tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
