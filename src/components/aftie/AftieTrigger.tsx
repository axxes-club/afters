"use client"

import { useAftie } from "./AftieProvider"
import { Sparkles } from "lucide-react"

export function AftieTrigger() {
  const { isOpen, toggleChat, isHydrated, setupStatus } = useAftie()

  // Don't render until hydrated to avoid hydration mismatch
  // Hide in production, when chat is open, or when user doesn't have profile
  // Hide when Aftie AI is disabled (isSetup = false)
  if (process.env.NODE_ENV === "production") return null
  if (!isHydrated || !setupStatus?.hasProfile || !setupStatus?.isSetup || isOpen) return null

  return (
    <button
      onClick={toggleChat}
      className="fixed bottom-4 right-4 md:bottom-6 md:right-6 w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#ff1493] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform duration-200 z-50"
      aria-label="Open Aftie AI Assistant"
    >
      <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-white" />
    </button>
  )
}
