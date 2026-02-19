"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MapPin, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EventLocationSettings } from "@/components/dashboard/EventLocationSettings";
import { MapPreview } from "@/components/dashboard/MapPreview";
import { useEventEditor } from "../layout";

export default function VenuePage() {
  const { event, eventId, refetch } = useEventEditor();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  if (!event) return null;

  async function updateVenue(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEditLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      venueName: formData.get("venueName"),
      venueAddress: formData.get("venueAddress"),
      city: formData.get("city"),
      state: formData.get("state") || null,
    };

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success("Venue updated");
        setShowEditDialog(false);
        refetch();
      } else {
        toast.error("Failed to update venue");
      }
    } catch {
      toast.error("Failed to update venue");
    } finally {
      setEditLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Venue Details */}
      <div className="border border-white/10 bg-white/[0.02]">
        <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-mono text-white/40 tracking-widest">VENUE DETAILS</span>
          </div>
          <button
            onClick={() => setShowEditDialog(true)}
            className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-mono text-white/40 hover:text-primary transition-colors"
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

      {/* Edit Venue Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="border-white/10 bg-black">
          <DialogHeader>
            <DialogTitle className="font-mono flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Edit Venue
            </DialogTitle>
            <DialogDescription className="text-xs text-white/40">
              Update venue details
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={updateVenue} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="venueName" className="text-xs font-mono text-white/50">
                  Venue Name
                </Label>
                <Input
                  id="venueName"
                  name="venueName"
                  defaultValue={event.venueName}
                  required
                  className="mt-1 bg-white/[0.02] border-white/10 focus:border-primary font-mono"
                />
              </div>
              <div>
                <Label htmlFor="venueAddress" className="text-xs font-mono text-white/50">
                  Address
                </Label>
                <Input
                  id="venueAddress"
                  name="venueAddress"
                  defaultValue={event.venueAddress}
                  required
                  className="mt-1 bg-white/[0.02] border-white/10 focus:border-primary font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="city" className="text-xs font-mono text-white/50">
                  City
                </Label>
                <Input
                  id="city"
                  name="city"
                  defaultValue={event.city}
                  required
                  className="mt-1 bg-white/[0.02] border-white/10 focus:border-primary font-mono"
                />
              </div>
              <div>
                <Label htmlFor="state" className="text-xs font-mono text-white/50">
                  State
                </Label>
                <Input
                  id="state"
                  name="state"
                  defaultValue={event.state || ""}
                  className="mt-1 bg-white/[0.02] border-white/10 focus:border-primary font-mono"
                />
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
                className="px-4 py-2 bg-primary text-black text-sm font-mono font-bold hover:bg-primary/90 transition-all"
              >
                {editLoading ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
