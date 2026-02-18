"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import {
  Plus,
  Trash2,
  Lock,
  Calendar,
  MapPin,
  Users,
  Sparkles,
  Loader2,
  Image as ImageIcon,
  ChevronDown,
  Palette,
  Clock,
  Zap,
} from "lucide-react"
import Image from "next/image"
import { FlyerUpload } from "@/components/FlyerUpload"
import { AuthGuard } from "@/components/AuthGuard"
import { ArtistAutocomplete, RecentArtists } from "@/components/dashboard/ArtistAutocomplete"
import { useAftie } from "@/components/aftie/AftieProvider"
import { RecurrenceSelector, defaultRecurrenceConfig, type RecurrenceConfig } from "@/components/events/RecurrenceSelector"
import { useAccentColor } from "@/hooks/useAccentColor"

const US_CITIES = [
  "New York", "Brooklyn", "Charlotte", "Raleigh", "Los Angeles", "Miami",
  "Las Vegas", "Chicago", "Atlanta", "Houston", "Dallas", "Phoenix",
  "San Francisco", "Detroit", "Denver", "Seattle", "Portland", "Austin",
  "Nashville", "Philadelphia", "Boston", "Washington DC", "New Orleans",
]

const ACCENT_COLORS = [
  { value: "#ff1493", name: "Hot Pink" },
  { value: "#00ff88", name: "Neon Green" },
  { value: "#00d4ff", name: "Cyan" },
  { value: "#ff6b00", name: "Orange" },
  { value: "#a855f7", name: "Purple" },
  { value: "#ffd700", name: "Gold" },
]

interface LineupArtist {
  name: string
  role: string
  imageUrl: string
  socialUrl: string
  showtime?: string      // e.g., "10:00 PM"
  showShowtime?: boolean // Toggle to show/hide time on public page
}

