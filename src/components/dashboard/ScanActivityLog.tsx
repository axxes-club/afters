"use client"

import { useState, useEffect } from "react"
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
    user?: {
      firstName: string | null
      lastName: string | null
      email: string
    } | null
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        return <CheckCircle className="h-3.5 w-3.5 text-green-400 shrink-0" />
      case "ALREADY_CHECKED_IN":
        return <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
      default:
        return <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
    }
  }

  function getResultLabel(result: string) {
    const map: Record<string, { color: string; label: string }> = {
      SUCCESS: { color: "text-green-400 border-green-400/30 bg-green-400/5", label: "Success" },
      ALREADY_CHECKED_IN: { color: "text-yellow-500 border-yellow-500/30 bg-yellow-500/5", label: "Duplicate" },
      INVALID_TICKET: { color: "text-red-400 border-red-400/30 bg-red-400/5", label: "Invalid" },
      CANCELLED_TICKET: { color: "text-red-400 border-red-400/30 bg-red-400/5", label: "Cancelled" },
      WRONG_EVENT: { color: "text-red-400 border-red-400/30 bg-red-400/5", label: "Wrong Event" },
    }
    const config = map[result] || { color: "text-white/40 border-white/10", label: result }
    return (
      <span className={`text-[9px] font-mono tracking-wider px-1.5 py-0.5 border ${config.color}`}>
        {config.label.toUpperCase()}
      </span>
    )
  }

  const totalScans = stats?.byResult
    ? Object.values(stats.byResult).reduce((a, b) => a + b, 0)
    : 0
  const successCount = stats?.byResult?.SUCCESS || 0
  const successRate =
    totalScans > 0 ? Math.round((successCount / totalScans) * 100) : 0

  if (loading) {
    return (
      <div className="border border-white/10 bg-white/[0.02]">
        <div className="p-8 text-center">
          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary animate-spin mx-auto" />
        </div>
      </div>
    )
  }

  if (totalScans === 0) {
    return null
  }

  return (
    <div className="border border-white/10 bg-white/[0.02]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-white/30" />
          <span className="text-[10px] font-mono text-white/40 tracking-widest">SCAN ACTIVITY</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          <span className="text-[10px] font-mono text-white/30">LIVE</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 border-b border-white/10">
        <div className="p-4 text-center border-r border-white/5">
          <p className="text-2xl font-mono font-bold">{totalScans}</p>
          <p className="text-[10px] font-mono text-white/40 tracking-widest mt-1">TOTAL SCANS</p>
        </div>
        <div className="p-4 text-center border-r border-white/5">
          <p className="text-2xl font-mono font-bold text-green-400">{successCount}</p>
          <p className="text-[10px] font-mono text-white/40 tracking-widest mt-1">SUCCESSFUL</p>
        </div>
        <div className="p-4 text-center">
          <p className="text-2xl font-mono font-bold">{successRate}%</p>
          <p className="text-[10px] font-mono text-white/40 tracking-widest mt-1">SUCCESS RATE</p>
        </div>
      </div>

      {/* By Scanner */}
      {stats && stats.byScanner.length > 0 && (
        <div className="px-4 py-3 border-b border-white/10">
          <p className="text-[10px] font-mono text-white/30 tracking-widest mb-2">BY SCANNER</p>
          <div className="space-y-1.5">
            {stats.byScanner.map((s) => (
              <div
                key={s.scannerId}
                className="flex items-center justify-between text-sm font-mono"
              >
                <span className="text-white/50 text-xs">{s.scannerName}</span>
                <span className="text-[10px] text-white/40 px-2 py-0.5 border border-white/10">
                  {s.count} scans
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="px-4 py-3">
        <p className="text-[10px] font-mono text-white/30 tracking-widest mb-3">RECENT ACTIVITY</p>
        <div className="space-y-0 max-h-80 overflow-y-auto divide-y divide-white/5">
          {logs.slice(0, 50).map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-3 py-2.5"
            >
              {getResultIcon(log.result)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {getResultLabel(log.result)}
                  <span className="text-[10px] font-mono text-white/30">
                    by {log.scanner.name}
                  </span>
                </div>
                {log.ticket && (
                  <p className="text-[10px] font-mono text-white/25 mt-0.5 truncate">
                    {log.ticket.ticketNumber} · {log.ticket.ticketTier.name}
                    {log.ticket.user?.firstName &&
                      ` · ${log.ticket.user.firstName} ${log.ticket.user.lastName || ""}`}
                  </p>
                )}
              </div>
              <time className="text-[10px] font-mono text-white/25 whitespace-nowrap shrink-0">
                {new Date(log.scannedAt).toLocaleTimeString()}
              </time>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
