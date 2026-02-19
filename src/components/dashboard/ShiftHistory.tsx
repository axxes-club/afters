"use client"

import { useState, useEffect } from "react"
import { Clock } from "lucide-react"

interface Shift {
  id: string
  punchedInAt: string
  punchedOutAt: string | null
  scanner: { id: string; name: string }
}

export function ShiftHistory({ eventId }: { eventId: string }) {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchShifts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  async function fetchShifts() {
    try {
      const res = await fetch(`/api/events/${eventId}/shifts`)
      if (res.ok) {
        const data = await res.json()
        setShifts(data.shifts)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  function formatDuration(start: string, end: string | null): string {
    const startMs = new Date(start).getTime()
    const endMs = end ? new Date(end).getTime() : Date.now()
    const minutes = Math.floor((endMs - startMs) / 1000 / 60)
    const hours = Math.floor(minutes / 60)
    const remaining = minutes % 60
    if (hours > 0) return `${hours}h ${remaining}m`
    return `${remaining}m`
  }

  if (loading) {
    return (
      <div className="border border-white/10 bg-white/[0.02]">
        <div className="p-8 text-center">
          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary animate-spin mx-auto" />
        </div>
      </div>
    )
  }

  if (shifts.length === 0) {
    return null
  }

  return (
    <div className="border border-white/10 bg-white/[0.02]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
        <Clock className="w-4 h-4 text-white/30" />
        <span className="text-[10px] font-mono text-white/40 tracking-widest">SHIFT HISTORY</span>
      </div>

      {/* Shifts */}
      <div className="divide-y divide-white/5">
        {shifts.map((shift) => (
          <div
            key={shift.id}
            className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-all"
          >
            <div>
              <p className="font-mono text-sm">{shift.scanner.name}</p>
              <p className="text-[10px] font-mono text-white/30 mt-0.5">
                {new Date(shift.punchedInAt).toLocaleString()}
                {shift.punchedOutAt &&
                  ` — ${new Date(shift.punchedOutAt).toLocaleTimeString()}`}
              </p>
            </div>
            <div>
              {shift.punchedOutAt ? (
                <span className="text-[9px] font-mono text-white/40 tracking-wider px-2 py-0.5 border border-white/10">
                  {formatDuration(shift.punchedInAt, shift.punchedOutAt)}
                </span>
              ) : (
                <span className="text-[9px] font-mono text-primary tracking-wider px-2 py-0.5 border border-primary/30 bg-primary/5">
                  ACTIVE · {formatDuration(shift.punchedInAt, null)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
