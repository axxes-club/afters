"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { ArrowLeft, Plus, Trash2, ExternalLink, QrCode } from "lucide-react"
import { formatCents } from "@/lib/stripe"

interface TicketTier {
  id: string
  name: string
  description: string | null
  price: number
  quantity: number
  quantitySold: number
}

interface Event {
  id: string
  title: string
  slug: string
  description: string | null
  status: string
  isPublished: boolean
  startsAt: string
  venueName: string
  city: string
  ticketTiers: TicketTier[]
  organizer: {
    slug: string
  }
}

export default function EventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params)
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [showTierDialog, setShowTierDialog] = useState(false)
  const [tierLoading, setTierLoading] = useState(false)

  useEffect(() => {
    fetchEvent()
  }, [eventId])

  async function fetchEvent() {
    try {
      const res = await fetch(`/api/events/${eventId}`)
      if (res.ok) {
        setEvent(await res.json())
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function publishEvent() {
    setPublishing(true)
    try {
      const res = await fetch(`/api/events/${eventId}/publish`, {
        method: "POST",
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message)
      }

      toast.success("Event published!")
      fetchEvent()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to publish")
    } finally {
      setPublishing(false)
    }
  }

  async function addTier(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setTierLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get("name"),
      description: formData.get("description") || null,
      price: parseFloat(formData.get("price") as string),
      quantity: parseInt(formData.get("quantity") as string),
      maxPerOrder: parseInt(formData.get("maxPerOrder") as string) || 10,
    }

    try {
      const res = await fetch(`/api/events/${eventId}/ticket-tiers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message)
      }

      toast.success("Ticket tier added!")
      setShowTierDialog(false)
      fetchEvent()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add tier")
    } finally {
      setTierLoading(false)
    }
  }

  async function deleteTier(tierId: string) {
    if (!confirm("Delete this ticket tier?")) return

    try {
      const res = await fetch(`/api/events/${eventId}/ticket-tiers?tierId=${tierId}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message)
      }

      toast.success("Tier deleted")
      fetchEvent()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete")
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  if (!event) {
    return <div className="text-center py-8">Event not found</div>
  }

  const eventUrl = `/e/${event.organizer.slug}-${event.slug}`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{event.title}</h1>
            <p className="text-muted-foreground">
              {new Date(event.startsAt).toLocaleDateString()} at {event.venueName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={event.status === "PUBLISHED" ? "default" : "secondary"}>
            {event.status}
          </Badge>
          {event.isPublished && (
            <Button variant="outline" size="sm" asChild>
              <Link href={eventUrl} target="_blank">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Live
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {event.ticketTiers.reduce((sum, t) => sum + t.quantity, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {event.ticketTiers.reduce((sum, t) => sum + t.quantitySold, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Check-in</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" asChild>
              <Link href={`/dashboard/events/${eventId}/check-in`}>
                <QrCode className="mr-2 h-4 w-4" />
                Open Scanner
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Ticket Tiers */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Ticket Tiers</CardTitle>
              <CardDescription>Manage your event&apos;s ticket types and pricing</CardDescription>
            </div>
            <Dialog open={showTierDialog} onOpenChange={setShowTierDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Tier
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Ticket Tier</DialogTitle>
                  <DialogDescription>
                    Create a new ticket type for your event
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={addTier} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Tier Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="e.g., General Admission"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (optional)</Label>
                    <Input
                      id="description"
                      name="description"
                      placeholder="e.g., Access to main floor"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Price ($)</Label>
                      <Input
                        id="price"
                        name="price"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="25.00"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        name="quantity"
                        type="number"
                        min="1"
                        placeholder="100"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxPerOrder">Max per Order</Label>
                    <Input
                      id="maxPerOrder"
                      name="maxPerOrder"
                      type="number"
                      min="1"
                      defaultValue="10"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={tierLoading}>
                    {tierLoading ? "Adding..." : "Add Tier"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {event.ticketTiers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No ticket tiers yet. Add one to start selling!
            </p>
          ) : (
            <div className="space-y-4">
              {event.ticketTiers.map((tier) => (
                <div
                  key={tier.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div>
                    <p className="font-medium">{tier.name}</p>
                    {tier.description && (
                      <p className="text-sm text-muted-foreground">{tier.description}</p>
                    )}
                    <p className="text-sm">
                      {formatCents(tier.price)} &bull; {tier.quantitySold}/{tier.quantity} sold
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteTier(tier.id)}
                    disabled={tier.quantitySold > 0}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Publish Card */}
      {event.status === "DRAFT" && (
        <Card>
          <CardHeader>
            <CardTitle>Ready to Go Live?</CardTitle>
            <CardDescription>
              Publishing will make your event visible to everyone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={publishEvent} disabled={publishing || event.ticketTiers.length === 0}>
              {publishing ? "Publishing..." : "Publish Event"}
            </Button>
            {event.ticketTiers.length === 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                Add at least one ticket tier before publishing.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
