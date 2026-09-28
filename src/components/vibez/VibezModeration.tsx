"use client";

import { useCallback, useEffect, useState } from "react";
import { Ban, Loader2, ShieldCheck, UserX } from "lucide-react";

interface BanRow {
  id: string;
  userId: string;
  reason: string | null;
  createdAt: string;
}

/**
 * The other half of moderation: a person who keeps posting what they shouldn't
 * can be barred from this event's feed. Scoped to the event — a ban here does
 * not follow them to the next one.
 */
export function VibezModeration({ eventId }: { eventId: string }) {
  const [bans, setBans] = useState<BanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/vibez/bans`);
      if (res.ok) {
        const data = await res.json();
        setBans(data.bans ?? []);
      }
    } catch {
      setError("Could not load the ban list");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const lift = async (userId: string) => {
    setBusy(userId);
    try {
      const res = await fetch(
        `/api/events/${eventId}/vibez/bans?userId=${encodeURIComponent(userId)}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setBans((prev) => prev.filter((b) => b.userId !== userId));
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="border border-white/10 bg-white/[0.02]">
      <div className="px-4 py-2 border-b border-white/10 flex items-center gap-2">
        <ShieldCheck className="w-3.5 h-3.5 text-white/40" />
        <span className="text-[10px] font-mono text-white/40 tracking-widest">
          MODERATION
        </span>
      </div>
      <div className="p-4 space-y-3">
        <p className="text-xs text-white/40 font-mono">
          Remove a photo with the bin icon on it. Reported photos carry an amber
          flag with a count. Anyone barred from posting appears here.
        </p>

        {error && <p className="text-xs text-red-400/80 font-mono">{error}</p>}

        {loading ? (
          <div className="flex items-center gap-2 text-white/40">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span className="text-[10px] font-mono">Loading…</span>
          </div>
        ) : bans.length === 0 ? (
          <p className="text-[10px] font-mono text-white/30 flex items-center gap-1.5">
            <UserX className="w-3 h-3" />
            Nobody is barred from this feed.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {bans.map((ban) => (
              <li
                key={ban.id}
                className="flex items-center gap-2 border border-white/10 px-2 py-1.5"
              >
                <Ban className="w-3 h-3 text-red-400/70 flex-shrink-0" />
                <span className="text-[10px] font-mono text-white/60 truncate flex-1">
                  {ban.userId.slice(0, 18)}
                  {ban.reason ? ` — ${ban.reason}` : ""}
                </span>
                <button
                  type="button"
                  onClick={() => lift(ban.userId)}
                  disabled={busy === ban.userId}
                  className="text-[10px] font-mono text-white/40 hover:text-white/80 disabled:opacity-50"
                >
                  {busy === ban.userId ? "…" : "Lift ban"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
