import React from "react"
import Link from "next/link"
import Image from "next/image"
import { Lock, MapPin, ExternalLink } from "lucide-react"
import { ViewTracker } from "@/components/ViewTracker"
import EventInfoSections from "@/components/public/EventInfoSections"
import { formatCents } from "@/lib/stripe"
import type { EventTemplateProps } from "./types"

export default function VaporTemplate(props: EventTemplateProps) {
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
    mapUrl,
    locationPrecision,
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
    <div className="min-h-screen overflow-hidden selection:bg-[#ff00ff]/30 selection:text-white" style={{ backgroundColor, color: textColor }}>
      <ViewTracker eventId={event.id} />
      {rescheduledBannerElement}

      {/* Vaporwave gradient background */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `linear-gradient(180deg, #1a0a2e 0%, #0a0612 50%, ${accentColor}15 100%)`,
        }}
      />

      {/* Scan lines overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-20 z-10 mix-blend-overlay"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.8) 2px, rgba(0,0,0,0.8) 4px)',
        }}
      />

      {/* Perspective grid floor */}
      <div className="fixed bottom-0 left-0 right-0 h-[45vh] pointer-events-none overflow-hidden z-0 opacity-60">
        <div
          className="absolute inset-0"
          style={{
            background: `
              repeating-linear-gradient(90deg, ${accentColor}60 0px, ${accentColor}60 2px, transparent 2px, transparent 80px),
              repeating-linear-gradient(0deg, ${accentColor}60 0px, ${accentColor}60 2px, transparent 2px, transparent 80px)
            `,
            transform: 'perspective(300px) rotateX(60deg)',
            transformOrigin: 'bottom center',
            animation: 'gridMove 10s linear infinite',
          }}
        />
        {/* Ground glow */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#0a0612] to-transparent" />
      </div>

      {/* Sun element */}
      <div
        className="fixed bottom-[35vh] left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none z-0"
        style={{
          background: `linear-gradient(180deg, #ffeb3b 0%, #ff00ff 45%, #ff6600 70%, transparent 100%)`,
          borderRadius: '100% 100% 0 0',
          filter: 'blur(3px) drop-shadow(0 0 50px #ff00ff)',
          opacity: 0.85,
          maskImage: 'repeating-linear-gradient(0deg, black 0px, black 4px, transparent 4px, transparent 10px)',
          WebkitMaskImage: 'repeating-linear-gradient(0deg, black 0px, black 4px, transparent 4px, transparent 10px)',
        }}
      />

      {/* Added animation styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes gridMove {
          0% { background-position: 0 0; }
          100% { background-position: 0 80px; }
        }
        @keyframes glitch {
          0% { transform: translate(0) }
          20% { transform: translate(-2px, 2px) }
          40% { transform: translate(-2px, -2px) }
          60% { transform: translate(2px, 2px) }
          80% { transform: translate(2px, -2px) }
          100% { transform: translate(0) }
        }
        .hover-glitch:hover {
          animation: glitch 0.3s cubic-bezier(.25, .46, .45, .94) both infinite;
        }
      `}} />

      {/* Main content */}
      <div className="relative z-20 min-h-screen">
        {/* Hero Section */}
        <section className="min-h-screen flex flex-col items-center justify-center px-6 text-center relative pt-12 pb-24">
          {/* Flyer with chrome frame */}
          {event.flyerUrl && (
            <div
              className="relative w-72 md:w-96 aspect-[3/4] mb-12 animate-in zoom-in-95 duration-1000 group cursor-crosshair hover-glitch"
              style={{
                boxShadow: `0 0 80px ${accentColor}60, 0 0 150px ${accentColor}30, inset 0 0 80px ${accentColor}20`,
                border: `4px solid ${accentColor}`,
              }}
            >
              <Image src={event.flyerUrl} alt={event.title} fill className="object-cover contrast-125 saturate-150 group-hover:hue-rotate-90 transition-all duration-1000" priority />
              {/* Corner accents */}
              <div className="absolute -top-2 -left-2 w-6 h-6 border-l-4 border-t-4" style={{ borderColor: '#00ffff', boxShadow: '-5px -5px 10px #00ffff' }} />
              <div className="absolute -top-2 -right-2 w-6 h-6 border-r-4 border-t-4" style={{ borderColor: '#00ffff', boxShadow: '5px -5px 10px #00ffff' }} />
              <div className="absolute -bottom-2 -left-2 w-6 h-6 border-l-4 border-b-4" style={{ borderColor: '#ff00ff', boxShadow: '-5px 5px 10px #ff00ff' }} />
              <div className="absolute -bottom-2 -right-2 w-6 h-6 border-r-4 border-b-4" style={{ borderColor: '#ff00ff', boxShadow: '5px 5px 10px #ff00ff' }} />
            </div>
          )}

          {/* Chrome text title */}
          <h1
            className={`${typographyClass} text-6xl md:text-8xl lg:text-[8rem] font-black tracking-widest mb-6 uppercase leading-none animate-in slide-in-from-bottom-8 duration-1000`}
            style={{
              color: 'transparent',
              WebkitTextStroke: `2px ${accentColor}`,
              backgroundImage: `linear-gradient(180deg, #fff 0%, ${accentColor} 50%, #00ffff 100%)`,
              WebkitBackgroundClip: 'text',
              textShadow: `0 0 20px ${accentColor}, 0 0 60px ${accentColor}80, 4px 4px 0 #ff00ff, -4px -4px 0 #00ffff`,
            }}
          >
            {event.title}
          </h1>

          {/* Organizer */}
          <div
            className="text-sm md:text-base tracking-[0.4em] mb-12 px-6 py-3 font-bold animate-in fade-in duration-1000 delay-300 backdrop-blur-sm"
            style={{
              color: '#00ffff',
              textShadow: '0 0 15px #00ffff',
              border: '2px solid rgba(0, 255, 255, 0.5)',
              boxShadow: 'inset 0 0 20px rgba(0, 255, 255, 0.2), 0 0 20px rgba(0, 255, 255, 0.2)',
              background: 'rgba(0, 255, 255, 0.05)'
            }}
          >
            PRESENTED BY {event.organizer.displayName.toUpperCase()}
          </div>

          {/* Date/Time display */}
          <div className="flex flex-col sm:flex-row items-center gap-6 mb-16 animate-in fade-in duration-1000 delay-500">
            <div
              className="text-center px-10 py-5 backdrop-blur-md hover:-translate-y-1 transition-transform"
              style={{
                background: 'linear-gradient(180deg, rgba(255,0,255,0.2) 0%, rgba(255,0,255,0.05) 100%)',
                border: '2px solid rgba(255,0,255,0.6)',
                boxShadow: '0 0 30px rgba(255,0,255,0.2)'
              }}
            >
              <div className="font-mono text-3xl font-bold mb-1" style={{ color: '#ff00ff', textShadow: '0 0 15px #ff00ff' }}>
                {dateStr}
              </div>
              <div className="font-mono text-sm text-white/70 tracking-[0.2em] font-bold">{dayStr.toUpperCase()}</div>
            </div>
            <div
              className="text-center px-10 py-5 backdrop-blur-md hover:-translate-y-1 transition-transform"
              style={{
                background: 'linear-gradient(180deg, rgba(0,255,255,0.2) 0%, rgba(0,255,255,0.05) 100%)',
                border: '2px solid rgba(0,255,255,0.6)',
                boxShadow: '0 0 30px rgba(0,255,255,0.2)'
              }}
            >
              <div className="font-mono text-3xl font-bold mb-1" style={{ color: '#00ffff', textShadow: '0 0 15px #00ffff' }}>
                {timeStr}
              </div>
              <div className="font-mono text-sm text-white/70 tracking-[0.2em] font-bold">DOORS OPEN</div>
            </div>
          </div>

          {/* CTA */}
          <div className="animate-in slide-in-from-bottom-8 duration-1000 delay-700 w-full max-w-sm mx-auto">
            {hasAvailability ? (
              <Link
                href={ctaUrl}
                className="relative block w-full px-12 py-6 font-mono text-2xl font-black tracking-[0.2em] text-black hover:scale-105 transition-transform group"
                style={{
                  background: `linear-gradient(90deg, ${accentColor}, #ff00ff, #00ffff)`,
                  boxShadow: `0 0 40px ${accentColor}80, 0 0 80px ${accentColor}40`,
                  border: '2px solid #fff'
                }}
              >
                <span className="relative z-10 drop-shadow-[0_2px_2px_rgba(255,255,255,0.8)]">{ctaText}</span>
                {/* Glitch effect layers */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    background: `linear-gradient(90deg, #00ffff, ${accentColor}, #ff00ff)`,
                    clipPath: 'inset(40% 0 40% 0)',
                    transform: 'translateX(4px)',
                  }}
                />
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    background: `linear-gradient(90deg, #ff00ff, #00ffff, ${accentColor})`,
                    clipPath: 'inset(10% 0 80% 0)',
                    transform: 'translateX(-4px)',
                  }}
                />
              </Link>
            ) : (
              <div className="w-full px-12 py-6 font-mono text-xl text-white/40 border-2 border-white/20 tracking-widest font-bold backdrop-blur-sm bg-black/40">
                {isRsvpEvent ? 'CAPACITY REACHED' : 'SOLD OUT'}
              </div>
            )}

            {/* Price tag */}
            <div className="mt-8 font-mono text-lg font-bold tracking-widest" style={{ color: accentColor, textShadow: `0 0 10px ${accentColor}` }}>
              {isRsvpEvent ? '// FREE ENTRY' : `// FROM ${lowestPrice === 0 ? 'FREE' : formatCents(lowestPrice)}`}
            </div>
          </div>
        </section>

        {/* Info Section */}
        <section className="py-24 px-6 relative bg-[#0a0612]/80 backdrop-blur-xl border-t-2" style={{ borderColor: accentColor }}>
          <div className="max-w-5xl mx-auto">
            {/* Section divider */}
            <div className="flex items-center gap-6 mb-16">
              <div className="flex-1 h-1" style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }} />
              <span className="font-mono text-xl tracking-[0.5em] font-bold" style={{ color: accentColor, textShadow: `0 0 15px ${accentColor}` }}>INFO</span>
              <div className="flex-1 h-1" style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }} />
            </div>

            {/* Description */}
            {event.description && (
              <p
                className={`${typographyClass} text-2xl md:text-3xl text-center leading-relaxed mb-24 font-bold max-w-4xl mx-auto`}
                style={{ color: 'rgba(255,255,255,0.9)', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}
              >
                {event.description}
              </p>
            )}

            <div className="grid lg:grid-cols-2 gap-12 mb-24">
              {/* Location card */}
              <div
                className="p-10 hover-glitch transition-transform hover:-translate-y-2 relative"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,0,255,0.1) 0%, rgba(0,255,255,0.05) 100%)',
                  border: '2px solid rgba(255,0,255,0.5)',
                  boxShadow: '0 0 40px rgba(255,0,255,0.15), inset 0 0 20px rgba(255,0,255,0.1)',
                }}
              >
                <div className="absolute top-0 right-0 p-2 font-mono text-[10px] text-[#ff00ff]/50 border-l border-b border-[#ff00ff]/30">SEC 01</div>
                <div className="flex items-center gap-4 mb-8">
                  <MapPin className="w-8 h-8" style={{ color: '#ff00ff', filter: 'drop-shadow(0 0 10px #ff00ff)' }} />
                  <span className="font-mono text-lg tracking-[0.3em] font-bold" style={{ color: '#ff00ff', textShadow: '0 0 10px #ff00ff' }}>LOCATION</span>
                </div>
                {showLocation ? (
                  <>
                    <p className={`${typographyClass} text-4xl mb-4 font-bold leading-tight`}>{event.venueName}</p>
                    {locationPrecision === 'exact' && (
                      <p className="text-white/70 text-lg mb-2">{event.venueAddress}</p>
                    )}
                    <p className="text-white/60 text-lg font-mono">{event.city}{event.state ? `, ${event.state}` : ''}</p>
                    {mapUrl && (
                      <a
                        href={mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-3 mt-8 font-mono text-lg font-bold hover:tracking-widest transition-all"
                        style={{ color: '#00ffff', textShadow: '0 0 10px #00ffff' }}
                      >
                        OPEN IN MAPS <ExternalLink className="w-5 h-5" />
                      </a>
                    )}
                  </>
                ) : (
                  <p className={`${typographyClass} text-2xl flex items-center gap-4 font-bold`}>
                    <Lock className="w-6 h-6" style={{ color: '#ff00ff' }} /> LOCATION REVEALED AFTER {isRsvpEvent ? 'RSVP' : 'PURCHASE'}
                  </p>
                )}
              </div>

              {/* Tickets */}
              {!isRsvpEvent && availableTiers.length > 0 && (
                <div className="space-y-6 relative"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,255,255,0.1) 0%, rgba(255,0,255,0.05) 100%)',
                    border: '2px solid rgba(0,255,255,0.5)',
                    boxShadow: '0 0 40px rgba(0,255,255,0.15), inset 0 0 20px rgba(0,255,255,0.1)',
                  }}
                >
                  <div className="absolute top-0 right-0 p-2 font-mono text-[10px] text-[#00ffff]/50 border-l border-b border-[#00ffff]/30">SEC 02</div>
                  <div className="p-10">
                    <div className="flex items-center gap-4 mb-8">
                      <span className="font-mono text-lg tracking-[0.3em] font-bold" style={{ color: '#00ffff', textShadow: '0 0 10px #00ffff' }}>TICKETS</span>
                    </div>

                    <div className="space-y-6">
                      {availableTiers.map((tier: any) => {
                        const available = tier.quantity - tier.quantitySold
                        const soldOut = available <= 0

                        return (
                          <div
                            key={tier.id}
                            className={`p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors hover:bg-black/40 ${soldOut ? 'opacity-40 grayscale' : 'hover:scale-105 transition-transform'}`}
                            style={{
                              background: `linear-gradient(90deg, ${accentColor}10 0%, transparent 100%)`,
                              border: `1px solid ${accentColor}50`,
                              borderLeft: `4px solid ${accentColor}`
                            }}
                          >
                            <div>
                              <p className={`${typographyClass} text-2xl font-bold mb-2`}>{tier.name}</p>
                              {tier.description && (
                                <p className="text-base text-white/60 mb-2">{tier.description}</p>
                              )}
                              <p className="font-mono text-sm font-bold tracking-widest text-white/50">
                                {soldOut ? 'SOLD OUT' : `${available} REMAINING`}
                              </p>
                            </div>
                            <div
                              className="font-mono text-3xl font-black whitespace-nowrap"
                              style={{ color: soldOut ? 'rgba(255,255,255,0.3)' : accentColor, textShadow: soldOut ? 'none' : `0 0 15px ${accentColor}` }}
                            >
                              {tier.price === 0 ? 'FREE' : formatCents(tier.price)}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Lineup */}
            {lineup.length > 0 && (
              <div className="mb-24">
                <div className="flex items-center gap-6 mb-12">
                  <div className="flex-1 h-1" style={{ background: `linear-gradient(90deg, transparent, #ff00ff, transparent)` }} />
                  <span className="font-mono text-xl tracking-[0.5em] font-bold" style={{ color: '#ff00ff', textShadow: `0 0 15px #ff00ff` }}>LINEUP</span>
                  <div className="flex-1 h-1" style={{ background: `linear-gradient(90deg, transparent, #ff00ff, transparent)` }} />
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {lineup.map((artist, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-6 p-6 group hover:scale-105 transition-transform duration-300"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,0,255,0.05) 0%, transparent 100%)',
                        border: '2px solid rgba(255,0,255,0.3)',
                        boxShadow: 'inset 0 0 20px rgba(255,0,255,0.05)'
                      }}
                    >
                      {artist.imageUrl ? (
                        <div className="relative w-20 h-20 flex-shrink-0 group-hover:hue-rotate-90 transition-all duration-500" style={{ border: '3px solid #00ffff', boxShadow: '0 0 15px #00ffff' }}>
                          <Image src={artist.imageUrl} alt={artist.name} fill className="object-cover contrast-125" />
                        </div>
                      ) : (
                        <div
                          className="w-20 h-20 flex items-center justify-center flex-shrink-0 font-mono text-3xl font-black bg-[#00ffff]/10"
                          style={{ border: '3px solid #00ffff', color: '#00ffff', textShadow: '0 0 10px #00ffff', boxShadow: '0 0 15px #00ffff' }}
                        >
                          {artist.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`${typographyClass} text-2xl font-bold truncate mb-1`} style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.8)' }}>{artist.name}</p>
                        {artist.role && (
                          <p className="font-mono text-xs text-[#00ffff] font-bold tracking-widest uppercase mb-2">{artist.role}</p>
                        )}
                        {artist.showtime && artist.showShowtime !== false && (
                          <span className="font-mono text-sm font-bold px-2 py-1 bg-white/10" style={{ color: accentColor, textShadow: `0 0 5px ${accentColor}` }}>
                            {artist.showtime}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info Sections */}
            <div className="p-8 border-2 bg-black/60 backdrop-blur-md" style={{ borderColor: accentColor }}>
              <EventInfoSections
                about={event.about}
                refundPolicy={event.refundPolicy}
                faqs={event.faqs}
                variant="vapor"
                accentColor={accentColor}
              />
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 text-center bg-[#05030a] border-t-4" style={{ borderColor: '#ff00ff' }}>
          <p className="font-mono text-sm font-bold text-white/50 tracking-[0.3em] uppercase">
            &copy; {new Date().getFullYear()} AFTERS // ALL RIGHTS RESERVED
          </p>
        </footer>
      </div>

      {/* Mobile sticky CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 pb-6 bg-[#0a0612]/95 backdrop-blur-2xl border-t-2 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.8)]" style={{ borderColor: accentColor }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-mono text-xs font-bold tracking-widest text-white/60 mb-1">{isRsvpEvent ? 'ENTRY' : 'FROM'}</div>
            <div className="font-mono text-2xl font-black" style={{ color: accentColor, textShadow: `0 0 10px ${accentColor}` }}>
              {isRsvpEvent ? 'FREE' : (lowestPrice === 0 ? 'FREE' : formatCents(lowestPrice))}
            </div>
          </div>
          {hasAvailability ? (
            <Link
              href={ctaUrl}
              className="px-8 py-4 font-mono font-black text-black tracking-widest active:scale-95 transition-transform"
              style={{ background: `linear-gradient(90deg, ${accentColor}, #ff00ff, #00ffff)`, boxShadow: `0 0 20px ${accentColor}80` }}
            >
              {ctaText}
            </Link>
          ) : (
            <div className="px-8 py-4 bg-white/10 text-white/30 font-mono font-bold tracking-widest border border-white/20">{isRsvpEvent ? 'FULL' : 'SOLD OUT'}</div>
          )}
        </div>
      </div>
    </div>
  )
}
