"use client"

import { useAftie } from "./AftieProvider"
import { Sparkles, Shield, Zap, Calendar, BarChart3, Loader2, X } from "lucide-react"

export function AftieConsentDialog() {
  const {
    isConsentDialogOpen,
    closeConsentDialog,
    approveAftie,
    isApproving,
    isHydrated,
    setupStatus,
  } = useAftie()

  // Don't render until hydrated and dialog is open
  if (!isHydrated || !isConsentDialogOpen) return null

  // If user doesn't have a profile, show different message
  if (!setupStatus?.hasProfile) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="w-full max-w-md bg-black border border-white/10 rounded-lg shadow-2xl p-6 mx-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff1493] to-[#ff1493]/50 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-mono font-bold text-lg">AFTIE</h2>
                <p className="text-xs text-white/50">AI Assistant</p>
              </div>
            </div>
            <button
              onClick={closeConsentDialog}
              className="p-1.5 hover:bg-white/5 transition-colors rounded"
            >
              <X className="w-5 h-5 text-white/50" />
            </button>
          </div>

          <div className="text-center py-6">
            <p className="text-white/70 mb-4">
              Complete your organizer profile to use Aftie.
            </p>
            <a
              href="/b"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#ff1493] hover:bg-[#ff1493]/80 text-white font-mono text-sm rounded transition-colors"
            >
              Complete Profile
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-black border border-white/10 rounded-lg shadow-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff1493] to-[#ff1493]/50 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-mono font-bold text-xl">Meet Aftie</h2>
              <p className="text-xs text-white/50">Your AI Event Assistant</p>
            </div>
          </div>
          <button
            onClick={closeConsentDialog}
            className="p-1.5 hover:bg-white/5 transition-colors rounded"
          >
            <X className="w-5 h-5 text-white/50" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <p className="text-white/70 text-sm leading-relaxed">
            Aftie is an AI assistant that can help you create events, manage tickets,
            and run your business more efficiently. To do this, Aftie needs permission
            to act on your behalf.
          </p>

          {/* Capabilities */}
          <div className="space-y-3">
            <p className="text-xs font-mono text-white/40 tracking-wider">WHAT AFTIE CAN DO</p>
            <div className="grid gap-2">
              <div className="flex items-start gap-3 p-3 bg-white/5 rounded border border-white/10">
                <Calendar className="w-5 h-5 text-[#ff1493] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Create & Manage Events</p>
                  <p className="text-xs text-white/50">Create events, update details, publish and unpublish</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-white/5 rounded border border-white/10">
                <BarChart3 className="w-5 h-5 text-[#ff1493] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">View Analytics</p>
                  <p className="text-xs text-white/50">Check ticket sales, check-ins, and revenue</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-white/5 rounded border border-white/10">
                <Zap className="w-5 h-5 text-[#ff1493] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Write Content</p>
                  <p className="text-xs text-white/50">Help write event descriptions, titles, and more</p>
                </div>
              </div>
            </div>
          </div>

          {/* Security note */}
          <div className="flex items-start gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded">
            <Shield className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-300">Secure Access</p>
              <p className="text-xs text-green-300/70">
                An API key will be created for Aftie. You can revoke access anytime
                from Settings &gt; Developers.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 p-4 border-t border-white/10 bg-white/[0.02]">
          <button
            onClick={closeConsentDialog}
            className="flex-1 px-4 py-2.5 border border-white/20 text-white/70 hover:text-white hover:border-white/40 font-mono text-sm rounded transition-all"
          >
            Not Now
          </button>
          <button
            onClick={approveAftie}
            disabled={isApproving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#ff1493] hover:bg-[#ff1493]/80 disabled:opacity-50 text-white font-mono text-sm rounded transition-all"
          >
            {isApproving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Setting up...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Enable Aftie
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
