"use client"

import { useState } from "react"
import { Bell, Mail, Ticket, Calendar, MessageSquare, Smartphone } from "lucide-react"

interface NotificationSetting {
  id: string
  icon: typeof Mail
  title: string
  description: string
  enabled: boolean
}

export default function NotificationsPage() {
  const [settings, setSettings] = useState<NotificationSetting[]>([
    { id: "ticket-sales", icon: Ticket, title: "Ticket Sales", description: "Get notified when someone buys a ticket", enabled: true },
    { id: "event-reminders", icon: Calendar, title: "Event Reminders", description: "Reminders before your events start", enabled: true },
    { id: "check-ins", icon: Mail, title: "Check-in Summaries", description: "Daily check-in reports during events", enabled: false },
    { id: "product-updates", icon: MessageSquare, title: "Product Updates", description: "News about new features and improvements", enabled: false },
  ])

  function toggleSetting(id: string) {
    setSettings(prev => prev.map(s => 
      s.id === id ? { ...s, enabled: !s.enabled } : s
    ))
  }

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden border border-white/10 bg-gradient-to-br from-blue-900/10 via-black to-indigo-900/10">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(99,102,241,0.15) 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }} />
        </div>
        
        <div className="relative p-8 md:p-12">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Bell className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="font-headline text-4xl md:text-5xl tracking-wide">
                NOTIFICATIONS<span className="text-blue-400">.</span>
              </h1>
              <p className="text-white/40 font-mono text-sm mt-2">ALERTS & PREFERENCES</p>
            </div>
          </div>
        </div>
      </div>

      {/* Email Notifications */}
      <div className="border border-white/10 bg-white/[0.02]">
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
          <Mail className="w-4 h-4 text-blue-400" />
          <h2 className="font-mono text-xs tracking-widest text-white/40">EMAIL NOTIFICATIONS</h2>
        </div>
        
        <div className="divide-y divide-white/5">
          {settings.map((setting) => (
            <div key={setting.id} className="p-5 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                  setting.enabled ? "bg-blue-500/20" : "bg-white/5"
                }`}>
                  <setting.icon className={`w-5 h-5 transition-colors ${
                    setting.enabled ? "text-blue-400" : "text-white/30"
                  }`} />
                </div>
                <div>
                  <h3 className="font-medium text-white">{setting.title}</h3>
                  <p className="text-sm text-white/40">{setting.description}</p>
                </div>
              </div>
              
              {/* Toggle */}
              <button
                onClick={() => toggleSetting(setting.id)}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  setting.enabled ? "bg-blue-500" : "bg-white/10"
                }`}
              >
                <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all ${
                  setting.enabled ? "left-6" : "left-1"
                }`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Push Notifications - Coming Soon */}
      <div className="border border-white/10 bg-white/[0.02]">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Smartphone className="w-4 h-4 text-white/30" />
            <h2 className="font-mono text-xs tracking-widest text-white/40">PUSH NOTIFICATIONS</h2>
          </div>
          <span className="text-[10px] font-mono px-2 py-1 bg-white/5 text-white/30">COMING SOON</span>
        </div>
        
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Bell className="w-8 h-8 text-white/20" />
          </div>
          <p className="text-white/40 text-sm mb-1">Push notifications coming soon</p>
          <p className="text-white/20 text-xs max-w-xs">
            Get instant alerts on your phone when tickets sell or guests check in
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="border border-blue-500/20 bg-blue-500/5 p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Mail className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-blue-200/80">
              <span className="font-medium text-blue-300">Email delivery:</span> Notifications are sent to your 
              account email. Make sure it&apos;s up to date in your profile settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
