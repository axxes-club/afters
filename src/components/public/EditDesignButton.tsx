'use client'

import { useState, useEffect, useRef } from 'react'
import { Palette, Type, Layout, EyeOff, Sparkles } from 'lucide-react'
import { useLivePreview, type DesignSettings } from './LivePreviewProvider'

interface EditDesignButtonProps {
  eventId: string
}

const ACCENT_COLORS = [
  { value: '#ff1493', name: 'Hot Pink' },
  { value: '#00ff88', name: 'Neon Green' },
  { value: '#00d4ff', name: 'Cyan' },
  { value: '#ff6b00', name: 'Orange' },
  { value: '#a855f7', name: 'Purple' },
  { value: '#ffd700', name: 'Gold' },
]

const TYPOGRAPHY_OPTIONS = [
  { id: 'mono', name: 'MONO', preview: 'JetBrains Mono' },
  { id: 'headline', name: 'HEADLINE', preview: 'Bebas Neue' },
  { id: 'elegant', name: 'ELEGANT', preview: 'Playfair Display' },
  { id: 'modern', name: 'MODERN', preview: 'Space Grotesk' },
]

const TEMPLATES = [
  { id: 'brutalist', name: 'BRUTALIST', icon: '▦' },
  { id: 'neon', name: 'NEON', icon: '◈' },
  { id: 'minimal', name: 'MINIMAL', icon: '○' },
  { id: 'tilt', name: 'TILT', icon: '⟋' },
  { id: 'lush', name: 'LUSH', icon: '◆' },
  { id: 'nice', name: 'NICE.AM', icon: '●' },
  { id: 'editorial', name: 'EDITORIAL', icon: '≡' },
  { id: 'card', name: 'CARD', icon: '▢' },
  { id: 'vapor', name: 'VAPOR', icon: '◎' },
]

