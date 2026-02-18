"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { Sparkles, Shield, Calendar, BarChart3, Zap, Check, X, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface AftieSetupStatus {
  hasProfile: boolean
  isSetup: boolean
  keyId?: string
  createdAt?: string
  lastUsedAt?: string
}

const AFTIE_CAPABILITIES = [
  {
    icon: Calendar,
    title: "Create & Manage Events",
    description: "Create events, update details, publish and unpublish"
  },
  {
    icon: BarChart3,
    title: "View Analytics",
    description: "Check ticket sales, check-ins, and revenue stats"
  },
  {
    icon: Zap,
    title: "Write Content",
    description: "Generate event descriptions, titles, and copy"
  },
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
          createdAt: data.createdAt,
        })
        toast.success("Aftie has been enabled!")
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
        setStatus({
          hasProfile: true,
          isSetup: false,
        })
        toast.success("Aftie has been disabled")
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
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Aftie Status Card */}
      <Card className={`border-2 ${status?.isSetup ? "border-[#ff1493]/30 bg-[#ff1493]/5" : "border-white/10 bg-white/[0.02]"}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                status?.isSetup 
                  ? "bg-gradient-to-br from-[#ff1493] to-[#ff1493]/50" 
                  : "bg-white/10"
              }`}>
                <Sparkles className={`w-6 h-6 ${status?.isSetup ? "text-white" : "text-white/50"}`} />
              </div>
              <div>
                <CardTitle className="text-xl font-mono flex items-center gap-2">
                  Aftie AI
                  {status?.isSetup ? (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      <Check className="w-3 h-3 mr-1" />
                      Enabled
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <X className="w-3 h-3 mr-1" />
                      Disabled
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Your AI assistant for managing events
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {status?.isSetup ? (
            <>
              {/* Status Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-black/20 rounded-lg">
                <div>
                  <p className="text-xs text-white/40 font-mono tracking-wider mb-1">ENABLED</p>
                  <p className="text-sm font-mono">{formatDate(status.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-white/40 font-mono tracking-wider mb-1">LAST USED</p>
                  <p className="text-sm font-mono">{formatDate(status.lastUsedAt)}</p>
                </div>
              </div>

              {/* Disable Button */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div>
                  <p className="font-medium">Disable Aftie</p>
                  <p className="text-sm text-muted-foreground">
                    Revoke Aftie&apos;s access to your account
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="text-red-400 border-red-400/30 hover:bg-red-400/10">
                      Disable
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Disable Aftie?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will revoke Aftie&apos;s access to create and manage events on your behalf.
                        You can re-enable Aftie anytime.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={disableAftie}
                        disabled={disabling}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {disabling ? "Disabling..." : "Disable Aftie"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </>
          ) : (
            <>
              {/* Enable CTA */}
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">
                  Enable Aftie to get AI-powered help with creating and managing your events.
                </p>
                <Button 
                  onClick={enableAftie} 
                  disabled={enabling}
                  className="gap-2"
                >
                  {enabling ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enabling...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Enable Aftie
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Capabilities */}
      <Card className="border-white/10 bg-white/[0.02]">
        <CardHeader>
          <CardTitle className="text-lg font-mono">What Aftie Can Do</CardTitle>
          <CardDescription>
            Aftie has access to perform these actions on your behalf
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {AFTIE_CAPABILITIES.map((capability, index) => (
              <div key={index} className="flex items-start gap-4 p-3 rounded-lg bg-white/5">
                <div className="p-2 rounded-lg bg-[#ff1493]/10 shrink-0">
                  <capability.icon className="w-5 h-5 text-[#ff1493]" />
                </div>
                <div>
                  <p className="font-medium">{capability.title}</p>
                  <p className="text-sm text-muted-foreground">{capability.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Note */}
      <Card className="border-green-500/20 bg-green-500/5">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-green-300">Secure Access</p>
              <p className="text-sm text-green-300/70">
                Aftie uses a dedicated API key with full permissions. You can view this key in your
                API Keys settings and revoke access at any time. Aftie only acts when you interact
                with it directly.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Tips */}
      <Card className="border-white/10 bg-white/[0.02]">
        <CardHeader>
          <CardTitle className="text-lg font-mono">Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-[#ff1493]">•</span>
              <span>Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs font-mono">⌘K</kbd> or click the Aftie button to open the assistant</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#ff1493]">•</span>
              <span>Ask Aftie to create events, check sales, or write content for your event pages</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#ff1493]">•</span>
              <span>When viewing an event, Aftie knows the context and can help with that specific event</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#ff1493]">•</span>
              <span>Aftie is in beta — send us feedback if something doesn&apos;t work as expected</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
