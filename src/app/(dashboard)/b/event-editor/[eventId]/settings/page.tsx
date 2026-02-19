"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ticket, UserCheck, Timer, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EventRsvpSettings } from "@/components/dashboard/EventRsvpSettings";
import { useEventEditor } from "../layout";

export default function SettingsPage() {
  const router = useRouter();
  const { event, eventId, refetch } = useEventEditor();
  const [expiresAfter, setExpiresAfter] = useState<string>(event?.expiresAfter || "24h");
  const [expirationLoading, setExpirationLoading] = useState(false);
  const [eventTypeLoading, setEventTypeLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  if (!event) return null;

  const totalSold = event.ticketTiers.reduce((sum, t) => sum + t.quantitySold, 0);

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
        refetch();
      }
    } catch {
      toast.error("Failed to update expiration");
      refetch();
    } finally {
      setExpirationLoading(false);
    }
  }

  async function toggleEventType(isRsvp: boolean) {
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
        refetch();
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

  async function deleteEvent() {
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}`, { method: "DELETE" });

      if (res.ok) {
        toast.success("Event deleted");
        router.push("/b/events");
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

  return (
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
                  ? "border-primary bg-primary/10"
                  : "border-white/10 hover:border-white/20"
              } ${eventTypeLoading ? "opacity-50 cursor-wait" : ""} ${
                event.ticketTiers.length === 0 && event.isRsvpOnly ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Ticket className={`w-5 h-5 ${!event.isRsvpOnly ? "text-primary" : "text-white/40"}`} />
                <span className={`font-mono font-bold text-sm ${!event.isRsvpOnly ? "text-primary" : "text-white/60"}`}>
                  TICKETED EVENT
                </span>
              </div>
              <p className="text-[10px] text-white/40 font-mono">
                Sell tickets with tiers and pricing
              </p>
              {!event.isRsvpOnly && (
                <div className="mt-2">
                  <span className="text-[8px] font-mono text-primary px-1.5 py-0.5 border border-primary/30">ACTIVE</span>
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

      {/* RSVP Settings */}
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
            <SelectTrigger className="h-10 bg-black border-white/10 font-mono" tabIndex={0}>
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
  );
}
