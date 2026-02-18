"use client"

import { useEffect, useSyncExternalStore } from "react"

const DEFAULT_ACCENT = "#ff1493"

function getAccentFromDOM(): string {
  if (typeof window === "undefined") return DEFAULT_ACCENT
  
  // Read from root CSS variable (set by UIPreferencesProvider)
  const root = document.documentElement
  const computedStyle = getComputedStyle(root)
  const cssVar = computedStyle.getPropertyValue("--accent-color").trim()
  
  return cssVar || DEFAULT_ACCENT
}

// Simple store for accent color
let listeners: (() => void)[] = []
let cachedAccent = DEFAULT_ACCENT

function subscribe(callback: () => void) {
  listeners.push(callback)
  return () => {
    listeners = listeners.filter(l => l !== callback)
  }
}

function getSnapshot() {
  return cachedAccent
}

function getServerSnapshot() {
  return DEFAULT_ACCENT
}

export function useAccentColor() {
  // Use useSyncExternalStore for hydration-safe state
  const accent = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  
  // Update cached value on mount and when DOM changes
  useEffect(() => {
    const updateCache = () => {
      const newAccent = getAccentFromDOM()
      if (newAccent !== cachedAccent) {
        cachedAccent = newAccent
        listeners.forEach(l => l())
      }
    }
    
    // Initial update
    updateCache()
    
    // Watch for style changes on :root
    const observer = new MutationObserver(updateCache)
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ["style"] 
    })
    
    return () => observer.disconnect()
  }, [])

  return accent
}

// For use in components that need the color as a style prop
export function useAccentStyles() {
  const color = useAccentColor()
  
  return {
    color,
    bg: color,
    border: color,
    // Opacity variants
    bgFaded: `${color}15`, // ~8% opacity
    borderFaded: `${color}30`, // ~19% opacity
    borderMedium: `${color}50`, // ~31% opacity
  }
}
