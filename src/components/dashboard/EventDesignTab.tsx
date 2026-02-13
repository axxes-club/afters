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
  },
  {
    id: "neon",
    name: "NEON",
    description: "Glowing accents, dark atmosphere",
  },
  {
    id: "minimal",
    name: "MINIMAL",
    description: "Clean, focused, elegant",
  },
  {
    id: "tilt",
    name: "TILT",
    description: "High energy, chaotic graphics",
  },
  {
    id: "editorial",
    name: "EDITORIAL",
    description: "Magazine-style, sophisticated",
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
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Scroll to active template on mount (mobile only)
  useEffect(() => {
    if (isMobile) {
      const timer = setTimeout(() => {
        scrollToIndex(activeIndex, false)
      }, 100)
      return () => clearTimeout(timer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile])

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
    // Only apply carousel behavior on mobile
    if (!isMobile) return
    if (!carouselRef.current) return

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
        setSelectedTemplate(TEMPLATES[closestIndex].id)
      }
    }, 150)
  }

  const selectTemplate = (templateId: string, index: number) => {
    setSelectedTemplate(templateId)
    setActiveIndex(index)
    // Only scroll on mobile
    if (isMobile) {
      scrollToIndex(index)
    }
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

  const getTypographyClass = () => {
    const font = TYPOGRAPHY_OPTIONS.find(f => f.id === selectedTypography)
    return font?.className || "font-headline"
  }

  // Template preview components with unique aesthetics
  const renderTemplatePreview = (templateId: string) => {
    const typographyClass = getTypographyClass()

    switch (templateId) {
      case "brutalist":
        return (
          <div className="absolute inset-0 bg-black flex flex-col">
            {/* Harsh header bar */}
            <div className="h-3" style={{ backgroundColor: accentColor }} />

            {/* Content area with exposed grid */}
            <div className="flex-1 p-3 relative">
              {/* Grid lines */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white" />
                <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white" />
                <div className="absolute top-1/3 left-0 right-0 h-px bg-white" />
              </div>

              {/* Flyer - stark bordered */}
              <div
                className="w-full aspect-[3/4] max-h-[40%] border-4 bg-white/5 mb-2"
                style={{ borderColor: accentColor }}
              />

              {/* Title - harsh, uppercase */}
              <div className={`text-[9px] text-white font-black tracking-widest uppercase mb-1 ${typographyClass}`}>
                EVENT TITLE
              </div>

              {/* Date - monospace */}
              <div className="font-mono text-[7px] text-white/50 tracking-wider mb-3">
                15.01.2025 // 22:00
              </div>

              {/* CTA - bordered, stark */}
              <div
                className="absolute bottom-3 left-3 right-3 h-6 border-2 flex items-center justify-center"
                style={{ borderColor: accentColor }}
              >
                <span className="font-mono text-[7px] font-bold tracking-widest" style={{ color: accentColor }}>
                  GET TICKETS →
                </span>
              </div>
            </div>
          </div>
        )

      case "neon":
        return (
          <div className="absolute inset-0 bg-black overflow-hidden">
            {/* Ambient glow */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full blur-3xl opacity-30"
              style={{ backgroundColor: accentColor }}
            />

            {/* Content centered */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
              {/* Glowing flyer frame */}
              <div
                className="w-3/4 aspect-[4/5] max-h-[45%] mb-3 relative"
                style={{
                  boxShadow: `0 0 30px ${accentColor}50, 0 0 60px ${accentColor}20, inset 0 0 20px ${accentColor}10`,
                  border: `2px solid ${accentColor}`,
                  backgroundColor: `${accentColor}05`,
                }}
              >
                {/* Inner glow lines */}
                <div
                  className="absolute top-2 left-2 right-2 h-px opacity-50"
                  style={{ backgroundColor: accentColor }}
                />
                <div
                  className="absolute bottom-2 left-2 right-2 h-px opacity-50"
                  style={{ backgroundColor: accentColor }}
                />
              </div>

              {/* Title - glowing */}
              <div
                className={`text-[10px] font-bold tracking-wider mb-1 ${typographyClass}`}
                style={{
                  color: accentColor,
                  textShadow: `0 0 10px ${accentColor}80, 0 0 20px ${accentColor}40`,
                }}
              >
                EVENT NAME
              </div>

              {/* Date */}
              <div className="text-[6px] text-white/40 tracking-widest mb-3">
                SAT · JAN 15 · 10PM
              </div>

              {/* CTA - neon button */}
              <div
                className="px-4 py-1.5"
                style={{
                  border: `1px solid ${accentColor}`,
                  boxShadow: `0 0 15px ${accentColor}40, inset 0 0 15px ${accentColor}10`,
                }}
              >
                <span
                  className="font-mono text-[6px] tracking-widest"
                  style={{ color: accentColor }}
                >
                  GET TICKETS
                </span>
              </div>
            </div>
          </div>
        )

      case "minimal":
        return (
          <div className="absolute inset-0 bg-zinc-950">
            {/* Subtle gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-zinc-950" />

            {/* Content - elegant spacing */}
            <div className="absolute inset-0 p-4 flex flex-col">
              {/* Small accent line */}
              <div
                className="w-8 h-0.5 mb-3 opacity-60"
                style={{ backgroundColor: accentColor }}
              />

              {/* Subtle flyer hint */}
              <div className="w-full aspect-[4/5] max-h-[35%] bg-white/[0.03] border border-white/[0.08] mb-auto" />

              {/* Bottom content - refined */}
              <div className="mt-auto">
                {/* Title - elegant, not all caps */}
                <div className={`text-[11px] text-white font-medium tracking-wide mb-1 ${typographyClass}`}>
                  Event Name
                </div>

                {/* Date - refined */}
                <div className="text-[7px] text-white/30 tracking-wide mb-3">
                  January 15, 2025
                </div>

                {/* CTA - minimal pill */}
                <div
                  className="inline-flex items-center px-3 py-1"
                  style={{ backgroundColor: accentColor }}
                >
                  <span className="text-[6px] text-black font-medium tracking-wider">
                    RSVP
                  </span>
                </div>
              </div>
            </div>
          </div>
        )

      case "tilt":
        return (
          <div className="absolute inset-0 bg-black overflow-hidden">
            {/* Chaotic background elements */}
            <div
              className="absolute -top-4 -left-4 w-20 h-20 border-[6px] rotate-[15deg]"
              style={{ borderColor: accentColor }}
            />
            <div
              className="absolute -bottom-6 -right-6 w-24 h-24 -rotate-[20deg]"
              style={{ backgroundColor: accentColor, opacity: 0.25 }}
            />
            <div className="absolute top-1/3 right-0 w-12 h-12 border-4 border-white rotate-45 opacity-30" />
            <div
              className="absolute bottom-1/4 left-2 w-6 h-6"
              style={{ backgroundColor: accentColor, opacity: 0.4 }}
            />

            {/* Diagonal stripe */}
            <div
              className="absolute top-0 left-1/2 w-1 h-full rotate-[30deg] origin-top"
              style={{ backgroundColor: accentColor, opacity: 0.3 }}
            />

            {/* Central content - chaotic alignment */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
              {/* Title - bold, rotated */}
              <div
                className={`text-[14px] font-black tracking-tight -rotate-3 mb-1 ${typographyClass}`}
                style={{ color: accentColor }}
              >
                EVENT
              </div>

              {/* Date - counter rotated */}
              <div className="font-mono text-[8px] text-white rotate-2 mb-4 tracking-wider">
                SAT 15 JAN
              </div>

              {/* CTA - rotated solid block */}
              <div
                className="px-3 py-1.5 -rotate-2"
                style={{ backgroundColor: accentColor }}
              >
                <span className="font-mono text-[7px] font-black text-black tracking-wider">
                  TICKETS
                </span>
              </div>
            </div>
          </div>
        )

      case "editorial":
        return (
          <div className="absolute inset-0 bg-neutral-900 overflow-hidden">
            {/* Layered composition */}
            <div className="absolute inset-0">
              {/* Background texture hint */}
              <div className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: `repeating-linear-gradient(0deg, white 0px, white 1px, transparent 1px, transparent 4px)`,
                }}
              />

              {/* Large flyer - editorial crop */}
              <div className="absolute top-0 left-0 right-4 bottom-1/3 bg-white/[0.08]">
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent" />
              </div>

              {/* Editorial text layout */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                {/* Category tag */}
                <div
                  className="text-[5px] font-mono tracking-[0.3em] mb-1 uppercase"
                  style={{ color: accentColor }}
                >
                  Music Event
                </div>

                {/* Title - editorial style */}
                <div className={`text-[12px] font-medium tracking-tight leading-tight mb-1.5 ${typographyClass}`}>
                  <span className="text-white">Event</span>
                  <br />
                  <span className="text-white/60">Name</span>
                </div>

                {/* Meta info - magazine style */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-[6px] text-white/40 font-mono">JAN 15</div>
                  <div className="w-px h-2 bg-white/20" />
                  <div className="text-[6px] text-white/40 font-mono">10PM</div>
                </div>

                {/* CTA - understated */}
                <div className="flex items-center gap-1">
                  <div
                    className="w-4 h-4 flex items-center justify-center"
                    style={{ backgroundColor: accentColor }}
                  >
                    <span className="text-[6px] text-black font-bold">→</span>
                  </div>
                  <span className="text-[6px] text-white/50 font-mono tracking-wider">TICKETS</span>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-8 w-full min-w-0">
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

          {/* Navigation arrows - mobile only */}
          <div className="flex sm:hidden items-center gap-2">
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

        {/* Template Cards Container */}
        {/* Mobile: Carousel with snap | Desktop: Horizontal scroll grid */}
        <div className="relative -mx-4 sm:mx-0 overflow-x-auto overflow-y-visible sm:overflow-visible">
          <div
            ref={carouselRef}
            onScroll={handleScroll}
            className="flex gap-3 sm:overflow-x-auto scrollbar-hide sm:pb-2 px-4 sm:px-0 min-w-0"
            style={{
              scrollSnapType: isMobile ? "x mandatory" : "none",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {/* Mobile padding spacer for peek effect */}
            <div className="sm:hidden flex-shrink-0 w-4" />

            {TEMPLATES.map((template, index) => {
              const isSelected = selectedTemplate === template.id
              const isActive = activeIndex === index

              return (
                <div
                  key={template.id}
                  data-template-card
                  onClick={() => selectTemplate(template.id, index)}
                  className="flex-shrink-0 snap-center sm:snap-none w-[200px] sm:w-[220px]"
                >
                  <div
                    className={`
                      relative border-2 transition-all duration-300 cursor-pointer group
                      ${isSelected
                        ? "border-[#ff1493] bg-[#ff1493]/5"
                        : isActive && isMobile
                          ? "border-white/30 bg-white/[0.02]"
                          : "border-white/10 bg-white/[0.01] sm:hover:border-white/30"
                      }
                    `}
                  >
                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="absolute -top-px -right-px w-8 h-8 bg-[#ff1493] flex items-center justify-center z-10">
                        <Check className="w-4 h-4 text-black" />
                      </div>
                    )}

                    {/* Template Preview */}
                    <div className="h-48 sm:h-52 relative overflow-hidden">
                      {renderTemplatePreview(template.id)}

                      {/* Hover overlay - desktop only */}
                      <div className={`
                        absolute inset-0 bg-black/70 flex items-center justify-center
                        opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200
                        ${isSelected ? "hidden" : ""}
                      `}>
                        <span className="text-[10px] font-mono tracking-wider text-white/90">
                          CLICK TO SELECT
                        </span>
                      </div>
                    </div>

                    {/* Template Info */}
                    <div className="p-3 border-t border-white/10">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className="font-mono font-bold text-xs tracking-wide">{template.name}</h4>
                        {isSelected && (
                          <span className="text-[8px] font-mono px-1.5 py-0.5 bg-[#ff1493] text-black">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-mono text-white/40">{template.description}</p>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Mobile padding spacer for peek effect */}
            <div className="sm:hidden flex-shrink-0 w-4" />
          </div>
        </div>

        {/* Carousel indicators - mobile only */}
        <div className="flex sm:hidden justify-center gap-2 mt-4 px-4">
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
          className="flex items-center gap-3 overflow-x-auto overflow-y-visible scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap py-1"
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
