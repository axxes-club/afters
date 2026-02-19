"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Save, ImageIcon, Eye, EyeOff, Type, Link2, Upload } from "lucide-react"
import { toast } from "sonner"
import { useUIPreferences } from "@/components/providers"
import { LogoUpload } from "@/components/LogoUpload"

interface LocalUIPreferences {
  sidebarLogoMode: "afters" | "afters3x" | "custom" | "hidden"
  sidebarCustomLogoUrl: string | null
  sidebarCompact: boolean
  uiAccentColor: string | null
  uiFontSize: "small" | "normal" | "large"
}

// Expanded color palette
const ACCENT_COLORS = [
  // Row 1: Core brand colors
  { color: null, label: "Pink" },
  { color: "#ff1493", label: "Hot Pink" },
  { color: "#ff0055", label: "Red Pink" },
  { color: "#ff3366", label: "Rose" },
  
  // Row 2: Warm colors
  { color: "#ff6b00", label: "Orange" },
  { color: "#ff8c00", label: "Tangerine" },
  { color: "#ffa500", label: "Amber" },
  { color: "#ffcc00", label: "Yellow" },
  
  // Row 3: Cool colors
  { color: "#00ff88", label: "Mint" },
  { color: "#00ff00", label: "Lime" },
  { color: "#00d4ff", label: "Cyan" },
  { color: "#00bfff", label: "Sky" },
  
  // Row 4: Blues & Purples
  { color: "#0066ff", label: "Blue" },
  { color: "#4169e1", label: "Royal" },
  { color: "#a855f7", label: "Purple" },
  { color: "#8b5cf6", label: "Violet" },
  
  // Row 5: Neutrals & Special
  { color: "#ffffff", label: "White" },
  { color: "#c0c0c0", label: "Silver" },
  { color: "#ffd700", label: "Gold" },
  { color: "#ff69b4", label: "Blush" },
]

