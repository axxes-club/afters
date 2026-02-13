"use client"

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings } from "lucide-react"

export default function SettingsPage() {
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

      <Card className="border-dashed opacity-60">
        <CardHeader>
          <CardTitle className="text-muted-foreground">Settings Coming Soon</CardTitle>
          <CardDescription>
            Site-wide settings will be added here as needed.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
