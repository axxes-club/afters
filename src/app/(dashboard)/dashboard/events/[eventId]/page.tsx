"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
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
  CheckCircle2, Circle, ChevronRight, Zap, ScanLine, Radio, UserCheck,
  Settings, Link2, Globe, Lock, Clock
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
  const router = useRouter()
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
  const [doorStats, setDoorStats] = useState<{ checkedIn: number; total: number } | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    fetchEvent()
    fetchStripeStatus()
    fetchDoorStats()
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

  async function fetchDoorStats() {
    try {
      const res = await fetch(`/api/events/${eventId}/analytics`)
      if (res.ok) {
        const data = await res.json()
        setDoorStats({
          checkedIn: data.summary.checkedInCount,
          total: data.summary.totalTicketsSold,
        })
      }
    } catch (error) {
      console.error("Failed to fetch door stats:", error)
    }
  }

  async function updateEvent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEditLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      title: formData.get("title"),
      description: formData.get("description") || null,
      venueName: formData.get("venueName"),
      venueAddress: formData.get("venueAddress"),
      city: formData.get("city"),
      state: formData.get("state") || null,
      startsAt: formData.get("startsAt"),
      endsAt: formData.get("endsAt") || null,
    }

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        toast.success("Event updated")
        setShowEditDialog(false)
        fetchEvent()
      } else {
        toast.error("Failed to update event")
      }
    } catch {
      toast.error("Failed to update event")
    } finally {
      setEditLoading(false)
    }
  }

  async function deleteEvent() {
    setDeleteLoading(true)

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        toast.success("Event deleted")
        router.push("/dashboard/events")
      } else {
        const data = await res.json()
        toast.error(data.message || "Failed to delete event")
      }
    } catch {
      toast.error("Failed to delete event")
    } finally {
      setDeleteLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  async function unpublishEvent() {
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: false, status: "DRAFT" }),
      })

      if (res.ok) {
        toast.success("Event unpublished")
        fetchEvent()
      } else {
        toast.error("Failed to unpublish event")
      }
    } catch {
      toast.error("Failed to unpublish event")
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
        toast.success("Party published!")
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
    toast.success("Party URL copied!")
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
        <p className="text-muted-foreground">Party not found</p>
      </div>
    )
  }

  const eventUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/e/${event.slug}`
  const totalCapacity = event.ticketTiers.reduce((sum, t) => sum + t.quantity, 0)
  const totalSold = event.ticketTiers.reduce((sum, t) => sum + t.quantitySold, 0)
  const totalRevenue = event.ticketTiers.reduce((sum, t) => sum + (t.quantitySold * t.price), 0)

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Compact Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between animate-fade-in-up">
        {/* Left: Back + Event Info */}
        <div className="flex items-start gap-4">
          {/* Flyer Thumbnail */}
          <div
            className="relative w-16 h-20 sm:w-20 sm:h-24 rounded-lg overflow-hidden border border-white/10 flex-shrink-0 cursor-pointer group"
            onClick={() => {
              setTempFlyerUrl(event.flyerUrl)
              setShowFlyerDialog(true)
            }}
          >
            {event.flyerUrl ? (
              <>
                <Image src={event.flyerUrl} alt={event.title} fill className="object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Pencil className="w-4 h-4 text-white" />
                </div>
              </>
            ) : (
              <div className="w-full h-full bg-white/5 flex items-center justify-center group-hover:bg-pink/10 transition-colors">
                <ImageIcon className="w-5 h-5 text-white/30 group-hover:text-pink transition-colors" />
              </div>
            )}
          </div>

          {/* Event Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Button variant="ghost" size="sm" className="h-6 px-2 text-white/40 hover:text-white -ml-2" asChild>
                <Link href="/dashboard/events">
                  <ArrowLeft className="mr-1 h-3 w-3" />
                  <span className="text-xs">Back</span>
                </Link>
              </Button>
              <Badge
                variant={event.status === "PUBLISHED" ? "default" : "secondary"}
                className={cn(
                  "font-mono text-[10px] h-5",
                  event.status === "PUBLISHED" && "bg-green-500/20 text-green-400 border-green-500/30"
                )}
              >
                {event.status === "PUBLISHED" ? <Eye className="mr-1 h-2.5 w-2.5" /> : <EyeOff className="mr-1 h-2.5 w-2.5" />}
                {event.status}
              </Badge>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-white truncate">
              {event.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/50 mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-pink" />
                {new Date(event.startsAt).toLocaleDateString('en-US', {
                  weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                })}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-pink" />
                {event.venueName}, {event.city}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {event.isPublished ? (
            <>
              <Button variant="outline" size="sm" className="h-8 border-white/10 text-white/70 hover:bg-white/5" asChild>
                <Link href={eventUrl} target="_blank">
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  View
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="h-8 border-white/10 text-white/70 hover:bg-white/5" onClick={shareEvent}>
                <Share2 className="mr-1.5 h-3.5 w-3.5" />
                Share
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              className="h-8 bg-pink hover:bg-pink/90 text-white font-bold"
              onClick={() => setShowPublishDialog(true)}
              disabled={publishing || event.ticketTiers.length === 0}
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Publish
            </Button>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-fade-in-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-pink/20 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono text-white/40 uppercase tracking-wider">Tickets</p>
              <p className="text-2xl font-bold font-mono mt-1">
                <span className="text-pink">{totalSold}</span>
                <span className="text-sm font-normal text-white/30">/{totalCapacity}</span>
              </p>
            </div>
            <Ticket className="h-5 w-5 text-pink/50" />
          </div>
          {totalCapacity > 0 && (
            <div className="mt-3 w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-pink" style={{ width: `${(totalSold / totalCapacity) * 100}%` }} />
            </div>
          )}
        </div>

        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-green-500/20 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono text-white/40 uppercase tracking-wider">Revenue</p>
              <p className="text-2xl font-bold font-mono text-green-400 mt-1">{formatCents(totalRevenue)}</p>
            </div>
            <DollarSign className="h-5 w-5 text-green-500/50" />
          </div>
        </div>

        <div
          className={cn(
            "p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-cyan-500/20 transition-colors cursor-pointer",
            copied && "border-green-500/30"
          )}
          onClick={copyEventUrl}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono text-white/40 uppercase tracking-wider">{copied ? "Copied!" : "URL"}</p>
              <p className="text-sm font-mono truncate max-w-[100px] text-cyan-400 mt-1">/e/{event.slug}</p>
            </div>
            {copied ? (
              <Check className="h-5 w-5 text-green-400" />
            ) : (
              <Copy className="h-5 w-5 text-cyan-500/50" />
            )}
          </div>
        </div>

        <Link
          href={`/dashboard/events/${eventId}/analytics`}
          className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-purple-500/20 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono text-white/40 uppercase tracking-wider">Insights</p>
              <p className="text-sm font-medium text-purple-400 mt-1">Analytics →</p>
            </div>
            <BarChart3 className="h-5 w-5 text-purple-500/50" />
          </div>
        </Link>
      </div>

      {/* Getting Started Checklist - Only for draft events */}
      {!event.isPublished && (
        <Card className="border-pink/20 bg-pink/[0.02] animate-fade-in-up" style={{ animationDelay: '0.15s', opacity: 0 }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-pink" />
                <span className="font-bold font-mono text-sm">Launch Checklist</span>
              </div>
              <Badge variant="outline" className="font-mono text-[10px] border-pink/30 text-pink">
                {[event.flyerUrl, event.ticketTiers.length > 0, event.description].filter(Boolean).length}/3
              </Badge>
            </div>
            <div className="grid sm:grid-cols-3 gap-2">
              <div
                className={cn(
                  "flex items-center gap-2 p-2.5 rounded-lg transition-all cursor-pointer",
                  event.flyerUrl ? "bg-green-500/10 border border-green-500/20" : "bg-white/[0.02] border border-white/[0.06] hover:border-pink/30"
                )}
                onClick={() => !event.flyerUrl && setShowFlyerDialog(true)}
              >
                {event.flyerUrl ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <Circle className="h-4 w-4 text-white/30" />}
                <span className={cn("text-sm", event.flyerUrl && "text-green-400")}>Upload flyer</span>
              </div>
              <div
                className={cn(
                  "flex items-center gap-2 p-2.5 rounded-lg transition-all cursor-pointer",
                  event.ticketTiers.length > 0 ? "bg-green-500/10 border border-green-500/20" : "bg-white/[0.02] border border-white/[0.06] hover:border-pink/30"
                )}
                onClick={() => event.ticketTiers.length === 0 && setShowTierDialog(true)}
              >
                {event.ticketTiers.length > 0 ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <Circle className="h-4 w-4 text-white/30" />}
                <span className={cn("text-sm", event.ticketTiers.length > 0 && "text-green-400")}>Add tickets</span>
              </div>
              <div
                className={cn(
                  "flex items-center gap-2 p-2.5 rounded-lg",
                  event.description ? "bg-green-500/10 border border-green-500/20" : "bg-white/[0.02] border border-white/[0.06]"
                )}
              >
                {event.description ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <Circle className="h-4 w-4 text-white/30" />}
                <span className={cn("text-sm", event.description ? "text-green-400" : "text-white/50")}>Description</span>
              </div>
            </div>
            {event.flyerUrl && event.ticketTiers.length > 0 && (
              <Button
                onClick={() => setShowPublishDialog(true)}
                className="w-full mt-3 bg-pink hover:bg-pink/90 text-white font-bold h-9"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Ready to Publish
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Live Event Banner */}
      {event.isPublished && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-green-500/[0.05] border border-green-500/20 animate-fade-in-up" style={{ animationDelay: '0.15s', opacity: 0 }}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            <span className="font-mono text-sm text-green-400">Live</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={copyEventUrl}>
              {copied ? <Check className="mr-1 h-3 w-3" /> : <Copy className="mr-1 h-3 w-3" />}
              {copied ? "Copied" : "Copy Link"}
            </Button>
            <Button size="sm" className="h-7 bg-pink hover:bg-pink/90 text-white text-xs" onClick={shareEvent}>
              <Share2 className="mr-1 h-3 w-3" />
              Share
            </Button>
          </div>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="h-9 bg-white/[0.02] border border-white/[0.06] p-0.5 rounded-lg">
          <TabsTrigger value="overview" className="h-8 px-4 text-xs font-mono data-[state=active]:bg-pink data-[state=active]:text-white rounded-md">
            Overview
          </TabsTrigger>
          <TabsTrigger value="tickets" className="h-8 px-4 text-xs font-mono data-[state=active]:bg-pink data-[state=active]:text-white rounded-md">
            Tickets
          </TabsTrigger>
          <TabsTrigger value="door" className="h-8 px-4 text-xs font-mono data-[state=active]:bg-pink data-[state=active]:text-white rounded-md">
            Door
          </TabsTrigger>
          <TabsTrigger value="settings" className="h-8 px-4 text-xs font-mono data-[state=active]:bg-pink data-[state=active]:text-white rounded-md">
            Settings
          </TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-4">
          {/* Ticket Tiers */}
          <Card className="border-white/[0.06] bg-white/[0.01]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="font-mono text-base">Ticket Tiers</CardTitle>
                <Button size="sm" className="h-7 bg-pink hover:bg-pink/90 text-white text-xs" onClick={() => setShowTierDialog(true)}>
                  <Plus className="mr-1 h-3 w-3" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {event.ticketTiers.length === 0 ? (
                <div className="text-center py-8 text-white/40">
                  <Ticket className="h-8 w-8 mx-auto mb-2 text-pink/50" />
                  <p className="text-sm">No ticket tiers yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {event.ticketTiers.map((tier) => {
                    const percentage = Math.round((tier.quantitySold / tier.quantity) * 100)
                    return (
                      <div
                        key={tier.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-0.5 h-8 rounded-full bg-pink" />
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{tier.name}</p>
                            <p className="text-xs text-white/40">
                              <span className="text-pink">{tier.quantitySold}</span>/{tier.quantity} • <span className="text-green-400">{formatCents(tier.price)}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="hidden sm:flex items-center gap-2">
                            <div className="w-16 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-pink" style={{ width: `${percentage}%` }} />
                            </div>
                            <span className="text-xs font-mono text-white/40 w-8">{percentage}%</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-3">
            <Link
              href={`/dashboard/events/${eventId}/check-in`}
              className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-cyan-500/30 transition-colors text-center group"
            >
              <QrCode className="h-6 w-6 mx-auto mb-2 text-cyan-400 group-hover:scale-110 transition-transform" />
              <p className="text-xs font-medium">Scanner</p>
            </Link>
            <Link
              href={`/dashboard/events/${eventId}/analytics`}
              className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-purple-500/30 transition-colors text-center group"
            >
              <BarChart3 className="h-6 w-6 mx-auto mb-2 text-purple-400 group-hover:scale-110 transition-transform" />
              <p className="text-xs font-medium">Analytics</p>
            </Link>
            <button
              onClick={copyEventUrl}
              className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-pink/30 transition-colors text-center group"
            >
              <Copy className="h-6 w-6 mx-auto mb-2 text-pink group-hover:scale-110 transition-transform" />
              <p className="text-xs font-medium">Copy Link</p>
            </button>
          </div>
        </TabsContent>

        {/* TICKETS TAB */}
        <TabsContent value="tickets" className="space-y-4">
          <Card className="border-white/[0.06] bg-white/[0.01]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-mono text-base">Ticket Tiers</CardTitle>
                  <CardDescription className="text-xs">Manage pricing and availability</CardDescription>
                </div>
                <Button size="sm" className="h-8 bg-pink hover:bg-pink/90 text-white" onClick={() => setShowTierDialog(true)}>
                  <Plus className="mr-1 h-3 w-3" />
                  Add Tier
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {event.ticketTiers.length === 0 ? (
                <div className="text-center py-12 text-white/40">
                  <Ticket className="h-10 w-10 mx-auto mb-3 text-pink/50" />
                  <p className="font-medium">No ticket tiers yet</p>
                  <p className="text-xs mt-1">Create your first tier to start selling</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {event.ticketTiers.map((tier) => {
                    const percentage = Math.round((tier.quantitySold / tier.quantity) * 100)
                    const almostSoldOut = percentage >= 80
                    return (
                      <div
                        key={tier.id}
                        className={cn(
                          "p-4 rounded-xl border transition-colors",
                          almostSoldOut ? "border-pink/30 bg-pink/[0.03]" : "border-white/[0.06] bg-white/[0.02]"
                        )}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-1 h-full min-h-[48px] rounded-full bg-gradient-to-b from-pink to-pink/20" />
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold">{tier.name}</p>
                                {almostSoldOut && (
                                  <Badge className="h-4 text-[10px] bg-pink/20 text-pink border-pink/30">HOT</Badge>
                                )}
                              </div>
                              {tier.description && (
                                <p className="text-xs text-white/50 mt-0.5">{tier.description}</p>
                              )}
                              <div className="flex items-center gap-4 mt-2">
                                <span className="text-xl font-bold font-mono text-green-400">{formatCents(tier.price)}</span>
                                <div>
                                  <p className="text-xs text-white/50">
                                    <span className="text-pink font-mono">{tier.quantitySold}</span> / {tier.quantity}
                                  </p>
                                  <div className="w-20 h-1 bg-white/[0.06] rounded-full overflow-hidden mt-1">
                                    <div className="h-full rounded-full bg-pink" style={{ width: `${percentage}%` }} />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-white/30 hover:text-red-400 hover:bg-red-500/10"
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
          {/* Hero Stats Panel */}
          <div className="relative overflow-hidden border border-white/[0.08] bg-black">
            {/* Accent stripe */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink via-pink/50 to-transparent" />

            <div className="p-6">
              {/* Check-in Progress */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 border border-pink/30 bg-pink/10 flex items-center justify-center">
                    <UserCheck className="h-5 w-5 text-pink" />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em]">Check-in Progress</p>
                    <p className="text-2xl font-bold font-mono tracking-tight">
                      <span className="text-pink">{doorStats?.checkedIn ?? 0}</span>
                      <span className="text-white/20 mx-1">/</span>
                      <span className="text-white/60">{doorStats?.total ?? totalSold}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold font-mono text-pink">
                    {doorStats?.total ? Math.round((doorStats.checkedIn / doorStats.total) * 100) : 0}%
                  </p>
                  <p className="text-[10px] font-mono text-white/30 uppercase tracking-wider">Checked In</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-2 bg-white/[0.06] overflow-hidden mb-6">
                <div
                  className="h-full bg-gradient-to-r from-pink to-pink/60 transition-all duration-500"
                  style={{ width: `${doorStats?.total ? (doorStats.checkedIn / doorStats.total) * 100 : 0}%` }}
                />
              </div>

              {/* Action Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Scanner Button */}
                <Link
                  href={`/dashboard/events/${eventId}/check-in`}
                  className="group relative overflow-hidden border border-cyan-500/30 bg-cyan-500/[0.05] hover:bg-cyan-500/10 hover:border-cyan-400/50 transition-all"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <ScanLine className="h-6 w-6 text-cyan-400" />
                      <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    </div>
                    <p className="font-bold font-mono text-cyan-400 uppercase tracking-wider text-sm">Open Scanner</p>
                    <p className="text-[10px] text-white/40 mt-1 font-mono">Scan tickets at door</p>
                  </div>
                </Link>

                {/* Test Ticket Button */}
                <Link
                  href={`/e/${event.slug}/test-ticket`}
                  target="_blank"
                  className="group relative overflow-hidden border border-orange-500/30 bg-orange-500/[0.05] hover:bg-orange-500/10 hover:border-orange-400/50 transition-all"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <Zap className="h-6 w-6 text-orange-400" />
                      <span className="text-[9px] font-mono text-orange-400/80 uppercase tracking-wider px-1.5 py-0.5 border border-orange-400/30">Training</span>
                    </div>
                    <p className="font-bold font-mono text-orange-400 uppercase tracking-wider text-sm">Test Ticket</p>
                    <p className="text-[10px] text-white/40 mt-1 font-mono">Staff training mode</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Bottom Stats Bar */}
            <div className="border-t border-white/[0.06] bg-white/[0.02]">
              <div className="grid grid-cols-3 divide-x divide-white/[0.06]">
                <div className="p-4 text-center">
                  <p className="text-lg font-bold font-mono text-white">{totalSold}</p>
                  <p className="text-[9px] font-mono text-white/30 uppercase tracking-wider">Total Tickets</p>
                </div>
                <div className="p-4 text-center">
                  <p className="text-lg font-bold font-mono text-green-400">{doorStats?.checkedIn ?? 0}</p>
                  <p className="text-[9px] font-mono text-white/30 uppercase tracking-wider">Checked In</p>
                </div>
                <div className="p-4 text-center">
                  <p className="text-lg font-bold font-mono text-white/60">{(doorStats?.total ?? totalSold) - (doorStats?.checkedIn ?? 0)}</p>
                  <p className="text-[9px] font-mono text-white/30 uppercase tracking-wider">Remaining</p>
                </div>
              </div>
            </div>
          </div>

          {/* Management Sections */}
          <div className="space-y-4">
            <GuestlistManagement eventId={eventId} />
            <ScannerManagement eventId={eventId} />
            <ScanActivityLog eventId={eventId} />
            <ShiftHistory eventId={eventId} />
          </div>
        </TabsContent>

        {/* SETTINGS TAB */}
        <TabsContent value="settings" className="space-y-6">
          {/* Event URL & Visibility */}
          <div className="relative overflow-hidden border border-white/[0.08] bg-black">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-cyan-500/50 to-transparent" />
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 border border-cyan-500/30 bg-cyan-500/10 flex items-center justify-center">
                    {event.isPublished ? <Globe className="h-5 w-5 text-cyan-400" /> : <Lock className="h-5 w-5 text-white/40" />}
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em]">Event Status</p>
                    <p className="font-bold font-mono">
                      {event.isPublished ? (
                        <span className="text-cyan-400">PUBLISHED</span>
                      ) : (
                        <span className="text-white/50">DRAFT</span>
                      )}
                    </p>
                  </div>
                </div>
                {event.isPublished ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={unpublishEvent}
                    className="border-white/20 hover:border-orange-500/50 hover:text-orange-400 font-mono text-xs"
                  >
                    <EyeOff className="mr-1.5 h-3 w-3" />
                    Unpublish
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => setShowPublishDialog(true)}
                    disabled={publishing || event.ticketTiers.length === 0}
                    className="bg-pink hover:bg-pink/90 text-white font-mono text-xs"
                  >
                    <Sparkles className="mr-1.5 h-3 w-3" />
                    Publish
                  </Button>
                )}
              </div>

              {/* Event URL */}
              <div className="p-4 bg-white/[0.02] border border-white/[0.06]">
                <p className="text-[10px] font-mono text-white/40 uppercase tracking-wider mb-2">Event URL</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm font-mono text-cyan-400 truncate">
                    {typeof window !== 'undefined' ? window.location.origin : ''}/e/{event.slug}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyEventUrl}
                    className="h-8 px-3 border border-white/10 hover:border-cyan-500/30"
                  >
                    {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="h-8 px-3 border border-white/10 hover:border-cyan-500/30"
                  >
                    <Link href={`/e/${event.slug}`} target="_blank">
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Event Details - Editable */}
          <div className="relative overflow-hidden border border-white/[0.08] bg-black">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink via-pink/50 to-transparent" />
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 border border-pink/30 bg-pink/10 flex items-center justify-center">
                    <Settings className="h-5 w-5 text-pink" />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em]">Party Details</p>
                    <p className="font-bold font-mono text-white">{event.title}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEditDialog(true)}
                  className="border-white/20 hover:border-pink/50 hover:text-pink font-mono text-xs"
                >
                  <Pencil className="mr-1.5 h-3 w-3" />
                  Edit
                </Button>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="p-4 bg-white/[0.02] border border-white/[0.06]">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-3 w-3 text-pink" />
                    <p className="text-[10px] font-mono text-white/40 uppercase tracking-wider">Venue</p>
                  </div>
                  <p className="font-medium text-sm">{event.venueName}</p>
                  <p className="text-xs text-white/40 mt-0.5">{event.venueAddress}</p>
                  <p className="text-xs text-white/30 mt-0.5">{event.city}{event.state ? `, ${event.state}` : ''}</p>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/[0.06]">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-3 w-3 text-green-400" />
                    <p className="text-[10px] font-mono text-white/40 uppercase tracking-wider">Date & Time</p>
                  </div>
                  <p className="font-medium text-sm">
                    {new Date(event.startsAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-white/40 mt-0.5">
                    {new Date(event.startsAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    {event.endsAt && ` - ${new Date(event.endsAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
                  </p>
                </div>
              </div>

              {event.description && (
                <div className="mt-3 p-4 bg-white/[0.02] border border-white/[0.06]">
                  <p className="text-[10px] font-mono text-white/40 uppercase tracking-wider mb-2">Description</p>
                  <p className="text-sm text-white/70 whitespace-pre-wrap">{event.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Danger Zone */}
          {event.status === "DRAFT" && (
            <div className="relative overflow-hidden border border-red-500/20 bg-red-500/[0.03]">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-red-500/50 to-transparent" />
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 border border-red-500/30 bg-red-500/10 flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-mono text-red-400/60 uppercase tracking-[0.2em]">Danger Zone</p>
                      <p className="text-sm text-white/50">Permanently delete this event</p>
                    </div>
                  </div>
                  {showDeleteConfirm ? (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="font-mono text-xs"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={deleteEvent}
                        disabled={deleteLoading}
                        className="bg-red-500 hover:bg-red-600 text-white font-mono text-xs"
                      >
                        {deleteLoading ? "Deleting..." : "Confirm Delete"}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 font-mono text-xs"
                    >
                      <Trash2 className="mr-1.5 h-3 w-3" />
                      Delete Event
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* DIALOGS */}
      {/* Flyer Dialog */}
      <Dialog open={showFlyerDialog} onOpenChange={setShowFlyerDialog}>
        <DialogContent className="border-white/[0.06] bg-black">
          <DialogHeader>
            <DialogTitle className="font-mono">Update Flyer</DialogTitle>
            <DialogDescription className="text-xs">Upload a new flyer image</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <FlyerUpload value={tempFlyerUrl} onChange={setTempFlyerUrl} disabled={flyerLoading} />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowFlyerDialog(false)} disabled={flyerLoading} className="border-white/10">
                Cancel
              </Button>
              <Button onClick={updateFlyer} disabled={flyerLoading} className="bg-pink hover:bg-pink/90 text-white">
                {flyerLoading ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tier Dialog */}
      <Dialog open={showTierDialog} onOpenChange={setShowTierDialog}>
        <DialogContent className="border-white/[0.06] bg-black">
          <DialogHeader>
            <DialogTitle className="font-mono flex items-center gap-2">
              <Ticket className="h-4 w-4 text-pink" />
              Add Ticket Tier
            </DialogTitle>
            <DialogDescription className="text-xs">Create a new ticket type</DialogDescription>
          </DialogHeader>
          <form onSubmit={createTier} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs">Tier Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="General Admission"
                required
                className="h-9 bg-white/[0.02] border-white/[0.06]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs">Description</Label>
              <Input
                id="description"
                name="description"
                placeholder="Access to main floor"
                className="h-9 bg-white/[0.02] border-white/[0.06]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="price" className="text-xs">Price ($)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="25.00"
                  required
                  className="h-9 bg-white/[0.02] border-white/[0.06] font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="quantity" className="text-xs">Quantity</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  placeholder="100"
                  required
                  className="h-9 bg-white/[0.02] border-white/[0.06] font-mono"
                />
              </div>
            </div>
            <Button type="submit" className="w-full bg-pink hover:bg-pink/90 text-white" disabled={tierLoading}>
              {tierLoading ? "Creating..." : "Create Tier"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Publish Confirmation Dialog */}
      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent className="border-white/[0.06] bg-black">
          <DialogHeader>
            <DialogTitle className="font-mono flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-pink" />
              Publish Event
            </DialogTitle>
            <DialogDescription className="text-xs">
              This will make your event visible to everyone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {stripeEnabled === false && hasPaidTiers && (
              <div className="flex gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium text-yellow-500 text-sm">Stripe not configured</p>
                  <p className="text-xs text-white/50">
                    Paid tiers will be hidden until you set up Stripe.
                  </p>
                  <Button variant="link" className="h-auto p-0 text-xs text-yellow-500" asChild>
                    <Link href="/dashboard/organizer">Configure Stripe →</Link>
                  </Button>
                </div>
              </div>
            )}
            <p className="text-sm text-white/50">Are you sure you want to publish?</p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowPublishDialog(false)} disabled={publishing} className="border-white/10">
              Cancel
            </Button>
            <Button onClick={publishEvent} disabled={publishing} className="bg-pink hover:bg-pink/90 text-white">
              <Sparkles className="mr-2 h-4 w-4" />
              {publishing ? "Publishing..." : "Publish"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="border-white/[0.06] bg-black max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-mono flex items-center gap-2">
              <Pencil className="h-4 w-4 text-pink" />
              Edit Event
            </DialogTitle>
            <DialogDescription className="text-xs">
              Update your event details
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={updateEvent} className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label htmlFor="edit-title" className="text-xs font-mono text-white/50">Title</Label>
                <Input
                  id="edit-title"
                  name="title"
                  defaultValue={event?.title}
                  required
                  className="mt-1 bg-white/[0.02] border-white/10 focus:border-pink font-mono"
                />
              </div>
              <div>
                <Label htmlFor="edit-description" className="text-xs font-mono text-white/50">Description</Label>
                <textarea
                  id="edit-description"
                  name="description"
                  defaultValue={event?.description || ''}
                  rows={3}
                  className="mt-1 w-full px-3 py-2 bg-white/[0.02] border border-white/10 focus:border-pink focus:outline-none font-mono text-sm resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit-venueName" className="text-xs font-mono text-white/50">Venue Name</Label>
                  <Input
                    id="edit-venueName"
                    name="venueName"
                    defaultValue={event?.venueName}
                    required
                    className="mt-1 bg-white/[0.02] border-white/10 focus:border-pink font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-venueAddress" className="text-xs font-mono text-white/50">Address</Label>
                  <Input
                    id="edit-venueAddress"
                    name="venueAddress"
                    defaultValue={event?.venueAddress}
                    required
                    className="mt-1 bg-white/[0.02] border-white/10 focus:border-pink font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit-city" className="text-xs font-mono text-white/50">City</Label>
                  <Input
                    id="edit-city"
                    name="city"
                    defaultValue={event?.city}
                    required
                    className="mt-1 bg-white/[0.02] border-white/10 focus:border-pink font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-state" className="text-xs font-mono text-white/50">State</Label>
                  <Input
                    id="edit-state"
                    name="state"
                    defaultValue={event?.state || ''}
                    className="mt-1 bg-white/[0.02] border-white/10 focus:border-pink font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit-startsAt" className="text-xs font-mono text-white/50">Start Date & Time</Label>
                  <Input
                    id="edit-startsAt"
                    name="startsAt"
                    type="datetime-local"
                    defaultValue={event?.startsAt ? new Date(event.startsAt).toISOString().slice(0, 16) : ''}
                    required
                    className="mt-1 bg-white/[0.02] border-white/10 focus:border-pink font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-endsAt" className="text-xs font-mono text-white/50">End Date & Time</Label>
                  <Input
                    id="edit-endsAt"
                    name="endsAt"
                    type="datetime-local"
                    defaultValue={event?.endsAt ? new Date(event.endsAt).toISOString().slice(0, 16) : ''}
                    className="mt-1 bg-white/[0.02] border-white/10 focus:border-pink font-mono"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)} disabled={editLoading} className="border-white/10">
                Cancel
              </Button>
              <Button type="submit" disabled={editLoading} className="bg-pink hover:bg-pink/90 text-white">
                {editLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
