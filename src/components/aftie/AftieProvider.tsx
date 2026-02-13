"use client"

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react"
import { useChat, type Message as AIMessage } from "@ai-sdk/react"

const BETA_STORAGE_KEY = "afty_ai_beta_enabled"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
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

  // Use the AI SDK's useChat hook for proper streaming with tool support
  const {
    messages: aiMessages,
    input,
    setInput,
    append,
    isLoading,
  } = useChat({
    api: "/api/ai/chat",
    onError: (error) => {
      console.error("Aftie chat error:", error)
    },
  })

  // Convert AI messages to our format (filter out tool messages)
  const messages: Message[] = aiMessages
    .filter((m): m is AIMessage & { role: "user" | "assistant" } =>
      m.role === "user" || m.role === "assistant"
    )
    .map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
    }))

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
    setInput("")
    await append({ role: "user", content: text })
  }, [append, isLoading, setInput])

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
      }}
    >
      {children}
    </AftieContext.Provider>
  )
}
