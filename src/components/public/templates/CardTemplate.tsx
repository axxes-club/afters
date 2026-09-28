import React from "react"
import Link from "next/link"
import Image from "next/image"
import { Lock, MapPin, CalendarDays, Ticket, Instagram, ArrowRight } from "lucide-react"
import { ViewTracker } from "@/components/ViewTracker"
import EventInfoSections from "@/components/public/EventInfoSections"
import { formatCents } from "@/lib/stripe"
import { safeHref } from "@/lib/security"
import type { EventTemplateProps, LineupArtist } from "./types"

export default function CardTemplate(props: EventTemplateProps) {
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
    ctaText,
    lineup,
  } = props

  const availableTiers = event.organizer?.stripeChargesEnabled
    ? event.ticketTiers
    : event.ticketTiers.filter((tier: any) => tier.price === 0)

  const totalAvailable = availableTiers.reduce(
    (sum: number, tier: any) => sum + (tier.quantity - tier.quantitySold),
    0
  )

  return (
    <div className="min-h-screen selection:bg-white/30" style={{ backgroundColor, color: textColor }}>
      <ViewTracker eventId={event.id} />
      {rescheduledBannerElement}

      {/* Ambient gradient background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 15% 50%, ${accentColor}10 0%, transparent 40%), radial-gradient(circle at 85% 30%, ${accentColor}15 0%, transparent 50%)`,
        }}
      />
      {/* Noise overlay */}
      <div className="fixed inset-0 pointer-events-none mix-blend-overlay opacity-30 grain-bg" />

      {/* Main content */}
      <div className="relative z-10 min-h-screen p-4 md:p-8 lg:p-12 animate-in fade-in duration-700 zoom-in-[0.98]">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* Hero Card - Flyer */}
          <div
            className="relative rounded-[2.5rem] overflow-hidden"
            style={{
              background: `linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)`,
              boxShadow: `0 30px 60px -15px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.5)`,
              backdropFilter: 'blur(10px)',
            }}
          >
            <div className="grid lg:grid-cols-[1fr_1.1fr] gap-0">
              {/* Flyer side */}
              <div className="relative aspect-[4/5] lg:aspect-auto lg:min-h-[650px] group overflow-hidden">
                {event.flyerUrl ? (
                  <Image
                    src={event.flyerUrl}
                    alt={event.title}
                    fill
                    className="object-cover transition-transform duration-1000 group-hover:scale-105 group-hover:rotate-1"
                    priority
                  />
                ) : (
                  <div
                    className="absolute inset-0 flex items-center justify-center transition-transform duration-1000 group-hover:scale-105"
                    style={{ background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}05)` }}
                  >
                    <span className={`${typographyClass} text-9xl`} style={{ color: accentColor, textShadow: `0 10px 30px ${accentColor}40` }}>
                      {event.title.charAt(0)}
                    </span>
                  </div>
                )}
                {/* Gradient overlay on mobile */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent lg:hidden" />
              </div>

              {/* Info side */}
              <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-between -mt-32 lg:mt-0 relative z-10">
                <div>
                  {/* Organizer */}
                  <div className="flex items-center gap-4 mb-8">
                    {event.organizer.logoUrl ? (
                      <div className="relative w-12 h-12 rounded-full overflow-hidden shadow-lg border border-white/10">
                        <Image src={event.organizer.logoUrl} alt={event.organizer.displayName} fill className="object-cover" />
                      </div>
                    ) : (
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shadow-lg"
                        style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                      >
                        {event.organizer.displayName.charAt(0)}
                      </div>
                    )}
                    <span className="text-sm font-bold tracking-widest uppercase text-white/50">{event.organizer.displayName}</span>
                  </div>

                  {/* Title */}
                  <h1 className={`${typographyClass} text-5xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight leading-[1.1]`}>
                    {event.title}
                  </h1>

                  {/* Description */}
                  {event.description && (
                    <p className="text-white/60 text-lg md:text-xl leading-relaxed mb-10 max-w-2xl font-light">
                      {event.description}
                    </p>
                  )}
                </div>

                {/* CTA Area */}
                <div className="mt-8 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-baseline sm:items-center justify-between gap-6">
                  <div className="flex items-baseline gap-3">
                    <span className={`${typographyClass} text-4xl md:text-5xl font-black`} style={{ color: accentColor }}>
                      {isRsvpEvent ? 'Free' : (lowestPrice === 0 ? 'Free' : formatCents(lowestPrice))}
                    </span>
                    {!isRsvpEvent && lowestPrice > 0 && (
                      <span className="text-white/40 text-sm font-bold uppercase tracking-widest">and up</span>
                    )}
                  </div>
                  {hasAvailability ? (
                    <Link
                      href={ctaUrl}
                      className="inline-flex items-center justify-center gap-3 px-10 py-5 rounded-2xl text-black font-bold text-lg transition-all hover:scale-[1.03] active:scale-[0.98] w-full sm:w-auto"
                      style={{
                        backgroundColor: accentColor,
                        boxShadow: `0 15px 40px ${accentColor}40`,
                      }}
                    >
                      {ctaText}
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  ) : (
                    <div className="inline-flex items-center justify-center px-10 py-5 rounded-2xl bg-white/5 text-white/30 font-bold text-lg w-full sm:w-auto">
                      {isRsvpEvent ? 'Full' : 'Sold Out'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Info Cards Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-8 duration-700 delay-100 fill-mode-both">
            {/* Date & Time Card */}
            <div
              className="p-8 rounded-[2rem] hover:-translate-y-2 transition-transform duration-500"
              style={{
                background: 'rgba(255,255,255,0.02)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <div className="flex items-center gap-4 mb-6">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: `${accentColor}15`, boxShadow: `0 4px 20px ${accentColor}20` }}
                >
                  <CalendarDays className="w-6 h-6" style={{ color: accentColor }} />
                </div>
                <span className="text-xs font-bold tracking-widest text-white/40 uppercase">When</span>
              </div>
              <p className={`${typographyClass} text-2xl md:text-3xl font-bold mb-2`}>{dayStr}</p>
              <p className="text-white/50 text-lg">{dateStr} &middot; {timeStr}</p>
            </div>

            {/* Location Card */}
            <div
              className="p-8 rounded-[2rem] hover:-translate-y-2 transition-transform duration-500"
              style={{
                background: 'rgba(255,255,255,0.02)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <div className="flex items-center gap-4 mb-6">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: `${accentColor}15`, boxShadow: `0 4px 20px ${accentColor}20` }}
                >
                  <MapPin className="w-6 h-6" style={{ color: accentColor }} />
                </div>
                <span className="text-xs font-bold tracking-widest text-white/40 uppercase">Where</span>
              </div>
              {showLocation ? (
                <>
                  <p className={`${typographyClass} text-2xl md:text-3xl font-bold mb-2`}>{event.venueName}</p>
                  <p className="text-white/50 text-lg mb-4">{event.city}{event.state ? `, ${event.state}` : ''}</p>
                  {mapUrl && (
                    <a
                      href={mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider group"
                      style={{ color: accentColor }}
                    >
                      View map <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </a>
                  )}
                </>
              ) : (
                <>
                  <p className={`${typographyClass} text-2xl md:text-3xl font-bold mb-2 flex items-center gap-3`}>
                    <Lock className="w-6 h-6" /> Hidden
                  </p>
                  <p className="text-white/50 text-lg">Revealed after {isRsvpEvent ? 'RSVP' : 'purchase'}</p>
                </>
              )}
            </div>

            {/* Tickets Card */}
            <div
              className="p-8 rounded-[2rem] md:col-span-2 lg:col-span-1 hover:-translate-y-2 transition-transform duration-500"
              style={{
                background: 'rgba(255,255,255,0.02)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <div className="flex items-center gap-4 mb-6">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: `${accentColor}15`, boxShadow: `0 4px 20px ${accentColor}20` }}
                >
                  <Ticket className="w-6 h-6" style={{ color: accentColor }} />
                </div>
                <span className="text-xs font-bold tracking-widest text-white/40 uppercase">
                  {isRsvpEvent ? 'RSVP' : 'Tickets'}
                </span>
              </div>
              {isRsvpEvent ? (
                <>
                  <p className={`${typographyClass} text-2xl md:text-3xl font-bold mb-2`}>Free Entry</p>
                  <p className="text-white/50 text-lg">
                    {/* rsvpSpotsLeft handling needs to be passed down if available */}
                    Open registration
                  </p>
                </>
              ) : (
                <>
                  <p className={`${typographyClass} text-2xl md:text-3xl font-bold mb-2`}>
                    {availableTiers.length} tier{availableTiers.length !== 1 ? 's' : ''} available
                  </p>
                  <p className="text-white/50 text-lg">{totalAvailable} remaining</p>
                </>
              )}
            </div>
          </div>

          {/* Lineup Card */}
          {lineup.length > 0 && (
            <div
              className="p-8 md:p-12 rounded-[2.5rem] animate-in slide-in-from-bottom-8 duration-700 delay-200 fill-mode-both"
              style={{
                background: 'rgba(255,255,255,0.02)',
                boxShadow: '0 15px 50px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <h3 className="text-sm font-bold tracking-[0.3em] text-white/40 uppercase mb-10">Lineup</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lineup.map((artist, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-5 p-5 rounded-2xl bg-white/[0.03] border border-white/5 group hover:bg-white/[0.05] transition-all hover:-translate-y-1 hover:shadow-xl"
                  >
                    {artist.imageUrl ? (
                      <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform">
                        <Image src={artist.imageUrl} alt={artist.name} fill className="object-cover" />
                      </div>
                    ) : (
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 text-2xl font-bold shadow-lg group-hover:scale-105 transition-transform"
                        style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
                      >
                        {artist.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col gap-1">
                        <p className={`${typographyClass} text-xl truncate font-bold`}>{artist.name}</p>
                        {artist.showtime && artist.showShowtime !== false && (
                          <span className="text-xs font-bold tracking-widest opacity-80" style={{ color: accentColor }}>
                            {artist.showtime}
                          </span>
                        )}
                      </div>
                      {artist.role && <p className="text-sm text-white/40 truncate mt-1">{artist.role}</p>}
                    </div>
                    {safeHref(artist.socialUrl) && (
                      <a href={safeHref(artist.socialUrl)!} target="_blank" rel="noopener noreferrer" className="text-white/20 hover:text-white p-2 transition-colors">
                        <Instagram className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ticket Tiers Card */}
          {!isRsvpEvent && availableTiers.length > 0 && (
            <div
              className="p-8 md:p-12 rounded-[2.5rem] animate-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both"
              style={{
                background: 'rgba(255,255,255,0.02)',
                boxShadow: '0 15px 50px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <h3 className="text-sm font-bold tracking-[0.3em] text-white/40 uppercase mb-10">Ticket Options</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableTiers.map((tier: any) => {
                  const available = tier.quantity - tier.quantitySold
                  const soldOut = available <= 0

                  return (
                    <div
                      key={tier.id}
                      className={`p-6 rounded-2xl border transition-all ${soldOut ? 'opacity-50 grayscale' : 'hover:-translate-y-1 hover:shadow-xl'}`}
                      style={{
                        backgroundColor: soldOut ? 'rgba(255,255,255,0.02)' : `${accentColor}05`,
                        borderColor: soldOut ? 'rgba(255,255,255,0.05)' : `${accentColor}30`,
                      }}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span className={`${typographyClass} text-xl font-bold`}>{tier.name}</span>
                        <span
                          className="text-2xl font-black"
                          style={{ color: soldOut ? 'rgba(255,255,255,0.3)' : accentColor }}
                        >
                          {tier.price === 0 ? 'Free' : formatCents(tier.price)}
                        </span>
                      </div>
                      {tier.description && (
                        <p className="text-sm text-white/60 mb-5 font-light">{tier.description}</p>
                      )}
                      <p className="text-xs font-bold tracking-widest uppercase text-white/40 bg-white/5 inline-block px-3 py-1 rounded-full">
                        {soldOut ? 'Sold out' : `${available} remaining`}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Map Card */}
          {showMap && mapEmbedUrl && (
            <div
              className="rounded-[2.5rem] overflow-hidden animate-in slide-in-from-bottom-8 duration-700 delay-400 fill-mode-both"
              style={{
                boxShadow: '0 20px 60px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <iframe
                src={mapEmbedUrl}
                width="100%"
                height="400"
                style={{ border: 0, filter: 'grayscale(0.8) contrast(1.2) brightness(0.9) sepia(0.2)' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          )}

          {/* Info Sections */}
          <div className="animate-in fade-in duration-700 delay-500 fill-mode-both">
            <EventInfoSections
              about={event.about}
              refundPolicy={event.refundPolicy}
              faqs={event.faqs}
              variant="default"
              accentColor={accentColor}
            />
          </div>

          {/* Footer */}
          <footer className="text-center py-12 text-sm font-bold tracking-[0.2em] text-white/30 uppercase mt-12 animate-in fade-in duration-700 delay-700 fill-mode-both">
            <a href="https://afters.am" className="hover:text-white transition-colors">afters.am</a>
          </footer>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 pb-6 bg-[#0a0a0a]/90 backdrop-blur-2xl border-t border-white/5 z-50">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold tracking-widest uppercase text-white/40 mb-1">{isRsvpEvent ? 'Entry' : 'From'}</div>
            <div className={`${typographyClass} text-2xl font-bold`} style={{ color: accentColor }}>
              {isRsvpEvent ? 'Free' : (lowestPrice === 0 ? 'Free' : formatCents(lowestPrice))}
            </div>
          </div>
          {hasAvailability ? (
            <Link
              href={ctaUrl}
              className="px-8 py-4 rounded-xl text-black font-bold uppercase tracking-wider shadow-lg active:scale-95 transition-transform"
              style={{ backgroundColor: accentColor }}
            >
              {ctaText}
            </Link>
          ) : (
            <div className="px-8 py-4 rounded-xl bg-white/5 text-white/30 font-bold uppercase tracking-wider">{isRsvpEvent ? 'Full' : 'Sold Out'}</div>
          )}
        </div>
      </div>
    </div>
  )
}
