"use client"

import { useState, useEffect, useCallback } from "react"
import { Mail, Bell, Ticket, Calendar, MessageSquare, Loader2, AlertCircle, CheckCircle, Zap, BellOff, Smartphone, Volume2, Sparkles } from "lucide-react"
import { usePushNotifications } from "@/hooks/usePushNotifications"

interface NotificationPreferences {
  emailTicketSales: boolean
  emailEventReminders: boolean
  emailCheckInSummaries: boolean
  emailProductUpdates: boolean
  pushTicketSales: boolean
  pushEventReminders: boolean
  pushCheckInSummaries: boolean
  pushProductUpdates: boolean
  hasPushSubscription: boolean
}

const notificationTypes = [
  { 
    id: "TicketSales", 
    icon: Ticket, 
    title: "Ticket Sales", 
    description: "Instant alerts when tickets sell",
    color: "text-green-400",
    bg: "bg-green-400/10",
    borderActive: "border-green-400/30"
  },
  { 
    id: "EventReminders", 
    icon: Calendar, 
    title: "Event Reminders", 
    description: "Countdown alerts before events",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    borderActive: "border-blue-400/30"
  },
  { 
    id: "CheckInSummaries", 
    icon: Volume2, 
    title: "Check-in Reports", 
    description: "Daily guest attendance stats",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    borderActive: "border-amber-400/30"
  },
  { 
    id: "ProductUpdates", 
    icon: Sparkles, 
    title: "Product Updates", 
    description: "New features & improvements",
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    borderActive: "border-purple-400/30"
  },
] as const

