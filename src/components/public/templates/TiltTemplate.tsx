import React from "react"
import Link from "next/link"
import Image from "next/image"
import { Lock } from "lucide-react"
import { ViewTracker } from "@/components/ViewTracker"
import EventInfoSections from "@/components/public/EventInfoSections"
import { formatCents } from "@/lib/stripe"
import type { EventTemplateProps } from "./types"

export default function TiltTemplate(props: EventTemplateProps) {
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
    mapEmbedUrl,
    rescheduledBannerElement,
    lowestPrice,
    hasAvailability,
    isRsvpEvent,
    ctaUrl,
    ctaText,
    lineup,
  } = props

  // Get ticket tiers
  const availableTiers = event.organizer?.stripeChargesEnabled
    ? event.ticketTiers
    : event.ticketTiers.filter((tier: any) => tier.price === 0)

  return (
    <div className="min-h-screen overflow-hidden" style={{ backgroundColor, color: textColor }}>
      <ViewTracker eventId={event.id} />
      {rescheduledBannerElement}

      {/* Chaotic background shapes with animations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden mix-blend-screen opacity-60">
        <div
          className="absolute -top-32 -left-32 w-96 h-96 border-[30px] rotate-[15deg] animate-[spin_60s_linear_infinite]"
          style={{ borderColor: accentColor, opacity: 0.15 }}
        />
        <div
          className="absolute -bottom-48 -right-48 w-[600px] h-[600px] -rotate-[20deg] animate-[spin_40s_linear_infinite_reverse]"
          style={{ backgroundColor: accentColor, opacity: 0.1 }}
        />
        <div className="absolute top-1/4 right-32 w-48 h-48 border-[12px] border-white rotate-45 opacity-5 animate-pulse" />
        <div
          className="absolute bottom-1/3 left-16 w-32 h-32 animate-bounce"
          style={{ backgroundColor: accentColor, opacity: 0.15, animationDuration: '4s' }}
        />
        <div
          className="absolute top-1/2 left-1/4 w-4 h-[800px] rotate-[35deg] animate-[pulse_5s_ease-in-out_infinite]"
          style={{ backgroundColor: accentColor, opacity: 0.15 }}
        />
      </div>

      <div className="relative z-10 animate-in zoom-in-95 fade-in duration-700 ease-out">
        {/* Main content - chaotic grid */}
        <main className="px-6 md:px-12 py-16 max-w-7xl mx-auto">
          {/* Title - large, tilted */}
          <div className="transform -rotate-3 mb-16 md:mb-24 hover:rotate-0 transition-transform duration-500 ease-out cursor-default">
            <h1
              className={`${typographyClass} text-7xl md:text-9xl lg:text-[12rem] font-black uppercase leading-[0.8] tracking-tighter mix-blend-normal hover:scale-105 transition-transform origin-left`}
              style={{ color: accentColor, textShadow: `8px 8px 0 rgba(255,255,255,0.1), -4px -4px 0 rgba(0,0,0,0.5)` }}
            >
              {event.title}
            </h1>
          </div>

          {/* Flyer and info - overlapping */}
          <div className="relative mb-32 flex flex-col md:flex-row items-center md:items-start justify-center gap-12">
            {/* Flyer - rotated */}
            {event.flyerUrl && (
              <div className="relative w-full max-w-lg aspect-[3/4] rotate-3 hover:rotate-6 hover:scale-105 transition-all duration-500 border-8 shadow-2xl z-20 group" style={{ borderColor: accentColor, boxShadow: `20px 20px 0 ${accentColor}40` }}>
                <Image
                  src={event.flyerUrl}
                  alt={event.title}
                  fill
                  className="object-cover group-hover:contrast-125 transition-all"
                  priority
                />
              </div>
            )}

            {/* Info box - overlapping, counter-rotated */}
            <div
              className="relative md:absolute md:-right-8 md:top-1/3 -rotate-3 hover:rotate-0 hover:scale-110 transition-all duration-500 mt-8 md:mt-0 p-8 border-8 bg-black/80 backdrop-blur-md max-w-md w-full shadow-2xl z-30"
              style={{ borderColor: accentColor, boxShadow: `-15px 15px 0 ${accentColor}80` }}
            >
              <div className="font-mono text-sm uppercase tracking-widest text-white/60 mb-6 bg-white/10 inline-block px-3 py-1 rotate-1">Event Info</div>

              <div className="space-y-8">
                <div className="rotate-2 transform hover:translate-x-2 transition-transform">
                  <div className="text-sm text-white/50 uppercase mb-2 tracking-widest font-bold">When</div>
                  <div className={`${typographyClass} text-3xl font-black uppercase`}>{dayStr}, {timeStr}</div>
                </div>

                <div className="-rotate-2 transform hover:-translate-x-2 transition-transform">
                  <div className="text-sm text-white/50 uppercase mb-2 tracking-widest font-bold">Where</div>
                  {showLocation ? (
                    <>
                      <div className={`${typographyClass} text-3xl font-black uppercase`}>{event.venueName}</div>
                      <div className="text-lg text-white/70 uppercase tracking-widest mt-1 font-bold">{event.city}</div>
                    </>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Lock className="w-6 h-6" style={{ color: accentColor }} />
                      <span className={`${typographyClass} text-3xl font-black`}>SECRET</span>
                    </div>
                  )}
                </div>

                <div className="rotate-1 transform hover:translate-x-2 transition-transform">
                  <div className="text-sm text-white/50 uppercase mb-2 tracking-widest font-bold">Price</div>
                  <div className={`${typographyClass} text-5xl font-black`} style={{ color: accentColor, textShadow: `3px 3px 0 rgba(255,255,255,0.2)` }}>
                    {lowestPrice === 0 ? 'FREE' : formatCents(lowestPrice)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Map - if enabled */}
          {showMap && mapEmbedUrl && (
            <div className="mb-32 -rotate-1 hover:rotate-1 transition-transform duration-700 border-8 max-w-4xl mx-auto shadow-2xl z-10 relative" style={{ borderColor: accentColor, boxShadow: `10px 10px 0 ${accentColor}60` }}>
              <iframe
                src={mapEmbedUrl}
                className="w-full h-80"
                style={{ border: 0, filter: 'contrast(1.5) saturate(1.2) hue-rotate(-20deg)' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          )}

          {/* Lineup - scattered */}
          {lineup.length > 0 && (
            <div className="mb-32 relative">
              <h2
                className={`${typographyClass} text-5xl md:text-7xl font-black uppercase rotate-3 mb-12 inline-block bg-black px-4 py-2 border-4 mix-blend-difference`}
                style={{ color: accentColor, borderColor: accentColor }}
              >
                LINEUP
              </h2>
              <div className="flex flex-wrap gap-6 justify-center md:justify-start">
                {lineup.map((artist, i) => (
                  <div
                    key={i}
                    className={`px-8 py-5 border-4 bg-black/60 backdrop-blur-sm shadow-xl hover:scale-110 hover:z-50 transition-all duration-300 ${i % 3 === 0 ? '-rotate-6' : i % 3 === 1 ? 'rotate-3' : '-rotate-2'}`}
                    style={{ borderColor: accentColor }}
                  >
                    <div className="font-black text-2xl uppercase tracking-wider">{artist.name}</div>
                    {artist.showtime && artist.showShowtime !== false && (
                      <div className="text-sm text-white/70 mt-2 font-mono bg-white/10 inline-block px-2 py-1">{artist.showtime}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="mb-32 max-w-2xl rotate-2 pl-8 border-l-8 bg-black/40 backdrop-blur p-8 shadow-2xl hover:rotate-0 transition-transform duration-500" style={{ borderColor: accentColor }}>
              <p className="text-white/80 text-xl font-bold leading-relaxed">{event.description}</p>
            </div>
          )}

          {/* Tickets - tilted cards */}
          <div className="mb-32">
            <h2
              className={`${typographyClass} text-5xl md:text-7xl font-black uppercase -rotate-2 mb-12 inline-block`}
              style={{ color: accentColor, textShadow: `4px 4px 0 rgba(255,255,255,0.1)` }}
            >
              TICKETS
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {availableTiers.map((tier: any, i) => {
                const available = tier.quantity - tier.quantitySold
                const soldOut = available <= 0

                return (
                  <div
                    key={tier.id}
                    className={`p-8 border-8 bg-black/50 backdrop-blur-md hover:scale-105 transition-all duration-300 ${soldOut ? 'opacity-40 grayscale' : 'hover:bg-black shadow-[10px_10px_0_rgba(255,255,255,0.1)]'} ${i % 2 === 0 ? '-rotate-3' : 'rotate-3'}`}
                    style={{ borderColor: accentColor }}
                  >
                    <div className={`${typographyClass} text-3xl font-black uppercase mb-4 break-words leading-none`}>{tier.name}</div>
                    <div
                      className={`${typographyClass} text-5xl font-black mb-6`}
                      style={{ color: soldOut ? 'rgba(255,255,255,0.3)' : accentColor }}
                    >
                      {tier.price === 0 ? 'FREE' : formatCents(tier.price)}
                    </div>
                    <div className="font-mono text-sm uppercase font-bold tracking-widest bg-white/10 inline-block px-3 py-1">
                      {soldOut ? 'SOLD OUT' : `${available} LEFT`}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mb-32 hidden md:block">
            {hasAvailability ? (
              <Link
                href={ctaUrl}
                className={`inline-block px-20 py-8 ${typographyClass} text-4xl font-black uppercase -rotate-3 hover:rotate-2 hover:scale-110 transition-all duration-300 border-8`}
                style={{ backgroundColor: accentColor, color: accentTextColor, borderColor: '#fff', boxShadow: `15px 15px 0 #fff` }}
              >
                {isRsvpEvent ? 'RSVP NOW' : 'GET TICKETS NOW'}
              </Link>
            ) : (
              <div className={`inline-block px-20 py-8 ${typographyClass} text-4xl font-black uppercase -rotate-3 bg-white/10 text-white/30 border-8 border-white/20`}>
                {isRsvpEvent ? 'FULL' : 'SOLD OUT'}
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="p-8 md:p-12 border-t-8 bg-black/80 backdrop-blur-md" style={{ borderColor: accentColor }}>
          <div className="flex justify-between items-center font-mono text-sm uppercase rotate-1 font-bold tracking-widest">
            <span style={{ color: accentColor }} className="font-headline text-3xl">.</span>
            <a href="https://afters.am" className="hover:underline opacity-60 hover:opacity-100 transition-opacity">afters.am</a>
          </div>
        </footer>
      </div>

      {/* Mobile sticky CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 z-50">
        <div className="rotate-1">
          {hasAvailability ? (
            <Link
              href={ctaUrl}
              className="block w-full py-5 text-center font-black text-2xl uppercase border-4 shadow-[5px_5px_0_#fff] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all"
              style={{ backgroundColor: accentColor, color: accentTextColor, borderColor: '#fff' }}
            >
              {ctaText}{" // "}{isRsvpEvent ? 'FREE' : (lowestPrice === 0 ? 'FREE' : formatCents(lowestPrice))}
            </Link>
          ) : (
            <div className="w-full py-5 text-center font-black text-2xl uppercase bg-zinc-900 border-4 border-white/20 text-white/30">
              {isRsvpEvent ? 'FULL' : 'SOLD OUT'}
            </div>
          )}
        </div>
      </div>

      {/* Info Sections */}
      <div className="container mx-auto px-6 py-16 rotate-1 mb-24 md:mb-0">
        <div className="border-4 p-6 bg-black/50 backdrop-blur" style={{ borderColor: accentColor }}>
          <EventInfoSections
            about={event.about}
            refundPolicy={event.refundPolicy}
            faqs={event.faqs}
            variant="tilt"
            accentColor={accentColor}
          />
        </div>
      </div>
    </div>
  )
}
