"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
    } catch (error) {
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
    } catch (error) {
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Guestlist
            </CardTitle>
            <CardDescription>
              Manage VIP and comp entries for your event
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV} disabled={entries.length === 0}>
              <FileDown className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Guest
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add to Guestlist</DialogTitle>
                  <DialogDescription>
                    Add a VIP or comp entry to your event guestlist.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={addEntry} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="John Smith"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="+1 555-123-4567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="plusOnes">Plus Ones</Label>
                      <Input
                        id="plusOnes"
                        name="plusOnes"
                        type="number"
                        min="0"
                        max="10"
                        defaultValue="0"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (internal)</Label>
                    <Input
                      id="notes"
                      name="notes"
                      placeholder="VIP, Artist +1, etc."
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={addLoading}>
                    {addLoading ? "Adding..." : "Add to Guestlist"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Guests</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{stats.totalWithPlusOnes}</p>
            <p className="text-xs text-muted-foreground">Total (w/ +1s)</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-500">{stats.checkedIn}</p>
            <p className="text-xs text-muted-foreground">Checked In</p>
          </div>
        </div>

        {/* Search */}
        {entries.length > 5 && (
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search guestlist..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading guestlist...
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No guests on the list yet</p>
            <p className="text-sm text-muted-foreground/70">
              Add VIPs, artists, or comp entries to get started
            </p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-center">+1s</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{entry.name}</p>
                        {entry.notes && (
                          <p className="text-xs text-muted-foreground">{entry.notes}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                        {entry.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {entry.phone}
                          </span>
                        )}
                        {entry.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {entry.email}
                          </span>
                        )}
                        {!entry.phone && !entry.email && (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {entry.plusOnes > 0 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium">
                          +{entry.plusOnes}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {entry.checkedInAt ? (
                        <div className="flex items-center gap-1 text-green-500 text-sm">
                          <CheckCircle className="h-4 w-4" />
                          <span>{new Date(entry.checkedInAt).toLocaleTimeString()}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-muted-foreground text-sm">
                          <Clock className="h-4 w-4" />
                          <span>Not arrived</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteEntry(entry.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
