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
import { Key, Plus, Copy, Check, Trash2, Clock, BookOpen, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface ApiKey {
  id: string
  name: string
  keyPrefix: string
  scopes: string[]
  lastUsedAt: string | null
  expiresAt: string | null
  createdAt: string
  key?: string
}

const SCOPE_OPTIONS = [
  { value: "events:read", label: "Read Events", description: "View event details" },
  { value: "events:write", label: "Write Events", description: "Create and update events" },
  { value: "events:delete", label: "Delete Events", description: "Delete events" },
  { value: "orders:read", label: "Read Orders", description: "View order details" },
  { value: "tickets:read", label: "Read Tickets", description: "View ticket details" },
  { value: "tickets:checkin", label: "Check In Tickets", description: "Check in tickets" },
  { value: "analytics:read", label: "Read Analytics", description: "View event analytics" },
  { value: "guestlist:read", label: "Read Guestlist", description: "View guestlist entries" },
  { value: "guestlist:write", label: "Write Guestlist", description: "Manage guestlist" },
  { value: "scanners:read", label: "Read Scanners", description: "View scanner details" },
  { value: "scanners:write", label: "Write Scanners", description: "Manage scanners" },
]

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["events:read"])
  const [newKey, setNewKey] = useState<ApiKey | null>(null)
  const [copied, setCopied] = useState(false)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchApiKeys()
  }, [])

  async function fetchApiKeys() {
    try {
      const res = await fetch("/api/api-keys")
      if (res.ok) {
        const data = await res.json()
        setApiKeys(data)
      }
    } catch (error) {
      console.error("Failed to fetch API keys:", error)
      toast.error("Failed to load API keys")
    } finally {
      setLoading(false)
    }
  }

  async function createApiKey() {
    if (!newKeyName.trim()) {
      toast.error("Please enter a name for your API key")
      return
    }

    setCreating(true)
    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName, scopes: selectedScopes }),
      })

      if (res.ok) {
        const data = await res.json()
        setNewKey(data)
        setApiKeys((prev) => [data, ...prev])
        toast.success("API key created")
      } else {
        const error = await res.json()
        toast.error(error.message || "Failed to create API key")
      }
    } catch (error) {
      console.error("Failed to create API key:", error)
      toast.error("Failed to create API key")
    } finally {
      setCreating(false)
    }
  }

  async function revokeApiKey(keyId: string, keyName: string) {
    try {
      const res = await fetch(`/api/api-keys/${keyId}`, { method: "DELETE" })
      if (res.ok) {
        setApiKeys((prev) => prev.filter((k) => k.id !== keyId))
        toast.success(`${keyName} revoked`)
      } else {
        const error = await res.json()
        toast.error(error.message || "Failed to revoke API key")
      }
    } catch (error) {
      console.error("Failed to revoke API key:", error)
      toast.error("Failed to revoke API key")
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success("Copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  function toggleScope(scope: string) {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    )
  }

  function resetCreateDialog() {
    setNewKeyName("")
    setSelectedScopes(["events:read"])
    setNewKey(null)
    setCreateDialogOpen(false)
  }

  function formatDate(date: string | null) {
    if (!date) return "Never"
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden border border-white/10 bg-gradient-to-br from-emerald-900/10 via-black to-white/5">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(45deg, rgba(16,185,129,0.1) 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }} />
        </div>
        
        <div className="relative p-8 md:p-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Key className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="font-headline text-4xl md:text-5xl tracking-wide">
                  API<span className="text-emerald-400">.</span>KEYS
                </h1>
                <p className="text-white/40 font-mono text-sm mt-2">PROGRAMMATIC ACCESS TOKENS</p>
              </div>
            </div>

            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-black font-mono tracking-wider">
                  <Plus className="w-4 h-4" />
                  NEW KEY
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                {newKey ? (
                  <>
                    <DialogHeader>
                      <DialogTitle className="font-headline text-2xl">Key Created</DialogTitle>
                      <DialogDescription>
                        Copy your API key now. You won&apos;t see it again.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-mono text-white/40">YOUR API KEY</Label>
                        <div className="flex gap-2">
                          <Input value={newKey.key} readOnly className="font-mono text-sm bg-black/40" />
                          <Button size="icon" variant="outline" onClick={() => copyToClipboard(newKey.key!)}>
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                      <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 text-sm text-yellow-200">
                        <strong>Important:</strong> Store this key securely. It provides access to your account.
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={resetCreateDialog} className="w-full">Done</Button>
                    </DialogFooter>
                  </>
                ) : (
                  <>
                    <DialogHeader>
                      <DialogTitle className="font-headline text-2xl">Create API Key</DialogTitle>
                      <DialogDescription>Generate a new key for API access</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-mono text-white/40">NAME</Label>
                        <Input
                          placeholder="e.g., Production Server"
                          value={newKeyName}
                          onChange={(e) => setNewKeyName(e.target.value)}
                          className="bg-black/40"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-mono text-white/40">PERMISSIONS</Label>
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                          {SCOPE_OPTIONS.map((scope) => (
                            <button
                              key={scope.value}
                              type="button"
                              onClick={() => toggleScope(scope.value)}
                              className={`text-left p-3 border transition-all ${
                                selectedScopes.includes(scope.value)
                                  ? "border-emerald-500 bg-emerald-500/10"
                                  : "border-white/10 hover:border-white/20"
                              }`}
                            >
                              <div className="text-sm font-medium">{scope.label}</div>
                              <div className="text-xs text-white/40">{scope.description}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <DialogFooter className="gap-2">
                      <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                      <Button onClick={createApiKey} disabled={creating} className="bg-emerald-500 hover:bg-emerald-600 text-black">
                        {creating ? "Creating..." : "Create Key"}
                      </Button>
                    </DialogFooter>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Keys List */}
      <div className="border border-white/10 bg-white/[0.02]">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-mono text-xs tracking-widest text-white/40">ACTIVE KEYS</h2>
          <span className="font-mono text-xs text-white/20">{apiKeys.length} total</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-white/20" />
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Key className="w-12 h-12 text-white/10 mb-4" />
            <p className="text-white/40 font-mono text-sm mb-2">No API keys yet</p>
            <p className="text-white/20 text-sm">Create a key to start using the API</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {apiKeys.map((key) => (
              <div key={key.id} className="p-5 flex items-start justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-medium truncate">{key.name}</span>
                    <code className="text-xs bg-white/5 px-2 py-0.5 font-mono text-white/40 shrink-0">
                      {key.keyPrefix}...
                    </code>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-white/30">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      Last used: {formatDate(key.lastUsedAt)}
                    </span>
                    <span className="hidden sm:inline">Created: {formatDate(key.createdAt)}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {key.scopes.slice(0, 3).map((scope) => (
                      <Badge key={scope} variant="secondary" className="text-[10px] bg-white/5 border-0">
                        {scope}
                      </Badge>
                    ))}
                    {key.scopes.length > 3 && (
                      <Badge variant="secondary" className="text-[10px] bg-white/5 border-0">
                        +{key.scopes.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-300 hover:bg-red-500/10 shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
                      <AlertDialogDescription>
                        Revoke &quot;{key.name}&quot;? Applications using this key will stop working.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => revokeApiKey(key.id, key.name)} className="bg-red-600 hover:bg-red-700">
                        Revoke
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Documentation Link */}
      <Link href="/d/developers/docs" className="block border border-white/10 bg-white/[0.02] p-6 hover:bg-white/[0.04] hover:border-white/20 transition-all group">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
            <BookOpen className="w-6 h-6 text-white/40 group-hover:text-white/60" />
          </div>
          <div className="flex-1">
            <h3 className="font-mono text-sm tracking-wider text-white group-hover:text-white">API DOCUMENTATION</h3>
            <p className="text-white/40 text-sm">Learn how to integrate with the Afters API</p>
          </div>
        </div>
      </Link>
    </div>
  )
}
