"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Plus, Trash2, Copy, QrCode, ExternalLink } from "lucide-react"

interface Scanner {
  id: string
  name: string
  code: string
  isActive: boolean
  createdAt: string
  _count?: {
    scanLogs: number
    shifts: number
  }
}

export function ScannerManagement({ eventId }: { eventId: string }) {
  const [scanners, setScanners] = useState<Scanner[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [newName, setNewName] = useState("")
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchScanners()
  }, [eventId])

  async function fetchScanners() {
    try {
      const res = await fetch(`/api/events/${eventId}/scanners`)
      if (res.ok) {
        const data = await res.json()
        setScanners(data.scanners)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function createScanner() {
    if (!newName.trim()) {
      toast.error("Please enter a name")
      return
    }

    setCreating(true)
    try {
      const res = await fetch(`/api/events/${eventId}/scanners`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      })

      if (res.ok) {
        const data = await res.json()
        setScanners([data.scanner, ...scanners])
        setShowDialog(false)
        setNewName("")
        toast.success(`Scanner created! Code: ${data.scanner.code}`)
      } else {
        const error = await res.json()
        toast.error(error.error || "Failed to create scanner")
      }
    } catch {
      toast.error("Failed to create scanner")
    } finally {
      setCreating(false)
    }
  }

  async function toggleActive(scannerId: string, currentState: boolean) {
    try {
      const res = await fetch(
        `/api/events/${eventId}/scanners/${scannerId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !currentState }),
        }
      )

      if (res.ok) {
        setScanners(
          scanners.map((s) =>
            s.id === scannerId ? { ...s, isActive: !currentState } : s
          )
        )
        toast.success(currentState ? "Scanner deactivated" : "Scanner activated")
      }
    } catch {
      toast.error("Failed to update scanner")
    }
  }

  async function deleteScanner(scannerId: string) {
    if (!confirm("Delete this scanner? This action cannot be undone.")) return

    try {
      const res = await fetch(
        `/api/events/${eventId}/scanners/${scannerId}`,
        { method: "DELETE" }
      )

      if (res.ok) {
        setScanners(scanners.filter((s) => s.id !== scannerId))
        toast.success("Scanner deleted")
      }
    } catch {
      toast.error("Failed to delete scanner")
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code)
    toast.success("Code copied to clipboard")
  }

  function copyScannerUrl() {
    const url = `${window.location.origin}/scan/${eventId}`
    navigator.clipboard.writeText(url)
    toast.success("Scanner URL copied to clipboard")
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading scanners...
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Scanner Management
            </CardTitle>
            <CardDescription>
              Create scanner codes for staff to check in tickets — no account
              needed
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={copyScannerUrl}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Copy Scanner URL
            </Button>
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Scanner
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Scanner</DialogTitle>
                  <DialogDescription>
                    Enter the staff member&apos;s name. A unique 6-digit code
                    will be generated for them.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="scanner-name">Staff Name</Label>
                    <Input
                      id="scanner-name"
                      placeholder="e.g., John Smith"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && createScanner()}
                    />
                  </div>
                  <Button
                    onClick={createScanner}
                    disabled={creating}
                    className="w-full"
                  >
                    {creating ? "Creating..." : "Create Scanner"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {scanners.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <QrCode className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="mb-1">No scanners yet</p>
            <p className="text-sm">
              Add a scanner to generate a code for your staff
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {scanners.map((scanner) => (
              <div
                key={scanner.id}
                className="flex items-center justify-between p-4 rounded-lg border"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{scanner.name}</p>
                    {scanner.isActive ? (
                      <Badge variant="default" className="shrink-0">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="shrink-0">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <button
                      onClick={() => copyCode(scanner.code)}
                      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <code className="bg-muted px-2 py-0.5 rounded font-mono">
                        {scanner.code}
                      </code>
                      <Copy className="h-3 w-3" />
                    </button>
                    {scanner._count && (
                      <p className="text-xs text-muted-foreground">
                        {scanner._count.scanLogs} scans
                        {scanner._count.shifts > 0 &&
                          ` · ${scanner._count.shifts} shifts`}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <Switch
                    checked={scanner.isActive}
                    onCheckedChange={() =>
                      toggleActive(scanner.id, scanner.isActive)
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteScanner(scanner.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
