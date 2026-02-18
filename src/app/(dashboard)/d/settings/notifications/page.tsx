"use client"

import { useState, useEffect, useCallback } from "react"
import { Mail, Bell, Ticket, Calendar, MessageSquare, Loader2, AlertCircle, CheckCircle, Zap, BellOff } from "lucide-react"
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
  { id: "TicketSales", icon: Ticket, title: "Ticket Sales", description: "When someone buys a ticket to your event" },
  { id: "EventReminders", icon: Calendar, title: "Event Reminders", description: "Alerts before your events start" },
  { id: "CheckInSummaries", icon: Mail, title: "Check-in Summaries", description: "Daily reports of guest check-ins" },
  { id: "ProductUpdates", icon: MessageSquare, title: "Product Updates", description: "New features and announcements" },
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
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-mono font-bold tracking-tight">NOTIFICATIONS</h1>
          <p className="text-white/40 text-sm font-mono mt-1">Choose how you want to be notified</p>
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

      {/* Push Notifications Section */}
      <div className="border border-white/10 bg-white/[0.02]">
        <div className="px-4 py-2 border-b border-white/10 flex items-center gap-2">
          <Bell className="w-4 h-4 text-white/40" />
          <span className="text-[10px] font-mono text-white/40 tracking-widest">PUSH NOTIFICATIONS</span>
        </div>
        
        {!pushSupported ? (
          <div className="p-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 flex items-center justify-center bg-white/5 flex-shrink-0">
                <BellOff className="w-5 h-5 text-white/30" />
              </div>
              <div>
                <p className="font-mono text-sm text-white/60">Not Supported</p>
                <p className="text-xs text-white/40 mt-1">
                  Push notifications are not available in your browser. Try using Chrome, Firefox, or Edge.
                </p>
              </div>
            </div>
          </div>
        ) : !pushEnabled ? (
          <div className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 flex items-center justify-center bg-[#ff1493]/10 flex-shrink-0">
                  <Zap className="w-5 h-5 text-[#ff1493]" />
                </div>
                <div>
                  <p className="font-mono text-sm">Enable Push Notifications</p>
                  <p className="text-xs text-white/40 mt-1">
                    {pushPermission === "denied"
                      ? "Blocked by browser. Enable in your browser settings to continue."
                      : "Get instant alerts when tickets sell or events start."}
                  </p>
                  {pushError && (
                    <p className="text-red-400 text-xs mt-2">{pushError}</p>
                  )}
                </div>
              </div>
              {pushPermission !== "denied" && (
                <button
                  onClick={handlePushToggle}
                  disabled={pushLoading}
                  className="px-5 py-2.5 bg-[#ff1493] text-black text-xs font-mono font-bold tracking-wider hover:bg-[#ff1493]/90 transition-colors disabled:opacity-50 flex-shrink-0"
                >
                  {pushLoading ? "ENABLING..." : "ENABLE"}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {/* Push Status */}
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-mono text-white/60">Push notifications active</span>
              </div>
              <button
                onClick={handlePushToggle}
                disabled={pushLoading}
                className="text-xs font-mono text-white/40 hover:text-red-400 transition-colors"
              >
                {pushLoading ? "..." : "DISABLE"}
              </button>
            </div>
            
            {/* Push Toggles */}
            {notificationTypes.map((type) => {
              const pushKey = `push${type.id}` as keyof NotificationPreferences
              const pushPrefEnabled = preferences?.[pushKey] ?? false

              return (
                <div key={`push-${type.id}`} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 flex items-center justify-center flex-shrink-0 ${
                      pushPrefEnabled ? "bg-[#ff1493]/10" : "bg-white/5"
                    }`}>
                      <type.icon className={`w-4 h-4 ${
                        pushPrefEnabled ? "text-[#ff1493]" : "text-white/30"
                      }`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-mono truncate">{type.title}</p>
                      <p className="text-xs text-white/40 truncate">{type.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => savePreference(pushKey, !pushPrefEnabled)}
                    disabled={saving}
                    className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                      pushPrefEnabled ? "bg-[#ff1493]" : "bg-white/10"
                    }`}
                    aria-label={`Toggle push ${type.title.toLowerCase()}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${
                      pushPrefEnabled ? "left-6" : "left-1"
                    }`} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Email Notifications Section */}
      <div className="border border-white/10 bg-white/[0.02]">
        <div className="px-4 py-2 border-b border-white/10 flex items-center gap-2">
          <Mail className="w-4 h-4 text-white/40" />
          <span className="text-[10px] font-mono text-white/40 tracking-widest">EMAIL NOTIFICATIONS</span>
        </div>
        <div className="p-6 space-y-1">
          <p className="text-sm text-white/60">Receive email notifications for important updates.</p>
        </div>
        <div className="divide-y divide-white/5 border-t border-white/10">
          {notificationTypes.map((type) => {
            const emailKey = `email${type.id}` as keyof NotificationPreferences
            const emailEnabled = preferences?.[emailKey] ?? false

            return (
              <div key={`email-${type.id}`} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 flex items-center justify-center flex-shrink-0 ${
                    emailEnabled ? "bg-[#ff1493]/10" : "bg-white/5"
                  }`}>
                    <type.icon className={`w-4 h-4 ${
                      emailEnabled ? "text-[#ff1493]" : "text-white/30"
                    }`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-mono truncate">{type.title}</p>
                    <p className="text-xs text-white/40 truncate">{type.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => savePreference(emailKey, !emailEnabled)}
                  disabled={saving}
                  className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                    emailEnabled ? "bg-[#ff1493]" : "bg-white/10"
                  }`}
                  aria-label={`Toggle email ${type.title.toLowerCase()}`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${
                    emailEnabled ? "left-6" : "left-1"
                  }`} />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Info Footer */}
      <div className="px-4 py-3 border border-white/5 bg-white/[0.01]">
        <p className="text-[10px] font-mono text-white/30 tracking-wide">
          We&apos;ll only send notifications you&apos;ve enabled. You can change these settings anytime.
        </p>
      </div>
    </div>
  )
}
