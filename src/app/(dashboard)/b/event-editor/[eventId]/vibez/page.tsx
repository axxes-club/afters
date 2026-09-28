"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { useAccentColor } from "@/hooks/useAccentColor";
import { Sparkles, ExternalLink, Clock } from "lucide-react";
import { VibezFeed } from "@/components/vibez/VibezFeed";
import { VibezModeration } from "@/components/vibez/VibezModeration";
import { useEventEditor } from "../layout";

export default function VibezPage() {
  const { event, eventId, refetch } = useEventEditor();
  const { user } = useUser();
  const userId = user?.id ?? null;
  const [toggling, setToggling] = useState(false);
  const uiAccent = useAccentColor();

  if (!event) return null;

  const eventStarted = new Date(event.startsAt) <= new Date();
  const feedAvailable = event.vibezEnabled && eventStarted;
  const guestVibezUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/e/${event.slug}/vibez`;

  async function toggleVibez(enabled: boolean) {
    setToggling(true);
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vibezEnabled: enabled }),
      });
      if (res.ok) {
        toast.success(enabled ? "VIBEZ enabled" : "VIBEZ disabled");
        refetch();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to update");
      }
    } catch {
      toast.error("Failed to update");
    } finally {
      setToggling(false);
    }
  }

  function copyGuestLink() {
    navigator.clipboard.writeText(guestVibezUrl);
    toast.success("Link copied! Share with attendees.");
  }

  return (
    <div className="space-y-6">
      <div className="border border-white/10 bg-white/[0.02]">
        <div className="px-4 py-2 border-b border-white/10 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-white/40" />
          <span className="text-[10px] font-mono text-white/40 tracking-widest">
            VIBEZ (BETA)
          </span>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-xs text-white/40 font-mono">
            Let guests share photos in a private feed during your event. Only
            people with a ticket, RSVP, or guestlist spot can see and post.
          </p>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-mono text-white/70">
              Enable VIBEZ for this event
            </span>
            <button
              onClick={() => toggleVibez(!event.vibezEnabled)}
              disabled={toggling}
              className={`relative w-11 h-6 rounded-full border transition-colors ${
                event.vibezEnabled
                  ? "border-primary"
                  : "border-white/20 bg-white/5"
              } ${toggling ? "opacity-50 cursor-wait" : ""}`}
              style={
                event.vibezEnabled
                  ? { backgroundColor: `${uiAccent}40` }
                  : undefined
              }
            >
              <span
                className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform"
                style={{
                  transform: event.vibezEnabled ? "translateX(20px)" : "none",
                  backgroundColor: event.vibezEnabled ? uiAccent : undefined,
                }}
              />
            </button>
          </div>

          {event.vibezEnabled && !eventStarted && (
            <div className="flex items-center gap-2 p-3 border border-white/10 bg-white/[0.02]">
              <Clock className="w-4 h-4 text-white/40 flex-shrink-0" />
              <p className="text-xs font-mono text-white/50">
                The feed will appear here once the event starts. Share the link
                below so guests can open the feed during the event.
              </p>
            </div>
          )}

          {event.vibezEnabled && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={copyGuestLink}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-white/10 text-xs font-mono text-white/60 hover:border-white/20 hover:text-white transition-all"
              >
                Copy guest link
              </button>
              <Link
                href={`/e/${event.slug}/vibez`}
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-white/10 text-xs font-mono text-white/60 hover:border-white/20 hover:text-white transition-all"
              >
                <ExternalLink className="w-3 h-3" />
                Open feed
              </Link>
            </div>
          )}
        </div>
      </div>

      {feedAvailable ? (
        <div>
          <h2 className="text-[10px] font-mono text-white/40 tracking-widest mb-3">
            LIVE FEED
          </h2>
          <VibezFeed
            eventId={eventId}
            canPost={true}
            canModerate={true}
            currentUserId={userId}
            accentColor={event.accentColor ?? undefined}
          />
        </div>
      ) : event.vibezEnabled && !eventStarted ? (
        <div className="border border-white/10 bg-white/[0.02] p-8 text-center">
          <Clock className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-sm text-white/40 font-mono">
            Feed goes live when the event starts
          </p>
        </div>
      ) : null}

      {event.vibezEnabled && <VibezModeration eventId={eventId} />}
    </div>
  );
}
