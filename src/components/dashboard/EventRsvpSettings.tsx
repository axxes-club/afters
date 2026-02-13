"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Users, UserPlus, Hash, Info } from "lucide-react"

interface RsvpSettings {
  isRsvpOnly: boolean
  rsvpCapacity: number | null
  rsvpAllowPlusOnes: boolean
  rsvpMaxPlusOnes: number
}

interface EventRsvpSettingsProps {
  eventId: string
  initialSettings: RsvpSettings
}

export function EventRsvpSettings({ eventId, initialSettings }: EventRsvpSettingsProps) {
  const [settings, setSettings] = useState<RsvpSettings>(initialSettings)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    setSettings(initialSettings)
  }, [initialSettings])

  const updateSetting = <K extends keyof RsvpSettings>(key: K, value: RsvpSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      if (res.ok) {
        toast.success("RSVP settings saved!")
        setHasChanges(false)
      } else {
        const data = await res.json()
        toast.error(data.message || "Failed to save settings")
      }
    } catch {
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  if (!settings.isRsvpOnly) {
    return null
  }

  return (
    <div className="border border-white/10 bg-white/[0.02]">
      <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-green-400" />
          <span className="text-[10px] font-mono text-white/40 tracking-widest">RSVP SETTINGS</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-green-400/80 px-1.5 py-0.5 border border-green-400/30">RSVP EVENT</span>
          {hasChanges && (
            <span className="text-[8px] font-mono text-yellow-400/60">UNSAVED</span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Info Banner */}
        <div className="flex gap-3 p-3 bg-green-500/5 border border-green-500/20">
          <Info className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-white/50">
            <p className="font-mono text-green-400/80 mb-1">Free Event Mode</p>
            <p>This event uses RSVP instead of tickets. Guests can reserve spots without payment.</p>
          </div>
        </div>

        {/* Capacity */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono text-white/60 tracking-wider flex items-center gap-2">
            <Hash className="w-3.5 h-3.5" />
            CAPACITY
          </h3>

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={settings.rsvpCapacity ?? ""}
                onChange={(e) => updateSetting("rsvpCapacity", e.target.value ? parseInt(e.target.value) : null)}
                placeholder="Unlimited"
                className="flex-1 px-3 py-2 bg-white/[0.02] border border-white/10 focus:border-green-400/50 focus:outline-none font-mono text-sm"
              />
              <button
                onClick={() => updateSetting("rsvpCapacity", null)}
                className={`px-3 py-2 border text-xs font-mono transition-all ${
                  settings.rsvpCapacity === null
                    ? "border-green-400 bg-green-400/10 text-green-400"
                    : "border-white/10 text-white/40 hover:border-white/20"
                }`}
              >
                UNLIMITED
              </button>
            </div>
            <p className="text-[10px] text-white/30 font-mono">
              {settings.rsvpCapacity
                ? `Maximum ${settings.rsvpCapacity} guests can RSVP`
                : "No limit on number of RSVPs"}
            </p>
          </div>
        </div>

        {/* Plus Ones */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono text-white/60 tracking-wider flex items-center gap-2">
            <UserPlus className="w-3.5 h-3.5" />
            PLUS ONES
          </h3>

          <div
            className="flex items-start gap-3 p-3 border border-white/5 hover:border-white/10 transition-colors cursor-pointer"
            onClick={() => updateSetting("rsvpAllowPlusOnes", !settings.rsvpAllowPlusOnes)}
          >
            <div className={`flex-shrink-0 ${settings.rsvpAllowPlusOnes ? "text-green-400" : "text-white/20"}`}>
              <UserPlus className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className={`font-mono text-sm ${settings.rsvpAllowPlusOnes ? "text-white" : "text-white/50"}`}>
                  Allow Plus Ones
                </p>
                <div
                  className={`w-10 h-5 rounded-full transition-colors flex items-center ${
                    settings.rsvpAllowPlusOnes ? "bg-green-500" : "bg-white/10"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white shadow transition-transform mx-0.5 ${
                      settings.rsvpAllowPlusOnes ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </div>
              </div>
              <p className="text-[10px] text-white/30 mt-0.5">Let guests bring additional people</p>
            </div>
          </div>

          {settings.rsvpAllowPlusOnes && (
            <div className="ml-6 space-y-2">
              <p className="text-[10px] font-mono text-white/40 tracking-wider">MAX PLUS ONES PER RSVP</p>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    onClick={() => updateSetting("rsvpMaxPlusOnes", num)}
                    className={`w-10 h-10 border text-sm font-mono transition-all ${
                      settings.rsvpMaxPlusOnes === num
                        ? "border-green-400 bg-green-400/10 text-green-400"
                        : "border-white/10 text-white/40 hover:border-white/20"
                    }`}
                  >
                    +{num}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="p-3 bg-white/[0.02] border border-white/5 space-y-2">
          <p className="text-[10px] font-mono text-white/40 tracking-wider">RSVP CONFIGURATION</p>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <div className="flex items-center gap-2">
              <span className="text-green-400">*</span>
              <span className="text-white/50">
                Capacity: {settings.rsvpCapacity ?? "Unlimited"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={settings.rsvpAllowPlusOnes ? "text-green-400" : "text-white/30"}>
                {settings.rsvpAllowPlusOnes ? "+" : "-"}
              </span>
              <span className="text-white/50">
                {settings.rsvpAllowPlusOnes
                  ? `Plus ones allowed (max +${settings.rsvpMaxPlusOnes})`
                  : "No plus ones"}
              </span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="w-full py-3 bg-green-500 text-black font-mono font-bold text-xs tracking-wider hover:bg-green-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black animate-spin rounded-full" />
              SAVING...
            </>
          ) : (
            <>
              <Users className="w-3.5 h-3.5" />
              SAVE RSVP SETTINGS
            </>
          )}
        </button>
      </div>
    </div>
  )
}
