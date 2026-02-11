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
  BarChart3, Ticket, Users, DollarSign, Calendar, MapPin,
  Copy, Eye, EyeOff, AlertTriangle, Sparkles, Check, Share2,
  CheckCircle2, Circle, ChevronRight
} from "lucide-react"
import { formatCents } from "@/lib/stripe"
import { FlyerUpload } from "@/components/FlyerUpload"
import { ScannerManagement } from "@/components/dashboard/ScannerManagement"
import { ScanActivityLog } from "@/components/dashboard/ScanActivityLog"
import { ShiftHistory } from "@/components/dashboard/ShiftHistory"
import { GuestlistManagement } from "@/components/guestlist-management"
import { cn } from "@/lib/utils"

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
  const [stripeEnabled, setStripeEnabled] = useState<boolean | null>(null)
  const [showPublishDialog, setShowPublishDialog] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchEvent()
    fetchStripeStatus()
  }, [eventId])

  async function fetchStripeStatus() {
    try {
      const res = await fetch('/api/user/stripe-status')
      if (res.ok) {
        const data = await res.json()
        setStripeEnabled(data.stripeChargesEnabled)
      }
    } catch (error) {
      console.error("Failed to fetch Stripe status:", error)
    }
  }

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
    setPublishing(true)
    setShowPublishDialog(false)

    try {
      const res = await fetch(`/api/events/${eventId}/publish`, { method: "POST" })
      if (res.ok) {
        toast.success("Event published!")
        fetchEvent()
      } else {
        const data = await res.json()
        toast.error(data.message || "Failed to publish")
      }
    } catch {
      toast.error("Failed to publish")
    } finally {
      setPublishing(false)
    }
  }

  // Check if event has paid tiers
  const hasPaidTiers = event?.ticketTiers.some(t => t.price > 0) || false

  function copyEventUrl() {
    const url = `${window.location.origin}/e/${event?.slug}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success("Event URL copied!")
    setTimeout(() => setCopied(false), 2000)
  }

  function shareEvent() {
    const url = `${window.location.origin}/e/${event?.slug}`
    if (navigator.share) {
      navigator.share({
        title: event?.title,
        text: `Check out ${event?.title}`,
        url,
      })
    } else {
      copyEventUrl()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="relative">
          <div className="w-12 h-12 border-2 border-pink/30 border-t-pink rounded-full animate-spin" />
          <div className="absolute inset-0 blur-xl bg-pink/20 animate-pulse" />
        </div>
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
      {/* Hero Header with Flyer Background */}
      <div className="relative -mx-6 -mt-6 mb-6 overflow-hidden rounded-b-3xl">
        {/* Background */}
        <div className="absolute inset-0">
          {event.flyerUrl ? (
            <>
              <Image
                src={event.flyerUrl}
                alt=""
                fill
                className="object-cover opacity-30 blur-sm scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-background" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-pink/10 via-background to-background" />
          )}
        </div>

        {/* Content */}
        <div className="relative px-6 pt-6 pb-8">
          <div className="space-y-4">
            {/* Top Row - Back button and status */}
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10 -ml-2" asChild>
                <Link href="/dashboard/events">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Back to Events</span>
                  <span className="sm:hidden">Back</span>
                </Link>
              </Button>
              <Badge
                variant={event.status === "PUBLISHED" ? "default" : "secondary"}
                className={cn(
                  "font-mono",
                  event.status === "PUBLISHED" && "bg-green-500/20 text-green-400 border-green-500/30"
                )}
              >
                {event.status === "PUBLISHED" ? <Eye className="mr-1 h-3 w-3" /> : <EyeOff className="mr-1 h-3 w-3" />}
                {event.status}
              </Badge>
            </div>

            {/* Title and Meta */}
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-mono tracking-tight text-white animate-fade-in">
                {event.title}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/60 mt-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-pink" />
                  {new Date(event.startsAt).toLocaleDateString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-pink" />
                  {event.venueName}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              {event.isPublished ? (
                <>
                  <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10" asChild>
                    <Link href={eventUrl} target="_blank">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">View Live</span>
                      <span className="sm:hidden">View</span>
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/20 text-white hover:bg-white/10"
                    onClick={shareEvent}
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setShowPublishDialog(true)}
                  disabled={publishing || event.ticketTiers.length === 0}
                  className={cn(
                    "bg-pink hover:bg-pink/90 text-white font-bold",
                    event.ticketTiers.length > 0 && "animate-pulse-glow"
                  )}
                  style={{ '--glow-color': 'rgba(255, 20, 147, 0.4)' } as React.CSSProperties}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {publishing ? "Publishing..." : "Publish Event"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="group glass-card border-white/10 hover:border-pink/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,20,147,0.15)] animate-fade-in-up stagger-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sold</p>
                <p className="text-2xl font-bold font-mono">
                  <span className="text-pink">{totalSold}</span>
                  <span className="text-sm font-normal text-muted-foreground">/{totalCapacity}</span>
                </p>
                {totalCapacity > 0 && (
                  <div className="mt-2 w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full progress-gradient"
                      style={{ width: `${(totalSold / totalCapacity) * 100}%` }}
                    />
                  </div>
                )}
              </div>
              <div className="p-2 rounded-xl bg-pink/10 group-hover:bg-pink/20 transition-colors">
                <Ticket className="h-6 w-6 text-pink" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="group glass-card border-white/10 hover:border-green-500/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(34,197,94,0.15)] animate-fade-in-up stagger-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold font-mono text-green-400">{formatCents(totalRevenue)}</p>
              </div>
              <div className="p-2 rounded-xl bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                <DollarSign className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card
          className={cn(
            "group glass-card border-white/10 hover:border-cyan-500/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)] cursor-pointer animate-fade-in-up stagger-3",
            copied && "border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.2)]"
          )}
          onClick={copyEventUrl}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{copied ? "Copied!" : "Event URL"}</p>
                <p className="text-sm font-mono truncate max-w-[120px] text-cyan-400">/e/{event.slug}</p>
              </div>
              <div className={cn(
                "p-2 rounded-xl transition-all",
                copied ? "bg-green-500/20" : "bg-cyan-500/10 group-hover:bg-cyan-500/20"
              )}>
                {copied ? (
                  <Check className="h-5 w-5 text-green-400 animate-scale-in" />
                ) : (
                  <Copy className="h-5 w-5 text-cyan-400 group-hover:scale-110 transition-transform" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="group glass-card border-white/10 hover:border-purple-500/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] animate-fade-in-up stagger-4">
          <CardContent className="p-4 h-full">
            <Link
              href={`/dashboard/events/${eventId}/analytics`}
              className="flex items-center justify-between h-full"
            >
              <div>
                <p className="text-sm text-muted-foreground">Insights</p>
                <p className="text-sm font-medium text-purple-400">View Analytics →</p>
              </div>
              <div className="p-2 rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                <BarChart3 className="h-6 w-6 text-purple-400" />
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started Checklist - Only for draft events */}
      {!event.isPublished && (
        <Card className="glass-card border-pink/20 bg-gradient-to-r from-pink/5 via-transparent to-transparent animate-fade-in-up">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-pink/10">
                  <Sparkles className="h-5 w-5 text-pink" />
                </div>
                <div>
                  <h3 className="font-bold font-mono">Get Ready to Launch</h3>
                  <p className="text-sm text-muted-foreground">Complete these steps to publish your event</p>
                </div>
              </div>
              <Badge variant="outline" className="font-mono border-pink/30 text-pink">
                {[event.flyerUrl, event.ticketTiers.length > 0, event.description].filter(Boolean).length}/3 done
              </Badge>
            </div>
            <div className="grid gap-2">
              <div
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg transition-all",
                  event.flyerUrl ? "bg-green-500/10 border border-green-500/20" : "bg-white/5 border border-white/10 cursor-pointer hover:border-pink/30"
                )}
                onClick={() => !event.flyerUrl && setShowFlyerDialog(true)}
              >
                {event.flyerUrl ? (
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
                <span className={cn("flex-1", event.flyerUrl && "text-green-400")}>Upload event flyer</span>
                {!event.flyerUrl && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </div>
              <div
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg transition-all",
                  event.ticketTiers.length > 0 ? "bg-green-500/10 border border-green-500/20" : "bg-white/5 border border-white/10 cursor-pointer hover:border-pink/30"
                )}
                onClick={() => event.ticketTiers.length === 0 && setShowTierDialog(true)}
              >
                {event.ticketTiers.length > 0 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
                <span className={cn("flex-1", event.ticketTiers.length > 0 && "text-green-400")}>Create ticket tiers</span>
                {event.ticketTiers.length === 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </div>
              <div
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg transition-all",
                  event.description ? "bg-green-500/10 border border-green-500/20" : "bg-white/5 border border-white/10"
                )}
              >
                {event.description ? (
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
                <span className={cn("flex-1", event.description ? "text-green-400" : "text-muted-foreground")}>
                  {event.description ? "Event description added" : "Add event description (optional)"}
                </span>
              </div>
            </div>
            {event.flyerUrl && event.ticketTiers.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <Button
                  onClick={() => setShowPublishDialog(true)}
                  className="w-full bg-pink hover:bg-pink/90 text-white font-bold btn-glow animate-pulse-glow"
                  style={{ '--glow-color': 'rgba(255, 20, 147, 0.4)' } as React.CSSProperties}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Ready to Publish!
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Share Card - Only for published events */}
      {event.isPublished && (
        <Card className="glass-card border-green-500/20 bg-gradient-to-r from-green-500/5 via-transparent to-transparent animate-fade-in-up">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-green-500/10">
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <h3 className="font-bold font-mono text-green-400">Event is Live!</h3>
                  <p className="text-sm text-muted-foreground">Share your event to start selling tickets</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/20 hover:border-cyan-500/30 hover:bg-cyan-500/10"
                  onClick={copyEventUrl}
                >
                  {copied ? <Check className="mr-2 h-4 w-4 text-green-400" /> : <Copy className="mr-2 h-4 w-4" />}
                  {copied ? "Copied!" : "Copy Link"}
                </Button>
                <Button
                  size="sm"
                  className="bg-pink hover:bg-pink/90 text-white font-bold"
                  onClick={shareEvent}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-white/5 p-1 rounded-xl">
          <TabsTrigger
            value="overview"
            className="font-mono text-sm data-[state=active]:bg-pink data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(255,20,147,0.3)] rounded-lg transition-all"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="tickets"
            className="font-mono text-sm data-[state=active]:bg-pink data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(255,20,147,0.3)] rounded-lg transition-all"
          >
            Tickets
          </TabsTrigger>
          <TabsTrigger
            value="door"
            className="font-mono text-sm data-[state=active]:bg-pink data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(255,20,147,0.3)] rounded-lg transition-all"
          >
            Door
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="font-mono text-sm data-[state=active]:bg-pink data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(255,20,147,0.3)] rounded-lg transition-all"
          >
            Settings
          </TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-[280px_1fr]">
            {/* Flyer */}
            <Card className="glass-card border-white/10 overflow-hidden group">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-mono">Event Flyer</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 hover:bg-pink/20 hover:text-pink"
                    onClick={() => {
                      setTempFlyerUrl(event.flyerUrl)
                      setShowFlyerDialog(true)
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {event.flyerUrl ? (
                  <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden border border-white/10 group-hover:border-pink/30 transition-all group-hover:shadow-[0_0_30px_rgba(255,20,147,0.2)]">
                    <Image src={event.flyerUrl} alt={event.title} fill className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ) : (
                  <div
                    className="aspect-[3/4] w-full rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-pink/50 hover:bg-pink/5 transition-all"
                    onClick={() => setShowFlyerDialog(true)}
                  >
                    <div className="p-3 rounded-full bg-pink/10">
                      <ImageIcon className="h-8 w-8 text-pink" />
                    </div>
                    <p className="text-sm text-muted-foreground">Add flyer</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ticket Tiers Summary */}
            <Card className="glass-card border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="font-mono">Ticket Tiers</CardTitle>
                    <CardDescription>Quick overview of your ticket types</CardDescription>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setShowTierDialog(true)}
                    className="bg-pink hover:bg-pink/90 text-white font-bold btn-glow"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Tier
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {event.ticketTiers.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="p-4 rounded-full bg-pink/10 w-fit mx-auto mb-4">
                      <Ticket className="h-10 w-10 text-pink" />
                    </div>
                    <p className="font-medium">No ticket tiers yet</p>
                    <p className="text-sm mt-1">Create your first tier to start selling</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {event.ticketTiers.map((tier, idx) => {
                      const percentage = Math.round((tier.quantitySold / tier.quantity) * 100)
                      return (
                        <div
                          key={tier.id}
                          className="group flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-pink/30 hover:bg-white/[0.07] transition-all animate-fade-in-up"
                          style={{ animationDelay: `${idx * 0.1}s` }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-1 h-10 rounded-full bg-gradient-to-b from-pink to-pink/30" />
                            <div>
                              <p className="font-medium">{tier.name}</p>
                              <p className="text-sm text-muted-foreground">
                                <span className="text-pink font-mono">{tier.quantitySold}</span>/{tier.quantity} sold • <span className="text-green-400">{formatCents(tier.price)}</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-28 h-2 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full progress-gradient transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className={cn(
                              "text-sm font-mono w-12 text-right",
                              percentage >= 80 ? "text-pink" : "text-muted-foreground"
                            )}>
                              {percentage}%
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-3">
            <Button
              variant="outline"
              className="group h-auto py-6 flex-col gap-3 border-white/10 hover:border-cyan-500/30 hover:bg-cyan-500/5 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)] transition-all"
              asChild
            >
              <Link href={`/dashboard/events/${eventId}/check-in`}>
                <div className="p-3 rounded-xl bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors">
                  <QrCode className="h-6 w-6 text-cyan-400" />
                </div>
                <span className="font-medium">Open Scanner</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="group h-auto py-6 flex-col gap-3 border-white/10 hover:border-purple-500/30 hover:bg-purple-500/5 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] transition-all"
              asChild
            >
              <Link href={`/dashboard/events/${eventId}/analytics`}>
                <div className="p-3 rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                  <BarChart3 className="h-6 w-6 text-purple-400" />
                </div>
                <span className="font-medium">View Analytics</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="group h-auto py-6 flex-col gap-3 border-white/10 hover:border-pink/30 hover:bg-pink/5 hover:shadow-[0_0_30px_rgba(255,20,147,0.15)] transition-all"
              onClick={copyEventUrl}
            >
              <div className="p-3 rounded-xl bg-pink/10 group-hover:bg-pink/20 transition-colors">
                <Copy className="h-6 w-6 text-pink" />
              </div>
              <span className="font-medium">Copy Event Link</span>
            </Button>
          </div>
        </TabsContent>

        {/* TICKETS TAB */}
        <TabsContent value="tickets" className="space-y-6">
          <Card className="glass-card border-white/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-mono">Ticket Tiers</CardTitle>
                  <CardDescription>Manage your event's ticket types and pricing</CardDescription>
                </div>
                <Button
                  onClick={() => setShowTierDialog(true)}
                  className="bg-pink hover:bg-pink/90 text-white font-bold btn-glow"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Tier
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {event.ticketTiers.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <div className="p-4 rounded-full bg-pink/10 w-fit mx-auto mb-4">
                    <Ticket className="h-12 w-12 text-pink" />
                  </div>
                  <p className="font-medium text-lg">No ticket tiers yet</p>
                  <p className="text-sm mt-1">Add your first tier to start selling tickets</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {event.ticketTiers.map((tier, idx) => {
                    const percentage = Math.round((tier.quantitySold / tier.quantity) * 100)
                    const almostSoldOut = percentage >= 80
                    return (
                      <div
                        key={tier.id}
                        className={cn(
                          "group relative p-5 rounded-xl border transition-all duration-300 animate-fade-in-up",
                          almostSoldOut
                            ? "border-pink/30 bg-pink/5 hover:border-pink/50 hover:shadow-[0_0_30px_rgba(255,20,147,0.2)]"
                            : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]"
                        )}
                        style={{ animationDelay: `${idx * 0.1}s` }}
                      >
                        {almostSoldOut && (
                          <div className="absolute top-3 right-12 px-2 py-1 rounded-full bg-pink/20 text-pink text-xs font-mono">
                            HOT
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <div className="w-1.5 h-12 rounded-full bg-gradient-to-b from-pink via-pink/50 to-pink/20" />
                              <div>
                                <p className="font-bold text-lg">{tier.name}</p>
                                {tier.description && (
                                  <p className="text-sm text-muted-foreground">{tier.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-6 ml-4 text-sm">
                              <span className="font-mono text-2xl font-bold text-green-400">{formatCents(tier.price)}</span>
                              <div>
                                <p className="text-muted-foreground">
                                  <span className="text-pink font-mono font-bold">{tier.quantitySold}</span> / {tier.quantity} sold
                                </p>
                                <div className="mt-1 w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full progress-gradient"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                            onClick={() => deleteTier(tier.id)}
                            disabled={tier.quantitySold > 0}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* DOOR TAB */}
        <TabsContent value="door" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Button
              variant="outline"
              size="lg"
              className="group h-auto py-8 flex-col gap-3 border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10 hover:border-cyan-400/50 hover:shadow-[0_0_40px_rgba(34,211,238,0.2)] transition-all"
              asChild
            >
              <Link href={`/dashboard/events/${eventId}/check-in`}>
                <div className="p-4 rounded-2xl bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors group-hover:scale-110 transform duration-300">
                  <QrCode className="h-10 w-10 text-cyan-400" />
                </div>
                <span className="font-bold text-lg text-cyan-400">Open Check-in Scanner</span>
                <span className="text-sm text-muted-foreground">Scan tickets at the door</span>
              </Link>
            </Button>
            <Card className="glass-card border-white/10 flex items-center justify-center p-8">
              <div className="text-center">
                <p className="text-5xl font-bold font-mono text-pink">{totalSold}</p>
                <p className="text-sm text-muted-foreground mt-2">tickets to scan</p>
                {totalCapacity > 0 && (
                  <div className="mt-4 w-32 mx-auto h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full progress-gradient"
                      style={{ width: `${(totalSold / totalCapacity) * 100}%` }}
                    />
                  </div>
                )}
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
          <Card className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="font-mono">Event Details</CardTitle>
              <CardDescription>Basic information about your event</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 text-pink mb-2">
                    <MapPin className="h-4 w-4" />
                    <p className="text-xs font-mono uppercase tracking-wider">Venue</p>
                  </div>
                  <p className="font-bold">{event.venueName}</p>
                  <p className="text-sm text-muted-foreground">{event.venueAddress}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 text-cyan-400 mb-2">
                    <MapPin className="h-4 w-4" />
                    <p className="text-xs font-mono uppercase tracking-wider">Location</p>
                  </div>
                  <p className="font-bold">{event.city}{event.state ? `, ${event.state}` : ''}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 text-green-400 mb-2">
                    <Calendar className="h-4 w-4" />
                    <p className="text-xs font-mono uppercase tracking-wider">Start</p>
                  </div>
                  <p className="font-bold">
                    {new Date(event.startsAt).toLocaleDateString('en-US', {
                      weekday: 'long', month: 'long', day: 'numeric'
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(event.startsAt).toLocaleTimeString('en-US', {
                      hour: 'numeric', minute: '2-digit'
                    })}
                  </p>
                </div>
                {event.endsAt && (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 text-orange-400 mb-2">
                      <Calendar className="h-4 w-4" />
                      <p className="text-xs font-mono uppercase tracking-wider">End</p>
                    </div>
                    <p className="font-bold">
                      {new Date(event.endsAt).toLocaleDateString('en-US', {
                        weekday: 'long', month: 'long', day: 'numeric'
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.endsAt).toLocaleTimeString('en-US', {
                        hour: 'numeric', minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {!event.isPublished && (
            <Card className="relative overflow-hidden border-pink/30 bg-gradient-to-br from-pink/10 via-background to-background">
              <div className="absolute top-0 right-0 w-64 h-64 bg-pink/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
              <CardHeader className="relative">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-pink" />
                  <CardTitle className="font-mono">Ready to Go Live?</CardTitle>
                </div>
                <CardDescription>
                  Publishing will make your event visible to everyone
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <Button
                  onClick={() => setShowPublishDialog(true)}
                  disabled={publishing || event.ticketTiers.length === 0}
                  className={cn(
                    "bg-pink hover:bg-pink/90 text-white font-bold",
                    event.ticketTiers.length > 0 && "animate-pulse-glow"
                  )}
                  style={{ '--glow-color': 'rgba(255, 20, 147, 0.4)' } as React.CSSProperties}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {publishing ? "Publishing..." : "Publish Event"}
                </Button>
                {event.ticketTiers.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-3">
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
        <DialogContent className="glass-card border-white/10">
          <DialogHeader>
            <DialogTitle className="font-mono">Update Event Flyer</DialogTitle>
            <DialogDescription>Upload a new flyer image</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <FlyerUpload value={tempFlyerUrl} onChange={setTempFlyerUrl} disabled={flyerLoading} />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowFlyerDialog(false)} disabled={flyerLoading} className="border-white/20">
                Cancel
              </Button>
              <Button onClick={updateFlyer} disabled={flyerLoading} className="bg-pink hover:bg-pink/90 text-white font-bold">
                {flyerLoading ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tier Dialog */}
      <Dialog open={showTierDialog} onOpenChange={setShowTierDialog}>
        <DialogContent className="glass-card border-white/10">
          <DialogHeader>
            <DialogTitle className="font-mono flex items-center gap-2">
              <Ticket className="h-5 w-5 text-pink" />
              Add Ticket Tier
            </DialogTitle>
            <DialogDescription>Create a new ticket type</DialogDescription>
          </DialogHeader>
          <form onSubmit={createTier} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Tier Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="General Admission"
                required
                className="bg-white/5 border-white/10 focus:border-pink/50 focus:ring-pink/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">Description</Label>
              <Input
                id="description"
                name="description"
                placeholder="Access to main floor"
                className="bg-white/5 border-white/10 focus:border-pink/50 focus:ring-pink/20"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price" className="text-sm font-medium">Price ($)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="25.00"
                  required
                  className="bg-white/5 border-white/10 focus:border-green-500/50 focus:ring-green-500/20 font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-sm font-medium">Quantity</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  placeholder="100"
                  required
                  className="bg-white/5 border-white/10 focus:border-cyan-500/50 focus:ring-cyan-500/20 font-mono"
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-pink hover:bg-pink/90 text-white font-bold btn-glow"
              disabled={tierLoading}
            >
              {tierLoading ? "Creating..." : "Create Tier"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Publish Confirmation Dialog */}
      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent className="glass-card border-white/10">
          <DialogHeader>
            <DialogTitle className="font-mono flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-pink" />
              Publish Event
            </DialogTitle>
            <DialogDescription>
              This will make your event visible to everyone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {stripeEnabled === false && hasPaidTiers && (
              <div className="flex gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium text-yellow-500">Stripe not configured</p>
                  <p className="text-sm text-muted-foreground">
                    Paid ticket tiers will be hidden from guests until you set up Stripe payouts.
                    Only free tickets will be available for purchase.
                  </p>
                  <Button variant="link" className="h-auto p-0 text-yellow-500" asChild>
                    <Link href="/dashboard/organizer">Configure Stripe →</Link>
                  </Button>
                </div>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              Are you sure you want to publish this event?
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowPublishDialog(false)} disabled={publishing} className="border-white/20">
              Cancel
            </Button>
            <Button
              onClick={publishEvent}
              disabled={publishing}
              className="bg-pink hover:bg-pink/90 text-white font-bold btn-glow"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {publishing ? "Publishing..." : "Publish Event"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