export default function AppearanceSettingsPage() {
  const { refreshPreferences } = useUIPreferences()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [logoInputMode, setLogoInputMode] = useState<"upload" | "url">("upload")
  const [preferences, setPreferences] = useState<LocalUIPreferences>({
    sidebarLogoMode: "afters3x",
    sidebarCustomLogoUrl: null,
    sidebarCompact: false,
    uiAccentColor: null,
    uiFontSize: "normal",
  })

  useEffect(() => {
    const controller = new AbortController()
    const loadPreferences = async () => {
      try {
        const res = await fetch("/api/user/preferences", { signal: controller.signal })
        const data = await res.json()
        if (data.organizerProfile) {
          setPreferences({
            sidebarLogoMode: data.organizerProfile.sidebarLogoMode || "afters3x",
            sidebarCustomLogoUrl: data.organizerProfile.sidebarCustomLogoUrl || null,
            sidebarCompact: data.organizerProfile.sidebarCompact || false,
            uiAccentColor: data.organizerProfile.uiAccentColor || null,
            uiFontSize: data.organizerProfile.uiFontSize || "normal",
          })
        }
        setLoading(false)
      } catch {
        if (!controller.signal.aborted) {
          toast.error("Failed to load preferences")
          setLoading(false)
        }
      }
    }
    loadPreferences()
    return () => controller.abort()
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

  const currentAccent = preferences.uiAccentColor || "#ff1493"

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
                className="w-4 h-4"
                style={{ accentColor: currentAccent }}
              />
              <div className="flex-1">
                <p className="font-mono text-sm">Afters Logo</p>
                <p className="text-xs text-white/40">Show the default AFTERS. branding</p>
              </div>
              <span className="font-headline text-lg">
                AFTERS<span style={{ color: currentAccent }}>.</span>
              </span>
            </label>

            <label className="flex items-center gap-3 p-4 border border-white/10 cursor-pointer hover:bg-white/5 transition-colors">
              <input
                type="radio"
                name="logoMode"
                checked={preferences.sidebarLogoMode === "afters3x"}
                onChange={() => setPreferences({ ...preferences, sidebarLogoMode: "afters3x" })}
                className="w-4 h-4"
                style={{ accentColor: currentAccent }}
              />
              <div className="flex-1">
                <p className="font-mono text-sm">Afters 3X Logo</p>
                <p className="text-xs text-white/40">Show a larger AFTERS. branding</p>
              </div>
              <span className="font-headline text-2xl">
                AFTERS<span style={{ color: currentAccent }}>.</span>
              </span>
            </label>

            <label className="flex items-center gap-3 p-4 border border-white/10 cursor-pointer hover:bg-white/5 transition-colors">
              <input
                type="radio"
                name="logoMode"
                checked={preferences.sidebarLogoMode === "custom"}
                onChange={() => setPreferences({ ...preferences, sidebarLogoMode: "custom" })}
                className="w-4 h-4"
                style={{ accentColor: currentAccent }}
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
                className="w-4 h-4"
                style={{ accentColor: currentAccent }}
              />
              <div className="flex-1">
                <p className="font-mono text-sm">No Logo</p>
                <p className="text-xs text-white/40">Hide the logo completely</p>
              </div>
              <EyeOff className="w-5 h-5 text-white/40" />
            </label>
          </div>

          {preferences.sidebarLogoMode === "custom" && (
            <div className="space-y-4 pt-4 border-t border-white/10">
              {/* Toggle between upload and URL */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setLogoInputMode("upload")}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono transition-colors ${
                    logoInputMode === "upload"
                      ? "bg-white/10 text-white border border-white/20"
                      : "text-white/40 border border-transparent hover:text-white/60"
                  }`}
                >
                  <Upload className="w-3 h-3" />
                  UPLOAD
                </button>
                <button
                  type="button"
                  onClick={() => setLogoInputMode("url")}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono transition-colors ${
                    logoInputMode === "url"
                      ? "bg-white/10 text-white border border-white/20"
                      : "text-white/40 border border-transparent hover:text-white/60"
                  }`}
                >
                  <Link2 className="w-3 h-3" />
                  URL
                </button>
              </div>

              {logoInputMode === "upload" ? (
                <LogoUpload
                  value={preferences.sidebarCustomLogoUrl}
                  onChange={(url) => setPreferences({ ...preferences, sidebarCustomLogoUrl: url })}
                />
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="customLogo" className="text-xs font-mono text-white/40">
                    Logo URL
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
                  <p className="text-[10px] text-white/30">Recommended: 200×50px, transparent PNG</p>

                  {preferences.sidebarCustomLogoUrl && (
                    <div className="mt-4 p-4 bg-black/50 border border-white/10 flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
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
          )}
        </div>
      </div>

      {/* Accent Color - Expanded */}
      <div className="border border-white/10 bg-white/[0.02]">
        <div className="px-4 py-2 border-b border-white/10">
          <span className="text-[10px] font-mono text-white/40 tracking-widest">ACCENT COLOR</span>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-white/60">Choose your dashboard accent color.</p>

          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
            {ACCENT_COLORS.map(({ color, label }) => {
              const isSelected = preferences.uiAccentColor === color
              const displayColor = color || "#ff1493"
              
              return (
                <button
                  key={color || "default"}
                  onClick={() => setPreferences({ ...preferences, uiAccentColor: color })}
                  className={`group relative flex flex-col items-center gap-1.5 p-3 border transition-all ${
                    isSelected
                      ? "border-white bg-white/10"
                      : "border-white/10 hover:border-white/30 hover:bg-white/5"
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full transition-transform ${isSelected ? "scale-110" : "group-hover:scale-105"}`}
                    style={{ 
                      backgroundColor: displayColor,
                      boxShadow: isSelected ? `0 0 12px ${displayColor}` : undefined
                    }}
                  />
                  <span className="text-[10px] font-mono text-white/60 truncate w-full text-center">
                    {label}
                  </span>
                  {isSelected && (
                    <span 
                      className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-black"
                      style={{ backgroundColor: displayColor }}
                    />
                  )}
                </button>
              )
            })}
          </div>

          {/* Custom color input */}
          <div className="pt-4 border-t border-white/10">
            <Label className="text-xs font-mono text-white/40 mb-2 block">CUSTOM COLOR</Label>
            <div className="flex gap-2">
              <div className="relative">
                <input
                  type="color"
                  value={preferences.uiAccentColor || "#ff1493"}
                  onChange={(e) => setPreferences({ ...preferences, uiAccentColor: e.target.value })}
                  className="w-12 h-10 cursor-pointer bg-transparent border border-white/10 rounded-none"
                />
              </div>
              <Input
                value={preferences.uiAccentColor || "#ff1493"}
                onChange={(e) => {
                  const val = e.target.value
                  if (val.match(/^#[0-9A-Fa-f]{0,6}$/)) {
                    setPreferences({ ...preferences, uiAccentColor: val })
                  }
                }}
                placeholder="#ff1493"
                className="bg-white/5 border-white/10 font-mono w-28"
              />
              <button
                onClick={() => setPreferences({ ...preferences, uiAccentColor: null })}
                className="px-3 py-2 border border-white/10 text-xs font-mono text-white/40 hover:bg-white/5 transition-colors"
              >
                RESET
              </button>
            </div>
          </div>
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
                    ? "border-white/40 bg-white/10"
                    : "border-white/10 hover:bg-white/5 text-white/60"
                }`}
                style={preferences.uiFontSize === size ? { borderColor: currentAccent, color: currentAccent } : undefined}
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
          <span className="text-[10px] font-mono text-white/40 tracking-widest">SIDEBAR</span>
        </div>
        <div className="p-6 space-y-4">
          <label className="flex items-center justify-between gap-4 cursor-pointer">
            <div>
              <p className="font-mono text-sm">Compact Mode</p>
              <p className="text-xs text-white/40">Use a narrower sidebar with icons only</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={preferences.sidebarCompact}
              onClick={() => setPreferences({ ...preferences, sidebarCompact: !preferences.sidebarCompact })}
              className="relative w-12 h-6 rounded-full transition-colors"
              style={{ backgroundColor: preferences.sidebarCompact ? currentAccent : "rgba(255,255,255,0.2)" }}
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

      {/* Save Button */}
      <Button 
        onClick={handleSave} 
        disabled={saving} 
        className="w-full sm:w-auto text-black font-mono font-bold"
        style={{ backgroundColor: currentAccent }}
        size="lg"
      >
        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
        Save Preferences
      </Button>
    </div>
  )
}
