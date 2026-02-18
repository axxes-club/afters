"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Save, ImageIcon, Eye, EyeOff, Type } from "lucide-react"
import { toast } from "sonner"
import { useUIPreferences } from "@/components/providers"

interface LocalUIPreferences {
  sidebarLogoMode: "afters" | "custom" | "hidden"
  sidebarCustomLogoUrl: string | null
  sidebarCompact: boolean
  uiAccentColor: string | null
  uiFontSize: "small" | "normal" | "large"
}

export default function AppearanceSettingsPage() {
  const { preferences: globalPrefs, refreshPreferences } = useUIPreferences()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [preferences, setPreferences] = useState<LocalUIPreferences>({
    sidebarLogoMode: "afters",
    sidebarCustomLogoUrl: null,
    sidebarCompact: false,
    uiAccentColor: null,
    uiFontSize: "normal",
  })

  useEffect(() => {
    fetch("/api/user/preferences")
      .then((res) => res.json())
      .then((data) => {
        if (data.organizerProfile) {
          setPreferences({
            sidebarLogoMode: data.organizerProfile.sidebarLogoMode || "afters",
            sidebarCustomLogoUrl: data.organizerProfile.sidebarCustomLogoUrl || null,
            sidebarCompact: data.organizerProfile.sidebarCompact || false,
            uiAccentColor: data.organizerProfile.uiAccentColor || null,
            uiFontSize: data.organizerProfile.uiFontSize || "normal",
          })
        }
        setLoading(false)
      })
      .catch(() => {
        toast.error("Failed to load preferences")
        setLoading(false)
      })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/user/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      })

      if (res.ok) {
        toast.success("Preferences saved! Changes applied site-wide.")
        // Refresh the global UI preferences context (no page reload needed)
        await refreshPreferences()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to save")
      }
    } catch {
      toast.error("Something went wrong")
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-white/40" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-mono font-bold tracking-tight">APPEARANCE</h1>
        <p className="text-white/40 text-sm font-mono mt-1">Customize how Afters looks for you</p>
      </div>

      {/* Sidebar Logo */}
      <div className="border border-white/10 bg-white/[0.02]">
        <div className="px-4 py-2 border-b border-white/10">
          <span className="text-[10px] font-mono text-white/40 tracking-widest">SIDEBAR LOGO</span>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-white/60">Choose what logo appears in the sidebar navigation.</p>

          <div className="grid gap-3">
            <label className="flex items-center gap-3 p-4 border border-white/10 cursor-pointer hover:bg-white/5 transition-colors">
              <input
                type="radio"
                name="logoMode"
                checked={preferences.sidebarLogoMode === "afters"}
                onChange={() => setPreferences({ ...preferences, sidebarLogoMode: "afters" })}
                className="w-4 h-4 accent-[#ff1493]"
              />
              <div className="flex-1">
                <p className="font-mono text-sm">Afters Logo</p>
                <p className="text-xs text-white/40">Show the default AFTERS. branding</p>
              </div>
              <span className="font-headline text-lg">
                AFTERS<span className="text-[#ff1493]">.</span>
              </span>
            </label>

            <label className="flex items-center gap-3 p-4 border border-white/10 cursor-pointer hover:bg-white/5 transition-colors">
              <input
                type="radio"
                name="logoMode"
                checked={preferences.sidebarLogoMode === "custom"}
                onChange={() => setPreferences({ ...preferences, sidebarLogoMode: "custom" })}
                className="w-4 h-4 accent-[#ff1493]"
              />
              <div className="flex-1">
                <p className="font-mono text-sm">Custom Logo</p>
                <p className="text-xs text-white/40">Use your own logo image</p>
              </div>
              <ImageIcon className="w-5 h-5 text-white/40" />
            </label>

            <label className="flex items-center gap-3 p-4 border border-white/10 cursor-pointer hover:bg-white/5 transition-colors">
              <input
                type="radio"
                name="logoMode"
                checked={preferences.sidebarLogoMode === "hidden"}
                onChange={() => setPreferences({ ...preferences, sidebarLogoMode: "hidden" })}
                className="w-4 h-4 accent-[#ff1493]"
              />
              <div className="flex-1">
                <p className="font-mono text-sm">No Logo</p>
                <p className="text-xs text-white/40">Hide the logo completely</p>
              </div>
              <EyeOff className="w-5 h-5 text-white/40" />
            </label>
          </div>

          {preferences.sidebarLogoMode === "custom" && (
            <div className="space-y-2 pt-4 border-t border-white/10">
              <Label htmlFor="customLogo" className="text-xs font-mono text-white/40">
                Custom Logo URL
              </Label>
              <Input
                id="customLogo"
                value={preferences.sidebarCustomLogoUrl || ""}
                onChange={(e) =>
                  setPreferences({ ...preferences, sidebarCustomLogoUrl: e.target.value || null })
                }
                placeholder="https://your-domain.com/logo.png"
                className="bg-white/5 border-white/10"
              />
              <p className="text-[10px] text-white/30">Recommended: 200x50px, transparent PNG</p>

              {preferences.sidebarCustomLogoUrl && (
                <div className="mt-4 p-4 bg-black/50 border border-white/10 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element -- External user-provided URL */}
                  <img
                    src={preferences.sidebarCustomLogoUrl}
                    alt="Custom logo preview"
                    className="max-h-10 max-w-[180px] object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = "none"
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Text Size */}
      <div className="border border-white/10 bg-white/[0.02]">
        <div className="px-4 py-2 border-b border-white/10 flex items-center gap-2">
          <Type className="w-4 h-4 text-white/40" />
          <span className="text-[10px] font-mono text-white/40 tracking-widest">TEXT SIZE</span>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-white/60">Adjust the text size for better readability.</p>

          <div className="flex gap-2">
            {(["small", "normal", "large"] as const).map((size) => (
              <button
                key={size}
                onClick={() => setPreferences({ ...preferences, uiFontSize: size })}
                className={`flex-1 py-3 px-4 border font-mono text-sm transition-colors ${
                  preferences.uiFontSize === size
                    ? "border-[#ff1493] bg-[#ff1493]/10 text-[#ff1493]"
                    : "border-white/10 hover:bg-white/5 text-white/60"
                }`}
              >
                {size.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Compact Mode */}
      <div className="border border-white/10 bg-white/[0.02]">
        <div className="px-4 py-2 border-b border-white/10 flex items-center gap-2">
          <Eye className="w-4 h-4 text-white/40" />
          <span className="text-[10px] font-mono text-white/40 tracking-widest">VISIBILITY</span>
        </div>
        <div className="p-6 space-y-4">
          <label className="flex items-center justify-between gap-4 cursor-pointer">
            <div>
              <p className="font-mono text-sm">Compact Sidebar</p>
              <p className="text-xs text-white/40">Use a narrower sidebar with icons only</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={preferences.sidebarCompact}
              onClick={() => setPreferences({ ...preferences, sidebarCompact: !preferences.sidebarCompact })}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                preferences.sidebarCompact ? "bg-[#ff1493]" : "bg-white/20"
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  preferences.sidebarCompact ? "translate-x-6" : ""
                }`}
              />
            </button>
          </label>
        </div>
      </div>

      {/* Accent Color */}
      <div className="border border-white/10 bg-white/[0.02]">
        <div className="px-4 py-2 border-b border-white/10">
          <span className="text-[10px] font-mono text-white/40 tracking-widest">ACCENT COLOR</span>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-white/60">Choose your dashboard accent color.</p>

          <div className="flex flex-wrap gap-3">
            {[
              { color: null, label: "Pink (Default)" },
              { color: "#00ff88", label: "Green" },
              { color: "#00d4ff", label: "Cyan" },
              { color: "#ff6b00", label: "Orange" },
              { color: "#a855f7", label: "Purple" },
              { color: "#ffffff", label: "White" },
            ].map(({ color, label }) => (
              <button
                key={color || "default"}
                onClick={() => setPreferences({ ...preferences, uiAccentColor: color })}
                className={`flex items-center gap-2 px-4 py-2 border transition-colors ${
                  preferences.uiAccentColor === color
                    ? "border-white bg-white/10"
                    : "border-white/10 hover:bg-white/5"
                }`}
              >
                <span
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: color || "#ff1493" }}
                />
                <span className="text-xs font-mono">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto" size="lg">
        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
        Save Preferences
      </Button>
    </div>
  )
}
