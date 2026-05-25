import React from "react"
import Link from "next/link"
import Image from "next/image"
import { Lock, MapPin, Users, Ticket, Instagram } from "lucide-react"
import { ViewTracker } from "@/components/ViewTracker"
import { SeriesBadge } from "@/components/events/SeriesBadge"
import EventInfoSections from "@/components/public/EventInfoSections"
import { formatCents } from "@/lib/stripe"
import { safeHref } from "@/lib/security"
import type { EventTemplateProps } from "./types"

export default function NeonTemplate(props: EventTemplateProps) {
  const {
    event,
    accentColor,
    backgroundColor,
    typographyClass,
    textColor,
    accentTextColor,
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
    seriesOccurrences,
  } = props

  // Get ticket tiers
  const availableTiers = event.organizer?.stripeChargesEnabled
    ? event.ticketTiers
    : event.ticketTiers.filter((tier: any) => tier.price === 0)

  return (
    <div className="min-h-screen relative overflow-hidden animate-in fade-in duration-1000" style={{ backgroundColor, color: textColor }}>
      <ViewTracker eventId={event.id} />
      {rescheduledBannerElement}

      {/* Ambient glow */}
      <div
        className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] md:w-[1000px] md:h-[1000px] rounded-full blur-[150px] md:blur-[250px] opacity-30 pointer-events-none"
        style={{ backgroundColor: accentColor }}
      />
      <div className="fixed inset-0 pointer-events-none grain z-50 opacity-40 mix-blend-overlay" />

      {/* Centered content layout */}
      <div className="relative z-10 min-h-screen flex flex-col items-center px-4 md:px-6 py-12 md:py-24">
        {/* Organizer */}
        <div className="flex items-center gap-4 mb-12 animate-in slide-in-from-bottom-4 duration-700 delay-100 fill-mode-both">
          {event.organizer?.logoUrl && (
            <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 shadow-[0_0_20px_rgba(255,255,255,0.2)]" style={{ borderColor: `${accentColor}80` }}>
              <Image src={event.organizer.logoUrl} alt={event.organizer?.displayName ?? 'Organizer'} fill className="object-cover" />
            </div>
          )}
          <span className="text-sm tracking-widest font-bold opacity-70 uppercase">{event.organizer?.displayName ?? 'Unknown Organizer'}</span>
        </div>

        {/* Flyer with intense glow */}
        <div
          className="relative w-full max-w-sm aspect-[3/4] mb-12 animate-in zoom-in-95 duration-1000 delay-200 fill-mode-both"
          style={{
            boxShadow: `0 0 100px ${accentColor}40, 0 0 200px ${accentColor}20`,
            borderRadius: '16px',
            overflow: 'hidden'
          }}
        >
          {event.flyerUrl ? (
            <Image
              src={event.flyerUrl}
              alt={event.title}
              fill
              className="object-cover hover:scale-105 transition-transform duration-1000"
              priority
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center border-2"
              style={{ borderColor: accentColor, backgroundColor: `${accentColor}10` }}
            >
              <span className={`${typographyClass} text-9xl`} style={{ color: accentColor, textShadow: `0 0 40px ${accentColor}` }}>
                {event.title.charAt(0)}
              </span>
            </div>
          )}
          {/* Inner Glow border */}
          <div
            className="absolute inset-0 border-2 pointer-events-none rounded-2xl"
            style={{ borderColor: `${accentColor}80`, boxShadow: `inset 0 0 40px ${accentColor}40` }}
          />
        </div>

        {/* Title with glow */}
        <h1
          className={`${typographyClass} text-5xl md:text-8xl text-center mb-6 font-black uppercase tracking-tight animate-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both`}
          style={{
            color: '#fff',
            textShadow: `0 0 20px ${accentColor}, 0 0 60px ${accentColor}, 0 0 100px ${accentColor}`,
          }}
        >
          {event.title}
        </h1>

        {/* Date/Time */}
        <div className="flex items-center gap-4 text-base tracking-widest uppercase font-bold opacity-80 mb-12 animate-in fade-in duration-700 delay-500 fill-mode-both">
          <span>{dayStr}</span>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor, boxShadow: `0 0 10px ${accentColor}` }} />
          <span>{dateStr}</span>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor, boxShadow: `0 0 10px ${accentColor}` }} />
          <span>{timeStr}</span>
        </div>

        {/* Series Badge */}
        {event.series && (
          <div className="mb-12">
            <SeriesBadge
              seriesTitle={event.series.title}
              currentOccurrence={event.seriesOccurrence}
              upcomingOccurrences={seriesOccurrences as any}
              accentColor={accentColor}
              variant="inline"
            />
          </div>
        )}

        {/* Location - Glassmorphic */}
        <div
          className="w-full max-w-md px-8 py-6 mb-12 rounded-3xl backdrop-blur-xl border animate-in slide-in-from-bottom-8 duration-700 delay-700 fill-mode-both"
          style={{
            borderColor: `${accentColor}30`,
            backgroundColor: 'rgba(0,0,0,0.4)',
            boxShadow: `0 8px 32px 0 ${accentColor}20, inset 0 0 0 1px ${accentColor}10`,
          }}
        >
          {showLocation ? (
            <div className="text-center">
              <div className="text-2xl font-bold mb-2 uppercase tracking-wide">{event.venueName}</div>
              {locationPrecision === 'exact' && (
                <div className="text-base opacity-70 mb-1">{event.venueAddress}</div>
              )}
              <div className="text-sm opacity-50 uppercase tracking-widest">{event.city}{event.state ? `, ${event.state}` : ''}</div>
              {mapUrl && (
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-6 text-sm font-bold uppercase tracking-widest hover:underline px-6 py-3 rounded-full transition-colors"
                  style={{ color: accentColor, backgroundColor: `${accentColor}10` }}
                >
                  <MapPin className="w-4 h-4" /> Open in Maps
                </a>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3 opacity-80 text-lg uppercase tracking-widest">
              <Lock className="w-5 h-5" style={{ color: accentColor }} />
              <span>{event.city} &bull; Secret Location</span>
            </div>
          )}
        </div>

        {/* Map */}
        {showMap && mapEmbedUrl && (
          <div
            className="w-full max-w-md mb-16 border-2 rounded-3xl overflow-hidden"
            style={{ borderColor: `${accentColor}30`, boxShadow: `0 0 60px ${accentColor}20` }}
          >
            <iframe
              src={mapEmbedUrl}
              className="w-full h-64"
              style={{ border: 0, filter: 'saturate(1.2) contrast(1.2) sepia(0.2) hue-rotate(180deg)' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        )}

        {/* Lineup - Glowing text */}
        {lineup.length > 0 && (
          <div className="w-full max-w-md mb-16">
            <h2
              className="text-center text-sm font-bold tracking-[0.4em] uppercase mb-8"
              style={{ color: accentColor, textShadow: `0 0 20px ${accentColor}` }}
            >
              Lineup
            </h2>
            <div className="space-y-4">
              {lineup.map((artist, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-5 rounded-2xl backdrop-blur-md transition-all hover:scale-105"
                  style={{ borderColor: `${accentColor}30`, backgroundColor: 'rgba(0,0,0,0.3)', border: `1px solid ${accentColor}30`, boxShadow: `0 4px 20px ${accentColor}10` }}
                >
                  {artist.imageUrl ? (
                    <div className="relative w-14 h-14 rounded-full overflow-hidden shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                      <Image src={artist.imageUrl} alt={artist.name} fill className="object-cover" />
                    </div>
                  ) : (
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center border"
                      style={{ backgroundColor: `${accentColor}20`, borderColor: accentColor, boxShadow: `0 0 20px ${accentColor}40` }}
                    >
                      <span className="text-xl" style={{ color: accentColor, textShadow: `0 0 10px ${accentColor}` }}>{artist.name.charAt(0)}</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className={`${typographyClass} text-2xl`}>{artist.name}</div>
                    {artist.role && <div className="text-xs uppercase tracking-widest opacity-50 mt-1">{artist.role}</div>}
                  </div>
                  {artist.showtime && artist.showShowtime !== false && (
                    <div className="text-sm font-mono tracking-wider" style={{ color: accentColor }}>
                      {artist.showtime}
                    </div>
                  )}
                  {safeHref(artist.socialUrl) && (
                    <a href={safeHref(artist.socialUrl)!} target="_blank" rel="noopener noreferrer" className="opacity-50 hover:opacity-100 transition-opacity p-2">
                      <Instagram className="w-6 h-6" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {event.description && (
          <div className="w-full max-w-lg mb-16 text-center">
            <p className="opacity-70 leading-loose text-lg font-medium">{event.description}</p>
          </div>
        )}

        {/* Tickets section */}
        <div className="w-full max-w-md mb-20">
          <h2
            className="text-center text-sm font-bold tracking-[0.4em] uppercase mb-8"
            style={{ color: accentColor, textShadow: `0 0 20px ${accentColor}` }}
          >
            Tickets
          </h2>
          <div className="space-y-4">
            {availableTiers.map((tier: any) => {
              const available = tier.quantity - tier.quantitySold
              const soldOut = available <= 0

              return (
                <div
                  key={tier.id}
                  className={`p-6 rounded-2xl backdrop-blur-md transition-all ${soldOut ? 'opacity-50 grayscale' : 'hover:scale-105 cursor-pointer'}`}
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    border: `1px solid ${soldOut ? 'rgba(255,255,255,0.1)' : accentColor}`,
                    boxShadow: soldOut ? 'none' : `0 4px 30px ${accentColor}20`
                  }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className={`${typographyClass} text-xl uppercase tracking-wider`}>{tier.name}</div>
                      {tier.description && <div className="text-sm opacity-50 mt-2">{tier.description}</div>}
                      <div className="text-xs font-bold uppercase tracking-widest opacity-50 mt-3">{soldOut ? 'Sold out' : `${available} left`}</div>
                    </div>
                    <div
                      className={`${typographyClass} text-3xl font-black`}
                      style={{
                        color: soldOut ? 'rgba(255,255,255,0.3)' : accentColor,
                        textShadow: soldOut ? 'none' : `0 0 20px ${accentColor}`
                      }}
                    >
                      {tier.price === 0 ? 'FREE' : formatCents(tier.price)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* CTA */}
        {hasAvailability ? (
          <Link
            href={ctaUrl}
            className="px-16 py-6 text-2xl font-black uppercase tracking-[0.2em] flex items-center gap-4 transition-all hover:scale-110 rounded-full"
            style={{
              backgroundColor: accentColor,
              color: '#000',
              boxShadow: `0 0 60px ${accentColor}80, inset 0 0 20px rgba(255,255,255,0.5)`,
            }}
          >
            {!isRsvpEvent && <Ticket className="w-7 h-7" />}
            {isRsvpEvent && <Users className="w-7 h-7" />}
            {ctaText}
          </Link>
        ) : (
          <div className="px-16 py-6 text-2xl font-black uppercase tracking-[0.2em] rounded-full border-2 border-white/20 text-white/30 backdrop-blur-md">
            {isRsvpEvent ? 'FULL' : 'SOLD OUT'}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-24 pt-12 border-t border-white/10 w-full text-center opacity-30 text-sm tracking-widest uppercase">
          <a href="https://afters.am" className="hover:opacity-100 transition-opacity">afters.am</a>
        </footer>
      </div>

      {/* Mobile sticky CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 z-50">
        <div className="backdrop-blur-xl rounded-full p-2 border shadow-2xl" style={{ backgroundColor: 'rgba(0,0,0,0.6)', borderColor: `${accentColor}50`, boxShadow: `0 0 40px ${accentColor}30` }}>
          <div className="flex items-center justify-between pl-6 pr-2 py-2">
            <div>
              <div className="text-xs uppercase tracking-widest font-bold opacity-50 mb-1">{isRsvpEvent ? 'Entry' : 'From'}</div>
              <div className={`${typographyClass} text-xl`} style={{ color: accentColor, textShadow: `0 0 10px ${accentColor}` }}>
                {isRsvpEvent ? 'FREE' : (lowestPrice === 0 ? 'FREE' : formatCents(lowestPrice))}
              </div>
            </div>
            {hasAvailability ? (
              <Link
                href={ctaUrl}
                className="px-8 py-4 rounded-full flex items-center gap-3 font-black uppercase tracking-widest text-sm transition-transform active:scale-95"
                style={{ backgroundColor: accentColor, color: '#000', boxShadow: `0 0 20px ${accentColor}` }}
              >
                {!isRsvpEvent && <Ticket className="w-4 h-4" />}
                {isRsvpEvent && <Users className="w-4 h-4" />}
                {ctaText}
              </Link>
            ) : (
              <div className="px-8 py-4 rounded-full bg-white/10 text-white/30 font-black uppercase tracking-widest text-sm">{isRsvpEvent ? 'FULL' : 'SOLD OUT'}</div>
            )}
          </div>
        </div>
      </div>

      {/* Info Sections */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12 mb-24 md:mb-0">
        <EventInfoSections
          about={event.about}
          refundPolicy={event.refundPolicy}
          faqs={event.faqs}
          variant="neon"
          accentColor={accentColor}
        />
      </div>
    </div>
  )
}