export default function EditDesignButton({ eventId }: EditDesignButtonProps) {
  const { design, hasChanges, updateDesign, resetToOriginal } = useLivePreview()
  const [isOpen, setIsOpen] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const [templateChangeNote, setTemplateChangeNote] = useState(false)

  const handleDesignUpdate = (key: keyof DesignSettings, value: any) => {
    updateDesign(key, value)
    // For template changes, navigate with preview params to see the change live
    if (key === 'pageTheme') {
      setTemplateChangeNote(true)
      // Navigate with preview params to show the new template
      const url = new URL(window.location.href)
      url.searchParams.set('preview_theme', value)
      url.searchParams.set('preview_color', design.accentColor)
      url.searchParams.set('preview_typography', design.typography)
      window.location.href = url.toString()
    }
  }

  const handlePublish = async () => {
    setIsPublishing(true)
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(design),
      })

      if (!response.ok) throw new Error('Failed to publish')

      // Show success and reload without preview params
      setTimeout(() => {
        const url = new URL(window.location.href)
        url.searchParams.delete('preview_theme')
        url.searchParams.delete('preview_color')
        url.searchParams.delete('preview_typography')
        window.location.href = url.toString()
      }, 500)
    } catch (error) {
      console.error('Failed to publish:', error)
      alert('Failed to publish changes')
      setIsPublishing(false)
    }
  }

  const handleCancel = () => {
    resetToOriginal()
    setIsOpen(false)
    // Clear preview params and reload to original state
    const url = new URL(window.location.href)
    if (url.searchParams.has('preview_theme') || url.searchParams.has('preview_color') || url.searchParams.has('preview_typography')) {
      url.searchParams.delete('preview_theme')
      url.searchParams.delete('preview_color')
      url.searchParams.delete('preview_typography')
      window.location.href = url.toString()
    }
  }

  return (
    <div className="fixed top-6 right-6 z-[100]" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative px-5 py-2.5 bg-black/40 backdrop-blur-xl border border-white/10 rounded-lg text-white text-sm font-medium tracking-wide hover:border-white/30 transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
        style={{
          boxShadow: isOpen
            ? `0 0 0 1px ${design.accentColor}40, 0 0 24px ${design.accentColor}20`
            : '0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4" />
          <span>Edit Design</span>
          {hasChanges && (
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: design.accentColor }}
            />
          )}
        </div>
      </button>

      {/* Dropdown Panel */}
      <div
        className="absolute top-full right-0 mt-3 w-[380px] origin-top-right transition-all duration-300 ease-out"
        style={{
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(-10px)',
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
      >
        <div className="bg-zinc-950/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.6)] overflow-hidden">
          {/* Header */}
          <div
            className="px-6 py-4 border-b border-white/5"
            style={{
              background: `linear-gradient(135deg, ${design.accentColor}15 0%, transparent 100%)`,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold text-base tracking-tight">
                  Design Controls
                </h3>
                <p className="text-white/40 text-xs mt-0.5 font-mono">
                  Live preview • Changes unpublished
                </p>
              </div>
              <Sparkles className="w-5 h-5 text-white/20" />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 max-h-[calc(100vh-240px)] overflow-y-auto custom-scrollbar">
            {/* Accent Color */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-6 h-6 rounded-md border-2 border-white/20"
                  style={{ backgroundColor: design.accentColor }}
                />
                <label className="text-white/60 text-xs uppercase tracking-widest font-medium">
                  Accent Color
                </label>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {ACCENT_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => handleDesignUpdate('accentColor', color.value)}
                    className="group relative h-11 rounded-lg border-2 transition-all duration-200 hover:scale-105"
                    style={{
                      backgroundColor: `${color.value}15`,
                      borderColor:
                        design.accentColor === color.value ? color.value : 'transparent',
                    }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: color.value }}
                      />
                      <span className="text-white/70 text-xs font-medium group-hover:text-white">
                        {color.name.split(' ')[0]}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-3">
                <input
                  type="color"
                  value={design.accentColor}
                  onChange={(e) => handleDesignUpdate('accentColor', e.target.value)}
                  className="w-full h-11 rounded-lg border border-white/10 bg-black/40 cursor-pointer"
                />
              </div>
            </section>

            {/* Typography */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Type className="w-4 h-4 text-white/40" />
                <label className="text-white/60 text-xs uppercase tracking-widest font-medium">
                  Typography
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {TYPOGRAPHY_OPTIONS.map((font) => (
                  <button
                    key={font.id}
                    onClick={() => handleDesignUpdate('typography', font.id)}
                    className="relative h-14 rounded-lg border transition-all duration-200 hover:scale-[1.02] group overflow-hidden"
                    style={{
                      backgroundColor:
                        design.typography === font.id
                          ? `${design.accentColor}10`
                          : 'rgba(255,255,255,0.02)',
                      borderColor:
                        design.typography === font.id ? design.accentColor : 'rgba(255,255,255,0.05)',
                    }}
                  >
                    <div className="px-3 py-2 text-left">
                      <div className="text-white text-xs font-bold mb-0.5">{font.name}</div>
                      <div className="text-white/40 text-[10px] font-mono">{font.preview}</div>
                    </div>
                    {design.typography === font.id && (
                      <div
                        className="absolute bottom-0 left-0 right-0 h-0.5"
                        style={{ backgroundColor: design.accentColor }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </section>

            {/* Page Template */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Layout className="w-4 h-4 text-white/40" />
                <label className="text-white/60 text-xs uppercase tracking-widest font-medium">
                  Page Template
                </label>
              </div>
              {templateChangeNote && (
                <div
                  className="mb-3 px-3 py-2 rounded-lg text-xs border"
                  style={{
                    backgroundColor: `${design.accentColor}10`,
                    borderColor: `${design.accentColor}40`,
                    color: design.accentColor,
                  }}
                >
                  Template change will be visible after re-publish
                </div>
              )}
              <div className="space-y-2">
                {TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleDesignUpdate('pageTheme', template.id)}
                    className="w-full group relative h-12 rounded-lg border transition-all duration-200 hover:scale-[1.01] overflow-hidden"
                    style={{
                      backgroundColor:
                        design.pageTheme === template.id
                          ? `${design.accentColor}15`
                          : 'rgba(255,255,255,0.02)',
                      borderColor:
                        design.pageTheme === template.id
                          ? design.accentColor
                          : 'rgba(255,255,255,0.05)',
                    }}
                  >
                    <div className="flex items-center justify-between px-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xl opacity-60">{template.icon}</span>
                        <span className="text-white text-sm font-semibold tracking-wide">
                          {template.name}
                        </span>
                      </div>
                      {design.pageTheme === template.id && (
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: design.accentColor }}
                        />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Visibility Toggles */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <EyeOff className="w-4 h-4 text-white/40" />
                <label className="text-white/60 text-xs uppercase tracking-widest font-medium">
                  Visibility
                </label>
              </div>
              <div className="space-y-2">
                <ToggleSwitch
                  label="Show Location"
                  checked={design.showLocationOnPage}
                  onChange={(checked) => handleDesignUpdate('showLocationOnPage', checked)}
                  accentColor={design.accentColor}
                />
                <ToggleSwitch
                  label="Show Map"
                  checked={design.showMapOnPage}
                  onChange={(checked) => handleDesignUpdate('showMapOnPage', checked)}
                  accentColor={design.accentColor}
                  disabled={!design.showLocationOnPage}
                />
                <ToggleSwitch
                  label="Hide Address Until Purchase"
                  checked={design.isAddressHidden}
                  onChange={(checked) => handleDesignUpdate('isAddressHidden', checked)}
                  accentColor={design.accentColor}
                />
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/5 bg-black/40 space-y-2">
            <button
              onClick={handlePublish}
              disabled={!hasChanges || isPublishing}
              className="w-full h-12 rounded-lg font-semibold text-sm tracking-wide transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed relative overflow-hidden group"
              style={{
                backgroundColor: hasChanges ? design.accentColor : 'rgba(255,255,255,0.05)',
                color: hasChanges ? '#000' : 'rgba(255,255,255,0.4)',
                boxShadow: hasChanges ? `0 4px 24px ${design.accentColor}40` : 'none',
              }}
            >
              <div className="relative z-10 flex items-center justify-center gap-2">
                {isPublishing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <span>{hasChanges ? 'Re-Publish Changes' : 'No Changes'}</span>
                )}
              </div>
              {hasChanges && !isPublishing && (
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: `linear-gradient(135deg, transparent 0%, ${design.accentColor}20 100%)`,
                  }}
                />
              )}
            </button>
            {hasChanges && (
              <button
                onClick={handleCancel}
                disabled={isPublishing}
                className="w-full h-10 rounded-lg border border-white/10 text-white/60 text-sm font-medium hover:text-white hover:border-white/30 transition-all"
              >
                Discard Changes
              </button>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  )
}

function ToggleSwitch({
  label,
  checked,
  onChange,
  accentColor,
  disabled = false,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  accentColor: string
  disabled?: boolean
}) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed group"
    >
      <span className="text-white/80 text-sm font-medium group-hover:text-white">
        {label}
      </span>
      <div
        className="relative w-11 h-6 rounded-full transition-all duration-300"
        style={{
          backgroundColor: checked ? accentColor : 'rgba(255,255,255,0.1)',
        }}
      >
        <div
          className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-lg transition-all duration-300"
          style={{
            transform: checked ? 'translateX(20px)' : 'translateX(0)',
          }}
        />
      </div>
    </button>
  )
}
