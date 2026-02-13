"use client"

import { createContext, useContext, useState, useCallback, useEffect, ReactNode, useRef } from "react"

const BETA_STORAGE_KEY = "afty_ai_beta_enabled"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

// Page context for Aftie to understand where the user is
export interface AftiePageContext {
  page: "dashboard" | "events" | "event-details" | "event-new" | "analytics" | "organizer" | "other"
  eventId?: string
  eventTitle?: string
  // Editing context - what field/section is the user currently focused on?
  editingField?: "description" | "title" | "venue" | "lineup" | "tickets" | "design" | "location" | "media" | null
  // Additional context about the event for content generation
  eventDetails?: {
    venueName?: string
    city?: string
    startsAt?: string
    lineup?: Array<{ name: string; role?: string }>
    genre?: string
    vibe?: string
  }
}

interface AftieContextType {
  isOpen: boolean
  openChat: () => void
  closeChat: () => void
  toggleChat: () => void
  isCommandPaletteOpen: boolean
  openCommandPalette: () => void
  closeCommandPalette: () => void
  // Chat state
  messages: Message[]
  input: string
  setInput: (value: string) => void
  sendMessage: (text: string) => Promise<void>
  isLoading: boolean
  // Beta toggle
  isBetaEnabled: boolean
  isHydrated: boolean
  // Page context
  pageContext: AftiePageContext
  setPageContext: (context: AftiePageContext) => void
}

const AftieContext = createContext<AftieContextType | null>(null)

export function useAftie() {
  const context = useContext(AftieContext)
  if (!context) {
    throw new Error("useAftie must be used within an AftieProvider")
  }
  return context
}

interface AftieProviderProps {
  children: ReactNode
}

export function AftieProvider({ children }: AftieProviderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [isBetaEnabled, setIsBetaEnabled] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [pageContext, setPageContext] = useState<AftiePageContext>({ page: "dashboard" })
  const abortControllerRef = useRef<AbortController | null>(null)

  // Initialize beta state from localStorage and set up global toggle
  useEffect(() => {
    setIsHydrated(true)

    const stored = localStorage.getItem(BETA_STORAGE_KEY)
    if (stored === "true") {
      setIsBetaEnabled(true)
    }

    const toggle = () => {
      setIsBetaEnabled(prev => {
        const newValue = !prev
        localStorage.setItem(BETA_STORAGE_KEY, newValue.toString())
        console.log(`🤖 Aftie AI beta ${newValue ? "ENABLED" : "DISABLED"}`)
        return newValue
      })
    }

    ;(window as unknown as { afty_ai_beta_toggle: () => void }).afty_ai_beta_toggle = toggle

    return () => {
      delete (window as unknown as { afty_ai_beta_toggle?: () => void }).afty_ai_beta_toggle
    }
  }, [])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text.trim(),
    }

    setInput("")
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    // Abort any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          context: pageContext,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error(`Chat error: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("No response body")
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "",
      }

      setMessages(prev => [...prev, assistantMessage])

      const decoder = new TextDecoder()
      let content = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        content += chunk

        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMessage.id ? { ...m, content } : m
          )
        )
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        return
      }
      console.error("Aftie chat error:", error)

      // Add error message
      setMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }, [messages, isLoading, pageContext])

  const openChat = useCallback(() => {
    setIsOpen(true)
    setIsCommandPaletteOpen(false)
  }, [])

  const closeChat = useCallback(() => {
    setIsOpen(false)
  }, [])

  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  const openCommandPalette = useCallback(() => {
    setIsCommandPaletteOpen(true)
    setIsOpen(false)
  }, [])

  const closeCommandPalette = useCallback(() => {
    setIsCommandPaletteOpen(false)
  }, [])

  return (
    <AftieContext.Provider
      value={{
        isOpen,
        openChat,
        closeChat,
        toggleChat,
        isCommandPaletteOpen,
        openCommandPalette,
        closeCommandPalette,
        messages,
        input,
        setInput,
        sendMessage,
        isLoading,
        isBetaEnabled,
        isHydrated,
        pageContext,
        setPageContext,
      }}
    >
      {children}
    </AftieContext.Provider>
  )
}
