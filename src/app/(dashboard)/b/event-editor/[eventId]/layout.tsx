"use client";

import { useEffect, useState, createContext, useContext, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { useAccentColor } from "@/hooks/useAccentColor";
import {
  Calendar,
  MapPin,
  ExternalLink,
  ImageIcon,
  Pencil,
  Sparkles,
  Share2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FlyerUpload } from "@/components/FlyerUpload";
import { useAftie } from "@/components/aftie/AftieProvider";

interface TicketTier {
  id: string;
  name: string;
  description: string | null;
  price: number;
  quantity: number;
  quantitySold: number;
}

export interface Event {
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
  pageTheme: string;
  accentColor: string | null;
  backgroundColor: string | null;
  typography: string;
  scannerSound: string;
  showLocationOnPage: boolean;
  showLocationOnTicket: boolean;
  showMapOnPage: boolean;
  showMapOnTicket: boolean;
  broadcastOnStart: boolean;
  locationPrecision: string;
  isAddressHidden: boolean;
  isRsvpOnly: boolean;
  rsvpCapacity: number | null;
  rsvpAllowPlusOnes: boolean;
  rsvpMaxPlusOnes: number;
  rsvpCount: number;
  about: string | null;
  refundPolicy: string | null;
  faqs: Array<{question: string; answer: string}> | null;
  lineup: Array<{name: string; role: string; imageUrl: string; socialUrl: string; showtime?: string; showShowtime?: boolean}> | null;
  gallery: string[] | null;
  expiresAfter: string;
}

interface EventEditorContextType {
  event: Event | null;
  loading: boolean;
  refetch: () => Promise<void>;
  stripeEnabled: boolean | null;
  doorStats: { checkedIn: number; total: number } | null;
  eventId: string;
}

const EventEditorContext = createContext<EventEditorContextType | null>(null);

export function useEventEditor() {
  const ctx = useContext(EventEditorContext);
  if (!ctx) throw new Error("useEventEditor must be used within EventEditorLayout");
  return ctx;
}

export default function EventEditorLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ eventId: string }>;
}) {
  const [eventId, setEventId] = useState<string>("");
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [stripeEnabled, setStripeEnabled] = useState<boolean | null>(null);
  const [doorStats, setDoorStats] = useState<{ checkedIn: number; total: number } | null>(null);
  const [showFlyerDialog, setShowFlyerDialog] = useState(false);
  const [tempFlyerUrl, setTempFlyerUrl] = useState<string | null>(null);
  const [flyerLoading, setFlyerLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const pathname = usePathname();
  const uiAccent = useAccentColor();
  const { setPageContext } = useAftie();

  // Extract eventId from params
  useEffect(() => {
    params.then(({ eventId }) => setEventId(eventId));
  }, [params]);

  const fetchEvent = useCallback(async () => {
    if (!eventId) return;
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
  }, [eventId]);

  const fetchStripeStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/user/stripe-status");
      if (res.ok) {
        const data = await res.json();
        setStripeEnabled(data.stripeChargesEnabled);
      }
    } catch (error) {
      console.error("Failed to fetch Stripe status:", error);
    }
  }, []);

  const fetchDoorStats = useCallback(async () => {
    if (!eventId) return;
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
  }, [eventId]);

  useEffect(() => {
    if (eventId) {
      fetchEvent();
      fetchStripeStatus();
      fetchDoorStats();
    }
  }, [eventId, fetchEvent, fetchStripeStatus, fetchDoorStats]);

  // Set Aftie context
  useEffect(() => {
    if (event) {
      const currentTab = pathname.split("/").pop() || "overview";
      const editingFieldMap: Record<string, "description" | "title" | "venue" | "lineup" | "tickets" | "design" | "location" | "media" | null> = {
        "overview": null,
        "tickets": "tickets",
        "door": null,
        "design": "design",
        "details": "description",
        "venue": "location",
        "settings": null,
      };

      setPageContext({
        page: "event-details",
        eventId: event.id,
        eventTitle: event.title,
        editingField: editingFieldMap[currentTab] || null,
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
  }, [event, pathname, setPageContext]);

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

  function copyEventUrl() {
    const url = `${window.location.origin}/e/${event?.slug}`;
    navigator.clipboard.writeText(url);
    toast.success("URL copied!");
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

  // Get current tab from pathname
  const currentTab = pathname.split("/").pop() || "overview";

  const tabs = [
    { id: "overview", label: "OVERVIEW" },
    ...(event && !event.isRsvpOnly ? [{ id: "tickets", label: "TICKETS" }] : []),
    { id: "door", label: "DOOR" },
    { id: "details", label: "DETAILS" },
    { id: "design", label: "DESIGN" },
    { id: "venue", label: "VENUE" },
    { id: "settings", label: "SETTINGS" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary animate-spin" />
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

  return (
    <EventEditorContext.Provider value={{ event, loading, refetch: fetchEvent, stripeEnabled, doorStats, eventId }}>
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
              className="relative w-14 h-[70px] sm:w-16 sm:h-20 border border-white/10 bg-white/5 flex-shrink-0 overflow-hidden group hover:border-primary/50 transition-colors"
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
                  <ImageIcon className="w-5 h-5 text-white/20 group-hover:text-primary transition-colors" />
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
                      ? "bg-primary/10 text-primary"
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
                onClick={publishEvent}
                disabled={publishing || (!event.isRsvpOnly && event.ticketTiers.length === 0)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-black text-xs font-mono font-bold tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: uiAccent }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                PUBLISH
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-[100vw] -mx-4 sm:mx-0">
          <div className="flex items-center gap-1 border-b border-white/10 overflow-x-auto overflow-y-hidden scrollbar-hide px-4 sm:px-0"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {tabs.map((tab) => (
              <Link
                key={tab.id}
                href={`/b/event-editor/${eventId}/${tab.id}`}
                className={`px-3 sm:px-4 py-2.5 text-xs font-mono tracking-wider transition-colors border-b-2 -mb-[1px] whitespace-nowrap ${
                  currentTab === tab.id
                    ? ""
                    : "text-white/40 border-transparent hover:text-white/60"
                }`}
                style={currentTab === tab.id ? { color: uiAccent, borderColor: uiAccent } : undefined}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Page Content */}
        <div className="max-w-[calc(100vw-32px)] md:max-w-[calc(100vw-14rem-48px)]">
          {children}
        </div>

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
                  className="px-4 py-2 bg-primary text-black text-sm font-mono font-bold hover:bg-primary/90 transition-all"
                >
                  {flyerLoading ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </EventEditorContext.Provider>
  );
}
