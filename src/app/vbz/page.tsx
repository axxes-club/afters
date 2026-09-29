import Link from "next/link";
import { VibezCodeForm } from "./VibezCodeForm";

/**
 * afters.am/vbz — the short URL for the VIBEZ camera.
 *
 * The QR codes an organizer prints around a room need to be short enough to read
 * off a sticker, and `afters.am/vbz/<event-slug>` is that: one domain to
 * remember, no DNS to configure, and it works on the same host the ticket was
 * bought on. The `vbz.afters.am` subdomain rewrite still works if that DNS is
 * ever added, but nothing here depends on it — deliberately, because that zone
 * lives at a registrar nobody currently has access to.
 *
 * A bare `/vbz` is someone who followed a QR code to the root, or typed the
 * prefix in. Explain the thing and get them to an event rather than 404ing or
 * dumping them on the marketing homepage.
 */
export default function VibezLandingPage() {
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

      <VibezCodeForm />

      <Link
        href="/"
        className="mt-10 text-xs font-mono text-white/30 underline-offset-4 hover:text-white/60 hover:underline"
      >
        afters.am
      </Link>
    </div>
  );
}