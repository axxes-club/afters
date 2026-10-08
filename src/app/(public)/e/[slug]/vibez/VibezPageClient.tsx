"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { VibezFeed } from "@/components/vibez/VibezFeed";
import { VibezJoin } from "./VibezJoin";

interface VibezPageClientProps {
  eventId: string;
  eventTitle: string;
  eventSlug: string;
  accentColor: string | null;
}

/**
 * The public feed page.
 *
 * It no longer asks the sign-in service who you are, and it no longer fetches /api/me to
 * guess. Both were answers to the wrong question: they could only ever say
 * whether an account exists, never whether the person is at this event. VibezFeed
 * asks the feed API, which is the only thing that actually knows.
 */
export function VibezPageClient({
  eventId,
  eventTitle,
  eventSlug,
  accentColor,
}: VibezPageClientProps) {
  // VibezJoin renders nothing once the viewer has access (a redeemed ticket, or
  // an account that already holds one), so it can sit above the feed
  // unconditionally and only appear for someone who is actually locked out.
  const [, forceFeedRefresh] = useState(0);

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/80 backdrop-blur">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href={`/e/${eventSlug}`}
            className="p-1 -ml-1 text-white/60 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-mono font-bold text-sm truncate">{eventTitle}</h1>
          <span className="text-[10px] font-mono text-white/40 tracking-widest ml-auto">
            VIBEZ
          </span>
        </div>
      </header>
      <main className="max-w-2xl mx-auto p-4">
        <p className="text-xs text-white/40 font-mono mb-4">
          Every room is a photobooth. Take a photo with the flash, and it lands
          on the live feed. Your ticket gets you in — no account needed.
        </p>
        <VibezJoin eventId={eventId} onJoined={() => forceFeedRefresh((n) => n + 1)} />
        <VibezFeed
          key={`vibez-${forceFeedRefresh}`}
          eventId={eventId}
          accentColor={accentColor}
        />
      </main>
    </div>
  );
}
