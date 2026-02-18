"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Plus, Trash2, Copy, QrCode, ExternalLink, Mail, RotateCw, Check } from "lucide-react"

interface Scanner {
  id: string
  name: string
  code: string
  email: string | null
  emailSentAt: string | null
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
  const [newEmail, setNewEmail] = useState("")
  const [sendEmailOnCreate, setSendEmailOnCreate] = useState(true)
  const [creating, setCreating] = useState(false)
  const [resendingId, setResendingId] = useState<string | null>(null)

  useEffect(() => {
    fetchScanners()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    // Validate email if provided
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (newEmail.trim() && !emailRegex.test(newEmail.trim())) {
      toast.error("Please enter a valid email address")
      return
    }

    setCreating(true)
    try {
      const res = await fetch(`/api/events/${eventId}/scanners`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: newName.trim(),
          email: newEmail.trim() || null,
          sendEmail: newEmail.trim() ? sendEmailOnCreate : false,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setScanners([data.scanner, ...scanners])
        setShowDialog(false)
        setNewName("")
        setNewEmail("")
        setSendEmailOnCreate(true)
        
        if (data.emailSent) {
          toast.success(`Scanner created! Credentials sent to ${data.scanner.email}`)
        } else if (data.emailError) {
          toast.warning(`Scanner created. Code: ${data.scanner.code}. ${data.emailError}`)
        } else {
          toast.success(`Scanner created! Code: ${data.scanner.code}`)
        }
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

  async function resendCredentials(scanner: Scanner) {
    if (!scanner.email) return
    
    setResendingId(scanner.id)
    try {
      const res = await fetch(
        `/api/events/${eventId}/scanners/${scanner.id}/resend`,
        { method: "POST" }
      )

      const data = await res.json()

      if (res.ok) {
        toast.success(`Credentials re-sent to ${scanner.email}`)
        // Update the scanner's emailSentAt
        setScanners(
          scanners.map((s) =>
            s.id === scanner.id ? { ...s, emailSentAt: new Date().toISOString() } : s
          )
        )
      } else if (res.status === 429) {
        toast.error(data.error || "Rate limit exceeded. Please try again later.")
      } else {
        toast.error(data.error || "Failed to resend credentials")
      }
    } catch {
      toast.error("Failed to resend credentials")
    } finally {
      setResendingId(null)
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
      <div className="border border-white/10 bg-white/[0.02]">
        <div className="p-8 text-center">
          <div className="w-5 h-5 border-2 border-[#ff1493]/30 border-t-[#ff1493] animate-spin mx-auto" />
        </div>
      </div>
    )
  }

  return (
    <div className="border border-white/10 bg-white/[0.02]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <QrCode className="w-4 h-4 text-white/30" />
          <span className="text-[10px] font-mono text-white/40 tracking-widest">SCANNERS</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyScannerUrl}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-white/10 text-[10px] font-mono text-white/60 tracking-wider hover:border-white/20 hover:text-white transition-all"
          >
            <ExternalLink className="w-3 h-3" />
            COPY URL
          </button>
          <button
            onClick={() => setShowDialog(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#ff1493] text-black text-[10px] font-mono font-bold tracking-wider hover:bg-[#ff1493]/90 transition-all"
          >
            <Plus className="w-3 h-3" />
            ADD SCANNER
          </button>
        </div>
      </div>

      {/* Scanner List */}
      {scanners.length === 0 ? (
        <div className="p-12 text-center">
          <QrCode className="w-8 h-8 mx-auto text-white/10 mb-3" />
          <p className="text-white/40 font-mono text-sm">No scanners yet</p>
          <p className="text-[10px] text-white/20 font-mono mt-1">
            Add a scanner to generate a code for your staff
          </p>
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {scanners.map((scanner) => (
            <div
              key={scanner.id}
              className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-all"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5">
                  <p className="font-mono text-sm truncate">{scanner.name}</p>
                  {scanner.isActive ? (
                    <span className="text-[9px] font-mono text-green-400 tracking-wider px-1.5 py-0.5 border border-green-400/30 bg-green-400/5">
                      ACTIVE
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono text-white/30 tracking-wider px-1.5 py-0.5 border border-white/10">
                      INACTIVE
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <button
                    onClick={() => copyCode(scanner.code)}
                    className="flex items-center gap-1.5 text-xs font-mono text-white/40 hover:text-[#ff1493] transition-colors"
                  >
                    <code className="bg-white/5 px-2 py-0.5 border border-white/10 text-[11px]">
                      {scanner.code}
                    </code>
                    <Copy className="w-3 h-3" />
                  </button>
                  {scanner._count && (
                    <p className="text-[10px] font-mono text-white/30">
                      {scanner._count.scanLogs} scans
                      {scanner._count.shifts > 0 &&
                        ` · ${scanner._count.shifts} shifts`}
                    </p>
                  )}
                </div>
                {/* Email Row */}
                {scanner.email && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-white/40">
                      <Mail className="w-3 h-3" />
                      <span className="truncate max-w-[180px]">{scanner.email}</span>
                      {scanner.emailSentAt && (
                        <span className="flex items-center gap-0.5 text-green-400/70">
                          <Check className="w-2.5 h-2.5" />
                          sent
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => resendCredentials(scanner)}
                      disabled={resendingId === scanner.id}
                      className="flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-mono text-white/40 hover:text-[#ff1493] hover:bg-white/5 transition-all disabled:opacity-50"
                      title="Resend credentials"
                    >
                      <RotateCw className={`w-2.5 h-2.5 ${resendingId === scanner.id ? 'animate-spin' : ''}`} />
                      resend
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                <button
                  onClick={() => toggleActive(scanner.id, scanner.isActive)}
                  className={`relative w-9 h-5 transition-all ${
                    scanner.isActive
                      ? "bg-[#ff1493]/20 border border-[#ff1493]/50"
                      : "bg-white/5 border border-white/10"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-3.5 h-3.5 transition-all ${
                      scanner.isActive
                        ? "left-[18px] bg-[#ff1493]"
                        : "left-0.5 bg-white/30"
                    }`}
                  />
                </button>
                <button
                  onClick={() => deleteScanner(scanner.id)}
                  className="p-1.5 text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Scanner Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="border-white/10 bg-black">
          <DialogHeader>
            <DialogTitle className="font-mono flex items-center gap-2">
              <QrCode className="h-4 w-4 text-[#ff1493]" />
              Create Scanner
            </DialogTitle>
            <DialogDescription className="text-xs text-white/40">
              Enter the staff member&apos;s details. A unique 6-digit code will be generated.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="scanner-name" className="text-xs font-mono text-white/50">
                Staff Name
              </Label>
              <Input
                id="scanner-name"
                placeholder="e.g., John Smith"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="bg-white/[0.02] border-white/10 font-mono focus:border-[#ff1493]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="scanner-email" className="text-xs font-mono text-white/50">
                Email <span className="text-white/30">(optional)</span>
              </Label>
              <Input
                id="scanner-email"
                type="email"
                placeholder="e.g., john@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="bg-white/[0.02] border-white/10 font-mono focus:border-[#ff1493]"
              />
              <p className="text-[10px] text-white/30 font-mono">
                Scanner credentials will be sent to this email
              </p>
            </div>
            {newEmail.trim() && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="send-email"
                  checked={sendEmailOnCreate}
                  onCheckedChange={(checked: boolean | "indeterminate") => setSendEmailOnCreate(checked === true)}
                  className="border-white/20 data-[state=checked]:bg-[#ff1493] data-[state=checked]:border-[#ff1493]"
                />
                <Label htmlFor="send-email" className="text-xs font-mono text-white/50 cursor-pointer">
                  Send scanner link and code via email
                </Label>
              </div>
            )}
            <button
              onClick={createScanner}
              disabled={creating}
              onKeyDown={(e) => e.key === "Enter" && createScanner()}
              className="w-full py-2.5 bg-[#ff1493] text-black font-mono font-bold hover:bg-[#ff1493]/90 transition-all disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create Scanner"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
