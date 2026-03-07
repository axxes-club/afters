"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { VibezFeed } from "@/components/vibez/VibezFeed";

interface VibezPageClientProps {
  eventId: string;
  eventTitle: string;
  eventSlug: string;
  accentColor: string | null;
}

export function VibezPageClient({
  eventId,
  eventTitle,
  eventSlug,
  accentColor,
}: VibezPageClientProps) {
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
          Share your moments. Only attendees can see this feed.
        </p>
        <VibezFeed
          eventId={eventId}
          canPost={true}
          accentColor={accentColor ?? undefined}
        />
      </main>
    </div>
  );
}
