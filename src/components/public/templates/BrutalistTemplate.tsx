import React from "react"
import Link from "next/link"
import Image from "next/image"
import { Lock, ExternalLink } from "lucide-react"
import { ViewTracker } from "@/components/ViewTracker"
import { SeriesBadge } from "@/components/events/SeriesBadge"
import EventInfoSections from "@/components/public/EventInfoSections"
import { formatCents } from "@/lib/stripe"
import type { EventTemplateProps } from "./types"

export default function BrutalistTemplate(props: EventTemplateProps) {
  const {
    event,
    accentColor,
    backgroundColor,
    typographyClass,
    textColor,
    accentTextColor,
    dateStr,
    timeStr,
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

  return (
    <div className={`min-h-screen font-mono ${typographyClass}`} style={{ backgroundColor, color: textColor }}>
      <ViewTracker eventId={event.id} />
      {rescheduledBannerElement}

      {/* Exposed grid background */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.04]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(${accentColor} 2px, transparent 2px),
              linear-gradient(90deg, ${accentColor} 2px, transparent 2px)
            `,
            backgroundSize: '100px 100px',
          }}
        />
      </div>

      {/* Top accent bar */}
      <div className="h-4 w-full" style={{ backgroundColor: accentColor }} />

      {/* Two-column harsh grid layout */}
      <div className="relative z-10 grid lg:grid-cols-2 min-h-[calc(100vh-4rem)]">
        {/* Left: Flyer with harsh border */}
        <div className="relative p-6 lg:p-12 flex items-center justify-center border-b-4 lg:border-b-0 lg:border-r-4" style={{ borderColor: accentColor }}>
          {event.flyerUrl ? (
            <div className="relative w-full max-w-md aspect-[3/4] border-8 shadow-[16px_16px_0_0_rgba(0,0,0,1)] transition-transform hover:-translate-y-2 hover:-translate-x-2" style={{ borderColor: accentColor, boxShadow: `16px 16px 0 0 ${accentColor}` }}>
              <Image
                src={event.flyerUrl}
                alt={event.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          ) : (
            <div
              className="w-full max-w-md aspect-[3/4] border-8 flex items-center justify-center shadow-[16px_16px_0_0_rgba(0,0,0,1)] transition-transform hover:-translate-y-2 hover:-translate-x-2"
              style={{ borderColor: accentColor, backgroundColor: `${accentColor}10`, boxShadow: `16px 16px 0 0 ${accentColor}` }}
            >
              <span className={`${typographyClass} text-8xl`} style={{ color: accentColor }}>
                {event.title.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* Right: Info block */}
        <div className="p-6 lg:p-12 flex flex-col justify-between">
          {/* Header */}
          <div>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-4 h-4" style={{ backgroundColor: accentColor }} />
              <span className="text-xs tracking-[0.3em] uppercase font-bold" style={{ color: accentColor }}>
                {event.organizer.displayName}
              </span>
            </div>

            <h1 className={`${typographyClass} text-6xl lg:text-8xl font-black tracking-tighter mb-8 uppercase leading-none break-words`}>
              {event.title}
            </h1>

            {/* Date/Time in monospace blocks */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="border-4 p-4 hover:bg-white/5 transition-colors" style={{ borderColor: accentColor }}>
                <div className="text-[10px] tracking-widest uppercase mb-2 font-bold" style={{ color: accentColor }}>DATE</div>
                <div className="text-xl font-bold">{dateStr}</div>
              </div>
              <div className="border-4 p-4 hover:bg-white/5 transition-colors" style={{ borderColor: accentColor }}>
                <div className="text-[10px] tracking-widest uppercase mb-2 font-bold" style={{ color: accentColor }}>TIME</div>
                <div className="text-xl font-bold">{timeStr}</div>
              </div>
              <div className="border-4 p-4 hover:bg-white/5 transition-colors" style={{ borderColor: accentColor }}>
                <div className="text-[10px] tracking-widest uppercase mb-2 font-bold" style={{ color: accentColor }}>PRICE</div>
                <div className="text-xl font-black" style={{ color: accentColor }}>
                  {lowestPrice === 0 ? 'FREE' : formatCents(lowestPrice)}
                </div>
              </div>
            </div>

            {/* Series Badge */}
            {event.series && (
              <div className="mb-8">
                <SeriesBadge
                  seriesTitle={event.series.title}
                  currentOccurrence={event.seriesOccurrence}
                  upcomingOccurrences={seriesOccurrences as any}
                  accentColor={accentColor}
                  variant="block"
                />
              </div>
            )}

            {/* Location */}
            {showLocation ? (
              <div className="border-l-8 pl-6 mb-8" style={{ borderColor: accentColor }}>
                <div className="text-xs tracking-widest uppercase mb-2 font-bold" style={{ color: accentColor }}>LOCATION</div>
                <div className="text-2xl font-black uppercase">{event.venueName}</div>
                {locationPrecision === 'exact' && (
                  <div className="text-base mt-2 opacity-80">{event.venueAddress}</div>
                )}
                <div className="text-sm mt-1 opacity-60">{event.city}{event.state ? `, ${event.state}` : ''}</div>
                {mapUrl && (
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-4 text-xs font-bold tracking-widest uppercase hover:underline p-2 border-2"
                    style={{ color: accentColor, borderColor: accentColor }}
                  >
                    VIEW MAP <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            ) : (
              <div className="border-l-8 pl-6 mb-8" style={{ borderColor: accentColor }}>
                <div className="text-xs tracking-widest uppercase mb-2 font-bold" style={{ color: accentColor }}>LOCATION</div>
                <div className="text-2xl font-black uppercase flex items-center gap-3">
                  <Lock className="w-6 h-6" style={{ color: accentColor }} />
                  {event.city}
                </div>
                <div className="text-sm opacity-60 mt-2 font-bold uppercase">Address revealed on ticket</div>
              </div>
            )}

            {/* Map embed */}
            {showMap && mapEmbedUrl && (
              <div className="mb-12 border-8 shadow-[8px_8px_0_0_rgba(0,0,0,1)]" style={{ borderColor: accentColor, boxShadow: `8px 8px 0 0 ${accentColor}` }}>
                <iframe
                  src={mapEmbedUrl}
                  className="w-full h-64 grayscale contrast-150"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            )}
          </div>

          {/* Lineup */}
          {lineup.length > 0 && (
            <div className="mb-12">
              <div className="text-xs tracking-widest uppercase mb-4 font-bold" style={{ color: accentColor }}>LINEUP</div>
              <div className="flex flex-wrap gap-3">
                {lineup.map((artist, i) => (
                  <div
                    key={i}
                    className="border-4 px-5 py-3 text-lg font-black uppercase flex items-center gap-3 hover:bg-white/10 transition-colors cursor-default"
                    style={{ borderColor: accentColor }}
                  >
                    <span>{artist.name}</span>
                    {artist.showtime && artist.showShowtime !== false && (
                      <span className="text-xs font-mono opacity-50">
                        {artist.showtime}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="mt-auto hidden lg:block">
            {hasAvailability ? (
              <Link
                href={ctaUrl}
                className="group block w-full p-8 text-center text-3xl font-black tracking-widest uppercase border-8 transition-all hover:-translate-y-1"
                style={{
                  borderColor: accentColor,
                  color: accentColor,
                  ['--accent' as any]: accentColor,
                }}
              >
                <span className="transition-colors group-hover:text-black">
                  {ctaText} <span className="inline-block transition-transform group-hover:translate-x-2">→</span>
                </span>
                <style>{`
                  .group:hover { background-color: var(--accent); }
                `}</style>
              </Link>
            ) : (
              <div className="w-full p-8 text-center text-3xl font-black tracking-widest uppercase border-8 border-white/20 text-white/30">
                {isRsvpEvent ? 'FULL' : 'SOLD OUT'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 z-50 bg-black/80 backdrop-blur-md border-t-4" style={{ borderColor: accentColor }}>
        {hasAvailability ? (
          <Link
            href={ctaUrl}
            className="block w-full p-4 text-center text-xl font-black tracking-widest uppercase active:scale-95 transition-transform"
            style={{ backgroundColor: accentColor, color: accentTextColor }}
          >
            {ctaText}{" // "}{isRsvpEvent ? 'FREE' : (lowestPrice === 0 ? 'FREE' : formatCents(lowestPrice))}
          </Link>
        ) : (
          <div className="w-full p-4 text-center text-xl font-black tracking-widest uppercase bg-white/10 text-white/30">
            {isRsvpEvent ? 'FULL' : 'SOLD OUT'}
          </div>
        )}
      </div>

      {/* Info Sections */}
      <div className="relative z-10 px-6 lg:px-12 pb-24 lg:pb-12 mt-12">
        <div className="border-t-4 pt-12" style={{ borderColor: accentColor }}>
          <EventInfoSections
            about={event.about}
            refundPolicy={event.refundPolicy}
            faqs={event.faqs}
            variant="brutalist"
            accentColor={accentColor}
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-6 lg:px-12 border-t-8" style={{ borderColor: accentColor }}>
        <div className="flex justify-between items-center text-sm font-bold tracking-widest uppercase">
          <span style={{ color: accentColor }} className="text-3xl">.</span>
          <a href="https://afters.am" className="hover:underline opacity-50 hover:opacity-100 transition-opacity" style={{ textDecorationColor: accentColor }}>afters.am</a>
        </div>
      </footer>
    </div>
  )
}
