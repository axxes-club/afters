"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useAccentColor } from "@/hooks/useAccentColor";
import {
  Ticket,
  DollarSign,
  UserCheck,
  Copy,
  Check,
  BarChart3,
  Eye,
  EyeOff,
} from "lucide-react";
import { formatCents } from "@/lib/stripe";
import { useEventEditor } from "../layout";

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
        highlight ? "border-primary/50 bg-primary/5" : "border-white/10 bg-white/[0.02]"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className={`${highlight ? "text-primary" : "text-white/30"}`}>{icon}</span>
        <span className="text-[10px] font-mono text-white/30 tracking-widest">{label}</span>
      </div>
      <p className={`text-xl font-mono font-bold ${highlight ? "text-primary" : ""}`}>{value}</p>
      {progress !== undefined && (
        <div className="mt-2 h-1 bg-white/5">
          <div
            className={`h-full ${highlight ? "bg-primary" : "bg-white/20"}`}
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default function OverviewPage() {
  const { event, doorStats, eventId, refetch } = useEventEditor();
  const [copied, setCopied] = useState(false);
  const uiAccent = useAccentColor();

  if (!event) return null;

  const totalCapacity = event.ticketTiers.reduce((sum, t) => sum + t.quantity, 0);
  const totalSold = event.ticketTiers.reduce((sum, t) => sum + t.quantitySold, 0);
  const totalRevenue = event.ticketTiers.reduce((sum, t) => sum + t.quantitySold * t.price, 0);

  function copyEventUrl() {
    const url = `${window.location.origin}/e/${event?.slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("URL copied!");
    setTimeout(() => setCopied(false), 2000);
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
        refetch();
      } else {
        toast.error("Failed to unpublish event");
      }
    } catch {
      toast.error("Failed to unpublish event");
    }
  }

  async function publishEvent() {
    try {
      const res = await fetch(`/api/events/${eventId}/publish`, {
        method: "POST",
      });
      if (res.ok) {
        toast.success("Event published!");
        refetch();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to publish");
      }
    } catch {
      toast.error("Failed to publish");
    }
  }

  return (
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
          className="border border-white/10 bg-white/[0.02] p-4 cursor-pointer hover:border-primary/30 transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-white/30">
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </span>
            <span className="text-[10px] font-mono text-white/30 tracking-widest">
              {copied ? "COPIED" : "COPY URL"}
            </span>
          </div>
          <p className="text-sm font-mono text-primary truncate">/e/{event.slug}</p>
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
          className="border border-white/10 p-3 sm:p-4 flex flex-col items-center gap-1.5 sm:gap-2 hover:border-primary/50 hover:bg-white/[0.02] transition-all group"
        >
          <Copy className="w-4 h-4 sm:w-5 sm:h-5 text-white/30 group-hover:text-primary transition-colors" />
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
                <Eye className="w-5 h-5 text-primary" />
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
                onClick={publishEvent}
                disabled={!event.isRsvpOnly && event.ticketTiers.length === 0}
                className="px-4 py-2 text-black text-xs font-mono font-bold tracking-wider transition-all disabled:opacity-50"
                style={{ backgroundColor: uiAccent }}
              >
                PUBLISH
              </button>
            )}
          </div>

          <div className="mt-4 p-3 bg-white/5 border border-white/10 overflow-hidden">
            <p className="text-[10px] font-mono text-white/40 tracking-wider mb-1">EVENT URL</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs sm:text-sm font-mono text-primary truncate min-w-0">
                /e/{event.slug}
              </code>
              <button
                onClick={copyEventUrl}
                className="p-1.5 border border-white/10 hover:border-primary/30 transition-all flex-shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
