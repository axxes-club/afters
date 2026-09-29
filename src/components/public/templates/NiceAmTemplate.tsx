import React from "react"
import Link from "next/link"
import Image from "next/image"
import { Lock, MapPin, CalendarDays, Clock, Instagram } from "lucide-react"
import { ViewTracker } from "@/components/ViewTracker"
import { formatCents } from "@/lib/stripe"
import { safeHref } from "@/lib/security"
import type { EventTemplateProps, LineupArtist } from "./types"

export default function NiceAmTemplate(props: EventTemplateProps) {
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
    mapEmbedUrl,
    rescheduledBannerElement,
    hasAvailability,
    isRsvpEvent,
    ctaUrl,
    lineup,
  } = props

  const faqs = Array.isArray(event.faqs) ? event.faqs : []

  // Get ticket tiers
  const availableTiers = event.organizer?.stripeChargesEnabled
    ? event.ticketTiers
    : event.ticketTiers.filter((tier) => tier.price === 0)

  // Dice.fm inspired layout
  return (
    <div className={`min-h-screen ${typographyClass}`} style={{ backgroundColor, color: textColor }}>
      <ViewTracker eventId={event.id} />
      {rescheduledBannerElement}

      {/* Blurred background image */}
      {event.flyerUrl && (
        <div className="fixed inset-0 z-0 overflow-hidden opacity-20 pointer-events-none">
          <Image
            src={event.flyerUrl}
            alt=""
            fill
            className="object-cover blur-[100px] scale-125 saturate-200"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/60 to-black/90" />
        </div>
      )}

      <div className="relative z-10 animate-in fade-in duration-700 slide-in-from-bottom-8">
        {/* Container with max-width */}
        <div className="max-w-6xl mx-auto px-4 py-8 lg:py-16">
          {/* Two-column layout */}
          <div className="grid lg:grid-cols-[1fr_380px] gap-8 lg:gap-16">
            {/* Left: Main content */}
            <div className="space-y-12">
              {/* Hero image */}
              {event.flyerUrl && (
                <div className="w-full aspect-square lg:aspect-[4/3] rounded-[2rem] overflow-hidden shadow-2xl relative group">
                  <Image
                    src={event.flyerUrl}
                    alt={event.title}
                    width={800}
                    height={600}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    priority
                  />
                  <div className="absolute inset-0 border border-white/10 rounded-[2rem] pointer-events-none" />
                </div>
              )}

              {/* Event title & organizer */}
              <div>
                <div className="flex items-center gap-2 mb-4 text-sm font-bold uppercase tracking-wider opacity-60">
                  <span>Presented by {event.organizer.displayName}</span>
                </div>
                <h1 className="text-5xl lg:text-7xl font-black mb-6 leading-[1.1] tracking-tight">
                  {event.title}
                </h1>
              </div>

              {/* About */}
              {event.about && (
                <div className="p-8 rounded-[2rem] bg-white/[0.03] backdrop-blur-xl border border-white/10">
                  <h2 className="text-2xl font-bold mb-6">About</h2>
                  <div className="text-white/70 whitespace-pre-wrap leading-loose text-lg font-medium">
                    {event.about}
                  </div>
                </div>
              )}

              {/* Lineup */}
              {lineup.length > 0 && (
                <div className="p-8 rounded-[2rem] bg-white/[0.03] backdrop-blur-xl border border-white/10">
                  <h2 className="text-2xl font-bold mb-8">Lineup</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
                    {lineup.map((artist: LineupArtist, idx: number) => (
                      <div key={idx} className="text-center group">
                        {artist.imageUrl ? (
                          <div className="relative w-28 h-28 mx-auto mb-4 rounded-full overflow-hidden shadow-lg transition-transform duration-300 group-hover:scale-110">
                            <Image
                              src={artist.imageUrl}
                              alt={artist.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div
                            className="w-28 h-28 mx-auto mb-4 rounded-full flex items-center justify-center font-black text-3xl shadow-lg transition-transform duration-300 group-hover:scale-110"
                            style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                          >
                            {artist.name.charAt(0)}
                          </div>
                        )}
                        <div className="font-bold text-lg leading-tight">{artist.name}</div>
                        {artist.role && (
                          <div className="text-sm text-white/50 mt-1">{artist.role}</div>
                        )}
                        {artist.showtime && artist.showShowtime !== false && (
                          <div className="text-sm font-bold mt-2 px-2 py-1 bg-white/10 rounded-full inline-block" style={{ color: accentColor }}>{artist.showtime}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FAQs */}
              {faqs.length > 0 && (
                <div className="p-8 rounded-[2rem] bg-white/[0.03] backdrop-blur-xl border border-white/10">
                  <h2 className="text-2xl font-bold mb-6">FAQs</h2>
                  <div className="space-y-4">
                    {(faqs as { question: string; answer: string }[]).filter((faq) => faq?.question && faq?.answer).map((faq, idx: number) => (
                      <details key={idx} className="group bg-white/5 rounded-2xl overflow-hidden border border-white/5">
                        <summary className="flex items-center justify-between cursor-pointer p-5 font-bold hover:bg-white/5 transition-colors">
                          <span className="pr-4 text-lg">{faq.question}</span>
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center transition-transform group-open:rotate-180">
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </summary>
                        <div className="px-5 pt-2 pb-6 text-white/60 leading-relaxed font-medium">
                          {faq.answer}
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              )}

              {/* Refund Policy */}
              {event.refundPolicy && (
                <div className="p-8 rounded-[2rem] bg-white/[0.03] backdrop-blur-xl border border-white/10">
                  <h2 className="text-2xl font-bold mb-6">Refund Policy</h2>
                  <div className="text-white/60 whitespace-pre-wrap leading-relaxed font-medium">
                    {event.refundPolicy}
                  </div>
                </div>
              )}

              {/* Map */}
              {showMap && mapEmbedUrl && (
                <div className="rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
                  <iframe
                    src={mapEmbedUrl}
                    width="100%"
                    height="450"
                    style={{ border: 0, filter: 'invert(1) hue-rotate(180deg) grayscale(0.5) contrast(1.2)' }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              )}
            </div>

            {/* Right: Sticky purchase sidebar */}
            <div className="lg:sticky lg:top-8 lg:self-start hidden lg:block">
              <div className="p-8 rounded-[2rem] backdrop-blur-3xl shadow-2xl border border-white/20" style={{ backgroundColor: 'rgba(20,20,20,0.8)' }}>
                {/* Date & Time */}
                <div className="mb-8 pb-8 border-b border-white/10">
                  <div className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-white/50 mb-3">
                    <CalendarDays className="w-4 h-4" />
                    <span>{dayStr}</span>
                  </div>
                  <div className="text-4xl font-black mb-3" style={{ color: accentColor }}>
                    {dateStr}
                  </div>
                  <div className="flex items-center gap-3 text-sm font-bold text-white/70">
                    <Clock className="w-4 h-4" />
                    <span>{timeStr}</span>
                  </div>
                </div>

                {/* Venue */}
                {showLocation && (
                  <div className="mb-8 pb-8 border-b border-white/10">
                    <div className="flex items-start gap-4">
                      <MapPin className="w-5 h-5 mt-1" style={{ color: accentColor }} />
                      <div>
                        <div className="font-bold text-xl mb-1">{event.venueName}</div>
                        {locationPrecision === 'exact' && (
                          <div className="text-white/60 font-medium mb-1">{event.venueAddress}</div>
                        )}
                        <div className="text-white/50 text-sm">
                          {event.city}{event.state ? `, ${event.state}` : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Age restriction */}
                {event.ageRestriction && (
                  <div className="mb-8 pb-8 border-b border-white/10">
                    <div className="flex items-center gap-3 text-base font-bold">
                      <Lock className="w-5 h-5" style={{ color: accentColor }} />
                      <span className="text-white/80">Ages {event.ageRestriction}+</span>
                    </div>
                  </div>
                )}

                {/* Tickets/RSVP */}
                <div>
                  {isRsvpEvent ? (
                    <>
                      <div className="mb-6">
                        <div className="text-4xl font-black mb-2" style={{ color: accentColor }}>Free</div>
                        <div className="text-sm font-bold text-white/50 uppercase tracking-wider">RSVP Required</div>
                      </div>
                      {hasAvailability ? (
                        <Link
                          href={ctaUrl}
                          className="block w-full py-5 rounded-2xl text-center font-black text-xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] shadow-xl"
                          style={{
                            backgroundColor: accentColor,
                            color: '#000'
                          }}
                        >
                          RSVP Now
                        </Link>
                      ) : (
                        <div className="w-full py-5 rounded-2xl text-center font-black text-xl bg-white/10 text-white/30">
                          RSVP Full
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="mb-8 space-y-4">
                        {availableTiers.map((tier) => (
                          <div key={tier.id} className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                            <div className="flex items-start justify-between mb-2">
                              <div className="font-bold text-lg">{tier.name}</div>
                              <div className="font-black text-xl" style={{ color: accentColor }}>
                                {tier.price === 0 ? 'Free' : formatCents(tier.price)}
                              </div>
                            </div>
                            {tier.description && (
                              <div className="text-sm text-white/60 mb-3 font-medium">{tier.description}</div>
                            )}
                            <div className="text-xs font-bold uppercase tracking-wider text-white/40 bg-black/40 inline-block px-2 py-1 rounded-md">
                              {tier.quantity - tier.quantitySold} / {tier.quantity} available
                            </div>
                          </div>
                        ))}
                      </div>

                      {hasAvailability ? (
                        <Link
                          href={ctaUrl}
                          className="block w-full py-5 rounded-2xl text-center font-black text-xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] shadow-xl"
                          style={{
                            backgroundColor: accentColor,
                            color: '#000'
                          }}
                        >
                          Get Tickets
                        </Link>
                      ) : (
                        <div className="w-full py-5 rounded-2xl text-center font-black text-xl bg-white/10 text-white/30">
                          Sold Out
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Organizer */}
                <div className="mt-8 pt-8 border-t border-white/10">
                  <div className="flex items-center gap-4">
                    {event.organizer.logoUrl ? (
                      <div className="relative w-14 h-14 rounded-full overflow-hidden shadow-lg border border-white/10">
                        <Image
                          src={event.organizer.logoUrl}
                          alt={event.organizer.displayName}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center font-black text-xl shadow-lg border border-white/10"
                        style={{ backgroundColor: `${accentColor}30`, color: accentColor }}
                      >
                        {event.organizer.displayName.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="text-xs font-bold uppercase tracking-widest text-white/40 mb-1">Organized by</div>
                      <div className="font-bold text-lg">{event.organizer.displayName}</div>
                    </div>
                  </div>
                  {safeHref(event.organizer.instagramUrl) && (
                    <a
                      href={safeHref(event.organizer.instagramUrl)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-6 flex items-center justify-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-sm font-bold group"
                    >
                      <Instagram className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span>Follow on Instagram</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Purchase Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 p-4 pb-8 bg-black/90 backdrop-blur-xl border-t border-white/10">
        <div className="max-w-md mx-auto">
          {hasAvailability ? (
            <Link
              href={ctaUrl}
              className="block w-full py-5 rounded-2xl text-center font-black text-xl shadow-xl transition-transform active:scale-95"
              style={{
                backgroundColor: accentColor,
                color: '#000'
              }}
            >
              {isRsvpEvent ? 'RSVP Now' : 'Get Tickets'}
            </Link>
          ) : (
            <div className="w-full py-5 rounded-2xl text-center font-black text-xl bg-white/10 text-white/30">
              {isRsvpEvent ? 'RSVP Full' : 'Sold Out'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
