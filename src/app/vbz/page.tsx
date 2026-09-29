"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * vbz.afters.am with no event slug.
 *
 * Someone has followed a QR code to the bare host, or typed it in by hand. The
 * useful thing to do is explain the product in one line and get them to an
 * event, rather than 404 or bounce them to the marketing homepage.
 *
 * The code box navigates client-side on purpose: there is no `/e?slug=` route,
 * and a plain form GET would have landed on a 404. The alias middleware turns
 * the slug into `/e/<slug>/vibez` either way, so this is the same page the
 * printed QR code reaches — just typed instead of scanned.
 */
export default function VibezLandingPage() {
  const router = useRouter();
  const [slug, setSlug] = useState("");

  const go = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = slug.trim().replace(/^\/+|\/+$/g, "");
    if (!trimmed) return;
    // Strip a leading `e/` in case someone pasted the full event URL — people do.
    const cleaned = trimmed.replace(/^e\//i, "");
    router.push(`/${cleaned}/vibez`);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-center text-white">
      <p className="font-mono text-[10px] tracking-[0.3em] text-white/40">VIBEZ</p>
      <h1 className="mt-4 text-2xl font-semibold sm:text-3xl">
        Every room is a photobooth
      </h1>
      <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/50">
        Scan the code on your ticket to open the camera for this event. Take a
        photo with the flash and it lands on the live feed. No account needed.
      </p>

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

      <Link
        href="/"
        className="mt-10 text-xs font-mono text-white/30 underline-offset-4 hover:text-white/60 hover:underline"
      >
        afters.am
      </Link>
    </div>
  );
}