"use client"

import Link from "next/link"
import { Repeat, ChevronRight } from "lucide-react"

export interface SeriesOccurrence {
  id: string
  title: string
  slug: string
  startsAt: Date
  seriesOccurrence: number | null
}

interface SeriesBadgeProps {
  seriesTitle: string
  currentOccurrence?: number | null
  upcomingOccurrences: SeriesOccurrence[]
  accentColor?: string
  variant?: "inline" | "block"
}

export function SeriesBadge({
  seriesTitle,
  currentOccurrence,
  upcomingOccurrences,
  accentColor = "#a855f7",
  variant = "inline",
}: SeriesBadgeProps) {
  if (variant === "inline") {
    return (
      <div 
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono"
        style={{ 
          borderColor: `${accentColor}40`,
          backgroundColor: `${accentColor}10`,
          color: accentColor,
        }}
      >
        <Repeat className="w-3 h-3" />
        <span>Part of {seriesTitle}</span>
        {currentOccurrence && (
          <span className="text-white/40">#{currentOccurrence}</span>
        )}
      </div>
    )
  }

  // Block variant with upcoming dates
  return (
    <div 
      className="border p-4 bg-white/[0.02]"
      style={{ borderColor: `${accentColor}30` }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Repeat className="w-4 h-4" style={{ color: accentColor }} />
        <span className="text-xs font-mono tracking-widest text-white/60">RECURRING EVENT</span>
      </div>
      
      <h3 className="font-mono font-bold text-sm mb-1" style={{ color: accentColor }}>
        {seriesTitle}
      </h3>
      
      {currentOccurrence && (
        <p className="text-[10px] text-white/40 font-mono mb-3">
          This is occurrence #{currentOccurrence}
        </p>
      )}

      {upcomingOccurrences.length > 0 && (
        <div className="space-y-2 pt-3 border-t border-white/10">
          <span className="text-[10px] font-mono tracking-widest text-white/40">
            UPCOMING IN THIS SERIES
          </span>
          <div className="space-y-1">
            {upcomingOccurrences.slice(0, 3).map((occ) => (
              <Link
                key={occ.id}
                href={`/e/${occ.slug}`}
                className="flex items-center justify-between p-2 hover:bg-white/5 transition-colors group"
              >
                <span className="text-sm text-white/80 group-hover:text-white">
                  {new Date(occ.startsAt).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/60" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
