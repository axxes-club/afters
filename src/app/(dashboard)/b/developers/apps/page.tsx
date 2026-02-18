"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Cube, Plus, Copy, Check, Trash2, RefreshCw, Shield, Users, Globe, Loader2, AlertTriangle, Key } from "lucide-react"
import { toast } from "sonner"

interface OAuthApp {
  id: string
  name: string
  description: string | null
  clientId: string
  redirectUris: string[]
  scopes: string[]
  logoUrl: string | null
  websiteUrl: string | null
  isActive: boolean
  isVerified: boolean
  createdAt: string
  connectionsCount: number
}

const SCOPE_OPTIONS = [
  { value: "read:profile", label: "Read Profile" },
  { value: "read:events", label: "Read Events" },
  { value: "write:events", label: "Write Events" },
  { value: "read:orders", label: "Read Orders" },
  { value: "read:tickets", label: "Read Tickets" },
  { value: "write:tickets", label: "Check In" },
  { value: "read:guestlist", label: "Read Guestlist" },
  { value: "write:guestlist", label: "Write Guestlist" },
  { value: "read:analytics", label: "Analytics" },
  { value: "webhooks", label: "Webhooks" },
]

export default function OAuthAppsPage() {
  const [apps, setApps] = useState<OAuthApp[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [secretDialogOpen, setSecretDialogOpen] = useState(false)
  const [newSecret, setNewSecret] = useState<{ clientId: string; clientSecret: string } | null>(null)
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  
  // Form state
  const [appName, setAppName] = useState("")
  const [appDescription, setAppDescription] = useState("")
  const [redirectUris, setRedirectUris] = useState("")
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["read:profile"])
  const [websiteUrl, setWebsiteUrl] = useState("")
  
  // Rotate state
  const [rotating, setRotating] = useState<string | null>(null)
  
  useEffect(() => {
    fetchApps()
  }, [])
  
  async function fetchApps() {
    try {
      const res = await fetch("/api/oauth/apps")
      const data = await res.json()
      if (data.success) {
        setApps(data.data)
      }
    } catch (error) {
      console.error("Error fetching apps:", error)
      toast.error("Failed to load apps")
    } finally {
      setLoading(false)
    }
  }
  
  async function handleCreate() {
    if (!appName.trim() || !redirectUris.trim()) {
      toast.error("Name and redirect URIs are required")
      return
    }
    
    setCreating(true)
    try {
      const uris = redirectUris.split("\n").map(u => u.trim()).filter(Boolean)
      
      const res = await fetch("/api/oauth/apps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: appName.trim(),
          description: appDescription.trim() || null,
          redirectUris: uris,
          scopes: selectedScopes,
          websiteUrl: websiteUrl.trim() || null,
        }),
      })
      
      const data = await res.json()
      
      if (data.success) {
        setNewSecret({ clientId: data.data.clientId, clientSecret: data.data.clientSecret })
        setCreateDialogOpen(false)
        setSecretDialogOpen(true)
        fetchApps()
        resetForm()
        toast.success("App created")
      } else {
        toast.error(data.error || "Failed to create app")
      }
    } catch {
      toast.error("Failed to create app")
    } finally {
      setCreating(false)
    }
  }
  
  async function handleDelete(appId: string, appName: string) {
    try {
      const res = await fetch(`/api/oauth/apps/${appId}`, { method: "DELETE" })
      if (res.ok) {
        setApps(prev => prev.filter(a => a.id !== appId))
        toast.success(`${appName} deleted`)
      } else {
        toast.error("Failed to delete app")
      }
    } catch {
      toast.error("Failed to delete app")
    }
  }
  
  async function handleRotateSecret(app: OAuthApp) {
    setRotating(app.id)
    try {
      const res = await fetch(`/api/oauth/apps/${app.id}/rotate-secret`, { method: "POST" })
      const data = await res.json()
      
      if (data.success) {
        setNewSecret({ clientId: app.clientId, clientSecret: data.data.clientSecret })
        setSecretDialogOpen(true)
        toast.success("Secret rotated - all tokens revoked")
      } else {
        toast.error("Failed to rotate secret")
      }
    } catch {
      toast.error("Failed to rotate secret")
    } finally {
      setRotating(null)
    }
  }
  
  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    toast.success("Copied")
    setTimeout(() => setCopied(null), 2000)
  }
  
  function toggleScope(scope: string) {
    setSelectedScopes(prev =>
      prev.includes(scope) ? prev.filter(s => s !== scope) : [...prev, scope]
    )
  }
  
  function resetForm() {
    setAppName("")
    setAppDescription("")
    setRedirectUris("")
    setSelectedScopes(["read:profile"])
    setWebsiteUrl("")
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-mono font-bold tracking-tight">OAUTH APPS</h1>
          <p className="text-white/40 text-sm font-mono mt-1">Register apps for OAuth 2.0 integration</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-1.5 px-3 py-2 bg-[#ff1493] text-black text-xs font-mono font-bold tracking-wider hover:bg-[#ff1493]/90 transition-all">
              <Plus className="w-3.5 h-3.5" />
              NEW APP
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-mono">Create OAuth App</DialogTitle>
              <DialogDescription>Register a new app for OAuth integration</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <Label className="text-xs font-mono text-white/40">APP NAME</Label>
                <Input
                  placeholder="My Integration"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-mono text-white/40">DESCRIPTION</Label>
                <Input
                  placeholder="What does this app do?"
                  value={appDescription}
                  onChange={(e) => setAppDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-mono text-white/40">REDIRECT URIS (one per line)</Label>
                <textarea
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-md font-mono text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#ff1493]"
                  rows={3}
                  placeholder={"https://myapp.com/callback\nhttp://localhost:3000/callback"}
                  value={redirectUris}
                  onChange={(e) => setRedirectUris(e.target.value)}
                />
                <p className="text-[10px] text-white/30">Must use HTTPS except localhost</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-mono text-white/40">WEBSITE URL</Label>
                <Input
                  placeholder="https://myapp.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-mono text-white/40">SCOPES</Label>
                <div className="flex flex-wrap gap-2">
                  {SCOPE_OPTIONS.map((scope) => (
                    <button
                      key={scope.value}
                      type="button"
                      onClick={() => toggleScope(scope.value)}
                      className={`px-2 py-1 text-xs font-mono border transition-all ${
                        selectedScopes.includes(scope.value)
                          ? "border-[#ff1493] bg-[#ff1493]/10 text-[#ff1493]"
                          : "border-white/10 text-white/50 hover:border-white/20"
                      }`}
                    >
                      {scope.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={handleCreate}
                disabled={creating || !appName.trim() || !redirectUris.trim()}
                className="bg-[#ff1493] hover:bg-[#ff1493]/80 text-black"
              >
                {creating ? "Creating..." : "Create App"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Secret Dialog */}
      <Dialog open={secretDialogOpen} onOpenChange={setSecretDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-mono">Save Your Credentials</DialogTitle>
            <DialogDescription>Copy now — you won&apos;t see the secret again</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-400">Store this secret securely. It provides access to your integration.</p>
            </div>
            {newSecret && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs font-mono text-white/40">CLIENT ID</Label>
                  <div className="flex gap-2">
                    <Input value={newSecret.clientId} readOnly className="font-mono text-sm" />
                    <Button size="icon" variant="outline" onClick={() => copyToClipboard(newSecret.clientId, "id")}>
                      {copied === "id" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-mono text-white/40">CLIENT SECRET</Label>
                  <div className="flex gap-2">
                    <Input value={newSecret.clientSecret} readOnly className="font-mono text-sm" />
                    <Button size="icon" variant="outline" onClick={() => copyToClipboard(newSecret.clientSecret, "secret")}>
                      {copied === "secret" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => { setSecretDialogOpen(false); setNewSecret(null) }} className="w-full">
              I&apos;ve Saved My Credentials
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Apps List */}
      <div className="border border-white/10 bg-white/[0.02]">
        <div className="px-4 py-2 border-b border-white/10">
          <span className="text-[10px] font-mono text-white/40 tracking-widest">REGISTERED APPS</span>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-white/20" />
          </div>
        ) : apps.length === 0 ? (
          <div className="p-8 text-center">
            <Cube className="w-6 h-6 mx-auto text-white/10 mb-2" />
            <p className="text-white/40 font-mono text-xs">No OAuth apps yet</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {apps.map((app) => (
              <div key={app.id} className="p-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Cube className="w-4 h-4 text-[#ff1493]" />
                      <span className="font-mono text-sm text-white">{app.name}</span>
                      {app.isVerified && <Shield className="w-3.5 h-3.5 text-[#ff1493]" />}
                    </div>
                    
                    <div className="flex items-center gap-3 text-[10px] text-white/30 mb-2">
                      <div className="flex items-center gap-1">
                        <Key className="w-3 h-3" />
                        <code className="bg-white/5 px-1.5 py-0.5">{app.clientId}</code>
                        <button onClick={() => copyToClipboard(app.clientId, `client-${app.id}`)} className="hover:text-white">
                          {copied === `client-${app.id}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {app.connectionsCount}
                      </div>
                      {app.websiteUrl && (
                        <div className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {new URL(app.websiteUrl).hostname}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {app.scopes.slice(0, 4).map(scope => (
                        <Badge key={scope} variant="secondary" className="text-[9px] bg-white/5 border-0 px-1.5 py-0">
                          {scope}
                        </Badge>
                      ))}
                      {app.scopes.length > 4 && (
                        <Badge variant="secondary" className="text-[9px] bg-white/5 border-0 px-1.5 py-0">
                          +{app.scopes.length - 4}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleRotateSecret(app)}
                      disabled={rotating === app.id}
                      className="p-2 text-white/20 hover:text-yellow-400 hover:bg-yellow-500/10 transition-all disabled:opacity-50"
                      title="Rotate Secret"
                    >
                      {rotating === app.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    </button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="p-2 text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete App</AlertDialogTitle>
                          <AlertDialogDescription>
                            Delete &quot;{app.name}&quot;? All tokens will be revoked. This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(app.id, app.name)} className="bg-red-600 hover:bg-red-700">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
