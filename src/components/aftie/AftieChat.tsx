"use client"

import { useAftie } from "./AftieProvider"
import { X, Send, Sparkles, Loader2, MessageSquare, ExternalLink, CheckCircle } from "lucide-react"
import { useEffect, useRef, useMemo, FormEvent } from "react"
import Link from "next/link"

// Clean up message content by removing raw tool call markup
// Some models output tool calls as XML-like text instead of structured calls
function cleanMessageContent(content: string): string {
  // Remove <function(...)>...</function> blocks
  let cleaned = content.replace(/<function\([^)]*\)=[^<]*<\/function>/g, '')
  
  // Remove tool call JSON blocks that might appear
  cleaned = cleaned.replace(/\{"tool_call":[^}]+\}/g, '')
  
  // Clean up any leftover fragments
  cleaned = cleaned.replace(/<function\([^)]*\)=[^}]*\}?/g, '')
  
  // Remove multiple consecutive newlines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n')
  
  return cleaned.trim()
}

// Parse message content to extract action links
function parseMessageForLinks(content: string) {
  const dashboardUrlMatch = content.match(/\/d\/events\/([a-zA-Z0-9]+)/)
  const publicUrlMatch = content.match(/\/e\/([a-zA-Z0-9-]+)/)
  
  const contentLower = content.toLowerCase()
  const isSuccess = contentLower.includes("created") || 
                   contentLower.includes("published") ||
                   contentLower.includes("updated")
  
  return {
    dashboardUrl: dashboardUrlMatch?.[0],
    publicUrl: publicUrlMatch?.[0],
    isSuccess,
    hasLinks: !!(dashboardUrlMatch || publicUrlMatch),
  }
}

export function AftieChat() {
  const {
    isOpen,
    closeChat,
    messages,
    input,
    setInput,
    sendMessage,
    isLoading,
    isHydrated,
    pageContext,
    lastAction,
  } = useAftie()

  // Get context-aware example prompts
  const examplePrompts = useMemo(() => {
    if (pageContext.page === "event-details" && pageContext.eventTitle) {
      return [
        { label: "Ticket sales", prompt: "How many tickets have we sold?" },
        { label: "Check-ins", prompt: "How many people have checked in?" },
        { label: "Publish", prompt: "Publish this event" },
      ]
    }
    if (pageContext.page === "events") {
      return [
        { label: "Create event", prompt: "Create a new event called Summer Vibes at The Warehouse, 123 Main St, NYC on March 15th 2025 at 10pm" },
        { label: "My events", prompt: "Show me my upcoming events" },
        { label: "Drafts", prompt: "Show me my draft events" },
      ]
    }
    return [
      { label: "Create event", prompt: "Create a new event" },
      { label: "My events", prompt: "Show me my events" },
      { label: "Help", prompt: "What can you help me with?" },
    ]
  }, [pageContext])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      sendMessage(input)
    }
  }

  // Don't render until hydrated and open
  if (!isHydrated || !isOpen) return null

  return (
    <div className="fixed bottom-4 right-4 w-[400px] h-[520px] bg-black border border-white/10 shadow-2xl flex flex-col z-50 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-mono text-sm font-medium">AFTIE</div>
            <div className="text-[10px] text-white/40">AI Assistant</div>
          </div>
        </div>
        <button
          onClick={closeChat}
          className="p-1.5 hover:bg-white/5 transition-colors rounded"
        >
          <X className="w-4 h-4 text-white/50" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-white/40 text-sm mt-4">
            <Sparkles className="w-8 h-8 mx-auto mb-3 text-primary/50" />
            <p className="font-mono">Hey, I&apos;m Aftie</p>
            <p className="text-xs mt-1 mb-6">Your AI event assistant</p>

            {/* Context indicator */}
            {pageContext.page === "event-details" && pageContext.eventTitle && (
              <div className="mb-4 px-3 py-2 bg-primary/10 border border-primary/20 text-left rounded">
                <p className="text-[10px] font-mono text-primary/60 mb-1">VIEWING EVENT</p>
                <p className="text-xs font-mono text-white truncate">{pageContext.eventTitle}</p>
              </div>
            )}

            {/* Example prompts */}
            <div className="space-y-2 text-left">
              <p className="text-[10px] font-mono text-white/30 tracking-wider mb-3">TRY ASKING</p>
              {examplePrompts.map((example, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInput(example.prompt)
                    sendMessage(example.prompt)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 bg-white/5 border border-white/10 hover:border-primary/30 hover:bg-white/[0.08] transition-all text-left group rounded"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-white/30 group-hover:text-primary transition-colors flex-shrink-0" />
                  <span className="text-xs font-mono text-white/60 group-hover:text-white transition-colors truncate">
                    {example.prompt}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => {
            // Clean assistant messages to remove raw tool call markup
            const displayContent = message.role === "assistant" 
              ? cleanMessageContent(message.content) 
              : message.content
            const parsed = message.role === "assistant" ? parseMessageForLinks(message.content) : null
            
            // Skip rendering if content is empty after cleaning (just a tool call)
            if (message.role === "assistant" && !displayContent) {
              return null
            }
            
            return (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 text-sm rounded ${
                    message.role === "user"
                      ? "bg-primary/20 text-white"
                      : "bg-white/5 text-white/90"
                  }`}
                >
                  {/* Success indicator for action messages */}
                  {parsed?.isSuccess && (
                    <div className="flex items-center gap-1.5 mb-2 text-green-400">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-mono tracking-wider">ACTION COMPLETED</span>
                    </div>
                  )}
                  
                  <div className="whitespace-pre-wrap break-words">{displayContent}</div>
                  
                  {/* Action links */}
                  {parsed?.hasLinks && (
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/10">
                      {parsed.dashboardUrl && (
                        <Link
                          href={parsed.dashboardUrl}
                          onClick={closeChat}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary text-xs font-mono rounded transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Open in Dashboard
                        </Link>
                      )}
                      {parsed.publicUrl && (
                        <Link
                          href={parsed.publicUrl}
                          target="_blank"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white/80 text-xs font-mono rounded transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View Public Page
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/5 px-3 py-2 rounded flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-xs text-white/40">Thinking...</span>
            </div>
          </div>
        )}
        
        {/* Data refresh notification */}
        {lastAction?.success && (
          <div className="flex justify-center">
            <div className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded text-green-400 text-xs font-mono flex items-center gap-1.5 animate-pulse">
              <CheckCircle className="w-3 h-3" />
              Page data refreshed
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-white/10 bg-black/50">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Aftie..."
            disabled={isLoading}
            className="flex-1 h-10 px-3 bg-white/5 border border-white/10 text-white font-mono text-sm placeholder:text-white/30 focus:border-primary/50 focus:outline-none rounded disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="h-10 w-10 flex items-center justify-center bg-primary hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
