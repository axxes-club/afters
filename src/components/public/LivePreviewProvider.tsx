'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export interface DesignSettings {
  accentColor: string
  typography: string
  pageTheme: string
  showLocationOnPage: boolean
  showMapOnPage: boolean
  isAddressHidden: boolean
}

interface DesignHistory {
  past: DesignSettings[]
  current: DesignSettings
}

interface LivePreviewContextType {
  design: DesignSettings
  originalDesign: DesignSettings
  hasChanges: boolean
  isPreviewMode: boolean
  canUndo: boolean
  updateDesign: (key: keyof DesignSettings, value: DesignSettings[keyof DesignSettings]) => void
  undo: () => void
  resetToOriginal: () => void
  setPreviewMode: (mode: boolean) => void
}

const LivePreviewContext = createContext<LivePreviewContextType | null>(null)

export function useLivePreview() {
  const context = useContext(LivePreviewContext)
  if (!context) {
    throw new Error('useLivePreview must be used within a LivePreviewProvider')
  }
  return context
}

interface LivePreviewProviderProps {
  children: ReactNode
  initialDesign: DesignSettings
}

export function LivePreviewProvider({ children, initialDesign }: LivePreviewProviderProps) {
  const [history, setHistory] = useState<DesignHistory>({
    past: [],
    current: initialDesign,
  })
  const [originalDesign] = useState(initialDesign)
  const [isPreviewMode, setPreviewMode] = useState(false)

  const hasChanges = JSON.stringify(history.current) !== JSON.stringify(originalDesign)
  const canUndo = history.past.length > 0

  const updateDesign = useCallback((key: keyof DesignSettings, value: DesignSettings[keyof DesignSettings]) => {
    setHistory(prev => ({
      past: [...prev.past, prev.current].slice(-20), // Keep last 20 states
      current: { ...prev.current, [key]: value },
    }))
    setPreviewMode(true)
  }, [])

  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.past.length === 0) return prev
      const newPast = [...prev.past]
      const previousState = newPast.pop()!
      return {
        past: newPast,
        current: previousState,
      }
    })
  }, [])

  const resetToOriginal = useCallback(() => {
    setHistory({
      past: [],
      current: originalDesign,
    })
    setPreviewMode(false)
  }, [originalDesign])

  return (
    <LivePreviewContext.Provider
      value={{
        design: history.current,
        originalDesign,
        hasChanges,
        isPreviewMode,
        canUndo,
        updateDesign,
        undo,
        resetToOriginal,
        setPreviewMode,
      }}
    >
      {children}
    </LivePreviewContext.Provider>
  )
}
