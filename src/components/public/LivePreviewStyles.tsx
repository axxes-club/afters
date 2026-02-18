'use client'

import { useLivePreview } from './LivePreviewProvider'
import { useEffect, useRef, useState } from 'react'

export function LivePreviewStyles() {
  const { design, originalDesign, hasChanges } = useLivePreview()
  const originalColorRef = useRef(originalDesign.accentColor)
  const prevColorRef = useRef(design.accentColor)
  const [showFlash, setShowFlash] = useState(false)

  // Flash effect when accent color changes
  useEffect(() => {
    if (prevColorRef.current !== design.accentColor && hasChanges) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowFlash(true)
      setTimeout(() => setShowFlash(false), 300)
    }
    prevColorRef.current = design.accentColor
  }, [design.accentColor, hasChanges])

  useEffect(() => {
    if (!hasChanges) {
      // Clean up when no changes
      document.body.removeAttribute('data-preview')
      const styleEl = document.getElementById('live-preview-styles')
      styleEl?.remove()
      return
    }

    // Add preview mode indicator
    document.body.setAttribute('data-preview', 'true')

    // Create or update style element
    let styleEl = document.getElementById('live-preview-styles') as HTMLStyleElement
    if (!styleEl) {
      styleEl = document.createElement('style')
      styleEl.id = 'live-preview-styles'
      document.head.appendChild(styleEl)
    }

    // CSS for preview border indicator
    styleEl.textContent = `
      body[data-preview="true"]::before {
        content: "";
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, ${design.accentColor}, transparent 30%, transparent 70%, ${design.accentColor});
        z-index: 9999;
        pointer-events: none;
      }
    `

    // Find and update all elements with the original accent color
    const originalColor = originalColorRef.current.toLowerCase()
    const newColor = design.accentColor

    // Update inline styles
    const updateInlineStyles = (el: HTMLElement) => {
      const style = el.getAttribute('style')
      if (style && style.toLowerCase().includes(originalColor.replace('#', ''))) {
        // Replace color in style attribute
        const regex = new RegExp(originalColor.replace('#', '#?'), 'gi')
        el.setAttribute('style', style.replace(regex, newColor))
      }
    }

    // Walk the DOM and update elements
    const allElements = document.querySelectorAll('[style]')
    allElements.forEach((el) => {
      if (el instanceof HTMLElement) {
        updateInlineStyles(el)
      }
    })

    // Update CSS variables
    document.documentElement.style.setProperty('--accent-color', design.accentColor)
    document.documentElement.style.setProperty('--preview-accent', design.accentColor)

    return () => {
      document.body.removeAttribute('data-preview')
    }
  }, [design.accentColor, hasChanges, originalDesign.accentColor])

  // Handle background color changes
  useEffect(() => {
    if (!hasChanges) return

    // Find and update the main container background
    const mainContainer = document.querySelector('[style*="backgroundColor"]') as HTMLElement
    if (mainContainer) {
      mainContainer.style.backgroundColor = design.backgroundColor
    }

    // Also update CSS variable for any elements that might use it
    document.documentElement.style.setProperty('--background-color', design.backgroundColor)
  }, [design.backgroundColor, hasChanges])

  // Handle typography changes
  useEffect(() => {
    if (!hasChanges) return

    const typographyMap: Record<string, string> = {
      mono: 'JetBrains Mono, monospace',
      headline: 'Bebas Neue, sans-serif',
      elegant: 'Playfair Display, serif',
      modern: 'Space Grotesk, sans-serif',
    }

    const fontFamily = typographyMap[design.typography] || typographyMap.headline

    // Apply to major headings
    document.querySelectorAll('h1, h2, [class*="font-"]').forEach((el) => {
      if (el instanceof HTMLElement) {
        const originalFont = el.dataset.originalFont
        if (!originalFont) {
          el.dataset.originalFont = el.style.fontFamily || ''
        }
        // Only override typography classes
        if (el.classList.contains('font-mono') ||
            el.classList.contains('font-headline') ||
            el.classList.contains('font-serif') ||
            el.classList.contains('font-sans')) {
          el.style.fontFamily = fontFamily
        }
      }
    })
  }, [design.typography, hasChanges])

  // Render flash effect overlay
  if (showFlash) {
    return (
      <div
        className="fixed inset-0 pointer-events-none z-[9998] animate-pulse"
        style={{
          background: `radial-gradient(circle at center, ${design.accentColor}20 0%, transparent 70%)`,
          animation: 'flash 0.3s ease-out forwards',
        }}
      >
        <style>{`
          @keyframes flash {
            0% { opacity: 1; }
            100% { opacity: 0; }
          }
        `}</style>
      </div>
    )
  }

  return null
}
