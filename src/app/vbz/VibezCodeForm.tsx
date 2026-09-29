"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * The event-code box on /vbz.
 *
 * It has to produce a *real* path on the canonical host, not a path that only
 * works because a subdomain rewrite exists. The previous version pushed
 * `/<slug>/vibez`, which is correct only on `vbz.afters.am` — on `afters.am`
 * that 404s, and since the subdomain's DNS is at a registrar nobody can reach,
 * that made the one field on this page a dead end.
 */
export function VibezCodeForm() {
  const router = useRouter();
  const [slug, setSlug] = useState("");

  const go = (e: React.FormEvent) => {
    e.preventDefault();
    // Trim stray slashes, then take the last segment. Someone pasting
    // "afters.am/e/friday-at-the-warehouse" gets the slug, not a nested path.
    const cleaned = slug
      .trim()
      .replace(/^https?:\/\/[^/]+/i, "")
      .replace(/^\/+/, "")
      .replace(/\/+$/, "")
      .split("/")
      .filter(Boolean)
      .pop();
    if (!cleaned) return;
    // The real route is /e/<slug>/vibez; /vbz/<slug> redirects to it, so the
    // short form is shareable and the redirect is the only place that knows.
    router.push(`/vbz/${encodeURIComponent(cleaned)}`);
  };

  return (
    <form onSubmit={go} className="mt-8 w-full max-w-xs">
      <label className="block text-left text-[10px] font-mono tracking-widest text-white/40">
        EVENT CODE
      </label>
      <div className="mt-2 flex gap-2">
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="friday-at-the-warehouse"
          autoComplete="off"
          spellCheck={false}
          className="min-w-0 flex-1 border border-white/15 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-white/25 focus:border-white/40"
          aria-label="Event code"
        />
        <button
          type="submit"
          disabled={!slug.trim()}
          className="shrink-0 border border-white/20 px-4 py-2.5 text-xs font-mono font-bold transition-colors hover:bg-white hover:text-black disabled:opacity-40"
        >
          Go
        </button>
      </div>
    </form>
  );
}
