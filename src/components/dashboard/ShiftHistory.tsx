"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading shifts...
        </CardContent>
      </Card>
    )
  }

  if (shifts.length === 0) {
    return null // Don't show if no shifts
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Shift History
        </CardTitle>
        <CardDescription>Staff punch in/out records</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {shifts.map((shift) => (
            <div
              key={shift.id}
              className="flex items-center justify-between p-3 rounded-lg border"
            >
              <div>
                <p className="font-medium text-sm">{shift.scanner.name}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(shift.punchedInAt).toLocaleString()}
                  {shift.punchedOutAt &&
                    ` — ${new Date(shift.punchedOutAt).toLocaleTimeString()}`}
                </p>
              </div>
              <div>
                {shift.punchedOutAt ? (
                  <Badge variant="secondary">
                    {formatDuration(shift.punchedInAt, shift.punchedOutAt)}
                  </Badge>
                ) : (
                  <Badge variant="default">
                    Active · {formatDuration(shift.punchedInAt, null)}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
