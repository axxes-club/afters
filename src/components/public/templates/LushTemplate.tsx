import React from "react"
import Link from "next/link"
import Image from "next/image"
import { Lock, MapPin, CalendarDays, Clock, Users, Ticket, Instagram, ArrowRight } from "lucide-react"
import { ViewTracker } from "@/components/ViewTracker"
import EventInfoSections from "@/components/public/EventInfoSections"
import { formatCents } from "@/lib/stripe"
import { safeHref } from "@/lib/security"
import type { EventTemplateProps, LineupArtist } from "./types"

export default function LushTemplate(props: EventTemplateProps) {
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

  // Get ticket tiers
  const availableTiers = event.organizer?.stripeChargesEnabled
    ? event.ticketTiers
    : event.ticketTiers.filter((tier) => tier.price === 0)

  return (
    <div className="min-h-screen font-serif" style={{ backgroundColor, color: textColor }}>
      <ViewTracker eventId={event.id} />
      {rescheduledBannerElement}

      {/* Warm gradient overlay */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0 opacity-40 mix-blend-screen"
          style={{
            background: `radial-gradient(circle at 30% 20%, ${accentColor} 0%, transparent 60%)`
          }}
        />
        <div
          className="absolute inset-0 opacity-20 mix-blend-screen"
          style={{
            background: `radial-gradient(circle at 80% 80%, ${accentColor} 0%, transparent 50%)`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80" />
      </div>

      {/* Two-column layout */}
      <div className="relative z-10 grid lg:grid-cols-[1.2fr_1fr] min-h-screen animate-in fade-in duration-1000">
        {/* Left: Flyer with backdrop blur card */}
        <div className="relative p-6 lg:p-16 flex items-start justify-center">
          <div className="w-full max-w-xl sticky top-16">
            {event.flyerUrl ? (
              <div className="relative w-full aspect-[4/5] rounded-[2rem] overflow-hidden group shadow-2xl">
                <Image
                  src={event.flyerUrl}
                  alt={event.title}
                  fill
                  className="object-cover transition-transform duration-1000 group-hover:scale-105"
                  priority
                />
                {/* Subtle overlay on hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                  style={{
                    background: `linear-gradient(180deg, transparent 0%, ${accentColor}40 100%)`
                  }}
                />
                {/* Glassmorphic border inset */}
                <div className="absolute inset-0 border-[3px] border-white/10 rounded-[2rem] pointer-events-none mix-blend-overlay" />
              </div>
            ) : (
              <div
                className="w-full aspect-[4/5] rounded-[2rem] flex items-center justify-center backdrop-blur-3xl border border-white/20 shadow-2xl"
                style={{ backgroundColor: `${accentColor}20` }}
              >
                <span className={`${typographyClass} text-9xl font-bold`} style={{ color: accentColor, textShadow: `0 4px 30px ${accentColor}80` }}>
                  {event.title.charAt(0)}
                </span>
              </div>
            )}

            {/* Quick info card below flyer */}
            <div className="mt-8 p-8 rounded-3xl backdrop-blur-2xl bg-white/5 border border-white/10 shadow-xl animate-in slide-in-from-bottom-8 duration-700 delay-200 fill-mode-both">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <CalendarDays className="w-5 h-5" style={{ color: accentColor }} />
                  <span className="text-base font-medium tracking-wide">{dayStr}, {dateStr}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5" style={{ color: accentColor }} />
                  <span className="text-base font-medium tracking-wide">{timeStr}</span>
                </div>
              </div>
              {showLocation && (
                <div className="flex items-start gap-3 pt-6 border-t border-white/10">
                  <MapPin className="w-5 h-5 mt-1" style={{ color: accentColor }} />
                  <div className="text-base">
                    <div className="font-semibold text-lg tracking-wide">{event.venueName}</div>
                    {locationPrecision === 'exact' && (
                      <div className="text-white/60 mt-1">{event.venueAddress}</div>
                    )}
                    <div className="text-white/40 mt-1">
                      {event.city}{event.state ? `, ${event.state}` : ''}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Event details */}
        <div className="relative p-6 lg:p-16 lg:pt-16">
          {/* Organizer badge */}
          <div className="flex items-center gap-4 mb-12 animate-in fade-in duration-700 delay-300 fill-mode-both">
            {event.organizer?.logoUrl ? (
              <div className="relative w-14 h-14 rounded-full overflow-hidden ring-2 ring-white/20 shadow-lg">
                <Image
                  src={event.organizer.logoUrl}
                  alt={event.organizer?.displayName ?? 'Organizer'}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold shadow-lg"
                style={{ backgroundColor: `${accentColor}30`, color: accentColor }}
              >
                {event.organizer?.displayName?.charAt(0) ?? 'U'}
              </div>
            )}
            <div>
              <div className="text-sm font-semibold tracking-widest uppercase mb-1">{event.organizer?.displayName ?? 'Unknown Organizer'}</div>
              <div className="text-xs text-white/40 uppercase tracking-widest">Presents</div>
            </div>
          </div>

          {/* Event title */}
          <h1 className={`${typographyClass} text-5xl lg:text-7xl font-semibold mb-10 leading-[1.1] animate-in slide-in-from-bottom-4 duration-700 delay-400 fill-mode-both`}>
            {event.title}
          </h1>

          {/* Description */}
          {event.description && (
            <div className="mb-12 text-white/80 leading-loose text-lg font-light animate-in fade-in duration-700 delay-500 fill-mode-both">
              {event.description}
            </div>
          )}

          {/* Lineup */}
          {lineup.length > 0 && (
            <div className="mb-12 animate-in fade-in duration-700 delay-600 fill-mode-both">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 mb-6">Featuring</h2>
              <div className="space-y-4">
                {lineup.map((artist: LineupArtist, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors duration-300 backdrop-blur-md border border-white/5"
                  >
                    {artist.imageUrl ? (
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden shadow-md">
                        <Image
                          src={artist.imageUrl}
                          alt={artist.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div
                        className="w-16 h-16 rounded-xl flex items-center justify-center font-bold text-2xl shadow-md"
                        style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                      >
                        {artist.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-semibold text-xl tracking-wide">{artist.name}</div>
                      {artist.role && (
                        <div className="text-sm text-white/50 mt-1 italic">{artist.role}</div>
                      )}
                    </div>
                    {artist.showtime && artist.showShowtime !== false && (
                      <span className="text-sm font-medium tracking-wider" style={{ color: accentColor }}>
                        {artist.showtime}
                      </span>
                    )}
                    {safeHref(artist.socialUrl) && (
                      <a
                        href={safeHref(artist.socialUrl)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 hover:bg-white/10 rounded-xl transition-colors"
                      >
                        <Instagram className="w-5 h-5" style={{ color: accentColor }} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Age restriction */}
          {event.ageRestriction && (
            <div className="mb-12 p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm animate-in fade-in duration-700 delay-700 fill-mode-both">
              <div className="flex items-center gap-3 text-base">
                <Lock className="w-5 h-5" style={{ color: accentColor }} />
                <span className="text-white/70 font-medium tracking-wide">
                  Strictly {event.ageRestriction}+
                </span>
              </div>
            </div>
          )}

          {/* Tickets/RSVP */}
          <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700 delay-800 fill-mode-both">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 mb-2">
              {isRsvpEvent ? 'Guestlist' : 'Reservations'}
            </h2>

            {isRsvpEvent ? (
              <div className="p-8 rounded-[2rem] backdrop-blur-2xl border border-white/20 shadow-2xl relative overflow-hidden" style={{ backgroundColor: `${accentColor}15` }}>
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                <div className="relative z-10 flex items-center justify-between mb-8">
                  <div>
                    <div className="text-3xl font-bold tracking-tight" style={{ color: accentColor }}>Complimentary</div>
                    <div className="text-base text-white/70 mt-2 font-medium tracking-wide">RSVP Required for Entry</div>
                  </div>
                  <Users className="w-10 h-10 opacity-30" style={{ color: accentColor }} />
                </div>
                {hasAvailability ? (
                  <Link
                    href={ctaUrl}
                    className="block w-full py-5 rounded-xl text-center font-bold text-lg tracking-widest uppercase transition-all duration-300 hover:scale-[1.02] active:scale-95"
                    style={{
                      backgroundColor: accentColor,
                      color: '#000',
                      boxShadow: `0 10px 40px ${accentColor}50`
                    }}
                  >
                    Request RSVP
                  </Link>
                ) : (
                  <div className="w-full py-5 rounded-xl text-center font-bold tracking-widest uppercase bg-black/40 text-white/30 backdrop-blur-md">
                    Guestlist Closed
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {availableTiers.map((tier) => (
                    <div
                      key={tier.id}
                      className="p-6 rounded-2xl backdrop-blur-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-xl tracking-wide">{tier.name}</h3>
                        <div className="text-3xl font-bold" style={{ color: accentColor }}>
                          {tier.price === 0 ? 'Free' : formatCents(tier.price)}
                        </div>
                      </div>
                      {tier.description && (
                        <p className="text-base text-white/60 mb-5 font-light">{tier.description}</p>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/40 font-medium tracking-wide uppercase text-xs">
                          {tier.quantity - tier.quantitySold} / {tier.quantity} Available
                        </span>
                        <Ticket className="w-5 h-5 text-white/20 group-hover:text-white/40 transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>

                {hasAvailability && (
                  <Link
                    href={ctaUrl}
                    className="block w-full py-6 rounded-2xl text-center font-bold text-xl tracking-widest uppercase transition-all duration-300 hover:scale-[1.02] active:scale-95 mt-8 shadow-2xl relative overflow-hidden group"
                    style={{
                      backgroundColor: accentColor,
                      color: '#000',
                      boxShadow: `0 12px 50px ${accentColor}50`
                    }}
                  >
                    <div className="absolute inset-0 bg-white/20 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                    Reserve Tickets
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Map */}
          {showMap && mapEmbedUrl && (
            <div className="mt-12 animate-in fade-in duration-700 delay-1000 fill-mode-both">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 mb-6">Location</h2>
              <div className="rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
                <iframe
                  src={mapEmbedUrl}
                  width="100%"
                  height="350"
                  style={{ border: 0, filter: 'sepia(0.3) saturate(0.8) contrast(1.1) brightness(0.7)' }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          )}

          {/* Organizer social */}
          {safeHref(event.organizer.instagramUrl) && (
            <div className="mt-12 pt-8 border-t border-white/10 animate-in fade-in duration-700 delay-1000 fill-mode-both">
              <a
                href={safeHref(event.organizer.instagramUrl)!}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-5 rounded-2xl bg-white/5 hover:bg-white/10 transition-all duration-300 group backdrop-blur-sm"
              >
                <Instagram className="w-6 h-6 transition-colors" style={{ color: accentColor }} />
                <span className="text-base font-semibold tracking-wide group-hover:underline decoration-white/30 underline-offset-4">
                  Follow {event.organizer.displayName} on Instagram
                </span>
                <ArrowRight className="w-5 h-5 ml-auto opacity-40 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Info Sections */}
      <div className="relative z-10 px-6 py-20 border-t border-white/10 bg-black/40 backdrop-blur-3xl">
        <div className="max-w-4xl mx-auto">
          <EventInfoSections
            about={event.about}
            refundPolicy={event.refundPolicy}
            faqs={event.faqs}
            variant="lush"
            accentColor={accentColor}
          />
        </div>
      </div>
      
      {/* Footer */}
      <footer className="relative z-10 text-center py-12 text-sm uppercase tracking-[0.3em] font-semibold text-white/30 bg-black">
        <a href="https://afters.am" className="hover:text-white hover:tracking-[0.4em] transition-all duration-500">afters.am</a>
      </footer>
    </div>
  )
}
