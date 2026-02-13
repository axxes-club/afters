"use client"

import { useAftys } from "./AftysProvider"
import { useEffect, useRef, FormEvent } from "react"
import { Sparkles, Send, Loader2 } from "lucide-react"

export function AftysCommandPalette() {
  const {
    isCommandPaletteOpen,
    closeCommandPalette,
    openChat,
    input,
    setInput,
    sendMessage,
    isLoading,
    isBetaEnabled,
  } = useAftys()

  const inputRef = useRef<HTMLInputElement>(null)

  // Handle keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Escape to close
      if (e.key === "Escape" && isCommandPaletteOpen) {
        closeCommandPalette()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isCommandPaletteOpen, closeCommandPalette])

  // Focus input when opened
  useEffect(() => {
    if (isCommandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 10)
    }
  }, [isCommandPaletteOpen])

  if (!isBetaEnabled || !isCommandPaletteOpen) return null

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      // Submit the message and switch to chat view
      sendMessage(input)
      openChat()
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={closeCommandPalette}
      />

      {/* Command palette */}
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg z-50">
        <div className="bg-black border border-white/10 shadow-2xl">
          <form onSubmit={handleFormSubmit}>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff1493] to-[#ff1493]/50 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Aftys anything..."
                className="flex-1 bg-transparent text-white font-mono text-sm placeholder:text-white/30 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="h-8 w-8 flex items-center justify-center bg-[#ff1493] hover:bg-[#ff1493]/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Send className="w-3 h-3" />
                )}
              </button>
            </div>
          </form>

          {/* Quick actions */}
          <div className="p-3 space-y-1">
            <button
              onClick={() => {
                setInput("Create a new event for ")
                inputRef.current?.focus()
              }}
              className="w-full px-3 py-2 text-left text-sm text-white/60 hover:bg-white/5 hover:text-white transition-colors"
            >
              <span className="text-white/30 mr-2">&gt;</span>
              Create a new event...
            </button>
            <button
              onClick={() => {
                setInput("Help me write a description for ")
                inputRef.current?.focus()
              }}
              className="w-full px-3 py-2 text-left text-sm text-white/60 hover:bg-white/5 hover:text-white transition-colors"
            >
              <span className="text-white/30 mr-2">&gt;</span>
              Write event description...
            </button>
            <button
              onClick={() => {
                setInput("What features does AFTERS have?")
                inputRef.current?.focus()
              }}
              className="w-full px-3 py-2 text-left text-sm text-white/60 hover:bg-white/5 hover:text-white transition-colors"
            >
              <span className="text-white/30 mr-2">&gt;</span>
              Platform help...
            </button>
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2 border-t border-white/5 text-[10px] text-white/30 font-mono">
            Press ESC to close
          </div>
        </div>
      </div>
    </>
  )
}

// Keyboard listener component to be added to the provider
export function AftysKeyboardListener() {
  const { openCommandPalette, isCommandPaletteOpen, isOpen, isBetaEnabled } = useAftys()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Only handle Cmd+K if beta is enabled
      if (isBetaEnabled && (e.metaKey || e.ctrlKey) && e.key === "k" && !isCommandPaletteOpen && !isOpen) {
        e.preventDefault()
        openCommandPalette()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [openCommandPalette, isCommandPaletteOpen, isOpen, isBetaEnabled])

  return null
}
