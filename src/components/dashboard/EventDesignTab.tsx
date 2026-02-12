"use client"

import { useState, useRef, useEffect } from "react"
import { Check, ChevronLeft, ChevronRight, Plus, Type, Palette, Layout } from "lucide-react"
import { toast } from "sonner"

const ACCENT_COLORS = [
  { value: "#ff1493", name: "Hot Pink" },
  { value: "#00ff88", name: "Neon Green" },
  { value: "#00d4ff", name: "Cyan" },
  { value: "#ff6b00", name: "Orange" },
  { value: "#a855f7", name: "Purple" },
  { value: "#ffd700", name: "Gold" },
]

const TYPOGRAPHY_OPTIONS = [
  { id: "mono", name: "MONO", preview: "JetBrains Mono", className: "font-mono", description: "Technical, precise" },
  { id: "headline", name: "HEADLINE", preview: "Bebas Neue", className: "font-headline", description: "Bold, impactful" },
  { id: "elegant", name: "ELEGANT", preview: "Playfair Display", className: "font-serif", description: "Refined, luxurious" },
  { id: "modern", name: "MODERN", preview: "Space Grotesk", className: "font-sans", description: "Clean, contemporary" },
]

const TEMPLATES = [
  {
    id: "brutalist",
    name: "BRUTALIST",
    description: "Raw, industrial, no-frills",
    preview: {
      bg: "bg-black",
      accent: "border-white",
      layout: "asymmetric",
    },
  },
  {
    id: "neon",
    name: "NEON UNDERGROUND",
    description: "Glowing accents, dark atmosphere",
    preview: {
      bg: "bg-black",
      accent: "border-[#ff1493]",
      layout: "centered",
    },
  },
  {
    id: "minimal",
    name: "MINIMAL",
    description: "Clean, focused, elegant",
    preview: {
      bg: "bg-zinc-950",
      accent: "border-white/20",
      layout: "minimal",
    },
  },
  {
    id: "rave",
    name: "RAVE",
    description: "High energy, bold graphics",
    preview: {
      bg: "bg-black",
      accent: "border-[#00ff88]",
      layout: "chaotic",
    },
  },
]

interface EventDesignTabProps {
  eventId: string
  initialTemplate?: string
  initialTypography?: string
  initialAccentColor?: string
}

