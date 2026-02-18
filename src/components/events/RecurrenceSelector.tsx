"use client"

import { useState, useEffect } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Repeat, Calendar, Hash, ChevronDown } from "lucide-react"
import { DAYS_OF_WEEK, WEEKS_OF_MONTH, buildRRule, getNextOccurrences } from "@/lib/recurrence"
import type { RecurrencePattern } from "@/lib/recurrence"

export interface RecurrenceConfig {
  enabled: boolean
  pattern: RecurrencePattern
  dayOfWeek: number // 0-6 (Monday-Sunday)
  weekOfMonth: number // 1-5
  dayOfMonth: number // 1-31
  endType: "never" | "count" | "date"
  occurrenceCount: number
  endDate: string
}

interface RecurrenceSelectorProps {
  value: RecurrenceConfig
  onChange: (config: RecurrenceConfig) => void
  startsAt: string
  disabled?: boolean
}

const PATTERNS = [
  { value: "weekly" as RecurrencePattern, label: "Weekly" },
  { value: "biweekly" as RecurrencePattern, label: "Every 2 weeks" },
  { value: "monthly-by-day" as RecurrencePattern, label: "Monthly (by day)" },
  { value: "monthly-by-date" as RecurrencePattern, label: "Monthly (by date)" },
]

export function RecurrenceSelector({
  value,
  onChange,
  startsAt,
  disabled = false,
}: RecurrenceSelectorProps) {
  const [preview, setPreview] = useState<Date[]>([])
  const [isExpanded, setIsExpanded] = useState(value.enabled)

  // Generate preview when config changes
  useEffect(() => {
    if (!value.enabled || !startsAt) {
      setPreview([])
      return
    }

    try {
      const rrule = buildRRule({
        pattern: value.pattern,
        dayOfWeek: value.dayOfWeek,
        weekOfMonth: value.weekOfMonth,
        dayOfMonth: value.dayOfMonth,
        startsAt: new Date(startsAt),
        endsAt: value.endType === "date" && value.endDate ? new Date(value.endDate) : undefined,
        maxOccurrences: value.endType === "count" ? value.occurrenceCount : undefined,
      })

      const dates = getNextOccurrences(rrule, 4, new Date(startsAt))
      setPreview(dates)
    } catch {
      setPreview([])
    }
  }, [value, startsAt])

  const update = (updates: Partial<RecurrenceConfig>) => {
    onChange({ ...value, ...updates })
  }

  // Auto-set dayOfWeek based on startsAt
  useEffect(() => {
    if (startsAt && value.enabled) {
      const date = new Date(startsAt)
      // Convert JS day (0=Sun) to RRule day (0=Mon)
      const jsDay = date.getDay()
      const rruleDay = jsDay === 0 ? 6 : jsDay - 1
      if (value.dayOfWeek !== rruleDay) {
        update({ dayOfWeek: rruleDay })
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startsAt, value.enabled])

  return (
    <div className="border border-white/10 bg-white/[0.02]">
      {/* Toggle Header */}
      <button
        type="button"
        onClick={() => {
          const newEnabled = !value.enabled
          setIsExpanded(newEnabled)
          update({ enabled: newEnabled })
        }}
        disabled={disabled}
        className="w-full px-4 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-all disabled:opacity-50"
        style={{ borderLeftWidth: "3px", borderLeftColor: value.enabled ? "#a855f7" : "transparent" }}
      >
        <div className="flex items-center gap-3">
          <Repeat className={`w-4 h-4 ${value.enabled ? "text-purple-400" : "text-white/30"}`} />
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-white/60 tracking-widest">RECURRING EVENT</span>
              {value.enabled && preview.length > 0 && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 bg-purple-500/20 text-purple-400">
                  {preview.length} dates
                </span>
              )}
            </div>
            <p className="text-[10px] text-white/30 font-mono">
              {value.enabled
                ? getPatternDescription(value)
                : "Create multiple occurrences on a schedule"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div onClick={(e) => e.stopPropagation()}>
            <Switch
              checked={value.enabled}
              onCheckedChange={(checked) => {
                setIsExpanded(checked)
                update({ enabled: checked })
              }}
              disabled={disabled}
            />
          </div>
          {value.enabled && (
            <ChevronDown
              className={`w-4 h-4 text-white/30 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            />
          )}
        </div>
      </button>

      {/* Expanded Options */}
      {value.enabled && isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-white/10 space-y-4">
          {/* Pattern Selection */}
          <div>
            <label className="block text-[10px] font-mono text-white/40 tracking-widest mb-2">
              REPEAT
            </label>
            <Select
              value={value.pattern}
              onValueChange={(v) => update({ pattern: v as RecurrencePattern })}
              disabled={disabled}
            >
              <SelectTrigger className="h-12 bg-black border-white/10 font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black border-white/10">
                {PATTERNS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Day/Week Selection based on pattern */}
          {(value.pattern === "weekly" || value.pattern === "biweekly") && (
            <div>
              <label className="block text-[10px] font-mono text-white/40 tracking-widest mb-2">
                ON DAY
              </label>
              <Select
                value={String(value.dayOfWeek)}
                onValueChange={(v) => update({ dayOfWeek: parseInt(v) })}
                disabled={disabled}
              >
                <SelectTrigger className="h-12 bg-black border-white/10 font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black border-white/10">
                  {DAYS_OF_WEEK.map((d) => (
                    <SelectItem key={d.value} value={String(d.value)}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {value.pattern === "monthly-by-day" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono text-white/40 tracking-widest mb-2">
                  WHICH
                </label>
                <Select
                  value={String(value.weekOfMonth)}
                  onValueChange={(v) => update({ weekOfMonth: parseInt(v) })}
                  disabled={disabled}
                >
                  <SelectTrigger className="h-12 bg-black border-white/10 font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/10">
                    {WEEKS_OF_MONTH.map((w) => (
                      <SelectItem key={w.value} value={String(w.value)}>
                        {w.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-white/40 tracking-widest mb-2">
                  DAY
                </label>
                <Select
                  value={String(value.dayOfWeek)}
                  onValueChange={(v) => update({ dayOfWeek: parseInt(v) })}
                  disabled={disabled}
                >
                  <SelectTrigger className="h-12 bg-black border-white/10 font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/10">
                    {DAYS_OF_WEEK.map((d) => (
                      <SelectItem key={d.value} value={String(d.value)}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {value.pattern === "monthly-by-date" && (
            <div>
              <label className="block text-[10px] font-mono text-white/40 tracking-widest mb-2">
                DAY OF MONTH
              </label>
              <Input
                type="number"
                min={1}
                max={31}
                value={value.dayOfMonth}
                onChange={(e) => update({ dayOfMonth: parseInt(e.target.value) || 1 })}
                disabled={disabled}
                className="h-12 bg-black border-white/10 font-mono"
              />
            </div>
          )}

          {/* End Condition */}
          <div>
            <label className="block text-[10px] font-mono text-white/40 tracking-widest mb-2">
              ENDS
            </label>
            <div className="space-y-3">
              {/* End type selector */}
              <div className="flex gap-2">
                {[
                  { value: "never" as const, label: "Never" },
                  { value: "count" as const, label: "After" },
                  { value: "date" as const, label: "On date" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => update({ endType: option.value })}
                    disabled={disabled}
                    className={`flex-1 h-10 text-[10px] font-mono tracking-wider transition-all ${
                      value.endType === option.value
                        ? "bg-purple-500/10 border border-purple-500/50 text-purple-400"
                        : "border border-white/10 text-white/40 hover:border-white/20"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {/* Conditional inputs */}
              {value.endType === "count" && (
                <div className="flex items-center gap-3">
                  <Hash className="w-4 h-4 text-white/30" />
                  <Input
                    type="number"
                    min={2}
                    max={52}
                    value={value.occurrenceCount}
                    onChange={(e) => update({ occurrenceCount: parseInt(e.target.value) || 8 })}
                    disabled={disabled}
                    className="h-10 w-20 bg-black border-white/10 font-mono text-center"
                  />
                  <span className="text-sm text-white/40 font-mono">occurrences</span>
                </div>
              )}

              {value.endType === "date" && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-white/30" />
                  <Input
                    type="date"
                    value={value.endDate}
                    onChange={(e) => update({ endDate: e.target.value })}
                    disabled={disabled}
                    className="h-10 bg-black border-white/10 font-mono"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div className="pt-3 border-t border-white/10">
              <label className="block text-[10px] font-mono text-white/40 tracking-widest mb-2">
                UPCOMING DATES PREVIEW
              </label>
              <div className="flex flex-wrap gap-2">
                {preview.map((date, i) => (
                  <span
                    key={i}
                    className="text-xs font-mono px-2 py-1 bg-purple-500/10 text-purple-300 border border-purple-500/20"
                  >
                    {date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      weekday: "short",
                    })}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function getPatternDescription(config: RecurrenceConfig): string {
  const dayName = DAYS_OF_WEEK.find((d) => d.value === config.dayOfWeek)?.label || ""
  const weekName = WEEKS_OF_MONTH.find((w) => w.value === config.weekOfMonth)?.label?.toLowerCase() || ""

  switch (config.pattern) {
    case "weekly":
      return `Every ${dayName}`
    case "biweekly":
      return `Every other ${dayName}`
    case "monthly-by-day":
      return `${weekName.charAt(0).toUpperCase() + weekName.slice(1)} ${dayName} of every month`
    case "monthly-by-date":
      return `${config.dayOfMonth}${getOrdinalSuffix(config.dayOfMonth)} of every month`
    default:
      return "Custom schedule"
  }
}

function getOrdinalSuffix(n: number): string {
  if (n > 3 && n < 21) return "th"
  switch (n % 10) {
    case 1: return "st"
    case 2: return "nd"
    case 3: return "rd"
    default: return "th"
  }
}

export const defaultRecurrenceConfig: RecurrenceConfig = {
  enabled: false,
  pattern: "weekly",
  dayOfWeek: 1, // Tuesday
  weekOfMonth: 1, // First
  dayOfMonth: 15,
  endType: "count",
  occurrenceCount: 8,
  endDate: "",
}
