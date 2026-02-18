"use client"

import { useAftie } from "./AftieProvider"
import { Sparkles } from "lucide-react"

export function AftieTrigger() {
  const { isOpen, toggleChat, isHydrated, setupStatus } = useAftie()

  // Don't render until hydrated to avoid hydration mismatch
  // Show for users with organizer profile (setupStatus.hasProfile)
  // The consent dialog will handle first-time setup
  if (process.env.NODE_ENV === "production") return null
  if (!isHydrated || !setupStatus?.hasProfile || isOpen) return null

  return (
    <button
      onClick={toggleChat}
      className="fixed bottom-4 right-4 w-14 h-14 rounded-full bg-gradient-to-br from-[#ff1493] to-[#ff1493]/60 shadow-xl shadow-[#ff1493]/30 flex items-center justify-center hover:scale-110 hover:shadow-[#ff1493]/50 active:scale-95 transition-all duration-200 z-50 group"
      aria-label="Open Aftie AI Assistant"
    >
      <Sparkles className="w-6 h-6 text-white group-hover:animate-pulse" />
      {/* Subtle pulse ring */}
      <span className="absolute inset-0 rounded-full bg-[#ff1493]/20 animate-ping opacity-75" style={{ animationDuration: '2s' }} />
    </button>
  )
}
