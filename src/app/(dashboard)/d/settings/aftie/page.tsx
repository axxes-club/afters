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
    if (!date) return "—"
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#ff1493]" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-none border border-white/10 bg-gradient-to-br from-[#ff1493]/10 via-black to-purple-900/10">
        {/* Animated background grid */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(255,20,147,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,20,147,0.1) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        <div className="relative p-8 md:p-12">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Icon */}
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-500 ${
              status?.isSetup 
                ? "bg-gradient-to-br from-[#ff1493] to-purple-600 shadow-lg shadow-[#ff1493]/30 animate-pulse-glow" 
                : "bg-white/5 border border-white/10"
            }`}>
              <Sparkles className={`w-10 h-10 ${status?.isSetup ? "text-white" : "text-white/30"}`} />
            </div>
            
            {/* Title */}
            <div className="flex-1">
              <h1 className="font-headline text-4xl md:text-5xl tracking-wide">
                AFTIE<span className="text-[#ff1493]">.</span>AI
              </h1>
              <p className="text-white/50 font-mono text-sm mt-2 tracking-wide">
                YOUR AUTONOMOUS EVENT ASSISTANT
              </p>
            </div>

            {/* Status Badge */}
            <div className={`px-4 py-2 rounded-full font-mono text-xs tracking-widest flex items-center gap-2 ${
              status?.isSetup 
                ? "bg-[#ff1493]/20 text-[#ff1493] border border-[#ff1493]/30" 
                : "bg-white/5 text-white/40 border border-white/10"
            }`}>
              <span className={`w-2 h-2 rounded-full ${status?.isSetup ? "bg-[#ff1493] animate-pulse" : "bg-white/30"}`} />
              {status?.isSetup ? "ONLINE" : "OFFLINE"}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column - Status/Control */}
        <div className="space-y-6">
          {/* Power Control */}
          <div className="border border-white/10 bg-white/[0.02] p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-mono text-xs tracking-widest text-white/40">POWER CONTROL</h2>
              {status?.isSetup && (
                <code className="text-[10px] font-mono text-[#ff1493]/60 bg-[#ff1493]/10 px-2 py-1">
                  {status.keyName}
                </code>
              )}
            </div>

            {status?.isSetup ? (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/40 p-4 border-l-2 border-[#ff1493]">
                    <p className="text-[10px] font-mono text-white/30 tracking-widest mb-1">ACTIVATED</p>
                    <p className="font-mono text-white">{formatDate(status.createdAt)}</p>
                  </div>
                  <div className="bg-black/40 p-4 border-l-2 border-white/20">
                    <p className="text-[10px] font-mono text-white/30 tracking-widest mb-1">LAST ACTIVE</p>
                    <p className="font-mono text-white">{formatDate(status.lastUsedAt)}</p>
                  </div>
                </div>

                {/* Deactivate */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-red-500/30 text-red-400 hover:bg-red-500/10 font-mono text-xs tracking-widest transition-all">
                      <Power className="w-4 h-4" />
                      DEACTIVATE AFTIE
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
                      <AlertDialogAction
                        onClick={disableAftie}
                        disabled={disabling}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {disabling ? "Deactivating..." : "Deactivate"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-white/50 text-sm">
                  Activate Aftie to unlock AI-powered event management. Create events with natural language, 
                  get instant analytics, and automate your workflow.
                </p>
                <Button 
                  onClick={enableAftie} 
                  disabled={enabling}
                  className="w-full h-14 bg-[#ff1493] hover:bg-[#ff1493]/80 text-black font-mono text-sm tracking-widest gap-3"
                >
                  {enabling ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Sparkles className="w-5 h-5" />
                  )}
                  {enabling ? "ACTIVATING..." : "ACTIVATE AFTIE"}
                </Button>
              </div>
            )}
          </div>

          {/* Keyboard Shortcut */}
          <div className="border border-white/10 bg-white/[0.02] p-6">
            <h2 className="font-mono text-xs tracking-widest text-white/40 mb-4">QUICK ACCESS</h2>
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm">Open Aftie</span>
              <kbd className="px-3 py-1.5 bg-white/5 border border-white/10 rounded text-xs font-mono text-white/60">
                ⌘K
              </kbd>
            </div>
          </div>
        </div>

        {/* Right Column - Capabilities */}
        <div className="border border-white/10 bg-white/[0.02]">
          <div className="p-4 border-b border-white/10">
            <h2 className="font-mono text-xs tracking-widest text-white/40">CAPABILITIES</h2>
          </div>
          <div className="divide-y divide-white/5">
            {[
              { icon: Calendar, title: "EVENT CREATION", desc: "Create and publish events using natural language" },
              { icon: BarChart3, title: "LIVE ANALYTICS", desc: "Real-time ticket sales, check-ins, revenue" },
              { icon: Zap, title: "CONTENT GENERATION", desc: "Write descriptions, titles, marketing copy" },
            ].map((cap, i) => (
              <div key={i} className="p-5 flex items-start gap-4 hover:bg-white/[0.02] transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-[#ff1493]/10 flex items-center justify-center group-hover:bg-[#ff1493]/20 transition-colors">
                  <cap.icon className="w-5 h-5 text-[#ff1493]" />
                </div>
                <div>
                  <h3 className="font-mono text-xs tracking-widest text-white mb-1">{cap.title}</h3>
                  <p className="text-white/40 text-sm">{cap.desc}</p>
                </div>
                {status?.isSetup && (
                  <Check className="w-4 h-4 text-green-400 ml-auto" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Banner */}
      <div className="border border-[#ff1493]/20 bg-gradient-to-r from-[#ff1493]/5 to-transparent p-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-[#ff1493]/10 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-6 h-6 text-[#ff1493]" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-white/70">
            <span className="text-[#ff1493] font-medium">Pro tip:</span> Click the Aftie button in the corner 
            or press <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs mx-1">⌘K</kbd> to start a conversation.
          </p>
        </div>
      </div>
    </div>
  )
}
