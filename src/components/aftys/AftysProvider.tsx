"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"

type ChatStatus = "ready" | "loading" | "error"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

interface AftysContextType {
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
  status: ChatStatus
  isLoading: boolean
}

const AftysContext = createContext<AftysContextType | null>(null)

export function useAftys() {
  const context = useContext(AftysContext)
  if (!context) {
    throw new Error("useAftys must be used within an AftysProvider")
  }
  return context
}

interface AftysProviderProps {
  children: ReactNode
}

export function AftysProvider({ children }: AftysProviderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [status, setStatus] = useState<ChatStatus>("ready")

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || status === "loading") return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setStatus("loading")

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      if (!res.ok) throw new Error("Failed to send message")

      const reader = res.body?.getReader()
      if (!reader) throw new Error("No reader")

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
      }

      setMessages(prev => [...prev, assistantMessage])

      const decoder = new TextDecoder()
      let done = false

      while (!done) {
        const { value, done: readerDone } = await reader.read()
        done = readerDone

        if (value) {
          const chunk = decoder.decode(value, { stream: true })
          // Plain text streaming - just append the chunk
          assistantMessage.content += chunk
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantMessage.id ? { ...m, content: assistantMessage.content } : m
            )
          )
        }
      }

      setStatus("ready")
    } catch (error) {
      console.error("Chat error:", error)
      setStatus("error")
    }
  }, [messages, status])

  const isLoading = status === "loading"

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
    <AftysContext.Provider
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
        status,
        isLoading,
      }}
    >
      {children}
    </AftysContext.Provider>
  )
}
