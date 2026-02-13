"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { MapPin, Lock, Eye, EyeOff, Mail, Map, Crosshair, Navigation, Info } from "lucide-react"

interface LocationSettings {
  showLocationOnPage: boolean
  showLocationOnTicket: boolean
  showMapOnPage: boolean
  showMapOnTicket: boolean
  broadcastOnStart: boolean
  locationPrecision: "exact" | "area" | "city"
  isAddressHidden: boolean
}

interface EventLocationSettingsProps {
  eventId: string
  initialSettings?: Partial<LocationSettings>
}

export function EventLocationSettings({ eventId, initialSettings }: EventLocationSettingsProps) {
  const [settings, setSettings] = useState<LocationSettings>({
    showLocationOnPage: initialSettings?.showLocationOnPage ?? false,
    showLocationOnTicket: initialSettings?.showLocationOnTicket ?? true,
    showMapOnPage: initialSettings?.showMapOnPage ?? false,
    showMapOnTicket: initialSettings?.showMapOnTicket ?? false,
    broadcastOnStart: initialSettings?.broadcastOnStart ?? false,
    locationPrecision: initialSettings?.locationPrecision ?? "exact",
    isAddressHidden: initialSettings?.isAddressHidden ?? false,
  })
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (initialSettings) {
      setSettings({
        showLocationOnPage: initialSettings.showLocationOnPage ?? false,
        showLocationOnTicket: initialSettings.showLocationOnTicket ?? true,
        showMapOnPage: initialSettings.showMapOnPage ?? false,
        showMapOnTicket: initialSettings.showMapOnTicket ?? false,
        broadcastOnStart: initialSettings.broadcastOnStart ?? false,
        locationPrecision: (initialSettings.locationPrecision as LocationSettings["locationPrecision"]) ?? "exact",
        isAddressHidden: initialSettings.isAddressHidden ?? false,
      })
    }
  }, [initialSettings])

  const updateSetting = <K extends keyof LocationSettings>(key: K, value: LocationSettings[K]) => {
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
        toast.success("Location settings saved!")
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

  return (
    <div className="border border-white/10 bg-white/[0.02]">
      <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-cyan-400" />
          <span className="text-[10px] font-mono text-white/40 tracking-widest">LOCATION BROADCASTING</span>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <span className="text-[8px] font-mono text-yellow-400/60">UNSAVED</span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Info Banner */}
        <div className="flex gap-3 p-3 bg-cyan-500/5 border border-cyan-500/20">
          <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-white/50">
            <p className="font-mono text-cyan-400/80 mb-1">Exclusivity Controls</p>
            <p>Configure how and when your event location is revealed. Perfect for secret parties and underground events.</p>
          </div>
        </div>

        {/* Public Event Page */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono text-white/60 tracking-wider flex items-center gap-2">
            <Eye className="w-3.5 h-3.5" />
            PUBLIC EVENT PAGE
          </h3>

          <ToggleOption
            label="Show Location"
            description="Display venue name and address on the public event page"
            enabled={settings.showLocationOnPage}
            onChange={(v) => updateSetting("showLocationOnPage", v)}
            icon={<MapPin className="w-4 h-4" />}
          />

          {settings.showLocationOnPage && (
            <ToggleOption
              label="Show Map"
              description="Display an interactive map on the event page"
              enabled={settings.showMapOnPage}
              onChange={(v) => updateSetting("showMapOnPage", v)}
              icon={<Map className="w-4 h-4" />}
              indent
            />
          )}
        </div>

        {/* Ticket */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono text-white/60 tracking-wider flex items-center gap-2">
            <Lock className="w-3.5 h-3.5" />
            TICKET (AFTER PURCHASE)
          </h3>

          <ToggleOption
            label="Show Location on Ticket"
            description="Reveal venue address on the ticket after purchase"
            enabled={settings.showLocationOnTicket}
            onChange={(v) => updateSetting("showLocationOnTicket", v)}
            icon={<MapPin className="w-4 h-4" />}
          />

          {settings.showLocationOnTicket && (
            <ToggleOption
              label="Show Map on Ticket"
              description="Include an interactive map on the ticket"
              enabled={settings.showMapOnTicket}
              onChange={(v) => updateSetting("showMapOnTicket", v)}
              icon={<Map className="w-4 h-4" />}
              indent
            />
          )}
        </div>

        {/* Email Broadcast */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono text-white/60 tracking-wider flex items-center gap-2">
            <Mail className="w-3.5 h-3.5" />
            EMAIL BROADCAST
          </h3>

          <ToggleOption
            label="Broadcast When Event Starts"
            description="Send location to all ticket holders when the event begins"
            enabled={settings.broadcastOnStart}
            onChange={(v) => updateSetting("broadcastOnStart", v)}
            icon={<Navigation className="w-4 h-4" />}
          />
        </div>

        {/* Location Precision */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono text-white/60 tracking-wider flex items-center gap-2">
            <Crosshair className="w-3.5 h-3.5" />
            LOCATION PRECISION
          </h3>
          <p className="text-[10px] text-white/40">How precise should the displayed location be?</p>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "exact" as const, label: "EXACT", description: "Full address" },
              { id: "area" as const, label: "AREA", description: "Venue name + city" },
              { id: "city" as const, label: "CITY", description: "City only" },
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => updateSetting("locationPrecision", option.id)}
                className={`p-3 border text-center transition-all ${
                  settings.locationPrecision === option.id
                    ? "border-cyan-400 bg-cyan-400/10"
                    : "border-white/10 hover:border-white/20"
                }`}
              >
                <div className={`font-mono text-xs font-bold ${
                  settings.locationPrecision === option.id ? "text-cyan-400" : "text-white/60"
                }`}>
                  {option.label}
                </div>
                <div className="text-[9px] text-white/30 mt-1">{option.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Legacy - Address Hidden */}
        <div className="space-y-3 pt-3 border-t border-white/5">
          <ToggleOption
            label="Hide Address Until Purchase"
            description="Legacy setting - hides address on public page until ticket is purchased"
            enabled={settings.isAddressHidden}
            onChange={(v) => updateSetting("isAddressHidden", v)}
            icon={<EyeOff className="w-4 h-4" />}
          />
        </div>

        {/* Summary */}
        <div className="p-3 bg-white/[0.02] border border-white/5 space-y-2">
          <p className="text-[10px] font-mono text-white/40 tracking-wider">CURRENT CONFIGURATION</p>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <div className="flex items-center gap-2">
              <span className={settings.showLocationOnPage ? "text-green-400" : "text-white/30"}>
                {settings.showLocationOnPage ? "+" : "-"}
              </span>
              <span className="text-white/50">Page shows location</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={settings.showMapOnPage ? "text-green-400" : "text-white/30"}>
                {settings.showMapOnPage ? "+" : "-"}
              </span>
              <span className="text-white/50">Page shows map</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={settings.showLocationOnTicket ? "text-green-400" : "text-white/30"}>
                {settings.showLocationOnTicket ? "+" : "-"}
              </span>
              <span className="text-white/50">Ticket shows location</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={settings.showMapOnTicket ? "text-green-400" : "text-white/30"}>
                {settings.showMapOnTicket ? "+" : "-"}
              </span>
              <span className="text-white/50">Ticket shows map</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={settings.broadcastOnStart ? "text-green-400" : "text-white/30"}>
                {settings.broadcastOnStart ? "+" : "-"}
              </span>
              <span className="text-white/50">Email on start</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-cyan-400">*</span>
              <span className="text-white/50">Precision: {settings.locationPrecision}</span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="w-full py-3 bg-cyan-500 text-black font-mono font-bold text-xs tracking-wider hover:bg-cyan-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black animate-spin rounded-full" />
              SAVING...
            </>
          ) : (
            <>
              <MapPin className="w-3.5 h-3.5" />
              SAVE LOCATION SETTINGS
            </>
          )}
        </button>
      </div>
    </div>
  )
}

function ToggleOption({
  label,
  description,
  enabled,
  onChange,
  icon,
  indent = false,
}: {
  label: string
  description: string
  enabled: boolean
  onChange: (value: boolean) => void
  icon: React.ReactNode
  indent?: boolean
}) {
  return (
    <div
      className={`flex items-start gap-3 p-3 border border-white/5 hover:border-white/10 transition-colors cursor-pointer ${
        indent ? "ml-6" : ""
      }`}
      onClick={() => onChange(!enabled)}
    >
      <div className={`flex-shrink-0 ${enabled ? "text-cyan-400" : "text-white/20"}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className={`font-mono text-sm ${enabled ? "text-white" : "text-white/50"}`}>{label}</p>
          <div
            className={`w-10 h-5 rounded-full transition-colors flex items-center ${
              enabled ? "bg-cyan-500" : "bg-white/10"
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white shadow transition-transform mx-0.5 ${
                enabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </div>
        </div>
        <p className="text-[10px] text-white/30 mt-0.5">{description}</p>
      </div>
    </div>
  )
}
