"use client"

import { useAftys } from "./AftysProvider"
import { Sparkles } from "lucide-react"

export function AftysTrigger() {
  const { isOpen, toggleChat } = useAftys()

  if (isOpen) return null

  return (
    <button
      onClick={toggleChat}
      className="fixed bottom-4 right-4 w-12 h-12 rounded-full bg-gradient-to-br from-[#ff1493] to-[#ff1493]/70 shadow-lg shadow-[#ff1493]/20 flex items-center justify-center hover:scale-105 transition-transform z-50"
    >
      <Sparkles className="w-5 h-5 text-white" />
    </button>
  )
}
