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
import { CheckCircle, XCircle, AlertTriangle, Activity } from "lucide-react"

interface ScanLogEntry {
  id: string
  result: string
  message: string | null
  ticketNumber: string | null
  scannedAt: string
  scanner: { id: string; name: string }
  ticket?: {
    ticketNumber: string
    ticketTier: { name: string }
    user: {
      firstName: string | null
      lastName: string | null
      email: string
    }
  } | null
}

interface Stats {
  byResult: Record<string, number>
  byScanner: Array<{
    scannerId: string
    scannerName: string
    count: number
  }>
}

export function ScanActivityLog({ eventId }: { eventId: string }) {
  const [logs, setLogs] = useState<ScanLogEntry[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLogs()
    const interval = setInterval(fetchLogs, 10000)
    return () => clearInterval(interval)
  }, [eventId])

  async function fetchLogs() {
    try {
      const res = await fetch(`/api/events/${eventId}/scan-log`)
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs)
        setStats(data.stats)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  function getResultIcon(result: string) {
    switch (result) {
      case "SUCCESS":
        return <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
      case "ALREADY_CHECKED_IN":
        return <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />
      default:
        return <XCircle className="h-4 w-4 text-red-500 shrink-0" />
    }
  }

  function getResultBadge(result: string) {
    const map: Record<string, { variant: "default" | "secondary" | "destructive"; label: string }> = {
      SUCCESS: { variant: "default", label: "Success" },
      ALREADY_CHECKED_IN: { variant: "secondary", label: "Duplicate" },
      INVALID_TICKET: { variant: "destructive", label: "Invalid" },
      CANCELLED_TICKET: { variant: "destructive", label: "Cancelled" },
      WRONG_EVENT: { variant: "destructive", label: "Wrong Event" },
    }
    const config = map[result] || { variant: "secondary" as const, label: result }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const totalScans = stats?.byResult
    ? Object.values(stats.byResult).reduce((a, b) => a + b, 0)
    : 0
  const successCount = stats?.byResult?.SUCCESS || 0
  const successRate =
    totalScans > 0 ? Math.round((successCount / totalScans) * 100) : 0

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading scan activity...
        </CardContent>
      </Card>
    )
  }

  if (totalScans === 0) {
    return null // Don't show card if no scans yet
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Scan Activity
        </CardTitle>
        <CardDescription>
          Real-time check-in activity (updates every 10s)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 grid-cols-3">
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Scans</p>
            <p className="text-2xl font-bold">{totalScans}</p>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Successful</p>
            <p className="text-2xl font-bold text-green-500">
              {successCount}
            </p>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Success Rate</p>
            <p className="text-2xl font-bold">{successRate}%</p>
          </div>
        </div>

        {/* Scans by Scanner */}
        {stats && stats.byScanner.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">By Scanner</p>
            <div className="space-y-1">
              {stats.byScanner.map((s) => (
                <div
                  key={s.scannerId}
                  className="flex items-center justify-between text-sm py-1"
                >
                  <span className="text-muted-foreground">
                    {s.scannerName}
                  </span>
                  <Badge variant="secondary">{s.count} scans</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div>
          <p className="text-sm font-medium mb-2">Recent Activity</p>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {logs.slice(0, 50).map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-3 rounded-lg border text-sm"
              >
                {getResultIcon(log.result)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getResultBadge(log.result)}
                    <span className="text-muted-foreground text-xs">
                      by {log.scanner.name}
                    </span>
                  </div>
                  {log.ticket && (
                    <p className="text-muted-foreground text-xs mt-1 truncate">
                      {log.ticket.ticketNumber} · {log.ticket.ticketTier.name}
                      {log.ticket.user.firstName &&
                        ` · ${log.ticket.user.firstName} ${log.ticket.user.lastName || ""}`}
                    </p>
                  )}
                </div>
                <time className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                  {new Date(log.scannedAt).toLocaleTimeString()}
                </time>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
