"use client";

import { useEffect, useState, use, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  ExternalLink,
  ImageIcon,
  Pencil,
  BarChart3,
  Ticket,
  DollarSign,
  Calendar,
  MapPin,
  Copy,
  Eye,
  EyeOff,
  AlertTriangle,
  Sparkles,
  Check,
  Share2,
  Zap,
  UserCheck,
  Clock,
  Timer,
  Map,
} from "lucide-react";
import { formatCents } from "@/lib/stripe";
import { FlyerUpload } from "@/components/FlyerUpload";
import { ScannerManagement } from "@/components/dashboard/ScannerManagement";
import { ScanActivityLog } from "@/components/dashboard/ScanActivityLog";
import { ShiftHistory } from "@/components/dashboard/ShiftHistory";
import { GuestlistManagement } from "@/components/guestlist-management";
import { EventDesignTab } from "@/components/dashboard/EventDesignTab"
import { EventDetailsTab } from "@/components/dashboard/EventDetailsTab"
import { EventLocationSettings } from "@/components/dashboard/EventLocationSettings";
import { MapPreview } from "@/components/dashboard/MapPreview";
import { EventRsvpSettings } from "@/components/dashboard/EventRsvpSettings";
import { ScannerSoundSelector } from "@/components/dashboard/ScannerSoundSelector";
import { useAftie } from "@/components/aftie/AftieProvider";

interface TicketTier {
  id: string;
  name: string;
  description: string | null;
  price: number;
  quantity: number;
  quantitySold: number;
}

interface Event {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  startsAt: string;
  endsAt: string | null;
  venueName: string;
  venueAddress: string;
  city: string;
  state: string | null;
  flyerUrl: string | null;
  status: string;
  isPublished: boolean;
  ticketTiers: TicketTier[];
  // Design settings
  pageTheme: string;
  accentColor: string | null;
  typography: string;
  scannerSound: string;
  // Location settings
  showLocationOnPage: boolean;
  showLocationOnTicket: boolean;
  showMapOnPage: boolean;
  showMapOnTicket: boolean;
  broadcastOnStart: boolean;
  locationPrecision: string;
  isAddressHidden: boolean;
  // RSVP settings
  isRsvpOnly: boolean;
  rsvpCapacity: number | null;
  rsvpAllowPlusOnes: boolean;
  rsvpMaxPlusOnes: number;
  rsvpCount: number;
  // Event info sections
  about: string | null;
  refundPolicy: string | null;
  faqs: Array<{question: string; answer: string}> | null;
  lineup: Array<{name: string; role: string; imageUrl: string; socialUrl: string; showtime?: string; showShowtime?: boolean}> | null;
  gallery: string[] | null;
  // Event expiration
  expiresAfter: string;
}