export function EventDesignTab({
  eventId,
  initialTemplate = "neon",
  initialTypography = "headline",
  initialAccentColor = "#ff1493",
}: EventDesignTabProps) {
  const [selectedTemplate, setSelectedTemplate] = useState(initialTemplate)
  const [selectedTypography, setSelectedTypography] = useState(initialTypography)
  const [accentColor, setAccentColor] = useState(initialAccentColor)
  const [saving, setSaving] = useState(false)
  const [activeIndex, setActiveIndex] = useState(
    TEMPLATES.findIndex((t) => t.id === initialTemplate) || 0
  )

  const carouselRef = useRef<HTMLDivElement>(null)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Scroll to active template on mount
  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      scrollToIndex(activeIndex, false)
    }, 100)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const scrollToIndex = (index: number, smooth = true) => {
    if (!carouselRef.current) return
    const container = carouselRef.current
    const cards = container.querySelectorAll('[data-template-card]')
    if (cards[index]) {
      const card = cards[index] as HTMLElement
      const containerWidth = container.offsetWidth
      const cardLeft = card.offsetLeft
      const cardWidth = card.offsetWidth
      const scrollPosition = cardLeft - (containerWidth - cardWidth) / 2

      container.scrollTo({
        left: scrollPosition,
        behavior: smooth ? "smooth" : "auto",
      })
    }
  }

  const handleScroll = () => {
    if (!carouselRef.current) return

    // Debounce to detect when scrolling stops
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }

    scrollTimeoutRef.current = setTimeout(() => {
      if (!carouselRef.current) return
      const container = carouselRef.current
      const containerCenter = container.scrollLeft + container.offsetWidth / 2
      const cards = container.querySelectorAll('[data-template-card]')

      let closestIndex = 0
      let closestDistance = Infinity

      cards.forEach((card, index) => {
        const cardElement = card as HTMLElement
        const cardCenter = cardElement.offsetLeft + cardElement.offsetWidth / 2
        const distance = Math.abs(containerCenter - cardCenter)
        if (distance < closestDistance) {
          closestDistance = distance
          closestIndex = index
        }
      })

      if (closestIndex !== activeIndex) {
        setActiveIndex(closestIndex)
        // Auto-select the visible template
        setSelectedTemplate(TEMPLATES[closestIndex].id)
      }
    }, 150)
  }

  const selectTemplate = (templateId: string, index: number) => {
    setSelectedTemplate(templateId)
    setActiveIndex(index)
    scrollToIndex(index)
  }

  const navigateCarousel = (direction: "prev" | "next") => {
    const newIndex = direction === "prev"
      ? Math.max(0, activeIndex - 1)
      : Math.min(TEMPLATES.length - 1, activeIndex + 1)
    setActiveIndex(newIndex)
    scrollToIndex(newIndex)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageTheme: selectedTemplate,
          typography: selectedTypography,
          accentColor,
        }),
      })

      if (res.ok) {
        toast.success("Design saved!")
      } else {
        const data = await res.json()
        toast.error(data.message || "Failed to save design")
      }
    } catch {
      toast.error("Failed to save design")
    } finally {
      setSaving(false)
    }
  }

  // Get the selected typography class
  const getTypographyClass = () => {
    const font = TYPOGRAPHY_OPTIONS.find(f => f.id === selectedTypography)
    return font?.className || "font-headline"
  }

  return (
    <div className="space-y-8 max-w-full overflow-x-hidden">
      {/* Template Selector */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border border-[#ff1493]/30 bg-[#ff1493]/5 flex items-center justify-center">
              <Layout className="w-4 h-4 text-[#ff1493]" />
            </div>
            <div>
              <h3 className="font-mono font-bold text-sm tracking-wide">PAGE TEMPLATE</h3>
              <p className="text-[10px] font-mono text-white/40">Choose your event page style</p>
            </div>
          </div>

          {/* Navigation arrows - desktop */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => navigateCarousel("prev")}
              disabled={activeIndex === 0}
              className="w-8 h-8 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigateCarousel("next")}
              disabled={activeIndex === TEMPLATES.length - 1}
              className="w-8 h-8 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Carousel Container */}
        <div className="relative -mx-4 sm:mx-0 max-w-[100vw] sm:max-w-full">
          <div
            ref={carouselRef}
            onScroll={handleScroll}
            className="flex gap-3 overflow-x-auto scrollbar-hide"
            style={{
              scrollSnapType: "x mandatory",
              WebkitOverflowScrolling: "touch",
              paddingLeft: "20%",
              paddingRight: "20%",
            }}
          >
            {TEMPLATES.map((template, index) => {
              const isSelected = selectedTemplate === template.id
              const isActive = activeIndex === index

              return (
                <div
                  key={template.id}
                  data-template-card
                  onClick={() => selectTemplate(template.id, index)}
                  className="flex-shrink-0 snap-center"
                  style={{ width: "60%", minWidth: "240px", maxWidth: "320px" }}
                >
                  <div
                    className={`
                      relative border-2 transition-all duration-300 cursor-pointer group
                      ${isSelected
                        ? "border-[#ff1493] bg-[#ff1493]/5"
                        : isActive
                          ? "border-white/30 bg-white/[0.02]"
                          : "border-white/10 bg-white/[0.01] opacity-60"
                      }
                    `}
                  >
                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="absolute -top-px -right-px w-8 h-8 bg-[#ff1493] flex items-center justify-center z-10">
                        <Check className="w-4 h-4 text-black" />
                      </div>
                    )}

                    {/* Template Preview - Realistic mini event page */}
                    <div className={`h-48 sm:h-56 ${template.preview.bg} relative overflow-hidden`}>
                      {/* Template-specific preview showing actual page layout */}
                      {template.id === "brutalist" && (
                        <div className="absolute inset-0 p-3 flex flex-col">
                          {/* Header bar */}
                          <div className="w-full h-2 mb-3" style={{ backgroundColor: accentColor }} />
                          {/* Flyer placeholder */}
                          <div
                            className="w-full aspect-[4/5] max-h-[45%] bg-white/10 border-2 mb-2"
                            style={{ borderColor: accentColor }}
                          />
                          {/* Title */}
                          <div className={`text-[8px] text-white font-bold tracking-wider mb-1 ${getTypographyClass()}`}>
                            EVENT NAME
                          </div>
                          <div className="flex gap-1 mb-2">
                            <div className="w-8 h-2 bg-white/40" />
                            <div className="w-6 h-2 bg-white/40" />
                          </div>
                          {/* CTA */}
                          <div className="mt-auto flex gap-1">
                            <div
                              className="flex-1 h-4 border-2 flex items-center justify-center"
                              style={{ borderColor: accentColor }}
                            >
                              <span className="text-[6px] font-mono" style={{ color: accentColor }}>GET TICKETS</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {template.id === "neon" && (
                        <div className="absolute inset-0 p-3 flex flex-col items-center text-center">
                          {/* Glowing flyer */}
                          <div
                            className="w-3/4 aspect-[4/5] max-h-[50%] border-2 mb-2"
                            style={{
                              borderColor: accentColor,
                              boxShadow: `0 0 20px ${accentColor}40, inset 0 0 30px ${accentColor}10`,
                              backgroundColor: `${accentColor}05`
                            }}
                          />
                          {/* Title */}
                          <div
                            className={`text-[9px] font-bold tracking-wider mb-1 ${getTypographyClass()}`}
                            style={{ color: accentColor }}
                          >
                            EVENT NAME
                          </div>
                          <div className="text-[6px] text-white/40 mb-2">SAT, JAN 15 • 10PM</div>
                          {/* CTA */}
                          <div
                            className="px-3 py-1.5 border mt-auto"
                            style={{
                              borderColor: accentColor,
                              boxShadow: `0 0 10px ${accentColor}30`
                            }}
                          >
                            <span className="text-[6px] font-mono" style={{ color: accentColor }}>GET TICKETS</span>
                          </div>
                        </div>
                      )}

                      {template.id === "minimal" && (
                        <div className="absolute inset-0 p-4 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent">
                          {/* Subtle flyer hint */}
                          <div
                            className="absolute top-3 left-3 w-6 h-6 border"
                            style={{ borderColor: `${accentColor}40` }}
                          />
                          {/* Title - elegant placement */}
                          <div className={`text-[10px] text-white font-medium tracking-wide mb-0.5 ${getTypographyClass()}`}>
                            Event Name
                          </div>
                          <div className="text-[6px] text-white/40 mb-2">January 15, 2025</div>
                          {/* Minimal CTA */}
                          <div
                            className="w-12 h-3 flex items-center justify-center"
                            style={{ backgroundColor: accentColor }}
                          >
                            <span className="text-[5px] font-mono text-black tracking-wider">RSVP</span>
                          </div>
                        </div>
                      )}

                      {template.id === "rave" && (
                        <div className="absolute inset-0 overflow-hidden">
                          {/* Chaotic background shapes */}
                          <div
                            className="absolute -top-2 -left-2 w-16 h-16 border-4 rotate-12"
                            style={{ borderColor: accentColor }}
                          />
                          <div
                            className="absolute -bottom-4 -right-4 w-20 h-20 -rotate-12"
                            style={{ backgroundColor: accentColor, opacity: 0.3 }}
                          />
                          <div className="absolute top-1/4 right-2 w-8 h-8 border-2 border-white rotate-45" />
                          {/* Central content */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-3">
                            <div
                              className={`text-[11px] font-black tracking-tight transform -rotate-2 mb-1 ${getTypographyClass()}`}
                              style={{ color: accentColor }}
                            >
                              EVENT
                            </div>
                            <div className="text-[7px] font-mono text-white transform rotate-1 mb-3">
                              SAT 15 JAN
                            </div>
                            <div
                              className="px-2 py-1 transform -rotate-1"
                              style={{ backgroundColor: accentColor }}
                            >
                              <span className="text-[6px] font-mono font-bold text-black">TICKETS</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Hover overlay */}
                      <div className={`
                        absolute inset-0 bg-black/70 flex items-center justify-center opacity-0
                        group-hover:opacity-100 transition-opacity duration-200
                        ${isSelected ? "hidden" : ""}
                      `}>
                        <span className="text-[10px] font-mono tracking-wider text-white/90">
                          TAP TO SELECT
                        </span>
                      </div>
                    </div>

                    {/* Template Info */}
                    <div className="p-4 border-t border-white/10">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-mono font-bold text-sm tracking-wide">{template.name}</h4>
                        {isSelected && (
                          <span className="text-[9px] font-mono px-2 py-0.5 bg-[#ff1493] text-black">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-white/40">{template.description}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Carousel indicators */}
          <div className="flex justify-center gap-2 mt-4">
            {TEMPLATES.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setActiveIndex(index)
                  scrollToIndex(index)
                }}
                className={`
                  h-1 transition-all duration-300
                  ${activeIndex === index
                    ? "w-6 bg-[#ff1493]"
                    : "w-2 bg-white/20 hover:bg-white/40"
                  }
                `}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Typography Selector */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border border-cyan-500/30 bg-cyan-500/5 flex items-center justify-center">
            <Type className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="font-mono font-bold text-sm tracking-wide">TYPOGRAPHY</h3>
            <p className="text-[10px] font-mono text-white/40">Select your font style</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {TYPOGRAPHY_OPTIONS.map((font) => {
            const isSelected = selectedTypography === font.id

            return (
              <button
                key={font.id}
                onClick={() => setSelectedTypography(font.id)}
                className={`
                  relative p-4 border-2 text-left transition-all group
                  ${isSelected
                    ? "border-cyan-400 bg-cyan-400/5"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20"
                  }
                `}
              >
                {isSelected && (
                  <div className="absolute -top-px -right-px w-6 h-6 bg-cyan-400 flex items-center justify-center">
                    <Check className="w-3 h-3 text-black" />
                  </div>
                )}

                <div className={`text-2xl mb-2 ${font.className}`}>
                  Aa
                </div>
                <div className="font-mono text-[10px] tracking-wider text-white/60 mb-0.5">
                  {font.name}
                </div>
                <div className="text-[9px] text-white/30">
                  {font.description}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Accent Color Selector */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border border-purple-500/30 bg-purple-500/5 flex items-center justify-center">
            <Palette className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h3 className="font-mono font-bold text-sm tracking-wide">ACCENT COLOR</h3>
            <p className="text-[10px] font-mono text-white/40">Brand color for buttons and highlights</p>
          </div>
        </div>

        <div
          className="flex items-center gap-3 overflow-x-auto overflow-y-hidden scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap py-1"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {ACCENT_COLORS.map((color) => (
            <button
              key={color.value}
              onClick={() => setAccentColor(color.value)}
              className={`
                w-10 h-10 flex-shrink-0 transition-all relative
                ${accentColor === color.value
                  ? "ring-2 ring-white ring-offset-2 ring-offset-black scale-110"
                  : "hover:scale-105"
                }
              `}
              style={{ backgroundColor: color.value }}
              title={color.name}
            >
              {accentColor === color.value && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Check className="w-4 h-4 text-black drop-shadow-lg" />
                </div>
              )}
            </button>
          ))}

          {/* Custom color picker */}
          <div className="relative w-10 h-10 flex-shrink-0 border-2 border-dashed border-white/20 overflow-hidden hover:border-white/40 transition-colors">
            <input
              type="color"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Plus className="w-4 h-4 text-white/40" />
            </div>
          </div>
        </div>

        {/* Color preview */}
        <div className="flex items-center gap-3 p-3 border border-white/10 bg-white/[0.02]">
          <div
            className="w-6 h-6 flex-shrink-0"
            style={{ backgroundColor: accentColor }}
          />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-mono text-white/60">Current accent</div>
            <div className="text-sm font-mono font-bold" style={{ color: accentColor }}>
              {accentColor.toUpperCase()}
            </div>
          </div>
          <button
            className="px-3 py-1.5 text-[10px] font-mono tracking-wider border transition-all"
            style={{
              borderColor: accentColor,
              color: accentColor,
            }}
          >
            PREVIEW
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <p className="text-[10px] font-mono text-white/30">
          Changes will be applied to your public event page
        </p>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-[#ff1493] text-black font-mono font-bold text-sm tracking-wider hover:bg-[#ff1493]/90 disabled:opacity-50 transition-all flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-black/30 border-t-black animate-spin" />
              SAVING...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              SAVE DESIGN
            </>
          )}
        </button>
      </div>
    </div>
  )
}
