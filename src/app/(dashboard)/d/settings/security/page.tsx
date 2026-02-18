"use client"

import { Button } from "@/components/ui/button"
import { Shield, Key, Smartphone, Lock, ExternalLink, Check } from "lucide-react"

const SECURITY_TIPS = [
  "Use a strong, unique password for your account",
  "Enable two-factor authentication when available",
  "Never share your API keys publicly",
  "Revoke unused API keys regularly",
  "Review active sessions periodically",
]

export default function SecurityPage() {
  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden border border-white/10 bg-gradient-to-br from-green-900/10 via-black to-emerald-900/10">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(45deg, rgba(34,197,94,0.05) 0, rgba(34,197,94,0.05) 1px, transparent 0, transparent 50%)`,
            backgroundSize: '10px 10px'
          }} />
        </div>
        
        <div className="relative p-8 md:p-12">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="font-headline text-4xl md:text-5xl tracking-wide">
                SECURITY<span className="text-green-400">.</span>
              </h1>
              <p className="text-white/40 font-mono text-sm mt-2">AUTHENTICATION & ACCESS</p>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Status */}
      <div className="border border-white/10 bg-white/[0.02]">
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
          <Lock className="w-4 h-4 text-green-400" />
          <h2 className="font-mono text-xs tracking-widest text-white/40">AUTHENTICATION</h2>
        </div>
        
        <div className="divide-y divide-white/5">
          {/* Password */}
          <div className="p-5 flex items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Key className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h3 className="font-medium text-white">Password</h3>
                <p className="text-sm text-white/40">Managed via your authentication provider</p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild className="gap-1.5">
              <a href="https://accounts.clerk.dev/user" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3 h-3" />
                Manage
              </a>
            </Button>
          </div>

          {/* 2FA */}
          <div className="p-5 flex items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-white/40" />
              </div>
              <div>
                <h3 className="font-medium text-white">Two-Factor Authentication</h3>
                <p className="text-sm text-white/40">Add extra security to your account</p>
              </div>
            </div>
            <span className="text-xs font-mono px-2 py-1 bg-white/5 text-white/40">VIA CLERK</span>
          </div>
        </div>
      </div>

      {/* Sessions */}
      <div className="border border-white/10 bg-white/[0.02]">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-4 h-4 text-white/30" />
            <h2 className="font-mono text-xs tracking-widest text-white/40">ACTIVE SESSIONS</h2>
          </div>
        </div>
        
        <div className="p-6 text-center">
          <p className="text-white/40 text-sm mb-4">
            View and manage your active sessions through Clerk
          </p>
          <Button variant="outline" size="sm" asChild className="gap-1.5">
            <a href="https://accounts.clerk.dev/user" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3 h-3" />
              Manage Sessions
            </a>
          </Button>
        </div>
      </div>

      {/* Security Tips */}
      <div className="border border-green-500/20 bg-green-500/5">
        <div className="p-4 border-b border-green-500/20">
          <h2 className="font-mono text-xs tracking-widest text-green-400/60">SECURITY BEST PRACTICES</h2>
        </div>
        <div className="p-6">
          <ul className="space-y-3">
            {SECURITY_TIPS.map((tip, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-green-400" />
                </div>
                <span className="text-green-200/70 text-sm">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* API Security Note */}
      <div className="border border-white/10 bg-white/[0.02] p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
            <Key className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-medium text-white mb-1">API Key Security</h3>
            <p className="text-sm text-white/50">
              Your API keys provide full access to your account. Never commit them to public repositories 
              or share them in client-side code. Use environment variables to store them securely.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
