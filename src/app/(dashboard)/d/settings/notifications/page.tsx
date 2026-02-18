"use client"

import { useState, useEffect, useCallback } from "react"
import { Mail, Bell, Ticket, Calendar, MessageSquare, Loader2, AlertCircle, CheckCircle } from "lucide-react"
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
  { id: "TicketSales", icon: Ticket, title: "Ticket Sales", description: "When someone buys a ticket" },
  { id: "EventReminders", icon: Calendar, title: "Event Reminders", description: "Before your events start" },
  { id: "CheckInSummaries", icon: Mail, title: "Check-in Summaries", description: "Daily check-in reports" },
  { id: "ProductUpdates", icon: MessageSquare, title: "Product Updates", description: "News and features" },
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

  // Fetch preferences
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

  // Save preferences
  const savePreference = useCallback(async (key: keyof NotificationPreferences, value: boolean) => {
    if (!preferences) return

    const previousValue = preferences[key]
    // Optimistic update
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
      // Revert on error
      setPreferences((prev) => prev ? { ...prev, [key]: previousValue } : null)
      setError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }, [preferences])

  // Handle push subscription toggle
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-mono font-bold tracking-tight">NOTIFICATIONS</h1>
          <p className="text-white/40 text-sm font-mono mt-1">Email and push alert preferences</p>
        </div>
        {(saving || saveSuccess) && (
          <div className="flex items-center gap-2 text-xs font-mono">
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
        <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">
          {error}
        </div>
      )}

      {/* Push Notification Setup */}
      {pushSupported && !pushEnabled && (
        <div className="border border-[#ff1493]/30 bg-[#ff1493]/5 p-4">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-[#ff1493] mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-mono text-sm">Enable Push Notifications</p>
              <p className="text-white/50 text-xs mt-1">
                {pushPermission === "denied"
                  ? "You've blocked notifications. Please enable them in your browser settings."
                  : "Get instant alerts in your browser when something happens."}
              </p>
              {pushPermission !== "denied" && (
                <button
                  onClick={handlePushToggle}
                  disabled={pushLoading}
                  className="mt-3 px-4 py-2 bg-[#ff1493] text-black text-xs font-mono font-bold tracking-wider hover:bg-[#ff1493]/90 transition-colors disabled:opacity-50"
                >
                  {pushLoading ? "ENABLING..." : "ENABLE PUSH"}
                </button>
              )}
              {pushError && (
                <p className="text-red-400 text-xs mt-2">{pushError}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notification Matrix */}
      <div className="border border-white/10 bg-white/[0.02] overflow-hidden">
        {/* Header Row */}
        <div className="grid grid-cols-[1fr,80px,80px] sm:grid-cols-[1fr,100px,100px] border-b border-white/10">
          <div className="px-4 py-3 flex items-center">
            <span className="text-[10px] font-mono text-white/40 tracking-widest">NOTIFICATION TYPE</span>
          </div>
          <div className="px-2 py-3 flex items-center justify-center gap-1.5 border-l border-white/10">
            <Mail className="w-3.5 h-3.5 text-white/30" />
            <span className="text-[10px] font-mono text-white/40 tracking-widest hidden sm:block">EMAIL</span>
          </div>
          <div className="px-2 py-3 flex items-center justify-center gap-1.5 border-l border-white/10">
            <Bell className="w-3.5 h-3.5 text-white/30" />
            <span className="text-[10px] font-mono text-white/40 tracking-widest hidden sm:block">PUSH</span>
          </div>
        </div>

        {/* Notification Rows */}
        <div className="divide-y divide-white/5">
          {notificationTypes.map((type) => {
            const emailKey = `email${type.id}` as keyof NotificationPreferences
            const pushKey = `push${type.id}` as keyof NotificationPreferences
            const emailEnabled = preferences?.[emailKey] ?? false
            const pushPrefEnabled = preferences?.[pushKey] ?? false

            return (
              <div key={type.id} className="grid grid-cols-[1fr,80px,80px] sm:grid-cols-[1fr,100px,100px]">
                {/* Type Info */}
                <div className="p-4 flex items-center gap-3">
                  <div className={`w-8 h-8 flex items-center justify-center ${
                    emailEnabled || (pushEnabled && pushPrefEnabled) ? "bg-[#ff1493]/10" : "bg-white/5"
                  }`}>
                    <type.icon className={`w-4 h-4 ${
                      emailEnabled || (pushEnabled && pushPrefEnabled) ? "text-[#ff1493]" : "text-white/30"
                    }`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-mono truncate">{type.title}</p>
                    <p className="text-xs text-white/40 truncate">{type.description}</p>
                  </div>
                </div>

                {/* Email Toggle */}
                <div className="flex items-center justify-center border-l border-white/10">
                  <button
                    onClick={() => savePreference(emailKey, !emailEnabled)}
                    disabled={saving}
                    className={`relative w-10 h-6 rounded-full transition-colors ${
                      emailEnabled ? "bg-[#ff1493]" : "bg-white/10"
                    }`}
                    aria-label={`Toggle email ${type.title.toLowerCase()}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${
                      emailEnabled ? "left-5" : "left-1"
                    }`} />
                  </button>
                </div>

                {/* Push Toggle */}
                <div className="flex items-center justify-center border-l border-white/10">
                  {pushEnabled ? (
                    <button
                      onClick={() => savePreference(pushKey, !pushPrefEnabled)}
                      disabled={saving}
                      className={`relative w-10 h-6 rounded-full transition-colors ${
                        pushPrefEnabled ? "bg-[#ff1493]" : "bg-white/10"
                      }`}
                      aria-label={`Toggle push ${type.title.toLowerCase()}`}
                    >
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${
                        pushPrefEnabled ? "left-5" : "left-1"
                      }`} />
                    </button>
                  ) : (
                    <span className="text-[10px] font-mono text-white/20">--</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Push Status */}
      {pushEnabled && (
        <div className="flex items-center justify-between px-4 py-3 border border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-mono text-white/60">Push notifications active</span>
          </div>
          <button
            onClick={handlePushToggle}
            disabled={pushLoading}
            className="text-xs font-mono text-white/40 hover:text-white/60 transition-colors"
          >
            {pushLoading ? "..." : "DISABLE"}
          </button>
        </div>
      )}

      {/* Browser Support Warning */}
      {!pushSupported && (
        <div className="px-4 py-3 border border-white/10 bg-white/[0.02] text-white/40 text-xs font-mono">
          Push notifications are not supported in your browser.
        </div>
      )}
    </div>
  )
}
