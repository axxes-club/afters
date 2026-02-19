"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import { ScannerManagement } from "@/components/dashboard/ScannerManagement";
import { ScanActivityLog } from "@/components/dashboard/ScanActivityLog";
import { ShiftHistory } from "@/components/dashboard/ShiftHistory";
import { GuestlistManagement } from "@/components/guestlist-management";
import { ScannerSoundSelector } from "@/components/dashboard/ScannerSoundSelector";
import { useEventEditor } from "../layout";

export default function DoorPage() {
  const { event, doorStats, eventId } = useEventEditor();

  if (!event) return null;

  const totalSold = event.ticketTiers.reduce((sum, t) => sum + t.quantitySold, 0);

  return (
    <div className="space-y-6">
      {/* Door Stats */}
      <div className="border border-white/10 bg-white/[0.02]">
        <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between">
          <span className="text-[10px] font-mono text-white/40 tracking-widest">CHECK-IN STATUS</span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            <span className="text-[10px] font-mono text-primary">
              {doorStats?.total ? Math.round((doorStats.checkedIn / doorStats.total) * 100) : 0}%
            </span>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-3xl font-mono font-bold">
                <span className="text-primary">{doorStats?.checkedIn ?? 0}</span>
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
              className="h-full bg-primary transition-all"
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
  );
}
