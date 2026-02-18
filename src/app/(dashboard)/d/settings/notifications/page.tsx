"use client"

import { useState } from "react"
import { Mail, Bell, Ticket, Calendar, MessageSquare } from "lucide-react"

interface NotificationSetting {
  id: string
  icon: typeof Mail
  title: string
  description: string
  enabled: boolean
}

export default function NotificationsPage() {
  const [settings, setSettings] = useState<NotificationSetting[]>([
    { id: "ticket-sales", icon: Ticket, title: "Ticket Sales", description: "When someone buys a ticket", enabled: true },
    { id: "event-reminders", icon: Calendar, title: "Event Reminders", description: "Before your events start", enabled: true },
    { id: "check-ins", icon: Mail, title: "Check-in Summaries", description: "Daily check-in reports", enabled: false },
    { id: "product-updates", icon: MessageSquare, title: "Product Updates", description: "News and features", enabled: false },
  ])

  function toggleSetting(id: string) {
    setSettings(prev => prev.map(s => 
      s.id === id ? { ...s, enabled: !s.enabled } : s
    ))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-mono font-bold tracking-tight">NOTIFICATIONS</h1>
        <p className="text-white/40 text-sm font-mono mt-1">Alert preferences</p>
      </div>

      {/* Email Notifications */}
      <div className="border border-white/10 bg-white/[0.02]">
        <div className="px-4 py-2 border-b border-white/10 flex items-center gap-2">
          <Mail className="w-3.5 h-3.5 text-white/30" />
          <span className="text-[10px] font-mono text-white/40 tracking-widest">EMAIL</span>
        </div>
        <div className="divide-y divide-white/5">
          {settings.map((setting) => (
            <div key={setting.id} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 flex items-center justify-center ${setting.enabled ? "bg-[#ff1493]/10" : "bg-white/5"}`}>
                  <setting.icon className={`w-4 h-4 ${setting.enabled ? "text-[#ff1493]" : "text-white/30"}`} />
                </div>
                <div>
                  <p className="text-sm font-mono">{setting.title}</p>
                  <p className="text-xs text-white/40">{setting.description}</p>
                </div>
              </div>
              <button
                onClick={() => toggleSetting(setting.id)}
                className={`relative w-10 h-6 rounded-full transition-colors ${
                  setting.enabled ? "bg-[#ff1493]" : "bg-white/10"
                }`}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${
                  setting.enabled ? "left-5" : "left-1"
                }`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Push Notifications */}
      <div className="border border-white/10 bg-white/[0.02]">
        <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-3.5 h-3.5 text-white/30" />
            <span className="text-[10px] font-mono text-white/40 tracking-widest">PUSH</span>
          </div>
          <span className="text-[9px] font-mono text-white/20 px-1.5 py-0.5 bg-white/5">SOON</span>
        </div>
        <div className="p-12 text-center">
          <Bell className="w-8 h-8 mx-auto text-white/10 mb-3" />
          <p className="text-white/40 font-mono text-sm">Coming soon</p>
        </div>
      </div>
    </div>
  )
}
