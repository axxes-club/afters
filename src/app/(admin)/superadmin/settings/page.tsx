"use client"

import { Settings } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-4 sm:space-y-6 pb-20 lg:pb-6">
      <div className="border-b border-white/10 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-6 h-6 text-[#ff1493]" />
          <h1 className="text-2xl font-mono font-bold tracking-tight text-white">SITE SETTINGS</h1>
        </div>
        <p className="text-white/40 font-mono text-sm">Global settings that affect the entire site.</p>
      </div>

      <div className="border border-dashed border-white/20 bg-white/[0.02] p-8 text-center">
        <Settings className="h-12 w-12 mx-auto text-white/20 mb-4" />
        <h3 className="font-mono font-bold text-white/40 mb-2">SETTINGS COMING SOON</h3>
        <p className="text-sm text-white/30 font-mono">
          Site-wide settings will be added here as needed.
        </p>
      </div>
    </div>
  )
}
