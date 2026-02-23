"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Terminal,
  ExternalLink,
  Check,
  Github,
  Sparkles,
  ChevronRight,
  Copy,
} from "lucide-react"
import { toast } from "sonner"

interface CommunityApp {
  id: string
  name: string
  description: string
  longDescription?: string
  icon: string
  category: "cli" | "integration" | "mobile" | "bot"
  features: string[]
  installCommand?: string
  githubUrl?: string
  websiteUrl?: string
  status: "available" | "beta" | "coming_soon"
  maintainedBy: "afters" | "community"
}

const COMMUNITY_APPS: CommunityApp[] = [
  {
    id: "after-cli",
    name: "After CLI",
    description: "Terminal interface for afters.am - manage events, check-ins, and more from your command line.",
    longDescription: "A powerful TUI (Terminal User Interface) for afters.am. Perfect for power users who want to manage events, handle check-ins, view orders, and more without leaving the terminal.",
    icon: "⌨️",
    category: "cli",
    features: [
      "Full event management",
      "Real-time check-in mode",
      "Guestlist management",
      "Orders & analytics view",
      "API key management",
      "OAuth authentication"
    ],
    installCommand: "npm install -g afters",
    githubUrl: "https://github.com/aftersapp/after-cli",
    status: "available",
    maintainedBy: "afters"
  },
  {
    id: "zapier",
    name: "Zapier Integration",
    description: "Connect afters.am to 5000+ apps with automated workflows.",
    icon: "⚡",
    category: "integration",
    features: [
      "Auto-sync attendees to CRM",
      "Send confirmation emails",
      "Post to social media",
      "Create calendar events"
    ],
    status: "coming_soon",
    maintainedBy: "afters"
  },
  {
    id: "slack-bot",
    name: "Slack Bot",
    description: "Get real-time event notifications in your Slack workspace.",
    icon: "💬",
    category: "bot",
    features: [
      "New order alerts",
      "Sold out warnings",
      "Daily sales summary",
      "Check-in notifications"
    ],
    status: "beta",
    maintainedBy: "community"
  },
  {
    id: "mobile-app",
    name: "Mobile App",
    description: "Native iOS and Android app for on-the-go event management.",
    icon: "📱",
    category: "mobile",
    features: [
      "Event dashboard",
      "Ticket scanning",
      "Push notifications",
      "Offline mode"
    ],
    status: "coming_soon",
    maintainedBy: "afters"
  }
]

const CATEGORY_LABELS = {
  cli: "Command Line",
  integration: "Integrations",
  mobile: "Mobile",
  bot: "Bots"
}

const STATUS_STYLES = {
  available: "bg-green-500/10 text-green-400 border-green-500/20",
  beta: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  coming_soon: "bg-white/5 text-white/40 border-white/10"
}

const STATUS_LABELS = {
  available: "Available",
  beta: "Beta",
  coming_soon: "Coming Soon"
}

export default function CommunityAppsPage() {
  const [selectedApp, setSelectedApp] = useState<CommunityApp | null>(null)
  const [copied, setCopied] = useState(false)

  function copyCommand(cmd: string) {
    navigator.clipboard.writeText(cmd)
    setCopied(true)
    toast.success("Copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-mono font-bold tracking-tight">COMMUNITY APPS</h1>
          <p className="text-white/40 text-sm font-mono mt-1">
            Third-party integrations and tools built for afters.am
          </p>
        </div>
        <Link href="/b/developers">
          <Button variant="outline" size="sm" className="font-mono text-xs">
            <ChevronRight className="w-3 h-3 mr-1 rotate-180" />
            Back to Developers
          </Button>
        </Link>
      </div>

      {/* Featured App */}
      <div className="border border-primary/20 bg-primary/5 p-6">
        <div className="flex items-start gap-4">
          <div className="text-4xl">⌨️</div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-mono font-bold text-lg">After CLI</h2>
              <span className="text-[9px] px-1.5 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 font-mono">
                AVAILABLE
              </span>
              <span className="text-[9px] px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/20 font-mono">
                OFFICIAL
              </span>
            </div>
            <p className="text-white/60 text-sm mb-4">
              Terminal interface for afters.am - manage events, check-ins, and more from your command line.
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {["Event Management", "Check-in Mode", "Guestlist", "Orders", "API Keys"].map(f => (
                <span key={f} className="text-[10px] px-2 py-1 bg-white/5 border border-white/10 font-mono">
                  {f}
                </span>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-black/50 border border-white/10 flex-1">
                <Terminal className="w-4 h-4 text-white/40" />
                <code className="text-sm font-mono flex-1">npm install -g afters</code>
                <button 
                  onClick={() => copyCommand("npm install -g afters")}
                  className="text-white/40 hover:text-white transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <a 
                href="https://github.com/aftersapp/after-cli" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm" className="font-mono text-xs w-full sm:w-auto">
                  <Github className="w-3.5 h-3.5 mr-1.5" />
                  View on GitHub
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      {Object.entries(CATEGORY_LABELS).map(([category, label]) => {
        const apps = COMMUNITY_APPS.filter(a => a.category === category)
        if (apps.length === 0) return null

        return (
          <div key={category}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-mono text-white/40 tracking-widest">{label}</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              {apps.map(app => (
                <div 
                  key={app.id}
                  className={`border bg-white/[0.02] p-4 transition-all cursor-pointer hover:bg-white/[0.04] ${
                    selectedApp?.id === app.id ? "border-primary" : "border-white/10"
                  }`}
                  onClick={() => setSelectedApp(selectedApp?.id === app.id ? null : app)}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{app.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-mono font-bold text-sm">{app.name}</h3>
                        <span className={`text-[9px] px-1.5 py-0.5 border font-mono ${STATUS_STYLES[app.status]}`}>
                          {STATUS_LABELS[app.status]}
                        </span>
                      </div>
                      <p className="text-white/40 text-xs font-mono line-clamp-2">{app.description}</p>
                    </div>
                  </div>
                  
                  {selectedApp?.id === app.id && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="flex flex-wrap gap-2 mb-4">
                        {app.features.map(f => (
                          <span key={f} className="text-[10px] px-2 py-1 bg-white/5 border border-white/10 font-mono flex items-center gap-1">
                            <Check className="w-2.5 h-2.5 text-primary" />
                            {f}
                          </span>
                        ))}
                      </div>
                      
                      {app.installCommand && app.status === "available" && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-black/50 border border-white/10 mb-3">
                          <Terminal className="w-4 h-4 text-white/40" />
                          <code className="text-sm font-mono flex-1">{app.installCommand}</code>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        {app.githubUrl && (
                          <a href={app.githubUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm" className="font-mono text-xs">
                              <Github className="w-3.5 h-3.5 mr-1.5" />
                              GitHub
                            </Button>
                          </a>
                        )}
                        {app.websiteUrl && (
                          <a href={app.websiteUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm" className="font-mono text-xs">
                              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                              Website
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* Build Your Own */}
      <div className="border border-white/10 bg-white/[0.02] p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-mono font-bold mb-1">Build Your Own Integration</h3>
            <p className="text-white/40 text-sm font-mono mb-4">
              Use our API to build custom integrations for your workflow.
            </p>
            <div className="flex gap-2">
              <Link href="/b/developers">
                <Button size="sm" className="bg-primary hover:bg-primary/80 text-black font-mono text-xs">
                  Get API Keys
                </Button>
              </Link>
              <Link href="/b/developers/apps">
                <Button variant="outline" size="sm" className="font-mono text-xs">
                  Register OAuth App
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}