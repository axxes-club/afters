"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { 
  ArrowLeft, Plus, Trash2, ExternalLink, QrCode, ImageIcon, Pencil, 
  BarChart3, Ticket, Users, Settings, DollarSign, Calendar, MapPin,
  Copy, Eye, EyeOff
} from "lucide-react"
import { formatCents } from "@/lib/stripe"
import { FlyerUpload } from "@/components/FlyerUpload"
import { ScannerManagement } from "@/components/dashboard/ScannerManagement"
import { ScanActivityLog } from "@/components/dashboard/ScanActivityLog"
import { ShiftHistory } from "@/components/dashboard/ShiftHistory"
import { GuestlistManagement } from "@/components/guestlist-management"

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
  startsAt: string
  endsAt: string | null
  venueName: string
  venueAddress: string
  city: string
  state: string | null
  flyerUrl: string | null
  status: string
  isPublished: boolean
  ticketTiers: TicketTier[]
}

export default function EventDashboardPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params)
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [showTierDialog, setShowTierDialog] = useState(false)
  const [showFlyerDialog, setShowFlyerDialog] = useState(false)
  const [tierLoading, setTierLoading] = useState(false)
  const [flyerLoading, setFlyerLoading] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [tempFlyerUrl, setTempFlyerUrl] = useState<string | null>(null)

  useEffect(() => {
    fetchEvent()
  }, [eventId])

  async function fetchEvent() {
    try {
      const res = await fetch(`/api/events/${eventId}`)
      if (res.ok) {
        const data = await res.json()
        setEvent(data)
      }
    } catch (error) {
      console.error("Failed to fetch event:", error)
    } finally {
      setLoading(false)
    }
  }

  async function createTier(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setTierLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get("name"),
      description: formData.get("description"),
      price: Math.round(parseFloat(formData.get("price") as string) * 100),
      quantity: parseInt(formData.get("quantity") as string),
    }

    try {
      const res = await fetch(`/api/events/${eventId}/ticket-tiers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        toast.success("Ticket tier created")
        setShowTierDialog(false)
        fetchEvent()
      } else {
        toast.error("Failed to create tier")
      }
    } catch {
      toast.error("Failed to create tier")
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

      if (res.ok) {
        toast.success("Tier deleted")
        fetchEvent()
      } else {
        toast.error("Failed to delete tier")
      }
    } catch {
      toast.error("Failed to delete tier")
    }
  }

  async function updateFlyer() {
    setFlyerLoading(true)
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flyerUrl: tempFlyerUrl }),
      })

      if (res.ok) {
        toast.success("Flyer updated")
        setShowFlyerDialog(false)
        fetchEvent()
      } else {
        toast.error("Failed to update flyer")
      }
    } catch {
      toast.error("Failed to update flyer")
    } finally {
      setFlyerLoading(false)
    }
  }

  async function publishEvent() {
    if (!confirm("Publish this event? It will be visible to everyone.")) return
    setPublishing(true)

    try {
      const res = await fetch(`/api/events/${eventId}/publish`, { method: "POST" })
      if (res.ok) {
        toast.success("Event published!")
        fetchEvent()
      } else {
        toast.error("Failed to publish")
      }
    } catch {
      toast.error("Failed to publish")
    } finally {
      setPublishing(false)
    }
  }

  function copyEventUrl() {
    const url = `${window.location.origin}/e/${event?.slug}`
    navigator.clipboard.writeText(url)
    toast.success("Event URL copied!")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Event not found</p>
      </div>
    )
  }

  const eventUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/e/${event.slug}`
  const totalCapacity = event.ticketTiers.reduce((sum, t) => sum + t.quantity, 0)
  const totalSold = event.ticketTiers.reduce((sum, t) => sum + t.quantitySold, 0)
  const totalRevenue = event.ticketTiers.reduce((sum, t) => sum + (t.quantitySold * t.price), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard/events">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{event.title}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(event.startsAt).toLocaleDateString('en-US', { 
                  weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                })}
                <span className="text-muted-foreground/50">•</span>
                <MapPin className="h-3.5 w-3.5" />
                {event.venueName}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={event.status === "PUBLISHED" ? "default" : "secondary"}>
            {event.status === "PUBLISHED" ? <Eye className="mr-1 h-3 w-3" /> : <EyeOff className="mr-1 h-3 w-3" />}
            {event.status}
          </Badge>
          {event.isPublished ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={eventUrl} target="_blank">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Live
              </Link>
            </Button>
          ) : (
            <Button size="sm" onClick={publishEvent} disabled={publishing || event.ticketTiers.length === 0}>
              {publishing ? "Publishing..." : "Publish Event"}
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sold</p>
                <p className="text-2xl font-bold">{totalSold}<span className="text-sm font-normal text-muted-foreground">/{totalCapacity}</span></p>
              </div>
              <Ticket className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold">{formatCents(totalRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors" onClick={copyEventUrl}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Event URL</p>
                <p className="text-sm font-mono truncate max-w-[120px]">/e/{event.slug}</p>
              </div>
              <Copy className="h-5 w-5 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <Button variant="outline" className="w-full h-full" asChild>
              <Link href={`/dashboard/events/${eventId}/analytics`}>
                <BarChart3 className="mr-2 h-4 w-4" />
                Analytics
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="door">Door</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-[280px_1fr]">
            {/* Flyer */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Event Flyer</CardTitle>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                    setTempFlyerUrl(event.flyerUrl)
                    setShowFlyerDialog(true)
                  }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {event.flyerUrl ? (
                  <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden border">
                    <Image src={event.flyerUrl} alt={event.title} fill className="object-cover" />
                  </div>
                ) : (
                  <div 
                    className="aspect-[3/4] w-full rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => setShowFlyerDialog(true)}
                  >
                    <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                    <p className="text-xs text-muted-foreground">Add flyer</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ticket Tiers Summary */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Ticket Tiers</CardTitle>
                    <CardDescription>Quick overview of your ticket types</CardDescription>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setShowTierDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Tier
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {event.ticketTiers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Ticket className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No ticket tiers yet</p>
                    <p className="text-sm">Create your first tier to start selling</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {event.ticketTiers.map((tier) => (
                      <div key={tier.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div>
                          <p className="font-medium">{tier.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {tier.quantitySold}/{tier.quantity} sold • {formatCents(tier.price)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full" 
                              style={{ width: `${(tier.quantitySold / tier.quantity) * 100}%` }} 
                            />
                          </div>
                          <span className="text-sm text-muted-foreground w-12 text-right">
                            {Math.round((tier.quantitySold / tier.quantity) * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href={`/dashboard/events/${eventId}/check-in`}>
                <QrCode className="h-6 w-6" />
                <span>Open Scanner</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href={`/dashboard/events/${eventId}/analytics`}>
                <BarChart3 className="h-6 w-6" />
                <span>View Analytics</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={copyEventUrl}>
              <Copy className="h-6 w-6" />
              <span>Copy Event Link</span>
            </Button>
          </div>
        </TabsContent>

        {/* TICKETS TAB */}
        <TabsContent value="tickets" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Ticket Tiers</CardTitle>
                  <CardDescription>Manage your event's ticket types and pricing</CardDescription>
                </div>
                <Button onClick={() => setShowTierDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Tier
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {event.ticketTiers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Ticket className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No ticket tiers yet</p>
                  <p className="text-sm">Add your first tier to start selling tickets</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {event.ticketTiers.map((tier) => (
                    <div key={tier.id} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="space-y-1">
                        <p className="font-medium">{tier.name}</p>
                        {tier.description && (
                          <p className="text-sm text-muted-foreground">{tier.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm">
                          <span className="font-medium">{formatCents(tier.price)}</span>
                          <span className="text-muted-foreground">
                            {tier.quantitySold}/{tier.quantity} sold
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
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
        </TabsContent>

        {/* DOOR TAB */}
        <TabsContent value="door" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Button variant="outline" size="lg" className="h-auto py-6 flex-col gap-2" asChild>
              <Link href={`/dashboard/events/${eventId}/check-in`}>
                <QrCode className="h-8 w-8" />
                <span className="font-medium">Open Check-in Scanner</span>
                <span className="text-sm text-muted-foreground">Scan tickets at the door</span>
              </Link>
            </Button>
            <Card className="flex items-center justify-center p-6">
              <div className="text-center">
                <p className="text-3xl font-bold">{totalSold}</p>
                <p className="text-sm text-muted-foreground">tickets to scan</p>
              </div>
            </Card>
          </div>

          <GuestlistManagement eventId={eventId} />
          <ScannerManagement eventId={eventId} />
          <ScanActivityLog eventId={eventId} />
          <ShiftHistory eventId={eventId} />
        </TabsContent>

        {/* SETTINGS TAB */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
              <CardDescription>Basic information about your event</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Venue</p>
                  <p className="font-medium">{event.venueName}</p>
                  <p className="text-sm text-muted-foreground">{event.venueAddress}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{event.city}{event.state ? `, ${event.state}` : ''}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Start</p>
                  <p className="font-medium">
                    {new Date(event.startsAt).toLocaleDateString('en-US', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                      hour: 'numeric', minute: '2-digit'
                    })}
                  </p>
                </div>
                {event.endsAt && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">End</p>
                    <p className="font-medium">
                      {new Date(event.endsAt).toLocaleDateString('en-US', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                        hour: 'numeric', minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {!event.isPublished && (
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader>
                <CardTitle>Ready to Go Live?</CardTitle>
                <CardDescription>
                  Publishing will make your event visible to everyone
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
        </TabsContent>
      </Tabs>

      {/* DIALOGS */}
      {/* Flyer Dialog */}
      <Dialog open={showFlyerDialog} onOpenChange={setShowFlyerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Event Flyer</DialogTitle>
            <DialogDescription>Upload a new flyer image</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <FlyerUpload value={tempFlyerUrl} onChange={setTempFlyerUrl} disabled={flyerLoading} />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowFlyerDialog(false)} disabled={flyerLoading}>
                Cancel
              </Button>
              <Button onClick={updateFlyer} disabled={flyerLoading}>
                {flyerLoading ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tier Dialog */}
      <Dialog open={showTierDialog} onOpenChange={setShowTierDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Ticket Tier</DialogTitle>
            <DialogDescription>Create a new ticket type</DialogDescription>
          </DialogHeader>
          <form onSubmit={createTier} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tier Name</Label>
              <Input id="name" name="name" placeholder="General Admission" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" placeholder="Access to main floor" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input id="price" name="price" type="number" step="0.01" min="0" placeholder="25.00" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input id="quantity" name="quantity" type="number" min="1" placeholder="100" required />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={tierLoading}>
              {tierLoading ? "Creating..." : "Create Tier"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  )
}
