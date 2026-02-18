"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Key, Plus, Copy, Check, Trash2, Clock, BookOpen, Sparkles } from "lucide-react"
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
  key?: string // Only present when just created
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

const AFTIE_KEY_NAME = "Aftie AI Assistant"

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
        body: JSON.stringify({
          name: newKeyName,
          scopes: selectedScopes,
        }),
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
      const res = await fetch(`/api/api-keys/${keyId}`, {
        method: "DELETE",
      })

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
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  // Separate Aftie key from other keys
  const aftieKey = apiKeys.find(k => k.name === AFTIE_KEY_NAME)
  const userKeys = apiKeys.filter(k => k.name !== AFTIE_KEY_NAME)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-mono font-bold tracking-tight">
          API KEYS
        </h1>
        <p className="text-white/40 text-sm font-mono mt-1">
          Manage API keys for programmatic access
        </p>
      </div>

      {/* Aftie API Key - Special Section */}
      {aftieKey && (
        <Card className="border-[#ff1493]/20 bg-[#ff1493]/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff1493] to-[#ff1493]/50 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-base font-mono">{aftieKey.name}</CardTitle>
                <CardDescription className="text-xs">
                  AI assistant with full access to manage your events
                </CardDescription>
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                >
                  Revoke Access
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Revoke Aftie Access?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will disable Aftie&apos;s ability to create and manage events on your behalf.
                    You can re-enable Aftie anytime by opening the assistant.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => revokeApiKey(aftieKey.id, "Aftie access")}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Revoke Access
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <code className="bg-black/20 px-1.5 py-0.5 rounded font-mono">
                {aftieKey.keyPrefix}...
              </code>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Last used: {formatDate(aftieKey.lastUsedAt)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User API Keys */}
      <Card className="border-white/10 bg-white/[0.02]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg font-mono">
              <Key className="w-5 h-5" />
              API Keys
            </CardTitle>
            <CardDescription>
              Create API keys for programmatic access
            </CardDescription>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Create Key
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              {newKey ? (
                <>
                  <DialogHeader>
                    <DialogTitle>API Key Created</DialogTitle>
                    <DialogDescription>
                      Copy your API key now. You won&apos;t be able to see it again.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Your API Key</Label>
                      <div className="flex gap-2">
                        <Input
                          value={newKey.key}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => copyToClipboard(newKey.key!)}
                        >
                          {copied ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-sm text-yellow-200">
                      <strong>Important:</strong> Store this key securely. It
                      provides access to your account&apos;s data.
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={resetCreateDialog}>Done</Button>
                  </DialogFooter>
                </>
              ) : (
                <>
                  <DialogHeader>
                    <DialogTitle>Create API Key</DialogTitle>
                    <DialogDescription>
                      Create a new API key to access the Afters API
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="key-name">Name</Label>
                      <Input
                        id="key-name"
                        placeholder="e.g., Production Server"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Permissions</Label>
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2">
                        {SCOPE_OPTIONS.map((scope) => (
                          <button
                            key={scope.value}
                            type="button"
                            onClick={() => toggleScope(scope.value)}
                            className={`text-left p-2 rounded border transition-all ${
                              selectedScopes.includes(scope.value)
                                ? "border-[#ff1493] bg-[#ff1493]/10"
                                : "border-white/10 hover:border-white/20"
                            }`}
                          >
                            <div className="text-sm font-medium">
                              {scope.label}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {scope.description}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={createApiKey} disabled={creating}>
                      {creating ? "Creating..." : "Create Key"}
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading API keys...
            </div>
          ) : userKeys.length === 0 ? (
            <div className="text-center py-8">
              <Key className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No API keys yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Create an API key to start using the API
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {userKeys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-white/[0.02]"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{key.name}</span>
                      <code className="text-xs bg-white/10 px-1.5 py-0.5 rounded font-mono shrink-0">
                        {key.keyPrefix}...
                      </code>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Last used: {formatDate(key.lastUsedAt)}
                      </span>
                      <span className="hidden sm:inline">Created: {formatDate(key.createdAt)}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {key.scopes.slice(0, 3).map((scope) => (
                        <Badge
                          key={scope}
                          variant="secondary"
                          className="text-[10px]"
                        >
                          {scope}
                        </Badge>
                      ))}
                      {key.scopes.length > 3 && (
                        <Badge variant="secondary" className="text-[10px]">
                          +{key.scopes.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-400 hover:text-red-300 hover:bg-red-400/10 shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to revoke &quot;{key.name}&quot;? This
                          action cannot be undone and any applications using
                          this key will stop working.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => revokeApiKey(key.id, key.name)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Revoke Key
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Documentation Link */}
      <Card className="border-white/10 bg-white/[0.02] hover:border-white/20 transition-colors">
        <Link href="/d/developers/docs">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-[#ff1493]/10">
                <BookOpen className="w-5 h-5 text-[#ff1493]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium">API Documentation</h3>
                <p className="text-sm text-muted-foreground">
                  Learn how to use the Afters API
                </p>
              </div>
            </div>
          </CardContent>
        </Link>
      </Card>
    </div>
  )
}