export default function NotificationsPage() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const {
    isSupported: pushSupported,
    permission: pushPermission,
    isSubscribed: isPushSubscribed,
    isLoading: pushLoading,
    error: pushError,
    subscribe: subscribeToPush,
    unsubscribe: unsubscribeFromPush,
  } = usePushNotifications()

  useEffect(() => {
    async function fetchPreferences() {
      try {
        const res = await fetch("/api/user/notifications")
        if (!res.ok) throw new Error("Failed to fetch preferences")
        const data = await res.json()
        setPreferences(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load preferences")
      } finally {
        setLoading(false)
      }
    }
    fetchPreferences()
  }, [])

  const savePreference = useCallback(async (key: keyof NotificationPreferences, value: boolean) => {
    if (!preferences) return

    const previousValue = preferences[key]
    setPreferences((prev) => prev ? { ...prev, [key]: value } : null)
    setSaving(true)
    setSaveSuccess(false)
    setError(null)

    try {
      const res = await fetch("/api/user/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      })
      if (!res.ok) throw new Error("Failed to save preference")
      const data = await res.json()
      setPreferences(data)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch (err) {
      setPreferences((prev) => prev ? { ...prev, [key]: previousValue } : null)
      setError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }, [preferences])

  const handlePushToggle = useCallback(async () => {
    if (isPushSubscribed) {
      await unsubscribeFromPush()
    } else {
      await subscribeToPush()
    }
  }, [isPushSubscribed, subscribeToPush, unsubscribeFromPush])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-white/40" />
      </div>
    )
  }

  if (error && !preferences) {
    return (
      <div className="py-12 text-center">
        <AlertCircle className="w-8 h-8 mx-auto text-red-500 mb-3" />
        <p className="text-white/60 font-mono text-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 text-xs font-mono text-white/60 border border-white/10 hover:border-white/20 transition-colors"
        >
          RETRY
        </button>
      </div>
    )
  }

  const pushEnabled = pushSupported && pushPermission === "granted" && isPushSubscribed

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-mono font-bold tracking-tight">NOTIFICATIONS</h1>
          <p className="text-white/40 text-sm font-mono mt-1">Stay in the loop with your events</p>
        </div>
        {(saving || saveSuccess) && (
          <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-full bg-white/5">
            {saving ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-white/40" />
                <span className="text-white/40">Saving...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span className="text-green-500">Saved</span>
              </>
            )}
          </div>
        )}
      </div>

      {error && preferences && (
        <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono rounded">
          {error}
        </div>
      )}

      {/* Push Notifications Hero */}
      {pushLoading ? (
        <div className="relative overflow-hidden border border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent">
          <div className="p-6 sm:p-8 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-white/40" />
          </div>
        </div>
      ) : !pushSupported ? (
        <div className="relative overflow-hidden border border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent">
          <div className="p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                <BellOff className="w-6 h-6 text-white/30" />
              </div>
              <div>
                <p className="font-mono text-base font-medium">Push Not Available</p>
                <p className="text-sm text-white/50 mt-1 leading-relaxed">
                  Your browser doesn&apos;t support push notifications. Try Chrome, Firefox, or Edge for real-time alerts.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : !pushEnabled ? (
        <div className="relative overflow-hidden border border-[#ff1493]/30 bg-gradient-to-br from-[#ff1493]/10 via-[#ff1493]/5 to-transparent">
          {/* Glow effect */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#ff1493]/20 rounded-full blur-3xl" />
          
          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="w-16 h-16 rounded-2xl bg-[#ff1493]/20 flex items-center justify-center flex-shrink-0 ring-1 ring-[#ff1493]/30">
                <Zap className="w-8 h-8 text-[#ff1493]" />
              </div>
              <div className="flex-1">
                <p className="font-mono text-lg font-bold tracking-tight">Enable Push Notifications</p>
                <p className="text-sm text-white/60 mt-2 leading-relaxed">
                  {pushPermission === "denied"
                    ? "Push notifications are blocked. Please enable them in your browser settings to receive real-time alerts."
                    : "Get instant alerts on your device when tickets sell, events start, and more. Never miss a beat."}
                </p>
                {pushError && (
                  <p className="text-red-400 text-xs mt-3 font-mono">{pushError}</p>
                )}
                {pushPermission !== "denied" && (
                  <button
                    onClick={handlePushToggle}
                    disabled={pushLoading}
                    className="mt-5 px-6 py-3 bg-[#ff1493] text-black text-sm font-mono font-bold tracking-wider hover:bg-[#ff1493]/90 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    <Smartphone className="w-4 h-4" />
                    {pushLoading ? "ENABLING..." : "ENABLE PUSH"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center ring-1 ring-green-500/20">
                <Bell className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <p className="font-mono text-sm font-medium text-green-400">Push Active</p>
                </div>
                <p className="text-xs text-white/40 mt-0.5">Receiving real-time notifications</p>
              </div>
            </div>
            <button
              onClick={handlePushToggle}
              disabled={pushLoading}
              className="px-4 py-2 text-xs font-mono text-white/40 border border-white/10 hover:border-red-500/30 hover:text-red-400 transition-all"
            >
              {pushLoading ? "..." : "DISABLE"}
            </button>
          </div>
        </div>
      )}

      {/* Notification Types */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[10px] font-mono text-white/40 tracking-widest">NOTIFICATION TYPES</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <div className="grid gap-3">
          {notificationTypes.map((type) => {
            const emailKey = `email${type.id}` as keyof NotificationPreferences
            const pushKey = `push${type.id}` as keyof NotificationPreferences
            const emailEnabled = preferences?.[emailKey] ?? false
            const pushPrefEnabled = preferences?.[pushKey] ?? false
            const isActive = emailEnabled || (pushEnabled && pushPrefEnabled)

            return (
              <div 
                key={type.id} 
                className={`border bg-white/[0.02] transition-all ${
                  isActive ? `${type.borderActive} bg-white/[0.04]` : "border-white/10"
                }`}
              >
                <div className="p-4 sm:p-5">
                  {/* Type Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isActive ? type.bg : "bg-white/5"
                    }`}>
                      <type.icon className={`w-5 h-5 ${isActive ? type.color : "text-white/30"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm font-medium">{type.title}</p>
                      <p className="text-xs text-white/40 mt-0.5">{type.description}</p>
                    </div>
                  </div>

                  {/* Toggle Row */}
                  <div className="flex items-center gap-6 pl-14">
                    {/* Email Toggle */}
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <button
                        onClick={() => savePreference(emailKey, !emailEnabled)}
                        disabled={saving}
                        className={`relative w-9 h-5 rounded-full transition-colors ${
                          emailEnabled ? "bg-[#ff1493]" : "bg-white/10 group-hover:bg-white/15"
                        }`}
                        aria-label={`Toggle email ${type.title.toLowerCase()}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                          emailEnabled ? "left-[18px]" : "left-0.5"
                        }`} />
                      </button>
                      <span className="text-xs font-mono text-white/50 group-hover:text-white/70 transition-colors flex items-center gap-1.5">
                        <Mail className="w-3 h-3" />
                        Email
                      </span>
                    </label>

                    {/* Push Toggle */}
                    {pushEnabled ? (
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <button
                          onClick={() => savePreference(pushKey, !pushPrefEnabled)}
                          disabled={saving}
                          className={`relative w-9 h-5 rounded-full transition-colors ${
                            pushPrefEnabled ? "bg-[#ff1493]" : "bg-white/10 group-hover:bg-white/15"
                          }`}
                          aria-label={`Toggle push ${type.title.toLowerCase()}`}
                        >
                          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                            pushPrefEnabled ? "left-[18px]" : "left-0.5"
                          }`} />
                        </button>
                        <span className="text-xs font-mono text-white/50 group-hover:text-white/70 transition-colors flex items-center gap-1.5">
                          <Bell className="w-3 h-3" />
                          Push
                        </span>
                      </label>
                    ) : (
                      <span className="text-[10px] font-mono text-white/20 flex items-center gap-1.5">
                        <Bell className="w-3 h-3" />
                        Push disabled
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-start gap-3 px-4 py-3 bg-white/[0.02] border border-white/5 rounded">
        <MessageSquare className="w-4 h-4 text-white/20 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] font-mono text-white/30 leading-relaxed">
          Notifications help you stay on top of your events. We&apos;ll only send what you&apos;ve enabled — no spam, ever.
        </p>
      </div>
    </div>
  )
}
