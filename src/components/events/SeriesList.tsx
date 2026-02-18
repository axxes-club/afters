"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Repeat, Calendar, ChevronRight, MoreVertical, Plus, Trash2, RefreshCw } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

interface EventSeries {
  id: string
  title: string
  recurrenceRule: string
  timezone: string
  startsAt: string
  endsAt: string | null
  maxOccurrences: number | null
  lastGeneratedAt: string | null
  createdAt: string
  _count: {
    events: number
  }
}

interface SeriesListProps {
  onSeriesClick?: (seriesId: string) => void
}

export function SeriesList({ onSeriesClick }: SeriesListProps) {
  const [series, setSeries] = useState<EventSeries[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState<string | null>(null)

  useEffect(() => {
    fetchSeries()
  }, [])

  const fetchSeries = async () => {
    try {
      const res = await fetch("/api/v1/event-series")
      if (!res.ok) throw new Error("Failed to fetch series")
      const data = await res.json()
      setSeries(data.series || [])
    } catch (error) {
      console.error("Failed to fetch series:", error)
      toast.error("Failed to load event series")
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateMore = async (seriesId: string) => {
    setGenerating(seriesId)
    try {
      const res = await fetch(`/api/v1/event-series/${seriesId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 4 }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to generate events")
      }

      const result = await res.json()
      toast.success(`Generated ${result.generatedCount} new events`)
      fetchSeries() // Refresh the list
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate events")
    } finally {
      setGenerating(null)
    }
  }

  const handleCancelSeries = async (seriesId: string, seriesTitle: string) => {
    if (!confirm(`Cancel all future events in "${seriesTitle}"? This cannot be undone.`)) {
      return
    }

    try {
      const res = await fetch(`/api/v1/event-series/${seriesId}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to cancel series")
      }

      const result = await res.json()
      toast.success(`Cancelled ${result.cancelledEventsCount} events`)
      fetchSeries()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to cancel series")
    }
  }

  if (loading) {
    return (
      <div className="border border-white/10 bg-white/[0.02] p-8">
        <div className="flex items-center justify-center gap-2 text-white/40">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="font-mono text-sm">Loading series...</span>
        </div>
      </div>
    )
  }

  if (series.length === 0) {
    return (
      <div className="border border-dashed border-white/10 p-8 text-center">
        <Repeat className="w-8 h-8 text-white/20 mx-auto mb-3" />
        <p className="text-white/40 font-mono text-sm mb-4">No event series yet</p>
        <Link
          href="/d/events/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 text-purple-400 font-mono text-xs hover:bg-purple-500/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create recurring event
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {series.map((s) => (
        <div
          key={s.id}
          className="border border-white/10 bg-white/[0.02] hover:border-purple-500/30 transition-colors group"
        >
          <div className="p-4 flex items-center justify-between">
            <div
              className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer"
              onClick={() => onSeriesClick?.(s.id)}
            >
              <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                <Repeat className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-mono font-bold text-sm truncate">{s.title}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] font-mono text-purple-400">
                    {s._count.events} events
                  </span>
                  <span className="text-[10px] font-mono text-white/30">
                    Started {new Date(s.startsAt).toLocaleDateString()}
                  </span>
                  {s.maxOccurrences && (
                    <span className="text-[10px] font-mono text-white/30">
                      Max: {s.maxOccurrences}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleGenerateMore(s.id)}
                disabled={generating === s.id}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono text-white/50 hover:text-purple-400 border border-white/10 hover:border-purple-500/30 transition-colors disabled:opacity-50"
              >
                <Plus className={`w-3 h-3 ${generating === s.id ? "animate-spin" : ""}`} />
                Generate more
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 text-white/30 hover:text-white transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-black border-white/10">
                  <DropdownMenuItem
                    onClick={() => onSeriesClick?.(s.id)}
                    className="text-white/60 hover:text-white cursor-pointer"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    View all events
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleCancelSeries(s.id, s.title)}
                    className="text-red-400 hover:text-red-300 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Cancel series
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-purple-400 transition-colors" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
