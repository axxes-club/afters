import React from "react"
import Link from "next/link"
import Image from "next/image"
import { Lock, ArrowRight } from "lucide-react"
import { ViewTracker } from "@/components/ViewTracker"
import EventInfoSections from "@/components/public/EventInfoSections"
import { formatCents } from "@/lib/stripe"
import type { EventTemplateProps } from "./types"

export default function MinimalTemplate(props: EventTemplateProps) {
  const {
    event,
    accentColor,
    backgroundColor,
    typographyClass,
    textColor,
    dateStr,
    timeStr,
    dayStr,
    showLocation,
    showMap,
    locationPrecision,
    mapUrl,
    mapEmbedUrl,
    rescheduledBannerElement,
    lowestPrice,
    hasAvailability,
    isRsvpEvent,
    ctaUrl,
    ctaTextLower,
    lineup,
  } = props

  const eventDate = new Date(event.startsAt)

  // Get ticket tiers
  const availableTiers = event.organizer?.stripeChargesEnabled
    ? event.ticketTiers
    : event.ticketTiers.filter((tier) => tier.price === 0)

  return (
    <div className="min-h-screen font-sans tracking-wide selection:bg-white/20" style={{ backgroundColor, color: textColor }}>
      <ViewTracker eventId={event.id} />
      {rescheduledBannerElement}

      {/* Subtle gradient noise overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-20 mix-blend-soft-light z-0" 
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
      />
      <div className="fixed inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black pointer-events-none -z-10" />

      <div className="relative z-10 animate-in fade-in duration-1000 slide-in-from-bottom-4">
        {/* Main content - asymmetric layout */}
        <main className="px-6 md:px-12 lg:px-24 py-12 md:py-24">
          <div className="max-w-7xl mx-auto">
            {/* Small accent line */}
            <div className="w-8 h-px mb-12 opacity-50" style={{ backgroundColor: accentColor }} />

            {/* Title - elegant, lowercase */}
            <h1 className={`${typographyClass} text-5xl md:text-7xl lg:text-8xl font-extralight tracking-tighter mb-8 leading-tight`}>
              {event.title.toLowerCase()}
            </h1>

            {/* Date line */}
            <p className="text-white/40 text-xl font-light mb-20 tracking-wider">
              {dayStr.toLowerCase()}, {eventDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }).toLowerCase()} &mdash; {timeStr.toLowerCase()}
            </p>

            {/* Two column layout */}
            <div className="grid lg:grid-cols-[5fr_3fr] gap-16 lg:gap-32">
              {/* Left column */}
              <div className="space-y-24">
                {/* Flyer - minimal frame */}
                {event.flyerUrl && (
                  <div className="relative aspect-[4/5] bg-white/[0.01] border border-white/[0.03] overflow-hidden group">
                    <Image
                      src={event.flyerUrl}
                      alt={event.title}
                      fill
                      className="object-cover opacity-90 mix-blend-luminosity group-hover:mix-blend-normal transition-all duration-1000 ease-out group-hover:scale-105"
                      priority
                    />
                  </div>
                )}

                {/* Description */}
                {event.description && (
                  <div>
                    <h2 className="text-xs text-white/30 uppercase tracking-[0.2em] mb-8 font-light">About</h2>
                    <p className="text-white/60 text-xl font-light leading-relaxed max-w-2xl text-balance">
                      {event.description}
                    </p>
                  </div>
                )}

                {/* Lineup */}
                {lineup.length > 0 && (
                  <div>
                    <h2 className="text-xs text-white/30 uppercase tracking-[0.2em] mb-8 font-light">Artists</h2>
                    <div className="flex flex-col gap-6">
                      {lineup.map((artist, i) => (
                        <div key={i} className="flex items-center gap-6 pb-6 border-b border-white/[0.05] group">
                          {artist.imageUrl && (
                            <div className="relative w-12 h-12 rounded-full overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-500">
                              <Image src={artist.imageUrl} alt={artist.name} fill className="object-cover" />
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className={`${typographyClass} text-2xl font-light tracking-wide`}>{artist.name.toLowerCase()}</span>
                            {artist.showtime && artist.showShowtime !== false && (
                              <span className="text-sm text-white/40 mt-1 font-mono tracking-widest">{artist.showtime}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Location */}
                <div>
                  <h2 className="text-xs text-white/30 uppercase tracking-[0.2em] mb-8 font-light">Location</h2>
                  {showLocation ? (
                    <div className="space-y-2">
                      <p className={`${typographyClass} text-3xl font-light tracking-wide`}>{event.venueName.toLowerCase()}</p>
                      {locationPrecision === 'exact' && (
                        <p className="text-white/40 text-lg font-light">{event.venueAddress?.toLowerCase()}</p>
                      )}
                      <p className="text-white/30 text-lg font-light">{event.city.toLowerCase()}{event.state ? `, ${event.state.toLowerCase()}` : ''}</p>
                      {mapUrl && (
                        <a
                          href={mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-3 mt-6 text-sm tracking-widest hover:text-white transition-colors group"
                          style={{ color: accentColor }}
                        >
                          view map <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 text-white/40 text-lg font-light">
                      <Lock className="w-5 h-5 opacity-50" />
                      <span>{event.city.toLowerCase()} &mdash; location revealed on ticket</span>
                    </div>
                  )}
                </div>

                {/* Map */}
                {showMap && mapEmbedUrl && (
                  <div className="border border-white/5 rounded-sm overflow-hidden opacity-80 hover:opacity-100 transition-opacity duration-500">
                    <iframe
                      src={mapEmbedUrl}
                      className="w-full h-[400px]"
                      style={{ border: 0, filter: 'grayscale(1) brightness(0.6) contrast(1.2)' }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                )}
              </div>

              {/* Right column - Tickets */}
              <div className="lg:sticky lg:top-12 lg:self-start">
                <div className="border border-white/[0.05] bg-white/[0.01] p-10 backdrop-blur-xl">
                  <h2 className="text-xs text-white/30 uppercase tracking-[0.2em] mb-10 font-light">Tickets</h2>

                  <div className="space-y-6 mb-12">
                    {availableTiers.map((tier) => {
                      const available = tier.quantity - tier.quantitySold
                      const soldOut = available <= 0

                      return (
                        <div
                          key={tier.id}
                          className={`pb-6 border-b border-white/[0.05] ${soldOut ? 'opacity-30' : 'group'}`}
                        >
                          <div className="flex justify-between items-end mb-3">
                            <span className={`${typographyClass} text-xl font-light tracking-wide`}>{tier.name.toLowerCase()}</span>
                            <span className="text-xl font-light" style={{ color: soldOut ? 'rgba(255,255,255,0.3)' : accentColor }}>
                              {tier.price === 0 ? 'free' : formatCents(tier.price)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-white/30 font-light tracking-wider">
                              {soldOut ? 'sold out' : `${available} available`}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {hasAvailability ? (
                    <Link
                      href={ctaUrl}
                      className="w-full block py-5 text-center text-black font-light tracking-[0.2em] uppercase transition-all hover:bg-white"
                      style={{ backgroundColor: accentColor }}
                    >
                      {ctaTextLower}
                    </Link>
                  ) : (
                    <div className="w-full py-5 text-center bg-white/5 text-white/30 font-light tracking-[0.2em] uppercase">
                      {isRsvpEvent ? 'full' : 'sold out'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="px-6 md:px-12 lg:px-24 py-16 border-t border-white/[0.02] mt-12">
          <div className="max-w-7xl mx-auto flex justify-between items-center text-xs tracking-widest text-white/30 uppercase font-light">
            <span>&copy; {new Date().getFullYear()} afters</span>
            <a href="https://afters.am" className="hover:text-white transition-colors">afters.am</a>
          </div>
        </footer>
      </div>

      {/* Mobile sticky CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-zinc-950/95 backdrop-blur-xl border-t border-white/[0.05] z-50">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-white/40 tracking-widest uppercase font-light mb-1">{isRsvpEvent ? 'entry' : 'from'}</div>
            <div className="text-xl font-light" style={{ color: accentColor }}>
              {isRsvpEvent ? 'free' : (lowestPrice === 0 ? 'free' : formatCents(lowestPrice))}
            </div>
          </div>
          {hasAvailability ? (
            <Link
              href={ctaUrl}
              className="px-10 py-4 text-black text-sm tracking-[0.2em] uppercase font-light active:scale-95 transition-transform"
              style={{ backgroundColor: accentColor }}
            >
              {ctaTextLower}
            </Link>
          ) : (
            <div className="px-10 py-4 bg-white/5 text-white/30 text-sm tracking-[0.2em] uppercase font-light">{isRsvpEvent ? 'full' : 'sold out'}</div>
          )}
        </div>
      </div>

      {/* Info Sections */}
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <EventInfoSections
          about={event.about}
          refundPolicy={event.refundPolicy}
          faqs={event.faqs}
          variant="minimal"
          accentColor={accentColor}
        />
      </div>
    </div>
  )
}
