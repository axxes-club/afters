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
import { 
  Sparkles, 
  Calendar, 
  BarChart3, 
  Check, 
  Power, 
  Loader2, 
  MessageSquare,
  Wand2,
  TrendingUp,
  Clock,
  Bot
} from "lucide-react"
import { toast } from "sonner"

interface AftieSetupStatus {
  hasProfile: boolean
  isSetup: boolean
  keyId?: string
  keyName?: string
  createdAt?: string
  lastUsedAt?: string
}

const capabilities = [
  { 
    icon: Calendar, 
    label: "Event Creation", 
    desc: "Create and publish events with natural language",
    color: "text-blue-400",
    bg: "bg-blue-400/10"
  },
  { 
    icon: BarChart3, 
    label: "Analytics", 
    desc: "Check ticket sales, check-ins, and revenue",
    color: "text-green-400",
    bg: "bg-green-400/10"
  },
  { 
    icon: Wand2, 
    label: "Content Generation", 
    desc: "Generate descriptions, titles, and marketing copy",
    color: "text-purple-400",
    bg: "bg-purple-400/10"
  },
  { 
    icon: TrendingUp, 
    label: "Insights", 
    desc: "Get suggestions to improve event performance",
    color: "text-amber-400",
    bg: "bg-amber-400/10"
  },
]

const examplePrompts = [
  "Create a techno event for next Saturday at 10pm",
  "How many tickets did I sell this month?",
  "Write a description for my warehouse party",
  "Who checked in at my last event?",
]

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
        toast.success("Aftie activated! Press ⌘K to start chatting.")
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
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-mono font-bold tracking-tight">AFTIE AI</h1>
        <p className="text-white/40 text-sm font-mono mt-1">Your AI-powered event assistant</p>
      </div>

      {/* Hero Section */}
      {status?.isSetup ? (
        /* Active State */
        <div className="border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
          
          <div className="relative p-6 sm:p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center ring-1 ring-primary/30">
                <Bot className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-mono font-bold text-lg">Aftie is Active</h2>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/20 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] font-mono text-primary">ONLINE</span>
                  </div>
                </div>
                <p className="text-sm text-white/50">
                  Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] font-mono mx-1">⌘K</kbd> to chat with Aftie
                </p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="p-3 bg-black/30 border border-white/5 rounded">
                <p className="text-[10px] font-mono text-white/30 tracking-widest mb-1">API KEY</p>
                <code className="text-xs font-mono text-primary truncate block">{status.keyName}</code>
              </div>
              <div className="p-3 bg-black/30 border border-white/5 rounded">
                <p className="text-[10px] font-mono text-white/30 tracking-widest mb-1">ACTIVATED</p>
                <p className="text-xs font-mono">{formatDate(status.createdAt)}</p>
              </div>
              <div className="p-3 bg-black/30 border border-white/5 rounded">
                <p className="text-[10px] font-mono text-white/30 tracking-widest mb-1">LAST USED</p>
                <p className="text-xs font-mono">{formatDate(status.lastUsedAt)}</p>
              </div>
            </div>

            {/* Deactivate */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-white/10 text-white/40 hover:border-red-500/30 hover:text-red-400 font-mono text-xs tracking-wider transition-all rounded">
                  <Power className="w-3.5 h-3.5" />
                  Deactivate Aftie
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
        </div>
      ) : (
        /* Inactive State - Activation CTA */
        <div className="border border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
          
          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center ring-1 ring-white/10">
                <Sparkles className="w-8 h-8 text-white/40" />
              </div>
              <div className="flex-1">
                <h2 className="font-mono font-bold text-lg mb-2">Activate Aftie AI</h2>
                <p className="text-sm text-white/50 leading-relaxed mb-5">
                  Get an AI assistant that can create events, analyze your ticket sales, 
                  and help you write compelling event descriptions — all through natural conversation.
                </p>
                <Button 
                  onClick={enableAftie} 
                  disabled={enabling}
                  className="bg-primary hover:bg-primary/90 text-black font-mono text-sm tracking-wider gap-2 h-11 px-6"
                >
                  {enabling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {enabling ? "Activating..." : "Activate Aftie"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Capabilities */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[10px] font-mono text-white/40 tracking-widest">CAPABILITIES</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {capabilities.map((cap, i) => (
            <div 
              key={i} 
              className={`p-4 border bg-white/[0.02] transition-all ${
                status?.isSetup 
                  ? "border-white/10 hover:border-white/20" 
                  : "border-white/5 opacity-60"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${status?.isSetup ? cap.bg : "bg-white/5"}`}>
                  <cap.icon className={`w-4.5 h-4.5 ${status?.isSetup ? cap.color : "text-white/30"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-mono font-medium">{cap.label}</p>
                    {status?.isSetup && <Check className="w-3.5 h-3.5 text-primary" />}
                  </div>
                  <p className="text-xs text-white/40 mt-0.5">{cap.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Example Prompts */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-3.5 h-3.5 text-white/40" />
          <span className="text-[10px] font-mono text-white/40 tracking-widest">TRY SAYING</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <div className="grid gap-2">
          {examplePrompts.map((prompt, i) => (
            <div 
              key={i} 
              className={`px-4 py-3 border border-white/5 bg-white/[0.01] font-mono text-sm transition-all ${
                status?.isSetup 
                  ? "text-white/60 hover:bg-white/[0.03] hover:border-white/10 cursor-pointer" 
                  : "text-white/30"
              }`}
            >
              <span className="text-white/30 mr-2">&quot;</span>
              {prompt}
              <span className="text-white/30 ml-1">&quot;</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Access */}
      <div className="border border-white/10 bg-white/[0.02] p-4 rounded flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
            <Clock className="w-4 h-4 text-white/40" />
          </div>
          <div>
            <p className="text-sm font-mono font-medium">Quick Access</p>
            <p className="text-xs text-white/40">Press ⌘K anywhere or click the sparkle button</p>
          </div>
        </div>
        <kbd className="px-3 py-1.5 bg-white/5 border border-white/10 text-xs font-mono text-white/40 rounded">⌘K</kbd>
      </div>
    </div>
  )
}
