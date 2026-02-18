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
import { Key, Plus, Copy, Check, Trash2, Clock, ArrowRight, Loader2 } from "lucide-react"
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
  { value: "events:read", label: "Read Events" },
  { value: "events:write", label: "Write Events" },
  { value: "events:delete", label: "Delete Events" },
  { value: "orders:read", label: "Read Orders" },
  { value: "tickets:read", label: "Read Tickets" },
  { value: "tickets:checkin", label: "Check In" },
  { value: "analytics:read", label: "Analytics" },
  { value: "guestlist:read", label: "Read Guestlist" },
  { value: "guestlist:write", label: "Write Guestlist" },
  { value: "scanners:read", label: "Read Scanners" },
  { value: "scanners:write", label: "Write Scanners" },
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
      toast.error("Please enter a name")
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
        toast.error("Failed to revoke API key")
      }
    } catch (error) {
      console.error("Failed to revoke API key:", error)
      toast.error("Failed to revoke API key")
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success("Copied")
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-mono font-bold tracking-tight">API KEYS</h1>
          <p className="text-white/40 text-sm font-mono mt-1">Programmatic access</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#ff1493] text-black text-[10px] font-mono font-bold tracking-wider hover:bg-[#ff1493]/90 transition-all">
              <Plus className="w-3 h-3" />
              NEW KEY
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            {newKey ? (
              <>
                <DialogHeader>
                  <DialogTitle className="font-mono">Key Created</DialogTitle>
                  <DialogDescription>Copy now — you won&apos;t see this again.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="flex gap-2">
                    <Input value={newKey.key} readOnly className="font-mono text-sm" />
                    <Button size="icon" variant="outline" onClick={() => copyToClipboard(newKey.key!)}>
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-yellow-400/80 bg-yellow-500/10 p-3 border border-yellow-500/20">
                    Store this key securely. It provides access to your account.
                  </p>
                </div>
                <DialogFooter>
                  <Button onClick={resetCreateDialog} className="w-full">Done</Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle className="font-mono">Create API Key</DialogTitle>
                  <DialogDescription>Generate a new key for API access</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-mono text-white/40">NAME</Label>
                    <Input
                      placeholder="e.g., Production Server"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-mono text-white/40">PERMISSIONS</Label>
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
                  <Button onClick={createApiKey} disabled={creating} className="bg-[#ff1493] hover:bg-[#ff1493]/80 text-black">
                    {creating ? "Creating..." : "Create"}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Keys List */}
      <div className="border border-white/10 bg-white/[0.02]">
        <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between">
          <span className="text-[10px] font-mono text-white/40 tracking-widest">ACTIVE KEYS</span>
          <span className="text-[10px] font-mono text-white/20">{apiKeys.length}</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-white/20" />
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="p-12 text-center">
            <Key className="w-8 h-8 mx-auto text-white/10 mb-3" />
            <p className="text-white/40 font-mono text-sm">No API keys</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {apiKeys.map((key) => (
              <div key={key.id} className="p-4 flex items-start justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm truncate">{key.name}</span>
                    <code className="text-[10px] bg-white/5 px-1.5 py-0.5 font-mono text-white/30">
                      {key.keyPrefix}...
                    </code>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-white/30">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(key.lastUsedAt)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {key.scopes.slice(0, 3).map((scope) => (
                      <Badge key={scope} variant="secondary" className="text-[9px] bg-white/5 border-0 px-1.5 py-0">
                        {scope}
                      </Badge>
                    ))}
                    {key.scopes.length > 3 && (
                      <Badge variant="secondary" className="text-[9px] bg-white/5 border-0 px-1.5 py-0">
                        +{key.scopes.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="p-2 text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Revoke Key</AlertDialogTitle>
                      <AlertDialogDescription>
                        Revoke &quot;{key.name}&quot;? Apps using this key will stop working.
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

      {/* Docs Link */}
      <Link
        href="/d/developers/docs"
        className="border border-white/10 p-4 flex items-center justify-between hover:border-[#ff1493]/30 hover:bg-white/[0.02] transition-all group"
      >
        <div className="flex items-center gap-3">
          <Key className="w-4 h-4 text-white/30 group-hover:text-[#ff1493] transition-colors" />
          <span className="text-sm font-mono text-white/60 group-hover:text-white transition-colors">API Documentation</span>
        </div>
        <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-[#ff1493] transition-colors" />
      </Link>
    </div>
  )
}