function NewEventForm() {
  const router = useRouter()
  const uiAccent = useAccentColor() // Organizer's UI accent from settings
  const [loading, setLoading] = useState(false)
  const [flyerUrl, setFlyerUrl] = useState<string | null>(null)
  const [city, setCity] = useState<string>("")
  const [timezone, setTimezone] = useState<string>("America/New_York")
  const [ageRestriction, setAgeRestriction] = useState<string>("21")
  const [title, setTitle] = useState<string>("")
  const [description, setDescription] = useState<string>("")

  // Underground features
  const [isAddressHidden, setIsAddressHidden] = useState(false)
  const [eventAccentColor, setEventAccentColor] = useState<string>("#ff1493") // Event's own accent
  const [lineup, setLineup] = useState<LineupArtist[]>([])

  // Event type: Ticketed vs RSVP
  const [isRsvpOnly, setIsRsvpOnly] = useState(false)
  const [rsvpCapacity, setRsvpCapacity] = useState<string>("")
  const [rsvpAllowPlusOnes, setRsvpAllowPlusOnes] = useState(false)
  const [rsvpMaxPlusOnes, setRsvpMaxPlusOnes] = useState<string>("1")

  // Event expiration
  const [expiresAfter, setExpiresAfter] = useState<string>("24h")

  // Date shortcuts
  const [startsAt, setStartsAt] = useState<string>("")
  const [endsAt, setEndsAt] = useState<string>("")
  const [endTimeMode, setEndTimeMode] = useState<"late" | "custom">("late")

  // Expandable sections
  const [showLineup, setShowLineup] = useState(false)
  const [showStyle, setShowStyle] = useState(false)

  // Recurring events
  const [recurrence, setRecurrence] = useState<RecurrenceConfig>(defaultRecurrenceConfig)

  // AI Summarization
  const [isSummarizing, setIsSummarizing] = useState(false)
  const { isBetaEnabled: isAftieEnabled } = useAftie()

  // Form validation
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const formRef = useRef<HTMLFormElement>(null)

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const markTouched = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!title.trim()) {
      newErrors.title = "Event title is required"
    }

    if (!startsAt) {
      newErrors.startsAt = "Start date and time is required"
    } else {
      const startDate = new Date(startsAt)
      if (startDate < new Date()) {
        newErrors.startsAt = "Start time must be in the future"
      }
    }

    if (endTimeMode === "custom" && endsAt) {
      const startDate = new Date(startsAt)
      const endDate = new Date(endsAt)
      if (endDate <= startDate) {
        newErrors.endsAt = "End time must be after start time"
      }
    }

    // Get form data for uncontrolled inputs
    const formData = formRef.current ? new FormData(formRef.current) : null
    const venueName = formData?.get("venueName") as string || ""
    const venueAddress = formData?.get("venueAddress") as string || ""

    if (!venueName.trim()) {
      newErrors.venueName = "Venue name is required"
    }

    if (!venueAddress.trim()) {
      newErrors.venueAddress = "Venue address is required"
    }

    if (!city) {
      newErrors.city = "City is required"
    }

    setErrors(newErrors)

    // Mark all fields as touched on submit attempt
    setTouched({
      title: true,
      startsAt: true,
      venueName: true,
      venueAddress: true,
      city: true,
    })

    if (Object.keys(newErrors).length > 0) {
      // Scroll to first error
      const firstErrorField = Object.keys(newErrors)[0]
      const element = document.querySelector(`[data-field="${firstErrorField}"]`)
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" })
      }
      return false
    }

    return true
  }

  // Date shortcut helpers
  const getTonight = () => {
    const now = new Date()
    // Set to midnight tonight (start of next day)
    const tonight = new Date(now)
    tonight.setHours(24, 0, 0, 0) // Midnight = start of tomorrow
    return tonight
  }

  const getTomorrowNight = () => {
    const tonight = getTonight()
    const tomorrow = new Date(tonight)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow
  }

  const formatDateForInput = (date: Date) => {
    // Format as YYYY-MM-DDTHH:mm for datetime-local input
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const setTonightShortcut = () => {
    const tonight = getTonight()
    setStartsAt(formatDateForInput(tonight))
    setEndTimeMode("late")
    setEndsAt("")
  }

  const setTomorrowShortcut = () => {
    const tomorrow = getTomorrowNight()
    setStartsAt(formatDateForInput(tomorrow))
    setEndTimeMode("late")
    setEndsAt("")
  }

  const getTomorrowDateStr = () => {
    const tomorrow = getTomorrowNight()
    return tomorrow.toLocaleDateString("en-US", { day: "numeric" })
  }

  const getTomorrowOrdinal = () => {
    const day = parseInt(getTomorrowDateStr())
    if (day > 3 && day < 21) return "th"
    switch (day % 10) {
      case 1: return "st"
      case 2: return "nd"
      case 3: return "rd"
      default: return "th"
    }
  }

  const summarizeDescription = async () => {
    if (!description.trim() || description.length < 50) {
      toast.error("Description too short to summarize")
      return
    }
    try {
      setIsSummarizing(true)
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: description }),
      })
      const data = await res.json()
      if (data.summary) {
        setDescription(data.summary)
        toast.success("Description summarized")
      }
    } catch {
      toast.error("Failed to summarize")
    } finally {
      setIsSummarizing(false)
    }
  }

  const addArtist = () => {
    setLineup([...lineup, { name: "", role: "", imageUrl: "", socialUrl: "", showtime: "", showShowtime: true }])
  }

  const removeArtist = (index: number) => {
    setLineup(lineup.filter((_, i) => i !== index))
  }

  const updateArtist = (index: number, field: keyof LineupArtist, value: string | boolean) => {
    setLineup(lineup.map((artist, i) =>
      i === index ? { ...artist, [field]: value } : artist
    ))
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!validateForm()) {
      toast.error("Please fix the errors below")
      return
    }

    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const cleanLineup = lineup.filter(a => a.name.trim() !== "")

    // Base event/template data
    const eventData = {
      title: formData.get("title"),
      description: formData.get("description"),
      startsAt: startsAt || formData.get("startsAt"),
      endsAt: endTimeMode === "custom" && endsAt ? endsAt : null,
      timezone: timezone,
      venueName: formData.get("venueName"),
      venueAddress: formData.get("venueAddress"),
      city: city,
      state: formData.get("state"),
      ageRestriction: ageRestriction === "all" ? null : parseInt(ageRestriction),
      flyerUrl: flyerUrl,
      isAddressHidden,
      accentColor: eventAccentColor,
      lineup: cleanLineup.length > 0 ? cleanLineup : null,
      // RSVP settings
      isRsvpOnly,
      rsvpCapacity: rsvpCapacity ? parseInt(rsvpCapacity) : null,
      rsvpAllowPlusOnes,
      rsvpMaxPlusOnes: parseInt(rsvpMaxPlusOnes),
      // Expiration
      expiresAfter,
    }

    try {
      let res: Response
      let successMessage: string

      if (recurrence.enabled) {
        // Create recurring event series
        const seriesData = {
          title: eventData.title,
          recurrencePattern: recurrence.pattern,
          dayOfWeek: recurrence.dayOfWeek,
          weekOfMonth: recurrence.weekOfMonth,
          dayOfMonth: recurrence.dayOfMonth,
          startsAt: eventData.startsAt,
          endsAt: recurrence.endType === "date" ? recurrence.endDate : null,
          maxOccurrences: recurrence.endType === "count" ? recurrence.occurrenceCount : null,
          timezone: eventData.timezone,
          generateCount: recurrence.endType === "count" ? recurrence.occurrenceCount : 8,
          templateData: {
            ...eventData,
            durationMinutes: endTimeMode === "custom" && endsAt && startsAt
              ? Math.round((new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60000)
              : null,
          },
        }

        res = await fetch("/api/v1/event-series", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(seriesData),
        })

        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.message || error.error || "Failed to create event series")
        }

        const result = await res.json()
        successMessage = `Created series with ${result.generatedCount} events!`
        toast.success(successMessage)
        // Navigate to the first event in the series
        if (result.events && result.events.length > 0) {
          router.push(`/d/events/${result.events[0].id}`)
        } else {
          router.push("/d/events")
        }
      } else {
        // Create single event
        res = await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eventData),
        })

        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.message || "Failed to create event")
        }

        const event = await res.json()
        successMessage = isRsvpOnly ? "RSVP event created!" : "Event created! Now add ticket tiers."
        toast.success(successMessage)
        router.push(`/d/events/${event.id}`)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-mono font-bold tracking-tight">NEW EVENT</h1>
          <p className="text-white/40 text-xs font-mono mt-0.5">Set up your party and start selling</p>
        </div>
        {/* <button
          type="button"
          onClick={() => toast("Afty AI coming soon!", { icon: "🪄" })}
          className="flex items-center gap-2 px-3 py-2 border border-purple-500/30 bg-purple-500/5 text-purple-400 text-xs font-mono tracking-wider hover:border-purple-500/50 hover:bg-purple-500/10 transition-all flex-shrink-0"
        >
          <span>🪄</span>
          <span className="hidden sm:inline">Afty AI</span>
        </button> */}
      </div>

      <div className="max-w-6xl mx-auto">

        <form ref={formRef} onSubmit={onSubmit} noValidate>
          <div className="grid lg:grid-cols-[1fr_380px] gap-6 lg:gap-8">
            {/* Main Content */}
            <div className="space-y-4 md:space-y-6 order-2 lg:order-1">
              {/* Flyer Upload - Mobile Only (inline) */}
              <div className="lg:hidden">
                <SectionCard
                  icon={<ImageIcon className="w-4 h-4" />}
                  title="FLYER"
                  color={uiAccent}
                  compact
                >
                  <FlyerUpload value={flyerUrl} onChange={setFlyerUrl} disabled={loading} />
                </SectionCard>
              </div>

              {/* Event Type Selector */}
              <div role="group" aria-label="Event type" className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  aria-pressed={!isRsvpOnly}
                  onClick={() => setIsRsvpOnly(false)}
                  className={`p-4 border transition-all text-left ${
                    !isRsvpOnly
                      ? "border-[#ff1493]/50 bg-[#ff1493]/5"
                      : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <svg className={`w-5 h-5 ${!isRsvpOnly ? "text-[#ff1493]" : "text-white/30"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                    <span className={`font-mono text-sm font-bold ${!isRsvpOnly ? "text-white" : "text-white/60"}`}>
                      TICKETED
                    </span>
                  </div>
                  <p className="text-[10px] text-white/40 font-mono">
                    Sell tickets with multiple tiers and pricing
                  </p>
                </button>
                <button
                  type="button"
                  aria-pressed={isRsvpOnly}
                  onClick={() => setIsRsvpOnly(true)}
                  className={`p-4 border transition-all text-left ${
                    isRsvpOnly
                      ? "border-[#00ff88]/50 bg-[#00ff88]/5"
                      : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <svg className={`w-5 h-5 ${isRsvpOnly ? "text-[#00ff88]" : "text-white/30"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className={`font-mono text-sm font-bold ${isRsvpOnly ? "text-white" : "text-white/60"}`}>
                      RSVP ONLY
                    </span>
                  </div>
                  <p className="text-[10px] text-white/40 font-mono">
                    Free event with guest list management
                  </p>
                </button>
              </div>

              {/* RSVP Settings (when RSVP is selected) */}
              {isRsvpOnly && (
                <SectionCard
                  icon={<Users className="w-4 h-4" />}
                  title="RSVP SETTINGS"
                  color="#00ff88"
                >
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-mono text-white/40 tracking-widest mb-2">
                        CAPACITY (leave empty for unlimited)
                      </label>
                      <Input
                        type="number"
                        min="1"
                        aria-label="RSVP capacity (leave empty for unlimited)"
                        value={rsvpCapacity}
                        onChange={(e) => setRsvpCapacity(e.target.value)}
                        placeholder="e.g., 100"
                        className="h-12 bg-black border-white/10 font-mono placeholder:text-white/20 focus:border-white/30 focus:ring-0"
                      />
                    </div>

                    <div
                      role="button"
                      tabIndex={0}
                      aria-label="Allow guests to bring plus ones"
                      aria-pressed={rsvpAllowPlusOnes}
                      onClick={() => setRsvpAllowPlusOnes(!rsvpAllowPlusOnes)}
                      onKeyDown={(e) => e.key === "Enter" && setRsvpAllowPlusOnes(!rsvpAllowPlusOnes)}
                      className={`w-full flex items-center justify-between p-4 border transition-all cursor-pointer ${
                        rsvpAllowPlusOnes
                          ? "border-[#00ff88]/50 bg-[#00ff88]/5"
                          : "border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Users className={`w-4 h-4 ${rsvpAllowPlusOnes ? "text-[#00ff88]" : "text-white/30"}`} />
                        <div className="text-left">
                          <p className="font-mono text-sm">Allow +1s</p>
                          <p className="text-[10px] text-white/40 font-mono">
                            Let guests bring additional people
                          </p>
                        </div>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <Switch checked={rsvpAllowPlusOnes} onCheckedChange={setRsvpAllowPlusOnes} />
                      </div>
                    </div>

                    {rsvpAllowPlusOnes && (
                      <div>
                        <label className="block text-[10px] font-mono text-white/40 tracking-widest mb-2">
                          MAX +1s PER GUEST
                        </label>
                        <Select value={rsvpMaxPlusOnes} onValueChange={setRsvpMaxPlusOnes}>
                          <SelectTrigger aria-label="Maximum plus-ones per guest" className="h-12 bg-black border-white/10 font-mono">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-black border-white/10">
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="3">3</SelectItem>
                            <SelectItem value="4">4</SelectItem>
                            <SelectItem value="5">5</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </SectionCard>
              )}

              {/* Event Details */}
              <SectionCard
                icon={<Sparkles className="w-4 h-4" />}
                title="EVENT DETAILS"
                color={errors.title && touched.title ? "#ef4444" : uiAccent}
              >
                <div className="space-y-4">
                  <div data-field="title">
                    <label className="block text-[10px] font-mono text-white/40 tracking-widest mb-2">
                      TITLE *
                    </label>
                    <Input
                      name="title"
                      aria-label="Event title"
                      aria-required="true"
                      aria-describedby={errors.title && touched.title ? "title-error" : undefined}
                      placeholder="e.g., VOID — Warehouse Session"
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value)
                        clearError("title")
                      }}
                      onBlur={() => markTouched("title")}
                      className={`h-12 md:h-14 bg-black font-mono text-lg placeholder:text-white/20 focus:ring-0 ${
                        errors.title && touched.title
                          ? "border-red-500 focus:border-red-500"
                          : "border-white/10 focus:border-white/30"
                      }`}
                    />
                    {errors.title && touched.title && (
                      <p id="title-error" role="alert" className="text-red-400 text-xs font-mono mt-1.5">{errors.title}</p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[10px] font-mono text-white/40 tracking-widest">
                        DESCRIPTION
                      </label>
                      {isAftieEnabled && description.length >= 50 && (
                        <button
                          type="button"
                          onClick={summarizeDescription}
                          disabled={isSummarizing}
                          className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono text-white/40 hover:text-[#ff1493] hover:bg-[#ff1493]/5 border border-white/10 hover:border-[#ff1493]/30 transition-all disabled:opacity-50"
                        >
                          {isSummarizing ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Sparkles className="w-3 h-3" />
                          )}
                          <span>SUMMARIZE</span>
                        </button>
                      )}
                    </div>
                    <Textarea
                      name="description"
                      aria-label="Event description"
                      placeholder="Tell people what to expect..."
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="bg-black border-white/10 font-mono placeholder:text-white/20 focus:border-white/30 focus:ring-0 resize-none"
                    />
                  </div>
                </div>
              </SectionCard>

              {/* Date & Time */}
              <SectionCard
                icon={<Calendar className="w-4 h-4" />}
                title="DATE & TIME"
                color={errors.startsAt && touched.startsAt ? "#ef4444" : "#00d4ff"}
              >
                {/* Quick Date Shortcuts */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    type="button"
                    onClick={setTonightShortcut}
                    className={`flex items-center gap-2 px-3 py-2 border text-xs font-mono transition-all ${
                      startsAt && startsAt === formatDateForInput(getTonight())
                        ? "border-[#00d4ff]/50 bg-[#00d4ff]/10 text-[#00d4ff]"
                        : "border-white/10 hover:border-[#00d4ff]/30 hover:bg-[#00d4ff]/5 text-white/60 hover:text-white"
                    }`}
                  >
                    <Zap className="w-3 h-3" />
                    Tonight
                  </button>
                  <button
                    type="button"
                    onClick={setTomorrowShortcut}
                    className={`flex items-center gap-2 px-3 py-2 border text-xs font-mono transition-all ${
                      startsAt && startsAt === formatDateForInput(getTomorrowNight())
                        ? "border-[#00d4ff]/50 bg-[#00d4ff]/10 text-[#00d4ff]"
                        : "border-white/10 hover:border-[#00d4ff]/30 hover:bg-[#00d4ff]/5 text-white/60 hover:text-white"
                    }`}
                  >
                    <Calendar className="w-3 h-3" />
                    Tomorrow night ({getTomorrowDateStr()}{getTomorrowOrdinal()})
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div data-field="startsAt">
                    <label className="block text-[10px] font-mono text-white/40 tracking-widest mb-2">
                      STARTS *
                    </label>
                    <Input
                      name="startsAt"
                      type="datetime-local"
                      aria-label="Event start date and time"
                      aria-required="true"
                      aria-describedby={errors.startsAt && touched.startsAt ? "startsAt-error" : undefined}
                      value={startsAt}
                      onChange={(e) => {
                        setStartsAt(e.target.value)
                        clearError("startsAt")
                      }}
                      onBlur={() => markTouched("startsAt")}
                      className={`h-12 bg-black font-mono focus:ring-0 ${
                        errors.startsAt && touched.startsAt
                          ? "border-red-500 focus:border-red-500"
                          : "border-white/10 focus:border-white/30"
                      }`}
                    />
                    {errors.startsAt && touched.startsAt && (
                      <p id="startsAt-error" role="alert" className="text-red-400 text-xs font-mono mt-1.5">{errors.startsAt}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-white/40 tracking-widest mb-2">
                      ENDS
                    </label>
                    {/* End Time Mode Toggle */}
                    <div role="group" aria-label="End time mode" className="flex gap-2 mb-2">
                      <button
                        type="button"
                        aria-pressed={endTimeMode === "late"}
                        onClick={() => setEndTimeMode("late")}
                        className={`flex-1 h-8 text-[10px] font-mono tracking-wider transition-all ${
                          endTimeMode === "late"
                            ? "bg-[#00d4ff]/10 border border-[#00d4ff]/50 text-[#00d4ff]"
                            : "border border-white/10 text-white/40 hover:border-white/20"
                        }`}
                      >
                        LATE
                      </button>
                      <button
                        type="button"
                        aria-pressed={endTimeMode === "custom"}
                        onClick={() => setEndTimeMode("custom")}
                        className={`flex-1 h-8 text-[10px] font-mono tracking-wider transition-all ${
                          endTimeMode === "custom"
                            ? "bg-[#00d4ff]/10 border border-[#00d4ff]/50 text-[#00d4ff]"
                            : "border border-white/10 text-white/40 hover:border-white/20"
                        }`}
                      >
                        SET TIME
                      </button>
                    </div>
                    {endTimeMode === "custom" ? (
                      <Input
                        name="endsAt"
                        type="datetime-local"
                        aria-label="Event end date and time"
                        value={endsAt}
                        onChange={(e) => setEndsAt(e.target.value)}
                        className="h-12 bg-black border-white/10 font-mono focus:border-white/30 focus:ring-0"
                      />
                    ) : (
                      <div className="h-12 bg-black border border-white/10 flex items-center px-4">
                        <span className="font-mono text-white/40 text-sm">Until late...</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-[10px] font-mono text-white/40 tracking-widest mb-2">
                      TIMEZONE
                    </label>
                    <Select value={timezone} onValueChange={setTimezone}>
                      <SelectTrigger aria-label="Timezone" className="h-12 bg-black border-white/10 font-mono">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-black border-white/10">
                        <SelectItem value="America/New_York">Eastern</SelectItem>
                        <SelectItem value="America/Chicago">Central</SelectItem>
                        <SelectItem value="America/Denver">Mountain</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-white/40 tracking-widest mb-2">
                      AGE
                    </label>
                    <Select value={ageRestriction} onValueChange={setAgeRestriction}>
                      <SelectTrigger aria-label="Age restriction" className="h-12 bg-black border-white/10 font-mono">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-black border-white/10">
                        <SelectItem value="all">All Ages</SelectItem>
                        <SelectItem value="18">18+</SelectItem>
                        <SelectItem value="21">21+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-[10px] font-mono text-white/40 tracking-widest mb-2">
                    EVENT EXPIRATION
                  </label>
                  <Select value={expiresAfter} onValueChange={setExpiresAfter}>
                    <SelectTrigger aria-label="Event expiration" className="h-12 bg-black border-white/10 font-mono">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-white/10">
                      <SelectItem value="on_end">When event ends</SelectItem>
                      <SelectItem value="12h">12 hours after end</SelectItem>
                      <SelectItem value="24h">24 hours after end</SelectItem>
                      <SelectItem value="48h">48 hours after end</SelectItem>
                      <SelectItem value="1w">1 week after end</SelectItem>
                      <SelectItem value="never">Never (manual only)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-white/30 font-mono mt-2">
                    Event page will be hidden after this time
                  </p>
                </div>
              </SectionCard>

              {/* Recurring Events */}
              <RecurrenceSelector
                value={recurrence}
                onChange={setRecurrence}
                startsAt={startsAt}
                disabled={loading}
              />

              {/* Venue */}
              <SectionCard
                icon={<MapPin className="w-4 h-4" />}
                title="VENUE"
                color={errors.venueName || errors.venueAddress || errors.city ? "#ef4444" : "#00ff88"}
              >
                <div className="space-y-4">
                  <div data-field="venueName">
                    <label className="block text-[10px] font-mono text-white/40 tracking-widest mb-2">
                      VENUE NAME *
                    </label>
                    <Input
                      name="venueName"
                      aria-label="Venue name"
                      aria-required="true"
                      aria-describedby={errors.venueName && touched.venueName ? "venueName-error" : undefined}
                      placeholder="e.g., The Warehouse"
                      onChange={() => clearError("venueName")}
                      onBlur={() => markTouched("venueName")}
                      className={`h-12 bg-black font-mono placeholder:text-white/20 focus:ring-0 ${
                        errors.venueName && touched.venueName
                          ? "border-red-500 focus:border-red-500"
                          : "border-white/10 focus:border-white/30"
                      }`}
                    />
                    {errors.venueName && touched.venueName && (
                      <p id="venueName-error" role="alert" className="text-red-400 text-xs font-mono mt-1.5">{errors.venueName}</p>
                    )}
                  </div>

                  <div data-field="venueAddress">
                    <label className="block text-[10px] font-mono text-white/40 tracking-widest mb-2">
                      ADDRESS *
                    </label>
                    <Input
                      name="venueAddress"
                      aria-label="Venue address"
                      aria-required="true"
                      aria-describedby={errors.venueAddress && touched.venueAddress ? "venueAddress-error" : undefined}
                      placeholder="e.g., 123 Industrial Ave"
                      onChange={() => clearError("venueAddress")}
                      onBlur={() => markTouched("venueAddress")}
                      className={`h-12 bg-black font-mono placeholder:text-white/20 focus:ring-0 ${
                        errors.venueAddress && touched.venueAddress
                          ? "border-red-500 focus:border-red-500"
                          : "border-white/10 focus:border-white/30"
                      }`}
                    />
                    {errors.venueAddress && touched.venueAddress && (
                      <p id="venueAddress-error" role="alert" className="text-red-400 text-xs font-mono mt-1.5">{errors.venueAddress}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div data-field="city">
                      <label className="block text-[10px] font-mono text-white/40 tracking-widest mb-2">
                        CITY *
                      </label>
                      <Select
                        value={city}
                        onValueChange={(value) => {
                          setCity(value)
                          clearError("city")
                          markTouched("city")
                        }}
                      >
                        <SelectTrigger
                          aria-label="City"
                          aria-required="true"
                          aria-describedby={errors.city && touched.city ? "city-error" : undefined}
                          className={`h-12 bg-black font-mono ${
                          errors.city && touched.city
                            ? "border-red-500"
                            : "border-white/10"
                        }`}>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-white/10 max-h-60">
                          {US_CITIES.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.city && touched.city && (
                        <p id="city-error" role="alert" className="text-red-400 text-xs font-mono mt-1.5">{errors.city}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-white/40 tracking-widest mb-2">
                        STATE
                      </label>
                      <Input
                        name="state"
                        aria-label="State"
                        placeholder="e.g., NY"
                        className="h-12 bg-black border-white/10 font-mono placeholder:text-white/20 focus:border-white/30 focus:ring-0"
                      />
                    </div>
                  </div>

                  {/* Secret Location Toggle */}
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label="Hide event location until ticket purchase"
                    aria-pressed={isAddressHidden}
                    onClick={() => setIsAddressHidden(!isAddressHidden)}
                    onKeyDown={(e) => e.key === "Enter" && setIsAddressHidden(!isAddressHidden)}
                    className={`w-full flex items-center justify-between p-4 border transition-all cursor-pointer ${
                      isAddressHidden
                        ? "border-[#ff6b00]/50 bg-[#ff6b00]/5"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Lock className={`w-4 h-4 ${isAddressHidden ? "text-[#ff6b00]" : "text-white/30"}`} />
                      <div className="text-left">
                        <p className="font-mono text-sm">Secret Location</p>
                        <p className="text-[10px] text-white/40 font-mono">
                          Address revealed after purchase
                        </p>
                      </div>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <Switch checked={isAddressHidden} onCheckedChange={setIsAddressHidden} />
                    </div>
                  </div>
                </div>
              </SectionCard>

              {/* Lineup - Expandable */}
              <ExpandableSection
                icon={<Users className="w-4 h-4" />}
                title="LINEUP"
                subtitle="Add artists (optional)"
                color="#a855f7"
                isOpen={showLineup}
                onToggle={() => setShowLineup(!showLineup)}
                badge={lineup.length > 0 ? lineup.length.toString() : undefined}
              >
                <div className="space-y-3">
                  {lineup.map((artist, index) => (
                    <div key={index} className="p-4 border border-white/10 bg-white/[0.02] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-[#a855f7] tracking-widest">
                          ARTIST {index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeArtist(index)}
                          aria-label={`Remove artist ${index + 1} from lineup`}
                          className="p-1 text-white/30 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <ArtistAutocomplete
                          value={artist.name}
                          onChange={(value) => updateArtist(index, "name", value)}
                          onSelectArtist={(pastArtist) => {
                            updateArtist(index, "name", pastArtist.name)
                            if (pastArtist.role) updateArtist(index, "role", pastArtist.role)
                            if (pastArtist.imageUrl) updateArtist(index, "imageUrl", pastArtist.imageUrl)
                            if (pastArtist.socialUrl) updateArtist(index, "socialUrl", pastArtist.socialUrl)
                          }}
                          placeholder="Name"
                        />
                        <Input
                          value={artist.role}
                          onChange={(e) => updateArtist(index, "role", e.target.value)}
                          aria-label={`Role for artist ${index + 1}`}
                          placeholder="Role"
                          className="h-10 bg-black border-white/10 font-mono text-sm"
                        />
                      </div>
                      {/* Showtime row */}
                      <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                        <div className="flex items-center gap-2 flex-1">
                          <Clock className="w-4 h-4 text-white/30" />
                          <Input
                            type="time"
                            value={artist.showtime || ""}
                            onChange={(e) => updateArtist(index, "showtime", e.target.value)}
                            aria-label={`Showtime for artist ${index + 1}`}
                            className="h-8 w-28 bg-black border-white/10 font-mono text-xs"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-white/40">Show time</span>
                          <Switch
                            checked={artist.showShowtime ?? true}
                            onCheckedChange={(checked) => updateArtist(index, "showShowtime", checked)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addArtist}
                    className="w-full h-12 border border-dashed border-white/20 hover:border-[#a855f7]/50 hover:bg-[#a855f7]/5 font-mono text-sm text-white/50 hover:text-white flex items-center justify-center gap-2 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    ADD ARTIST
                  </button>

                  {/* Quick add from history */}
                  <RecentArtists
                    excludeNames={lineup.map((a) => a.name.toLowerCase())}
                    onSelect={(artist) => {
                      setLineup((prev) => [
                        ...prev,
                        {
                          name: artist.name,
                          role: artist.role || "",
                          imageUrl: artist.imageUrl || "",
                          socialUrl: artist.socialUrl || "",
                          showtime: "",
                          showShowtime: true,
                        },
                      ])
                    }}
                  />
                </div>
              </ExpandableSection>

              {/* Style - Expandable */}
              <ExpandableSection
                icon={<Palette className="w-4 h-4" />}
                title="STYLE"
                subtitle="Customize appearance"
                color={eventAccentColor}
                isOpen={showStyle}
                onToggle={() => setShowStyle(!showStyle)}
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono text-white/40 tracking-widest mb-3">
                      ACCENT COLOR
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {ACCENT_COLORS.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => setEventAccentColor(color.value)}
                          aria-label={`Select ${color.name} accent color`}
                          aria-pressed={eventAccentColor === color.value}
                          className={`w-10 h-10 md:w-12 md:h-12 transition-all ${
                            eventAccentColor === color.value
                              ? "ring-2 ring-white ring-offset-2 ring-offset-black scale-110"
                              : "hover:scale-105"
                          }`}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                      <div className="relative w-10 h-10 md:w-12 md:h-12 border border-white/20 overflow-hidden">
                        <input
                          type="color"
                          value={eventAccentColor}
                          onChange={(e) => setEventAccentColor(e.target.value)}
                          aria-label="Custom accent color"
                          className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Plus className="w-4 h-4 text-white/40" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ExpandableSection>

              {/* Submit - Mobile */}
              <div className="lg:hidden pt-4 pb-8">
                <SubmitButton loading={loading} accentColor={uiAccent} isSeries={recurrence.enabled} />
              </div>
            </div>

            {/* Sidebar - Desktop Only */}
            <div className="hidden lg:block order-1 lg:order-2">
              <div className="sticky top-8 space-y-4">
                {/* Flyer Upload */}
                <div className="border border-white/10 bg-white/[0.02]">
                  <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-white/40" />
                    <span className="text-[10px] font-mono text-white/40 tracking-widest">FLYER</span>
                  </div>
                  <div className="p-4">
                    <FlyerUpload value={flyerUrl} onChange={setFlyerUrl} disabled={loading} />
                  </div>
                </div>

                {/* Live Preview */}
                <div
                  className="border bg-white/[0.02] overflow-hidden"
                  style={{ borderColor: `${eventAccentColor}30` }}
                >
                  <div
                    className="h-1"
                    style={{ backgroundColor: eventAccentColor }}
                  />
                  <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
                    <Zap className="w-4 h-4" style={{ color: eventAccentColor }} />
                    <span className="text-[10px] font-mono text-white/40 tracking-widest">PREVIEW</span>
                  </div>
                  <div className="p-4">
                    <div className="flex gap-4">
                      {flyerUrl ? (
                        <div className="relative w-20 h-24 border border-white/10 flex-shrink-0 overflow-hidden">
                          <Image src={flyerUrl} alt="Preview" fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="w-20 h-24 border border-dashed border-white/10 flex items-center justify-center flex-shrink-0">
                          <ImageIcon className="w-6 h-6 text-white/10" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-mono font-bold text-lg truncate">
                          {title || "Event Title"}
                        </h3>
                        <p className="text-sm text-white/40 font-mono truncate mt-1">
                          {city || "City"} • {ageRestriction === "all" ? "All Ages" : `${ageRestriction}+`}
                        </p>
                        {description && (
                          <p className="text-xs text-white/30 font-mono mt-2 line-clamp-2">
                            {description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <SubmitButton loading={loading} accentColor={uiAccent} isSeries={recurrence.enabled} />

                {/* Help Text */}
                <p className="text-[10px] text-white/30 font-mono text-center px-4">
                  {recurrence.enabled
                    ? `Creating ${recurrence.endType === "count" ? recurrence.occurrenceCount : "multiple"} recurring events`
                    : isRsvpOnly
                      ? "RSVP event - guests will register without payment"
                      : "You'll add ticket tiers after creating the event"
                  }
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

function SectionCard({
  icon,
  title,
  color,
  children,
  compact = false,
}: {
  icon: React.ReactNode
  title: string
  color: string
  children: React.ReactNode
  compact?: boolean
}) {
  return (
    <div className="border border-white/10 bg-white/[0.02]">
      <div
        className="px-4 py-3 border-b border-white/10 flex items-center gap-3"
        style={{ borderLeftWidth: "3px", borderLeftColor: color }}
      >
        <span style={{ color }}>{icon}</span>
        <span className="text-[10px] font-mono text-white/60 tracking-widest">{title}</span>
      </div>
      <div className={compact ? "p-4" : "p-4 md:p-5"}>{children}</div>
    </div>
  )
}

function ExpandableSection({
  icon,
  title,
  subtitle,
  color,
  isOpen,
  onToggle,
  badge,
  children,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  color: string
  isOpen: boolean
  onToggle: () => void
  badge?: string
  children: React.ReactNode
}) {
  return (
    <div className={`border transition-all ${isOpen ? "border-white/20" : "border-white/10"}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-label={`${title}: ${subtitle}${isOpen ? " (expanded)" : " (collapsed)"}`}
        className="w-full px-4 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-all"
        style={{ borderLeftWidth: "3px", borderLeftColor: isOpen ? color : "transparent" }}
      >
        <div className="flex items-center gap-3">
          <span className={isOpen ? "" : "text-white/30"} style={{ color: isOpen ? color : undefined }}>
            {icon}
          </span>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-white/60 tracking-widest">{title}</span>
              {badge && (
                <span
                  className="text-[9px] font-mono px-1.5 py-0.5"
                  style={{ backgroundColor: `${color}20`, color }}
                >
                  {badge}
                </span>
              )}
            </div>
            <p className="text-[10px] text-white/30 font-mono">{subtitle}</p>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-white/30 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && <div className="px-4 pb-4 pt-2 border-t border-white/10">{children}</div>}
    </div>
  )
}

function SubmitButton({ loading, accentColor, isSeries }: { loading: boolean; accentColor: string; isSeries?: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full h-14 font-mono font-bold text-sm tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      style={{ backgroundColor: accentColor, color: "#000" }}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {isSeries ? "CREATING SERIES..." : "CREATING..."}
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4" />
          {isSeries ? "CREATE SERIES" : "CREATE EVENT"}
        </>
      )}
    </button>
  )
}

export default function NewEventPage() {
  return (
    <AuthGuard>
      <NewEventForm />
    </AuthGuard>
  )
}
