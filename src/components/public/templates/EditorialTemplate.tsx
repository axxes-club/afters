import React from "react"
import Link from "next/link"
import Image from "next/image"
import { Lock, ArrowRight, Instagram } from "lucide-react"
import { ViewTracker } from "@/components/ViewTracker"
import EventInfoSections from "@/components/public/EventInfoSections"
import { formatCents } from "@/lib/stripe"
import { safeHref } from "@/lib/security"
import type { EventTemplateProps } from "./types"

export default function EditorialTemplate(props: EventTemplateProps) {
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
    lineup,
  } = props

  const eventDate = new Date(event.startsAt)

  // Get ticket tiers
  const availableTiers = event.organizer?.stripeChargesEnabled
    ? event.ticketTiers
    : event.ticketTiers.filter((tier) => tier.price === 0)

  return (
    <div className="min-h-screen selection:bg-white/20 font-serif" style={{ backgroundColor, color: textColor }}>
      <ViewTracker eventId={event.id} />
      {rescheduledBannerElement}

      {/* Subtle texture */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, white 0px, white 1px, transparent 1px, transparent 8px)`,
          }}
        />
      </div>

      <div className="relative z-10 animate-in fade-in duration-1000">
        {/* Hero - full-width image with editorial overlay */}
        <section className="relative h-[75vh] md:h-[85vh] overflow-hidden">
          {event.flyerUrl ? (
            <div className="absolute inset-0">
              <Image
                src={event.flyerUrl}
                alt={event.title}
                fill
                className="object-cover scale-105 animate-[kenburns_20s_ease-out_forwards]"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/50 via-transparent to-neutral-950/50" />
            </div>
          ) : (
            <div
              className="absolute inset-0 bg-gradient-to-br from-neutral-900 to-neutral-950"
            />
          )}

          {/* Editorial text overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 lg:p-20">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="flex-1">
                {/* Organizer tag */}
                <div className="flex items-center gap-4 mb-6">
                  {event.organizer.logoUrl && (
                    <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/20">
                      <Image src={event.organizer.logoUrl} alt={event.organizer.displayName} fill className="object-cover" />
                    </div>
                  )}
                  <span
                    className="font-mono text-xs tracking-[0.4em] uppercase font-semibold"
                    style={{ color: accentColor }}
                  >
                    {event.organizer.displayName}
                  </span>
                </div>

                {/* Title - editorial split */}
                <h1 className={`${typographyClass} text-6xl md:text-8xl lg:text-9xl tracking-tighter leading-[0.85]`}>
                  <span className="text-white drop-shadow-2xl">{event.title.split(' ')[0]}</span>
                  {event.title.split(' ').length > 1 && (
                    <>
                      <br />
                      <span className="text-white/60 drop-shadow-2xl">{event.title.split(' ').slice(1).join(' ')}</span>
                    </>
                  )}
                </h1>
              </div>

              {/* Meta info right aligned on desktop */}
              <div className="flex flex-col gap-2 font-mono text-sm tracking-widest text-white/50 border-l-2 pl-6" style={{ borderColor: accentColor }}>
                <span className="text-white/80">{eventDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                <span>{timeStr}</span>
                <span>{event.city.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Added animation styles */}
        <style dangerouslySetInnerHTML={{
          __html: `
          @keyframes kenburns {
            0% { transform: scale(1.05); }
            100% { transform: scale(1.15); }
          }
        `}} />

        {/* Editorial content grid */}
        <section className="py-20 md:py-32">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20">
            <div className="grid lg:grid-cols-[2fr_1fr] gap-20">
              {/* Main column */}
              <div className="space-y-24">
                {/* Intro section */}
                <div className="animate-in slide-in-from-bottom-8 duration-1000 delay-200 fill-mode-both">
                  <div className="w-24 h-1 mb-12" style={{ backgroundColor: accentColor }} />
                  <p className="text-3xl md:text-4xl font-light leading-relaxed text-white/90 text-balance font-serif">
                    {event.description || `Join us for an unforgettable night featuring incredible music and atmosphere.`}
                  </p>
                </div>

                {/* Details grid */}
                <div className="grid md:grid-cols-2 gap-16 border-t border-white/10 pt-16 animate-in slide-in-from-bottom-8 duration-1000 delay-300 fill-mode-both">
                  {/* Date & Time */}
                  <div>
                    <h3 className="font-mono text-xs tracking-[0.4em] uppercase text-white/30 mb-6">When</h3>
                    <p className={`${typographyClass} text-2xl mb-2`}>{dayStr}</p>
                    <p className="text-white/70 text-lg mb-1 font-light">{eventDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
                    <p className="text-white/50 font-mono tracking-widest">{timeStr}</p>
                  </div>

                  {/* Location */}
                  <div>
                    <h3 className="font-mono text-xs tracking-[0.4em] uppercase text-white/30 mb-6">Where</h3>
                    {showLocation ? (
                      <>
                        <p className={`${typographyClass} text-2xl mb-2`}>{event.venueName}</p>
                        {locationPrecision === 'exact' && (
                          <p className="text-white/70 text-lg mb-1 font-light">{event.venueAddress}</p>
                        )}
                        <p className="text-white/50 font-mono tracking-widest mb-6">{event.city}{event.state ? `, ${event.state}` : ''}</p>
                        {mapUrl && (
                          <a
                            href={mapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-3 text-sm tracking-widest uppercase font-semibold group hover:text-white transition-colors"
                            style={{ color: accentColor }}
                          >
                            View on map <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </a>
                        )}
                      </>
                    ) : (
                      <>
                        <p className={`${typographyClass} text-2xl flex items-center gap-3 mb-2`}>
                          <Lock className="w-5 h-5" style={{ color: accentColor }} />
                          Secret Location
                        </p>
                        <p className="text-white/70 text-lg mb-1 font-light">{event.city}</p>
                        <p className="font-mono tracking-widest text-xs text-white/40 mt-4">ADDRESS REVEALED AFTER PURCHASE</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Map */}
                {showMap && mapEmbedUrl && (
                  <div className="animate-in slide-in-from-bottom-8 duration-1000 delay-400 fill-mode-both">
                    <h3 className="font-mono text-xs tracking-[0.4em] uppercase text-white/30 mb-8">Location</h3>
                    <div className="border border-white/10 rounded-none overflow-hidden grayscale hover:grayscale-0 transition-all duration-700">
                      <iframe
                        src={mapEmbedUrl}
                        className="w-full h-[400px]"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                  </div>
                )}

                {/* Lineup */}
                {lineup.length > 0 && (
                  <div className="border-t border-white/10 pt-16 animate-in slide-in-from-bottom-8 duration-1000 delay-500 fill-mode-both">
                    <h3 className="font-mono text-xs tracking-[0.4em] uppercase text-white/30 mb-12">Featured Artists</h3>
                    <div className="space-y-8">
                      {lineup.map((artist, i) => (
                        <div key={i} className="flex items-center gap-8 group pb-8 border-b border-white/5 last:border-0">
                          <span className="font-mono text-sm text-white/20 tracking-widest">{String(i + 1).padStart(2, '0')}</span>
                          {artist.imageUrl && (
                            <div className="relative w-20 h-20 rounded-full overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-500">
                              <Image src={artist.imageUrl} alt={artist.name} fill className="object-cover" />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className={`${typographyClass} text-3xl group-hover:text-white transition-colors`}>{artist.name}</p>
                            {artist.role && <p className="text-sm text-white/50 tracking-widest uppercase mt-2 font-mono">{artist.role}</p>}
                          </div>
                          {artist.showtime && artist.showShowtime !== false && (
                            <span className="font-mono tracking-widest text-sm font-semibold" style={{ color: accentColor }}>
                              {artist.showtime}
                            </span>
                          )}
                          {safeHref(artist.socialUrl) && (
                            <a href={safeHref(artist.socialUrl)!} target="_blank" rel="noopener noreferrer" className="ml-4 text-white/20 hover:text-white transition-colors p-2">
                              <Instagram className="w-5 h-5" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar - Tickets */}
              <div className="lg:sticky lg:top-12 lg:self-start">
                <div className="border border-white/10 bg-neutral-900/40 backdrop-blur-xl animate-in slide-in-from-bottom-8 duration-1000 delay-300 fill-mode-both">
                  {/* Header */}
                  <div className="p-8 border-b border-white/10">
                    <h3 className="font-mono text-xs tracking-[0.4em] uppercase text-white/40 mb-4">Admission</h3>
                    <p className={`${typographyClass} text-4xl font-light`} style={{ color: accentColor }}>
                      {lowestPrice === 0 ? 'Free Entry' : `From ${formatCents(lowestPrice)}`}
                    </p>
                  </div>

                  {/* Tiers */}
                  <div className="p-8 space-y-6">
                    {availableTiers.map((tier) => {
                      const available = tier.quantity - tier.quantitySold
                      const soldOut = available <= 0

                      return (
                        <div
                          key={tier.id}
                          className={`pb-6 border-b border-white/10 last:border-0 last:pb-0 ${soldOut ? 'opacity-40 grayscale' : 'hover:opacity-80 transition-opacity'}`}
                        >
                          <div className="flex justify-between items-baseline mb-2">
                            <span className={`${typographyClass} text-xl`}>{tier.name}</span>
                            <span className="font-serif text-xl" style={{ color: soldOut ? 'rgba(255,255,255,0.3)' : accentColor }}>
                              {tier.price === 0 ? 'Free' : formatCents(tier.price)}
                            </span>
                          </div>
                          <div className="font-mono text-xs tracking-widest text-white/40 uppercase">
                            {soldOut ? 'Sold out' : `${available} remaining`}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* CTA */}
                  <div className="p-8 pt-0">
                    {hasAvailability ? (
                      <Link
                        href={ctaUrl}
                        className="w-full block py-6 text-center text-black font-semibold tracking-[0.2em] uppercase transition-all hover:bg-white active:scale-95"
                        style={{ backgroundColor: accentColor }}
                      >
                        {isRsvpEvent ? 'RSVP' : 'Get Tickets'}
                      </Link>
                    ) : (
                      <div className="w-full py-6 text-center bg-white/5 text-white/30 tracking-[0.2em] uppercase font-semibold">
                        {isRsvpEvent ? 'Full' : 'Sold Out'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Organizer card */}
                <div className="mt-8 p-8 border border-white/10 bg-neutral-900/20 backdrop-blur-sm animate-in slide-in-from-bottom-8 duration-1000 delay-500 fill-mode-both">
                  <div className="flex items-center gap-6">
                    {event.organizer.logoUrl ? (
                      <div className="relative w-16 h-16 rounded-full overflow-hidden border border-white/10 grayscale hover:grayscale-0 transition-all">
                        <Image src={event.organizer.logoUrl} alt={event.organizer.displayName} fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-serif" style={{ backgroundColor: `${accentColor}10`, color: accentColor }}>
                        {event.organizer.displayName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-mono text-xs text-white/40 uppercase tracking-[0.3em] mb-2">Presented by</p>
                      <p className={`${typographyClass} text-xl tracking-wide`}>{event.organizer.displayName}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Info Sections */}
        <div className="px-6 md:px-12 lg:px-20 py-16 border-t border-white/10 bg-black/20">
          <div className="max-w-7xl mx-auto">
            <EventInfoSections
              about={event.about}
              refundPolicy={event.refundPolicy}
              faqs={event.faqs}
              variant="default"
              accentColor={accentColor}
            />
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-white/10 py-12 px-6 md:px-12 lg:px-20">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-xs font-mono tracking-widest uppercase text-white/30">
            <span>&copy; {new Date().getFullYear()} Afters</span>
            <a href="https://afters.am" className="hover:text-white transition-colors">afters.am</a>
          </div>
        </footer>
      </div>

      {/* Mobile sticky CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-neutral-950/95 backdrop-blur-xl border-t border-white/10 z-50">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-mono text-[10px] tracking-widest uppercase text-white/40 mb-1">{isRsvpEvent ? 'Entry' : 'From'}</div>
            <div className={`${typographyClass} text-2xl`} style={{ color: accentColor }}>
              {isRsvpEvent ? 'Free' : (lowestPrice === 0 ? 'Free' : formatCents(lowestPrice))}
            </div>
          </div>
          {hasAvailability ? (
            <Link
              href={ctaUrl}
              className="px-10 py-4 text-black font-semibold tracking-widest uppercase text-sm"
              style={{ backgroundColor: accentColor }}
            >
              {isRsvpEvent ? 'RSVP' : 'Get Tickets'}
            </Link>
          ) : (
            <div className="px-10 py-4 bg-white/5 text-white/30 tracking-widest uppercase text-sm">{isRsvpEvent ? 'Full' : 'Sold Out'}</div>
          )}
        </div>
      </div>
    </div>
  )
}
