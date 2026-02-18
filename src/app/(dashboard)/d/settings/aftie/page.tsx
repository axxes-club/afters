"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Sparkles, Calendar, BarChart3, Zap, Check, Power, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface AftieSetupStatus {
  hasProfile: boolean
  isSetup: boolean
  keyId?: string
  keyName?: string
  createdAt?: string
  lastUsedAt?: string
}

export default function AftieSettingsPage() {
  const [status, setStatus] = useState<AftieSetupStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [enabling, setEnabling] = useState(false)
  const [disabling, setDisabling] = useState(false)

  useEffect(() => {
    fetchStatus()
  }, [])

  async function fetchStatus() {
    try {
      const res = await fetch("/api/aftie/setup")
      if (res.ok) {
        const data = await res.json()
        setStatus(data)
      }
    } catch (error) {
      console.error("Failed to fetch Aftie status:", error)
      toast.error("Failed to load Aftie status")
    } finally {
      setLoading(false)
    }
  }

  async function enableAftie() {
    setEnabling(true)
    try {
      const res = await fetch("/api/aftie/setup", { method: "POST" })
      if (res.ok) {
        const data = await res.json()
        setStatus({
          hasProfile: true,
          isSetup: true,
          keyId: data.keyId,
          keyName: data.keyName,
          createdAt: data.createdAt,
        })
        toast.success("Aftie activated")
      } else {
        const error = await res.json()
        toast.error(error.message || "Failed to enable Aftie")
      }
    } catch (error) {
      console.error("Failed to enable Aftie:", error)
      toast.error("Failed to enable Aftie")
    } finally {
      setEnabling(false)
    }
  }

  async function disableAftie() {
    setDisabling(true)
    try {
      const res = await fetch("/api/aftie/setup", { method: "DELETE" })
      if (res.ok) {
        setStatus({ hasProfile: true, isSetup: false })
        toast.success("Aftie deactivated")
      } else {
        const error = await res.json()
        toast.error(error.message || "Failed to disable Aftie")
      }
    } catch (error) {
      console.error("Failed to disable Aftie:", error)
      toast.error("Failed to disable Aftie")
    } finally {
      setDisabling(false)
    }
  }

  function formatDate(date: string | null | undefined) {
    if (!date) return "Never"
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-white/20" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-mono font-bold tracking-tight">AFTIE AI</h1>
        <p className="text-white/40 text-sm font-mono mt-1">AI assistant settings</p>
      </div>

      {/* Status Card */}
      <div className={`border ${status?.isSetup ? "border-[#ff1493]/30" : "border-white/10"} bg-white/[0.02]`}>
        <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between">
          <span className="text-[10px] font-mono text-white/40 tracking-widest">STATUS</span>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${status?.isSetup ? "bg-[#ff1493] animate-pulse" : "bg-white/20"}`} />
            <span className={`text-[10px] font-mono ${status?.isSetup ? "text-[#ff1493]" : "text-white/40"}`}>
              {status?.isSetup ? "ACTIVE" : "INACTIVE"}
            </span>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className={`w-12 h-12 flex items-center justify-center ${status?.isSetup ? "bg-[#ff1493]/10" : "bg-white/5"}`}>
              <Sparkles className={`w-6 h-6 ${status?.isSetup ? "text-[#ff1493]" : "text-white/30"}`} />
            </div>
            <div className="flex-1">
              <h2 className="font-mono font-bold text-lg">Aftie AI Assistant</h2>
              <p className="text-sm text-white/40 mt-1">
                {status?.isSetup 
                  ? "Aftie can create events, check analytics, and manage your account."
                  : "Enable Aftie to get AI-powered help with event management."}
              </p>
            </div>
          </div>

          {status?.isSetup ? (
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="p-4 bg-white/[0.02] border border-white/5">
                  <p className="text-[10px] font-mono text-white/30 tracking-widest mb-1">API KEY</p>
                  <code className="text-xs font-mono text-[#ff1493]">{status.keyName}</code>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/5">
                  <p className="text-[10px] font-mono text-white/30 tracking-widest mb-1">ACTIVATED</p>
                  <p className="text-sm font-mono">{formatDate(status.createdAt)}</p>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/5">
                  <p className="text-[10px] font-mono text-white/30 tracking-widest mb-1">LAST USED</p>
                  <p className="text-sm font-mono">{formatDate(status.lastUsedAt)}</p>
                </div>
              </div>

              {/* Deactivate */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-red-500/30 text-red-400 hover:bg-red-500/10 font-mono text-xs tracking-widest transition-all">
                    <Power className="w-4 h-4" />
                    DEACTIVATE
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Deactivate Aftie?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will revoke Aftie&apos;s API access. You can reactivate anytime.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={disableAftie} disabled={disabling} className="bg-red-600 hover:bg-red-700">
                      {disabling ? "Deactivating..." : "Deactivate"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ) : (
            <Button 
              onClick={enableAftie} 
              disabled={enabling}
              className="w-full h-12 bg-[#ff1493] hover:bg-[#ff1493]/80 text-black font-mono text-xs tracking-widest gap-2"
            >
              {enabling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {enabling ? "ACTIVATING..." : "ACTIVATE AFTIE"}
            </Button>
          )}
        </div>
      </div>

      {/* Capabilities */}
      <div className="border border-white/10 bg-white/[0.02]">
        <div className="px-4 py-2 border-b border-white/10">
          <span className="text-[10px] font-mono text-white/40 tracking-widest">CAPABILITIES</span>
        </div>
        <div className="divide-y divide-white/5">
          {[
            { icon: Calendar, label: "EVENT CREATION", desc: "Create and publish events with natural language" },
            { icon: BarChart3, label: "ANALYTICS", desc: "Check ticket sales, check-ins, and revenue" },
            { icon: Zap, label: "CONTENT", desc: "Generate descriptions, titles, and copy" },
          ].map((cap, i) => (
            <div key={i} className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 flex items-center justify-center bg-white/5">
                <cap.icon className="w-5 h-5 text-white/40" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono tracking-wider">{cap.label}</p>
                <p className="text-xs text-white/40 mt-0.5">{cap.desc}</p>
              </div>
              {status?.isSetup && <Check className="w-4 h-4 text-[#ff1493]" />}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Access */}
      <div className="border border-white/10 bg-white/[0.02] p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-mono tracking-wider">QUICK ACCESS</p>
            <p className="text-xs text-white/40 mt-0.5">Press ⌘K or click the button in the corner</p>
          </div>
          <kbd className="px-2 py-1 bg-white/5 border border-white/10 text-xs font-mono text-white/40">⌘K</kbd>
        </div>
      </div>
    </div>
  )
}
