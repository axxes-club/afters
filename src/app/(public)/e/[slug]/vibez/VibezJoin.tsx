"use client";

import { useEffect, useState } from "react";

/**
 * The guest join step.
 *
 * Most people at a night did not make an account, and asking them to is how the
 * feed ends up empty in a room full of people who would happily have posted a
 * photo. So: type the code printed on your ticket, and you are in. That is the
 * whole flow.
 *
 * On mount it asks the feed whether access already exists, so a returning guest
 * — or anyone signed in with a ticket — never sees this at all. It renders
 * nothing once access is confirmed, which is what makes it safe to leave mounted
 * above the feed unconditionally.
 */
export function VibezJoin({ eventId, onJoined }: { eventId: string; onJoined: () => void }) {
  const [checking, setChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/events/${eventId}/vibez`)
      .then((r) => {
        if (cancelled) return;
        // 403 is the expected answer for someone who has not redeemed yet, and
        // is not an error worth showing.
        setHasAccess(r.ok);
      })
      .catch(() => {
        if (!cancelled) setHasAccess(false);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const join = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/vibez/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || "That code didn't work.");
        return;
      }
      setHasAccess(true);
      onJoined();
    } catch {
      setError("Couldn't check that code. Try again.");
    } finally {
      setBusy(false);
    }
  };

  if (checking || hasAccess) return null;

  return (
    <form onSubmit={join} className="mb-4 border border-white/10 bg-white/[0.02] p-3">
      <label className="block text-[10px] font-mono text-white/40 mb-2">
        GOT A TICKET? ENTER THE CODE TO SEE THE FEED
      </label>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="e.g. AFT-1234"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          className="flex-1 rounded-none border border-white/15 bg-black px-3 py-2 text-sm font-mono uppercase tracking-wider text-white outline-none placeholder:text-white/25 focus:border-white/40"
          aria-label="Ticket code"
        />
        <button
          type="submit"
          disabled={busy || !code.trim()}
          className="border border-white/20 px-4 py-2 text-xs font-mono font-bold text-white transition-colors hover:bg-white hover:text-black disabled:opacity-40"
        >
          {busy ? "Checking…" : "Join"}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-xs text-red-400/80 font-mono" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}