"use client"

import { useAftys } from "./AftysProvider"
import { X, Send, Sparkles, Loader2 } from "lucide-react"
import { useEffect, useRef, FormEvent } from "react"

export function AftysChat() {
  const {
    isOpen,
    closeChat,
    messages,
    input,
    setInput,
    sendMessage,
    isLoading,
    isBetaEnabled,
    isHydrated,
  } = useAftys()

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      sendMessage(input)
    }
  }

  // Don't render until hydrated to avoid hydration mismatch
  if (!isHydrated || !isBetaEnabled || !isOpen) return null

  return (
    <div className="fixed bottom-4 right-4 w-[380px] h-[500px] bg-black border border-white/10 shadow-2xl flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff1493] to-[#ff1493]/50 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-mono text-sm font-medium">AFTYS</div>
            <div className="text-[10px] text-white/40">AI Assistant</div>
          </div>
        </div>
        <button
          onClick={closeChat}
          className="p-1.5 hover:bg-white/5 transition-colors"
        >
          <X className="w-4 h-4 text-white/50" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-white/40 text-sm mt-8">
            <Sparkles className="w-8 h-8 mx-auto mb-3 text-[#ff1493]/50" />
            <p className="font-mono">Hey, I&apos;m Aftys</p>
            <p className="text-xs mt-1">Ask me anything about events</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] px-3 py-2 text-sm ${
                  message.role === "user"
                    ? "bg-[#ff1493]/20 text-white"
                    : "bg-white/5 text-white/90"
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
              </div>
            </div>
          ))
        )}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start">
            <div className="bg-white/5 px-3 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#ff1493]" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-white/10">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Aftys..."
            className="flex-1 h-10 px-3 bg-white/5 border border-white/10 text-white font-mono text-sm placeholder:text-white/30 focus:border-[#ff1493]/50 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="h-10 w-10 flex items-center justify-center bg-[#ff1493] hover:bg-[#ff1493]/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  )
}
