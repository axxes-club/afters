"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Radio, Settings, Loader2 } from "lucide-react"

interface SiteSettings {
  id: string
  radioWidgetEnabled: boolean
  createdAt: string
  updatedAt: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings")
      if (!res.ok) throw new Error("Failed to fetch settings")
      const data = await res.json()
      setSettings(data)
    } catch (error) {
      toast.error("Failed to load settings")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = async (key: keyof SiteSettings, value: boolean) => {
    if (!settings) return

    setSaving(true)
    const previousValue = settings[key]

    // Optimistic update
    setSettings({ ...settings, [key]: value })

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      })

      if (!res.ok) throw new Error("Failed to update setting")

      const data = await res.json()
      setSettings(data)
      toast.success("Setting updated")
    } catch (error) {
      // Revert on error
      setSettings({ ...settings, [key]: previousValue })
      toast.error("Failed to update setting")
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Settings className="h-8 w-8 text-[#ff1493]" />
          Site Settings
        </h1>
        <p className="text-muted-foreground">
          Global settings that affect the entire site.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-[#ff1493]" />
            AFTERS RADIO Widget
          </CardTitle>
          <CardDescription>
            Control the visibility of the floating radio player on the public site.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="radio-widget" className="text-base font-medium">
                Show Radio Widget
              </Label>
              <p className="text-sm text-muted-foreground">
                When enabled, the floating radio player appears on all public pages.
              </p>
            </div>
            <Switch
              id="radio-widget"
              checked={settings?.radioWidgetEnabled ?? true}
              onCheckedChange={(checked) => updateSetting("radioWidgetEnabled", checked)}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Placeholder for future settings */}
      <Card className="border-dashed opacity-60">
        <CardHeader>
          <CardTitle className="text-muted-foreground">More Settings Coming Soon</CardTitle>
          <CardDescription>
            Additional site-wide settings will be added here as needed.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
