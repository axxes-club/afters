"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Loader2, 
  RefreshCw, 
  Shield, 
  Key, 
  Link2, 
  Users,
  Copy,
  Check,
  Plus
} from "lucide-react"
import { toast } from "sonner"

interface OAuthApp {
  id: string
  name: string
  description: string | null
  clientId: string
  redirectUris: string[]
  scopes: string[]
  websiteUrl: string | null
  isActive: boolean
  isVerified: boolean
  createdAt: string
  user: {
    email: string
    firstName: string | null
    lastName: string | null
  }
  _count: {
    connections: number
    accessTokens: number
  }
}

export default function OAuthAppsPage() {
  const [apps, setApps] = useState<OAuthApp[]>([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const fetchApps = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/oauth-apps")
      if (res.ok) {
        const data = await res.json()
        setApps(data.apps || [])
      } else {
        toast.error("Failed to load OAuth apps")
      }
    } catch {
      toast.error("Error loading OAuth apps")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApps()
  }, [])

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    toast.success(`${label} copied!`)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleSeedMembersApp = async () => {
    setSeeding(true)
    try {
      const res = await fetch("/api/admin/oauth-apps/seed-members", { method: "POST" })
      const data = await res.json()
      
      if (res.ok) {
        toast.success(data.message || "Members Portal app created!")
        if (data.clientSecret) {
          // Show the secret in a more permanent way
          toast.info(`Client Secret: ${data.clientSecret}`, { duration: 30000 })
        }
        fetchApps()
      } else {
        toast.error(data.error || "Failed to create app")
      }
    } catch {
      toast.error("Error seeding app")
    } finally {
      setSeeding(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-white/40" />
      </div>
    )
  }

  const membersAppExists = apps.some(app => app.name === "Members Portal")

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-mono font-bold tracking-tight">OAUTH APPS</h1>
          <p className="text-white/40 text-sm font-mono mt-1">
            Manage OAuth applications and integrations
          </p>
        </div>
        <div className="flex gap-2">
          {!membersAppExists && (
            <Button
              onClick={handleSeedMembersApp}
              disabled={seeding}
              className="bg-primary text-black"
            >
              {seeding ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Add Members Portal
            </Button>
          )}
          <Button variant="outline" onClick={fetchApps}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Apps List */}
      {apps.length === 0 ? (
        <div className="border border-white/10 bg-white/[0.02] p-8 text-center">
          <Key className="w-8 h-8 mx-auto mb-4 text-white/20" />
          <p className="text-white/40 font-mono">No OAuth apps registered</p>
          <p className="text-white/20 text-sm font-mono mt-2">
            Click &quot;Add Members Portal&quot; to create the first app
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {apps.map((app) => (
            <div
              key={app.id}
              className="border border-white/10 bg-white/[0.02] overflow-hidden"
            >
              {/* App Header */}
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {app.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-mono font-bold">{app.name}</h3>
                      {app.isVerified && (
                        <Shield className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    {app.websiteUrl && (
                      <a
                        href={app.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-white/40 hover:text-white/60"
                      >
                        {app.websiteUrl}
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={app.isActive ? "default" : "secondary"}>
                    {app.isActive ? "Active" : "Disabled"}
                  </Badge>
                </div>
              </div>

              {/* App Details */}
              <div className="p-4 space-y-4">
                {app.description && (
                  <p className="text-sm text-white/60">{app.description}</p>
                )}

                {/* Client ID */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-white/40 tracking-widest">
                    CLIENT ID
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-black border border-white/10 text-sm font-mono text-white/80 truncate">
                      {app.clientId}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(app.clientId, "Client ID")}
                    >
                      {copied === "Client ID" ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Redirect URIs */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-white/40 tracking-widest flex items-center gap-2">
                    <Link2 className="w-3 h-3" />
                    REDIRECT URIS
                  </label>
                  <div className="space-y-1">
                    {app.redirectUris.map((uri, i) => (
                      <code
                        key={i}
                        className="block px-3 py-2 bg-black border border-white/10 text-xs font-mono text-white/60 truncate"
                      >
                        {uri}
                      </code>
                    ))}
                  </div>
                </div>

                {/* Scopes */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-white/40 tracking-widest">
                    SCOPES
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {app.scopes.map((scope) => (
                      <Badge key={scope} variant="outline" className="text-xs">
                        {scope}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 pt-2 border-t border-white/10 text-xs text-white/40">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{app._count.connections} connections</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Key className="w-3 h-3" />
                    <span>{app._count.accessTokens} tokens</span>
                  </div>
                  <div className="ml-auto">
                    Created by {app.user.firstName ? `${app.user.firstName} ${app.user.lastName || ''}`.trim() : app.user.email}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
