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
import { Key, Plus, Copy, Check, Trash2, ExternalLink, Clock, BookOpen, Box, Link2 } from "lucide-react"
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

export default function DevelopersPage() {
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

  async function revokeApiKey(keyId: string) {
    try {
      const res = await fetch(`/api/api-keys/${keyId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setApiKeys((prev) => prev.filter((k) => k.id !== keyId))
        toast.success("API key revoked")
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Developers</h1>
          <p className="text-muted-foreground mt-1">
            Manage API keys and access documentation
          </p>
        </div>
        <Button asChild variant="outline" className="gap-2">
          <Link href="/b/developers/docs">
            <BookOpen className="w-4 h-4" />
            API Docs
          </Link>
        </Button>
      </div>

      {/* API Keys Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              API Keys
            </CardTitle>
            <CardDescription>
              Create and manage API keys for programmatic access
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
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-8">
              <Key className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No API keys yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Create an API key to start using the API
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-white/[0.02]"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{key.name}</span>
                      <code className="text-xs bg-white/10 px-1.5 py-0.5 rounded font-mono">
                        {key.keyPrefix}...
                      </code>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Last used: {formatDate(key.lastUsedAt)}
                      </span>
                      <span>Created: {formatDate(key.createdAt)}</span>
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
                        className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
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
                          onClick={() => revokeApiKey(key.id)}
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

      {/* OAuth & Integrations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="hover:border-white/20 transition-colors">
          <Link href="/b/developers/apps">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-[#ff1493]/10">
                  <Box className="w-6 h-6 text-[#ff1493]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">OAuth Apps</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Register apps for OAuth 2.0 integration with one-click authorization.
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:border-white/20 transition-colors">
          <Link href="/b/developers/connections">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-white/10">
                  <Link2 className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Connected Apps</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Manage third-party apps you&apos;ve authorized to access your account.
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="hover:border-white/20 transition-colors">
          <Link href="/developers">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-[#ff1493]/10">
                  <BookOpen className="w-6 h-6 text-[#ff1493]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">API Documentation</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Learn how to use the Afters API to manage events, tickets,
                    and more.
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:border-white/20 transition-colors">
          <a
            href="https://github.com/aftersapp/api-examples"
            target="_blank"
            rel="noopener noreferrer"
          >
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-white/10">
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Example Code</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Browse example integrations and code snippets on GitHub.
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </div>
            </CardContent>
          </a>
        </Card>
      </div>
    </div>
  )
}
