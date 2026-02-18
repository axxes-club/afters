"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import {
  Plus,
  Trash2,
  Users,
  Search,
  Phone,
  Mail,
  CheckCircle,
  Clock,
  FileDown,
} from "lucide-react"

interface GuestlistEntry {
  id: string
  name: string
  phone?: string
  email?: string
  plusOnes: number
  notes?: string
  checkedInAt?: string
  createdAt: string
}

interface GuestlistStats {
  total: number
  checkedIn: number
  totalWithPlusOnes: number
}

export function GuestlistManagement({ eventId }: { eventId: string }) {
  const [entries, setEntries] = useState<GuestlistEntry[]>([])
  const [stats, setStats] = useState<GuestlistStats>({ total: 0, checkedIn: 0, totalWithPlusOnes: 0 })
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchGuestlist()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  async function fetchGuestlist() {
    try {
      const res = await fetch(`/api/events/${eventId}/guestlist`)
      if (res.ok) {
        const data = await res.json()
        setEntries(data.entries || [])
        setStats(data.stats || { total: 0, checkedIn: 0, totalWithPlusOnes: 0 })
      }
    } catch (error) {
      console.error("Failed to fetch guestlist:", error)
    } finally {
      setLoading(false)
    }
  }

  async function addEntry(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setAddLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get("name") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      plusOnes: parseInt(formData.get("plusOnes") as string) || 0,
      notes: formData.get("notes") as string,
    }

    try {
      const res = await fetch(`/api/events/${eventId}/guestlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        toast.success("Guest added to list")
        setShowAddDialog(false)
        fetchGuestlist()
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to add guest")
      }
    } catch {
      toast.error("Failed to add guest")
    } finally {
      setAddLoading(false)
    }
  }

  async function deleteEntry(entryId: string) {
    if (!confirm("Remove this guest from the list?")) return

    try {
      const res = await fetch(`/api/events/${eventId}/guestlist?id=${entryId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        toast.success("Guest removed")
        fetchGuestlist()
      } else {
        toast.error("Failed to remove guest")
      }
    } catch {
      toast.error("Failed to remove guest")
    }
  }

  function exportCSV() {
    const headers = ["Name", "Phone", "Email", "Plus Ones", "Notes", "Checked In"]
    const rows = entries.map(e => [
      e.name,
      e.phone || "",
      e.email || "",
      e.plusOnes.toString(),
      e.notes || "",
      e.checkedInAt ? new Date(e.checkedInAt).toLocaleString() : "No",
    ])

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `guestlist-${eventId}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredEntries = entries.filter(e =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.phone?.includes(searchQuery) ||
    e.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="border border-white/10 bg-white/[0.02]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-white/30" />
          <span className="text-[10px] font-mono text-white/40 tracking-widest">GUESTLIST</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            disabled={entries.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-white/10 text-[10px] font-mono text-white/60 tracking-wider hover:border-white/20 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <FileDown className="w-3 h-3" />
            EXPORT
          </button>
          <button
            onClick={() => setShowAddDialog(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#ff1493] text-black text-[10px] font-mono font-bold tracking-wider hover:bg-[#ff1493]/90 transition-all"
          >
            <Plus className="w-3 h-3" />
            ADD GUEST
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 border-b border-white/10">
        <div className="p-4 text-center border-r border-white/5">
          <p className="text-2xl font-mono font-bold">{stats.total}</p>
          <p className="text-[10px] font-mono text-white/40 tracking-widest mt-1">GUESTS</p>
        </div>
        <div className="p-4 text-center border-r border-white/5">
          <p className="text-2xl font-mono font-bold">{stats.totalWithPlusOnes}</p>
          <p className="text-[10px] font-mono text-white/40 tracking-widest mt-1">TOTAL W/ +1s</p>
        </div>
        <div className="p-4 text-center">
          <p className="text-2xl font-mono font-bold text-green-400">{stats.checkedIn}</p>
          <p className="text-[10px] font-mono text-white/40 tracking-widest mt-1">CHECKED IN</p>
        </div>
      </div>

      {/* Search */}
      {entries.length > 5 && (
        <div className="px-4 py-3 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
            <input
              placeholder="Search guestlist..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white/[0.02] border border-white/10 text-sm font-mono text-white placeholder:text-white/20 focus:border-[#ff1493]/50 focus:outline-none transition-colors"
            />
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="p-8 text-center">
          <div className="w-5 h-5 border-2 border-[#ff1493]/30 border-t-[#ff1493] animate-spin mx-auto" />
        </div>
      ) : entries.length === 0 ? (
        <div className="p-12 text-center">
          <Users className="w-8 h-8 mx-auto text-white/10 mb-3" />
          <p className="text-white/40 font-mono text-sm">No guests on the list yet</p>
          <p className="text-[10px] text-white/20 font-mono mt-1">
            Add VIPs, artists, or comp entries
          </p>
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {/* Column Headers */}
          <div className="grid grid-cols-[1fr_1fr_60px_120px_40px] gap-4 px-4 py-2 text-[10px] font-mono text-white/30 tracking-widest">
            <span>NAME</span>
            <span>CONTACT</span>
            <span className="text-center">+1s</span>
            <span>STATUS</span>
            <span></span>
          </div>
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className="grid grid-cols-[1fr_1fr_60px_120px_40px] gap-4 px-4 py-3 items-center hover:bg-white/[0.02] transition-all"
            >
              <div className="min-w-0">
                <p className="font-mono text-sm truncate">{entry.name}</p>
                {entry.notes && (
                  <p className="text-[10px] font-mono text-white/30 truncate">{entry.notes}</p>
                )}
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                {entry.phone && (
                  <span className="flex items-center gap-1.5 text-xs font-mono text-white/40 truncate">
                    <Phone className="w-3 h-3 flex-shrink-0" />
                    {entry.phone}
                  </span>
                )}
                {entry.email && (
                  <span className="flex items-center gap-1.5 text-xs font-mono text-white/40 truncate">
                    <Mail className="w-3 h-3 flex-shrink-0" />
                    {entry.email}
                  </span>
                )}
                {!entry.phone && !entry.email && (
                  <span className="text-white/20 font-mono text-xs">—</span>
                )}
              </div>
              <div className="text-center">
                {entry.plusOnes > 0 ? (
                  <span className="inline-flex items-center justify-center px-1.5 py-0.5 bg-[#ff1493]/10 text-[#ff1493] text-[10px] font-mono font-bold">
                    +{entry.plusOnes}
                  </span>
                ) : (
                  <span className="text-white/20 font-mono text-xs">—</span>
                )}
              </div>
              <div>
                {entry.checkedInAt ? (
                  <div className="flex items-center gap-1.5 text-green-400">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span className="text-xs font-mono">{new Date(entry.checkedInAt).toLocaleTimeString()}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-white/30">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-xs font-mono">Not arrived</span>
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => deleteEntry(entry.id)}
                  className="p-1.5 text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Guest Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="border-white/10 bg-black">
          <DialogHeader>
            <DialogTitle className="font-mono flex items-center gap-2">
              <Users className="h-4 w-4 text-[#ff1493]" />
              Add to Guestlist
            </DialogTitle>
            <DialogDescription className="text-xs text-white/40">
              Add a VIP or comp entry to your event guestlist.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={addEntry} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-mono text-white/50">
                Name *
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="John Smith"
                required
                className="bg-white/[0.02] border-white/10 font-mono focus:border-[#ff1493]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-mono text-white/50">
                  Phone
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+1 555-123-4567"
                  className="bg-white/[0.02] border-white/10 font-mono focus:border-[#ff1493]"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="plusOnes" className="text-xs font-mono text-white/50">
                  Plus Ones
                </Label>
                <Input
                  id="plusOnes"
                  name="plusOnes"
                  type="number"
                  min="0"
                  max="10"
                  defaultValue="0"
                  className="bg-white/[0.02] border-white/10 font-mono focus:border-[#ff1493]"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-mono text-white/50">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="john@example.com"
                className="bg-white/[0.02] border-white/10 font-mono focus:border-[#ff1493]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs font-mono text-white/50">
                Notes (internal)
              </Label>
              <Input
                id="notes"
                name="notes"
                placeholder="VIP, Artist +1, etc."
                className="bg-white/[0.02] border-white/10 font-mono focus:border-[#ff1493]"
              />
            </div>
            <button
              type="submit"
              disabled={addLoading}
              className="w-full py-2.5 bg-[#ff1493] text-black font-mono font-bold hover:bg-[#ff1493]/90 transition-all disabled:opacity-50"
            >
              {addLoading ? "Adding..." : "Add to Guestlist"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