function EventDashboardContent({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as "overview" | "tickets" | "door" | "design" | "details" | "venue" | "settings" | null;
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTierDialog, setShowTierDialog] = useState(false);
  const [showFlyerDialog, setShowFlyerDialog] = useState(false);
  const [tierLoading, setTierLoading] = useState(false);
  const [flyerLoading, setFlyerLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [tempFlyerUrl, setTempFlyerUrl] = useState<string | null>(null);
  const [stripeEnabled, setStripeEnabled] = useState<boolean | null>(null);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [doorStats, setDoorStats] = useState<{
    checkedIn: number;
    total: number;
  } | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeSection, setActiveSection] = useState<"overview" | "tickets" | "door" | "design" | "details" | "venue" | "settings">(
    tabParam && ["overview", "tickets", "door", "design", "details", "venue", "settings"].includes(tabParam) ? tabParam : "overview"
  );
  const [expiresAfter, setExpiresAfter] = useState<string>("24h");
  const [expirationLoading, setExpirationLoading] = useState(false);
  const [eventTypeLoading, setEventTypeLoading] = useState(false);

  // Set Aftie page context
  const { setPageContext } = useAftie();

  // Sync tab state with URL changes
  useEffect(() => {
    if (tabParam && ["overview", "tickets", "door", "design", "details", "venue", "settings"].includes(tabParam)) {
      setActiveSection(tabParam);
    }
  }, [tabParam]);

  // Function to change tabs and update URL
  function changeTab(tab: "overview" | "tickets" | "door" | "design" | "details" | "venue" | "settings") {
    setActiveSection(tab);
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "overview") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    router.push(`/d/events/${eventId}${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false });
  }

  useEffect(() => {
    fetchEvent();
    fetchStripeStatus();
    fetchDoorStats();
  }, [eventId]);

  // Sync expiresAfter state with event data
  useEffect(() => {
    if (event?.expiresAfter) {
      setExpiresAfter(event.expiresAfter);
    }
  }, [event?.expiresAfter]);

  // Set Aftie page context when viewing event (with rich context for content generation)
  useEffect(() => {
    if (event) {
      // Map active section to editing field for Aftie context
      const editingFieldMap: Record<string, "description" | "title" | "venue" | "lineup" | "tickets" | "design" | "location" | "media" | null> = {
        "overview": null,
        "tickets": "tickets",
        "door": null,
        "design": "design",
        "details": "description", // Details tab is where about/description is edited
        "venue": "location",
        "settings": null,
      };

      setPageContext({
        page: "event-details",
        eventId: event.id,
        eventTitle: event.title,
        editingField: editingFieldMap[activeSection] || null,
        eventDetails: {
          venueName: event.venueName,
          city: event.city,
          startsAt: new Date(event.startsAt).toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          }),
          lineup: event.lineup?.map(a => ({ name: a.name, role: a.role })) || [],
        },
      });
    }
    return () => {
      setPageContext({ page: "dashboard" });
    };
  }, [event, activeSection, setPageContext]);

  async function fetchStripeStatus() {
    try {
      const res = await fetch("/api/user/stripe-status");
      if (res.ok) {
        const data = await res.json();
        setStripeEnabled(data.stripeChargesEnabled);
      }
    } catch (error) {
      console.error("Failed to fetch Stripe status:", error);
    }
  }

  async function fetchDoorStats() {
    try {
      const res = await fetch(`/api/events/${eventId}/analytics`);
      if (res.ok) {
        const data = await res.json();
        setDoorStats({
          checkedIn: data.summary.checkedInCount,
          total: data.summary.totalTicketsSold,
        });
      }
    } catch (error) {
      console.error("Failed to fetch door stats:", error);
    }
  }

  async function updateEvent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEditLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title"),
      description: formData.get("description") || null,
      venueName: formData.get("venueName"),
      venueAddress: formData.get("venueAddress"),
      city: formData.get("city"),
      state: formData.get("state") || null,
      startsAt: formData.get("startsAt"),
      endsAt: formData.get("endsAt") || null,
    };

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success("Event updated");
        setShowEditDialog(false);
        fetchEvent();
      } else {
        toast.error("Failed to update event");
      }
    } catch {
      toast.error("Failed to update event");
    } finally {
      setEditLoading(false);
    }
  }

  async function deleteEvent() {
    setDeleteLoading(true);

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Event deleted");
        router.push("/d/events");
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to delete event");
      }
    } catch {
      toast.error("Failed to delete event");
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  }

  async function unpublishEvent() {
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: false, status: "DRAFT" }),
      });

      if (res.ok) {
        toast.success("Event unpublished");
        fetchEvent();
      } else {
        toast.error("Failed to unpublish event");
      }
    } catch {
      toast.error("Failed to unpublish event");
    }
  }

  async function fetchEvent() {
    try {
      const res = await fetch(`/api/events/${eventId}`);
      if (res.ok) {
        const data = await res.json();
        setEvent(data);
      }
    } catch (error) {
      console.error("Failed to fetch event:", error);
    } finally {
      setLoading(false);
    }
  }

  async function createTier(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTierLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      description: formData.get("description"),
      price: 0, // Free during beta
      quantity: parseInt(formData.get("quantity") as string),
    };

    try {
      const res = await fetch(`/api/events/${eventId}/ticket-tiers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success("Ticket tier created");
        setShowTierDialog(false);
        fetchEvent();
      } else {
        toast.error("Failed to create tier");
      }
    } catch {
      toast.error("Failed to create tier");
    } finally {
      setTierLoading(false);
    }
  }

  async function deleteTier(tierId: string) {
    if (!confirm("Delete this ticket tier?")) return;

    try {
      const res = await fetch(
        `/api/events/${eventId}/ticket-tiers?tierId=${tierId}`,
        {
          method: "DELETE",
        },
      );

      if (res.ok) {
        toast.success("Tier deleted");
        fetchEvent();
      } else {
        toast.error("Failed to delete tier");
      }
    } catch {
      toast.error("Failed to delete tier");
    }
  }

  async function updateFlyer() {
    setFlyerLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flyerUrl: tempFlyerUrl }),
      });

      if (res.ok) {
        toast.success("Flyer updated");
        setShowFlyerDialog(false);
        fetchEvent();
      } else {
        toast.error("Failed to update flyer");
      }
    } catch {
      toast.error("Failed to update flyer");
    } finally {
      setFlyerLoading(false);
    }
  }

  async function publishEvent() {
    setPublishing(true);
    setShowPublishDialog(false);

    try {
      const res = await fetch(`/api/events/${eventId}/publish`, {
        method: "POST",
      });
      if (res.ok) {
        toast.success("Event published!");
        fetchEvent();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to publish");
      }
    } catch {
      toast.error("Failed to publish");
    } finally {
      setPublishing(false);
    }
  }

  const hasPaidTiers = event?.ticketTiers.some((t) => t.price > 0) || false;

  async function updateExpiration(value: string) {
    setExpiresAfter(value);
    setExpirationLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expiresAfter: value }),
      });
      if (res.ok) {
        toast.success("Expiration updated");
      } else {
        toast.error("Failed to update expiration");
        fetchEvent(); // Revert on failure
      }
    } catch {
      toast.error("Failed to update expiration");
      fetchEvent(); // Revert on failure
    } finally {
      setExpirationLoading(false);
    }
  }

  async function toggleEventType(isRsvp: boolean) {
    if (!event) return;

    // Prevent switching from ticketed to RSVP if tickets have been sold
    if (isRsvp && totalSold > 0) {
      toast.error("Cannot switch to RSVP after tickets have been sold");
      return;
    }

    setEventTypeLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRsvpOnly: isRsvp }),
      });
      if (res.ok) {
        toast.success(isRsvp ? "Switched to RSVP event" : "Switched to ticketed event");
        fetchEvent();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to update event type");
      }
    } catch {
      toast.error("Failed to update event type");
    } finally {
      setEventTypeLoading(false);
    }
  }

  function copyEventUrl() {
    const url = `${window.location.origin}/e/${event?.slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("URL copied!");
    setTimeout(() => setCopied(false), 2000);
  }

  function shareEvent() {
    const url = `${window.location.origin}/e/${event?.slug}`;
    if (navigator.share) {
      navigator.share({
        title: event?.title,
        text: `Check out ${event?.title}`,
        url,
      });
    } else {
      copyEventUrl();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-6 h-6 border-2 border-[#ff1493]/30 border-t-[#ff1493] animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="text-white/40 font-mono text-sm">Event not found</p>
      </div>
    );
  }

  const totalCapacity = event.ticketTiers.reduce((sum, t) => sum + t.quantity, 0);
  const totalSold = event.ticketTiers.reduce((sum, t) => sum + t.quantitySold, 0);
  const totalRevenue = event.ticketTiers.reduce((sum, t) => sum + t.quantitySold * t.price, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Flyer Thumbnail */}
          <button
            onClick={() => {
              setTempFlyerUrl(event.flyerUrl);
              setShowFlyerDialog(true);
            }}
            className="relative w-14 h-[70px] sm:w-16 sm:h-20 border border-white/10 bg-white/5 flex-shrink-0 overflow-hidden group hover:border-[#ff1493]/50 transition-colors"
          >
            {event.flyerUrl ? (
              <>
                <Image
                  src={event.flyerUrl}
                  alt={event.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Pencil className="w-4 h-4 text-white" />
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-white/20 group-hover:text-[#ff1493] transition-colors" />
              </div>
            )}
          </button>

          {/* Event Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-lg sm:text-2xl font-mono font-bold tracking-tight truncate">{event.title}</h1>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 flex-shrink-0 ${
                  event.isPublished
                    ? "bg-[#ff1493]/10 text-[#ff1493]"
                    : "bg-yellow-500/10 text-yellow-500"
                }`}
              >
                {event.isPublished ? "LIVE" : "DRAFT"}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-4 mt-1 text-xs text-white/40 font-mono">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">
                  {new Date(event.startsAt).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{event.venueName}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {event.isPublished ? (
            <>
              <Link
                href={`/e/${event.slug}`}
                target="_blank"
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 border border-white/10 text-xs font-mono text-white/60 hover:border-white/20 hover:text-white transition-all"
              >
                <ExternalLink className="w-3 h-3" />
                VIEW
              </Link>
              <button
                onClick={shareEvent}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 border border-white/10 text-xs font-mono text-white/60 hover:border-white/20 hover:text-white transition-all"
              >
                <Share2 className="w-3 h-3" />
                SHARE
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowPublishDialog(true)}
              disabled={publishing || (!event.isRsvpOnly && event.ticketTiers.length === 0)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-[#ff1493] text-black text-xs font-mono font-bold tracking-wider hover:bg-[#ff1493]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-3.5 h-3.5" />
              PUBLISH
            </button>
          )}
        </div>
      </div>

      {/* Section Nav */}
      <div className="max-w-[100vw] -mx-4 sm:mx-0">
        <div className="flex items-center gap-1 border-b border-white/10 overflow-x-auto overflow-y-hidden scrollbar-hide px-4 sm:px-0"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
        {[
          { id: "overview" as const, label: "OVERVIEW" },
          ...(!event.isRsvpOnly ? [{ id: "tickets" as const, label: "TICKETS" }] : []),
          { id: "door" as const, label: "DOOR" },
          { id: "details" as const, label: "DETAILS" },
          { id: "design" as const, label: "DESIGN" },
          { id: "venue" as const, label: "VENUE" },
          { id: "settings" as const, label: "SETTINGS" },
        ].map((section) => (
          <button
            key={section.id}
            onClick={() => changeTab(section.id)}
            className={`px-3 sm:px-4 py-2.5 text-xs font-mono tracking-wider transition-colors border-b-2 -mb-[1px] whitespace-nowrap ${
              activeSection === section.id
                ? "text-[#ff1493] border-[#ff1493]"
                : "text-white/40 border-transparent hover:text-white/60"
            }`}
          >
            {section.label}
          </button>
        ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[calc(100vw-32px)] md:max-w-[calc(100vw-14rem-48px)]">
      {activeSection === "overview" && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {event.isRsvpOnly ? (
              <StatCard
                label="RSVPS"
                value={`${event.rsvpCount}${event.rsvpCapacity ? `/${event.rsvpCapacity}` : ''}`}
                icon={<UserCheck className="w-4 h-4" />}
                progress={event.rsvpCapacity ? (event.rsvpCount / event.rsvpCapacity) * 100 : 0}
                highlight
              />
            ) : (
              <StatCard
                label="TICKETS SOLD"
                value={`${totalSold}/${totalCapacity}`}
                icon={<Ticket className="w-4 h-4" />}
                progress={totalCapacity > 0 ? (totalSold / totalCapacity) * 100 : 0}
                highlight
              />
            )}
            {!event.isRsvpOnly && (
              <StatCard
                label="REVENUE"
                value={formatCents(totalRevenue)}
                icon={<DollarSign className="w-4 h-4" />}
              />
            )}
            <StatCard
              label="CHECKED IN"
              value={`${doorStats?.checkedIn ?? 0}/${doorStats?.total ?? totalSold}`}
              icon={<UserCheck className="w-4 h-4" />}
              progress={doorStats?.total ? (doorStats.checkedIn / doorStats.total) * 100 : 0}
            />
            <div
              onClick={copyEventUrl}
              className="border border-white/10 bg-white/[0.02] p-4 cursor-pointer hover:border-[#ff1493]/30 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-white/30">
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </span>
                <span className="text-[10px] font-mono text-white/30 tracking-widest">
                  {copied ? "COPIED" : "COPY URL"}
                </span>
              </div>
              <p className="text-sm font-mono text-[#ff1493] truncate">/e/{event.slug}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <Link
              href={`/d/events/${eventId}/analytics`}
              className="border border-white/10 p-3 sm:p-4 flex flex-col items-center gap-1.5 sm:gap-2 hover:border-purple-500/50 hover:bg-white/[0.02] transition-all group"
            >
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-white/30 group-hover:text-purple-400 transition-colors" />
              <span className="text-[9px] sm:text-[10px] font-mono tracking-widest text-white/50 group-hover:text-white transition-colors">
                ANALYTICS
              </span>
            </Link>
            <button
              onClick={copyEventUrl}
              className="border border-white/10 p-3 sm:p-4 flex flex-col items-center gap-1.5 sm:gap-2 hover:border-[#ff1493]/50 hover:bg-white/[0.02] transition-all group"
            >
              <Copy className="w-4 h-4 sm:w-5 sm:h-5 text-white/30 group-hover:text-[#ff1493] transition-colors" />
              <span className="text-[9px] sm:text-[10px] font-mono tracking-widest text-white/50 group-hover:text-white transition-colors">
                COPY LINK
              </span>
            </button>
          </div>

          {/* Event Status */}
          <div className="border border-white/10 bg-white/[0.02]">
            <div className="px-4 py-2 border-b border-white/10">
              <span className="text-[10px] font-mono text-white/40 tracking-widest">EVENT STATUS</span>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {event.isPublished ? (
                    <Eye className="w-5 h-5 text-[#ff1493]" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-white/40" />
                  )}
                  <div>
                    <p className="font-mono font-medium">
                      {event.isPublished ? "Published" : "Draft"}
                    </p>
                    <p className="text-xs text-white/40 font-mono">
                      {event.isPublished
                        ? "Event is visible to the public"
                        : "Event is not visible yet"}
                    </p>
                  </div>
                </div>
                {event.isPublished ? (
                  <button
                    onClick={unpublishEvent}
                    className="px-3 py-1.5 border border-white/20 text-xs font-mono text-white/60 hover:border-orange-500/50 hover:text-orange-400 transition-all"
                  >
                    UNPUBLISH
                  </button>
                ) : (
                  <button
                    onClick={() => setShowPublishDialog(true)}
                    disabled={publishing || (!event.isRsvpOnly && event.ticketTiers.length === 0)}
                    className="px-4 py-2 bg-[#ff1493] text-black text-xs font-mono font-bold tracking-wider hover:bg-[#ff1493]/90 transition-all disabled:opacity-50"
                  >
                    PUBLISH
                  </button>
                )}
              </div>

              <div className="mt-4 p-3 bg-white/5 border border-white/10 overflow-hidden">
                <p className="text-[10px] font-mono text-white/40 tracking-wider mb-1">EVENT URL</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs sm:text-sm font-mono text-[#ff1493] truncate min-w-0">
                    /e/{event.slug}
                  </code>
                  <button
                    onClick={copyEventUrl}
                    className="p-1.5 border border-white/10 hover:border-[#ff1493]/30 transition-all flex-shrink-0"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSection === "tickets" && (
        <div className="space-y-6">
          {/* Ticket Tiers */}
          <div className="border border-white/10">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <span className="text-xs font-mono text-white/40 tracking-widest">TICKET TIERS</span>
              <button
                onClick={() => setShowTierDialog(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#ff1493] text-black text-[10px] font-mono font-bold tracking-wider hover:bg-[#ff1493]/90 transition-all"
              >
                <Plus className="w-3 h-3" />
                ADD TIER
              </button>
            </div>

            {event.ticketTiers.length === 0 ? (
              <div className="p-12 text-center">
                <Ticket className="w-8 h-8 mx-auto text-white/10 mb-3" />
                <p className="text-white/40 font-mono text-sm">No ticket tiers yet</p>
                <button
                  onClick={() => setShowTierDialog(true)}
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 border border-white/20 text-xs font-mono hover:bg-white/5 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  CREATE FIRST TIER
                </button>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {event.ticketTiers.map((tier) => {
                  const percentage = tier.quantity > 0 ? Math.round((tier.quantitySold / tier.quantity) * 100) : 0;
                  return (
                    <div
                      key={tier.id}
                      className="flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <p className="font-mono font-medium">{tier.name}</p>
                          <span className="text-xs font-mono text-green-400">{formatCents(tier.price)}</span>
                        </div>
                        {tier.description && (
                          <p className="text-xs text-white/40 font-mono mt-0.5">{tier.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-mono">
                            <span className="text-[#ff1493]">{tier.quantitySold}</span>
                            <span className="text-white/30">/{tier.quantity}</span>
                          </p>
                          <div className="w-16 h-1 bg-white/5 mt-1">
                            <div
                              className="h-full bg-[#ff1493]"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => deleteTier(tier.id)}
                          disabled={tier.quantitySold > 0}
                          className="p-2 text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeSection === "door" && (
        <div className="space-y-6">
          {/* Door Stats */}
          <div className="border border-white/10 bg-white/[0.02]">
            <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between">
              <span className="text-[10px] font-mono text-white/40 tracking-widest">CHECK-IN STATUS</span>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-[#ff1493] rounded-full animate-pulse" />
                <span className="text-[10px] font-mono text-[#ff1493]">
                  {doorStats?.total ? Math.round((doorStats.checkedIn / doorStats.total) * 100) : 0}%
                </span>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-3xl font-mono font-bold">
                    <span className="text-[#ff1493]">{doorStats?.checkedIn ?? 0}</span>
                    <span className="text-white/20 mx-1">/</span>
                    <span className="text-white/60">{doorStats?.total ?? totalSold}</span>
                  </p>
                  <p className="text-xs font-mono text-white/40 mt-1">CHECKED IN</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-mono font-bold text-white/40">
                    {(doorStats?.total ?? totalSold) - (doorStats?.checkedIn ?? 0)}
                  </p>
                  <p className="text-xs font-mono text-white/40 mt-1">REMAINING</p>
                </div>
              </div>
              <div className="h-2 bg-white/5">
                <div
                  className="h-full bg-[#ff1493] transition-all"
                  style={{
                    width: `${doorStats?.total ? (doorStats.checkedIn / doorStats.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Management Components */}
          <GuestlistManagement eventId={eventId} />
          {!event.isRsvpOnly && (
            <>
              <ScannerManagement eventId={eventId} />
              <ScanActivityLog eventId={eventId} />
              <ShiftHistory eventId={eventId} />
            </>
          )}

          {/* Scanner Sound Selector */}
          <ScannerSoundSelector
            eventId={eventId}
            initialSound={event.scannerSound || "basic"}
          />

          {/* Test Ticket - Staff Training */}
          <Link
            href={`/d/events/${eventId}/test-ticket`}
            target="_blank"
            className="block border border-orange-500/30 bg-orange-500/5 p-4 hover:border-orange-500/50 hover:bg-orange-500/10 transition-all group"
          >
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-orange-400" />
              <span className="text-[9px] font-mono text-orange-400/80 tracking-wider px-1.5 py-0.5 border border-orange-400/30">
                TRAINING
              </span>
            </div>
            <p className="font-mono font-bold text-orange-400 text-sm tracking-wider">TEST TICKET</p>
            <p className="text-[10px] text-white/40 font-mono mt-1">Staff practice</p>
          </Link>
        </div>
      )}

      {activeSection === "design" && event && (
        <EventDesignTab
          eventId={eventId}
          initialTemplate={event.pageTheme}
          initialTypography={event.typography}
          initialAccentColor={event.accentColor || "#ff1493"}
          flyerUrl={event.flyerUrl}
        />
      )}

      {activeSection === "details" && event && (
        <EventDetailsTab
          eventId={eventId}
          initialAbout={event.about || ""}
          initialFaqs={event.faqs || []}
          initialLineup={event.lineup || []}
          initialGallery={event.gallery || []}
        />
      )}

      {activeSection === "venue" && (
        <div className="space-y-6">
          {/* Venue Details */}
          <div className="border border-white/10 bg-white/[0.02]">
            <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#ff1493]" />
                <span className="text-[10px] font-mono text-white/40 tracking-widest">VENUE DETAILS</span>
              </div>
              <button
                onClick={() => setShowEditDialog(true)}
                className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-mono text-white/40 hover:text-[#ff1493] transition-colors"
              >
                <Pencil className="w-3 h-3" />
                EDIT
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-mono text-white/40 tracking-wider mb-1">VENUE NAME</p>
                  <p className="font-mono text-sm">{event.venueName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono text-white/40 tracking-wider mb-1">ADDRESS</p>
                  <p className="font-mono text-sm">{event.venueAddress}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono text-white/40 tracking-wider mb-1">CITY</p>
                  <p className="font-mono text-sm">{event.city}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono text-white/40 tracking-wider mb-1">STATE</p>
                  <p className="font-mono text-sm">{event.state || "—"}</p>
                </div>
              </div>

              {/* Map Preview */}
              <MapPreview
                venueName={event.venueName}
                venueAddress={event.venueAddress}
                city={event.city}
                state={event.state}
                mapStyle="dark"
                mapZoom={15}
              />
            </div>
          </div>

          {/* Location Broadcasting */}
          <EventLocationSettings
            eventId={eventId}
            initialSettings={{
              showLocationOnPage: event.showLocationOnPage,
              showLocationOnTicket: event.showLocationOnTicket,
              showMapOnPage: event.showMapOnPage,
              showMapOnTicket: event.showMapOnTicket,
              broadcastOnStart: event.broadcastOnStart,
              locationPrecision: event.locationPrecision as "exact" | "area" | "city",
              isAddressHidden: event.isAddressHidden,
            }}
          />
        </div>
      )}

      {activeSection === "settings" && (
        <div className="space-y-6">
          {/* Event Type Toggle */}
          <div className="border border-white/10 bg-white/[0.02]">
            <div className="px-4 py-2 border-b border-white/10 flex items-center gap-2">
              <Ticket className="w-3.5 h-3.5 text-white/40" />
              <span className="text-[10px] font-mono text-white/40 tracking-widest">EVENT TYPE</span>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-xs text-white/40 font-mono">
                Choose how guests register for your event
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => toggleEventType(true)}
                  disabled={eventTypeLoading || (totalSold > 0 && !event.isRsvpOnly)}
                  className={`p-4 border transition-all text-left ${
                    event.isRsvpOnly
                      ? "border-green-500 bg-green-500/10"
                      : "border-white/10 hover:border-white/20"
                  } ${eventTypeLoading ? "opacity-50 cursor-wait" : ""} ${
                    totalSold > 0 && !event.isRsvpOnly ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <UserCheck className={`w-5 h-5 ${event.isRsvpOnly ? "text-green-400" : "text-white/40"}`} />
                    <span className={`font-mono font-bold text-sm ${event.isRsvpOnly ? "text-green-400" : "text-white/60"}`}>
                      RSVP EVENT
                    </span>
                  </div>
                  <p className="text-[10px] text-white/40 font-mono">
                    Free registration, guests reserve spots
                  </p>
                  {event.isRsvpOnly && (
                    <div className="mt-2">
                      <span className="text-[8px] font-mono text-green-400 px-1.5 py-0.5 border border-green-400/30">ACTIVE</span>
                    </div>
                  )}
                </button>
                <button
                  onClick={() => toggleEventType(false)}
                  disabled={eventTypeLoading || (event.ticketTiers.length === 0 && !event.isRsvpOnly)}
                  className={`p-4 border transition-all text-left ${
                    !event.isRsvpOnly
                      ? "border-[#ff1493] bg-[#ff1493]/10"
                      : "border-white/10 hover:border-white/20"
                  } ${eventTypeLoading ? "opacity-50 cursor-wait" : ""} ${
                    event.ticketTiers.length === 0 && event.isRsvpOnly ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Ticket className={`w-5 h-5 ${!event.isRsvpOnly ? "text-[#ff1493]" : "text-white/40"}`} />
                    <span className={`font-mono font-bold text-sm ${!event.isRsvpOnly ? "text-[#ff1493]" : "text-white/60"}`}>
                      TICKETED EVENT
                    </span>
                  </div>
                  <p className="text-[10px] text-white/40 font-mono">
                    Sell tickets with tiers and pricing
                  </p>
                  {!event.isRsvpOnly && (
                    <div className="mt-2">
                      <span className="text-[8px] font-mono text-[#ff1493] px-1.5 py-0.5 border border-[#ff1493]/30">ACTIVE</span>
                    </div>
                  )}
                </button>
              </div>
              {event.isRsvpOnly && event.ticketTiers.length === 0 && (
                <p className="text-[10px] text-white/30 font-mono">
                  To switch to ticketed, create ticket tiers in the TICKETS tab first
                </p>
              )}
              {!event.isRsvpOnly && totalSold > 0 && (
                <p className="text-[10px] text-yellow-400/60 font-mono">
                  Cannot switch to RSVP after tickets have been sold ({totalSold} sold)
                </p>
              )}
            </div>
          </div>

          {/* RSVP Settings (only for RSVP events) */}
          {event.isRsvpOnly && (
            <EventRsvpSettings
              eventId={eventId}
              initialSettings={{
                isRsvpOnly: event.isRsvpOnly,
                rsvpCapacity: event.rsvpCapacity,
                rsvpAllowPlusOnes: event.rsvpAllowPlusOnes,
                rsvpMaxPlusOnes: event.rsvpMaxPlusOnes,
              }}
            />
          )}

          {/* Event Expiration */}
          <div className="border border-white/10 bg-white/[0.02]">
            <div className="px-4 py-2 border-b border-white/10 flex items-center gap-2">
              <Timer className="w-3.5 h-3.5 text-white/40" />
              <span className="text-[10px] font-mono text-white/40 tracking-widest">EVENT EXPIRATION</span>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-xs text-white/40 font-mono">
                When should the event page stop being visible?
              </p>
              <Select value={expiresAfter} onValueChange={updateExpiration} disabled={expirationLoading}>
                <SelectTrigger className="h-10 bg-black border-white/10 font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black border-white/10">
                  <SelectItem value="on_end">When event ends</SelectItem>
                  <SelectItem value="12h">12 hours after end</SelectItem>
                  <SelectItem value="24h">24 hours after end</SelectItem>
                  <SelectItem value="48h">48 hours after end</SelectItem>
                  <SelectItem value="1w">1 week after end</SelectItem>
                  <SelectItem value="never">Never (manual only)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-white/30 font-mono">
                Event will be hidden from public discovery after this time
              </p>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="border border-red-500/20 bg-red-500/5">
            <div className="px-4 py-2 border-b border-red-500/20">
              <span className="text-[10px] font-mono text-red-400/60 tracking-widest">DANGER ZONE</span>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-mono text-sm">Delete Event</p>
                <p className="text-xs text-white/40">
                  {!event.isRsvpOnly && totalSold > 0
                    ? "Cannot delete - tickets have been sold"
                    : "Permanently delete this event"}
                </p>
              </div>
              {!event.isRsvpOnly && totalSold > 0 ? (
                <span className="text-xs font-mono text-white/30 px-3 py-1.5">
                  {totalSold} tickets sold
                </span>
              ) : showDeleteConfirm ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1.5 text-xs font-mono text-white/60 hover:text-white transition-colors"
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={deleteEvent}
                    disabled={deleteLoading}
                    className="px-3 py-1.5 bg-red-500 text-white text-xs font-mono font-bold hover:bg-red-600 transition-all"
                  >
                    {deleteLoading ? "DELETING..." : "CONFIRM"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-red-500/30 text-red-400 text-xs font-mono hover:bg-red-500/10 transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                  DELETE
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      </div>

      {/* DIALOGS */}
      {/* Flyer Dialog */}
      <Dialog open={showFlyerDialog} onOpenChange={setShowFlyerDialog}>
        <DialogContent className="border-white/10 bg-black">
          <DialogHeader>
            <DialogTitle className="font-mono">Update Flyer</DialogTitle>
            <DialogDescription className="text-xs text-white/40">
              Upload a new flyer image
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <FlyerUpload
              value={tempFlyerUrl}
              onChange={setTempFlyerUrl}
              disabled={flyerLoading}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowFlyerDialog(false)}
                disabled={flyerLoading}
                className="px-4 py-2 border border-white/10 text-sm font-mono hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={updateFlyer}
                disabled={flyerLoading}
                className="px-4 py-2 bg-[#ff1493] text-black text-sm font-mono font-bold hover:bg-[#ff1493]/90 transition-all"
              >
                {flyerLoading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tier Dialog */}
      <Dialog open={showTierDialog} onOpenChange={setShowTierDialog}>
        <DialogContent className="border-white/10 bg-black">
          <DialogHeader>
            <DialogTitle className="font-mono flex items-center gap-2">
              <Ticket className="h-4 w-4 text-[#ff1493]" />
              Add Ticket Tier
            </DialogTitle>
            <DialogDescription className="text-xs text-white/40">
              Create a new ticket type
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={createTier} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-mono text-white/50">
                Tier Name
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="General Admission"
                required
                className="bg-white/[0.02] border-white/10 font-mono focus:border-[#ff1493]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-mono text-white/50">
                Description
              </Label>
              <Input
                id="description"
                name="description"
                placeholder="Access to main floor"
                className="bg-white/[0.02] border-white/10 font-mono focus:border-[#ff1493]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="price" className="text-xs font-mono text-white/50">
                  Price ($)
                </Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value="0"
                  disabled
                  className="bg-white/[0.02] border-white/10 font-mono opacity-50 cursor-not-allowed"
                />
                <p className="text-[10px] font-mono text-[#ff1493]/60">Free during beta</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="quantity" className="text-xs font-mono text-white/50">
                  Quantity
                </Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  placeholder="100"
                  required
                  className="bg-white/[0.02] border-white/10 font-mono focus:border-[#ff1493]"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-[#ff1493] text-black font-mono font-bold hover:bg-[#ff1493]/90 transition-all"
              disabled={tierLoading}
            >
              {tierLoading ? "Creating..." : "Create Tier"}
            </button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Publish Confirmation Dialog */}
      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent className="border-white/10 bg-black">
          <DialogHeader>
            <DialogTitle className="font-mono flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#ff1493]" />
              Publish Event
            </DialogTitle>
            <DialogDescription className="text-xs text-white/40">
              This will make your event visible to everyone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {stripeEnabled === false && hasPaidTiers && (
              <div className="flex gap-3 p-3 border border-yellow-500/30 bg-yellow-500/5">
                <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-mono text-yellow-500 text-sm">Stripe not configured</p>
                  <p className="text-xs text-white/50">
                    Paid tiers will be hidden until you set up Stripe.
                  </p>
                  <Link
                    href="/d/organizer"
                    className="text-xs text-yellow-500 hover:underline"
                  >
                    Configure Stripe →
                  </Link>
                </div>
              </div>
            )}
            <p className="text-sm text-white/50">Are you sure you want to publish?</p>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowPublishDialog(false)}
              disabled={publishing}
              className="px-4 py-2 border border-white/10 text-sm font-mono hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={publishEvent}
              disabled={publishing}
              className="px-4 py-2 bg-[#ff1493] text-black text-sm font-mono font-bold hover:bg-[#ff1493]/90 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {publishing ? "Publishing..." : "Publish"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="border-white/10 bg-black max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-mono flex items-center gap-2">
              <Pencil className="h-4 w-4 text-[#ff1493]" />
              Edit Event
            </DialogTitle>
            <DialogDescription className="text-xs text-white/40">
              Update your event details
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={updateEvent} className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label htmlFor="edit-title" className="text-xs font-mono text-white/50">
                  Title
                </Label>
                <Input
                  id="edit-title"
                  name="title"
                  defaultValue={event?.title}
                  required
                  className="mt-1 bg-white/[0.02] border-white/10 focus:border-[#ff1493] font-mono"
                />
              </div>
              <div>
                <Label htmlFor="edit-description" className="text-xs font-mono text-white/50">
                  Description
                </Label>
                <textarea
                  id="edit-description"
                  name="description"
                  defaultValue={event?.description || ""}
                  rows={3}
                  className="mt-1 w-full px-3 py-2 bg-white/[0.02] border border-white/10 focus:border-[#ff1493] focus:outline-none font-mono text-sm resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit-venueName" className="text-xs font-mono text-white/50">
                    Venue Name
                  </Label>
                  <Input
                    id="edit-venueName"
                    name="venueName"
                    defaultValue={event?.venueName}
                    required
                    className="mt-1 bg-white/[0.02] border-white/10 focus:border-[#ff1493] font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-venueAddress" className="text-xs font-mono text-white/50">
                    Address
                  </Label>
                  <Input
                    id="edit-venueAddress"
                    name="venueAddress"
                    defaultValue={event?.venueAddress}
                    required
                    className="mt-1 bg-white/[0.02] border-white/10 focus:border-[#ff1493] font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit-city" className="text-xs font-mono text-white/50">
                    City
                  </Label>
                  <Input
                    id="edit-city"
                    name="city"
                    defaultValue={event?.city}
                    required
                    className="mt-1 bg-white/[0.02] border-white/10 focus:border-[#ff1493] font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-state" className="text-xs font-mono text-white/50">
                    State
                  </Label>
                  <Input
                    id="edit-state"
                    name="state"
                    defaultValue={event?.state || ""}
                    className="mt-1 bg-white/[0.02] border-white/10 focus:border-[#ff1493] font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit-startsAt" className="text-xs font-mono text-white/50">
                    Start Date & Time
                  </Label>
                  <Input
                    id="edit-startsAt"
                    name="startsAt"
                    type="datetime-local"
                    defaultValue={
                      event?.startsAt
                        ? new Date(event.startsAt).toISOString().slice(0, 16)
                        : ""
                    }
                    required
                    className="mt-1 bg-white/[0.02] border-white/10 focus:border-[#ff1493] font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-endsAt" className="text-xs font-mono text-white/50">
                    End Date & Time
                  </Label>
                  <Input
                    id="edit-endsAt"
                    name="endsAt"
                    type="datetime-local"
                    defaultValue={
                      event?.endsAt
                        ? new Date(event.endsAt).toISOString().slice(0, 16)
                        : ""
                    }
                    className="mt-1 bg-white/[0.02] border-white/10 focus:border-[#ff1493] font-mono"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowEditDialog(false)}
                disabled={editLoading}
                className="px-4 py-2 border border-white/10 text-sm font-mono hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editLoading}
                className="px-4 py-2 bg-[#ff1493] text-black text-sm font-mono font-bold hover:bg-[#ff1493]/90 transition-all"
              >
                {editLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  progress,
  highlight = false,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  progress?: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`border p-4 ${
        highlight ? "border-[#ff1493]/50 bg-[#ff1493]/5" : "border-white/10 bg-white/[0.02]"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className={`${highlight ? "text-[#ff1493]" : "text-white/30"}`}>{icon}</span>
        <span className="text-[10px] font-mono text-white/30 tracking-widest">{label}</span>
      </div>
      <p className={`text-xl font-mono font-bold ${highlight ? "text-[#ff1493]" : ""}`}>{value}</p>
      {progress !== undefined && (
        <div className="mt-2 h-1 bg-white/5">
          <div
            className={`h-full ${highlight ? "bg-[#ff1493]" : "bg-white/20"}`}
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default function EventDashboardPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#ff1493]/30 border-t-[#ff1493] rounded-full animate-spin" />
      </div>
    }>
      <EventDashboardContent params={params} />
    </Suspense>
  );
}
