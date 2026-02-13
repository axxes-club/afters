"use client"

import { useEffect, useState, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, Users, Calendar, MapPin, Loader2, Mail, User, UserPlus, Check } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface Event {
  id: string
  title: string
  slug: string
  startsAt: string
  venueName: string
  city: string
  flyerUrl: string | null
  accentColor: string | null
  isRsvpOnly: boolean
  rsvpCapacity: number | null
  rsvpAllowPlusOnes: boolean
  rsvpMaxPlusOnes: number
  rsvpCount: number
  organizer: {
    displayName: string
    slug: string
  }
}

export default function RsvpPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Form fields
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [plusOnes, setPlusOnes] = useState(0)
  const [message, setMessage] = useState("")

  const fetchEvent = useCallback(async () => {
    try {
      const res = await fetch(`/api/events?slug=${slug}`)
      if (res.ok) {
        const events = await res.json()
        if (events.length > 0) {
          setEvent(events[0])
        }
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    fetchEvent()
  }, [fetchEvent])

  const accentColor = event?.accentColor || '#ff1493'

  // Validation
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const isFormValid = isValidEmail && name.trim().length >= 2

  // Availability
  const spotsLeft = event?.rsvpCapacity ? event.rsvpCapacity - event.rsvpCount : null
  const isFull = spotsLeft !== null && spotsLeft <= 0
  const totalGuests = 1 + plusOnes

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!isFormValid) {
      toast.error("Please enter your name and email")
      return
    }

    if (isFull) {
      toast.error("This event is full")
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch(`/api/events/${event?.id}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          plusOnes,
          message: message.trim() || null,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message)
      }

      setSubmitted(true)
      toast.success("RSVP confirmed!")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "RSVP failed")
    } finally {
      setSubmitting(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="w-16 h-16 border-2 border-white/10 rounded-full" />
              <div className="absolute inset-0 w-16 h-16 border-2 border-t-[#ff1493] rounded-full animate-spin" />
            </div>
            <p className="text-white/30 font-body text-sm uppercase tracking-[0.2em]">Loading</p>
          </div>
        </div>
      </div>
    )
  }

  // Event not found or not RSVP event
  if (!event || !event.isRsvpOnly) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-headline text-3xl text-white mb-4">EVENT NOT FOUND</h1>
          <Link href="/" className="font-body text-white/50 hover:text-white transition-colors">
            Return home
          </Link>
        </div>
      </div>
    )
  }

  const eventDate = new Date(event.startsAt)

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen bg-black text-white relative">
        <div className="fixed inset-0 pointer-events-none grain z-50" />

        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            <div
              className="w-20 h-20 mx-auto mb-8 flex items-center justify-center"
              style={{ backgroundColor: accentColor }}
            >
              <Check className="w-10 h-10 text-black" />
            </div>

            <h1 className="font-headline text-4xl mb-4">YOU&apos;RE IN</h1>
            <p className="text-white/50 font-body mb-8">
              Your RSVP for <span className="text-white">{event.title}</span> has been confirmed.
              We&apos;ve sent the details to <span style={{ color: accentColor }}>{email}</span>
            </p>

            <div className="p-6 border border-white/10 bg-white/[0.02] text-left mb-8">
              <div className="flex items-center gap-4 mb-4">
                {event.flyerUrl && (
                  <div className="relative w-16 h-20 flex-shrink-0 overflow-hidden border border-white/10">
                    <Image src={event.flyerUrl} alt={event.title} fill className="object-cover" />
                  </div>
                )}
                <div>
                  <h2 className="font-headline text-xl">{event.title}</h2>
                  <p className="text-white/40 text-sm font-body">{event.organizer.displayName}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm font-body">
                <div className="flex items-center gap-2 text-white/60">
                  <Calendar className="w-4 h-4" style={{ color: accentColor }} />
                  {eventDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </div>
                <div className="flex items-center gap-2 text-white/60">
                  <MapPin className="w-4 h-4" style={{ color: accentColor }} />
                  {event.venueName}, {event.city}
                </div>
                <div className="flex items-center gap-2 text-white/60">
                  <Users className="w-4 h-4" style={{ color: accentColor }} />
                  {totalGuests} {totalGuests === 1 ? 'guest' : 'guests'}
                </div>
              </div>
            </div>

            <Link
              href={`/e/${slug}`}
              className="inline-block px-8 py-3 border border-white/20 font-body text-sm hover:border-white/40 transition-colors"
            >
              Back to event
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white relative">
      <div className="fixed inset-0 pointer-events-none grain z-50" />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href={`/e/${slug}`}
            className="flex items-center gap-2 text-white/50 hover:text-white transition-colors font-body text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to event</span>
          </Link>
          <Link href="/" className="font-headline text-3xl" style={{ color: accentColor }}>
            .
          </Link>
          <div className="w-24" />
        </div>
      </header>

      <main className="pt-20 pb-8">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Event Mini-Header */}
          <div className="mb-8">
            <div className="flex items-center gap-5 p-5 border border-white/10 bg-white/[0.02]">
              {event.flyerUrl && (
                <div className="hidden sm:block relative w-20 h-24 flex-shrink-0 overflow-hidden border border-white/10">
                  <Image src={event.flyerUrl} alt={event.title} fill className="object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="font-headline text-2xl md:text-3xl tracking-wide mb-3 truncate">
                  {event.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-white/50 font-body">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" style={{ color: accentColor }} />
                    <span>{eventDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" style={{ color: accentColor }} />
                    <span>{event.venueName}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {isFull ? (
            /* Full Event State */
            <div className="text-center py-16 border border-white/10">
              <Users className="h-12 w-12 mx-auto text-white/20 mb-4" />
              <h2 className="font-headline text-2xl mb-2">EVENT IS FULL</h2>
              <p className="text-white/40 font-body">This event has reached capacity.</p>
            </div>
          ) : (
            /* RSVP Form */
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Availability Info */}
              {spotsLeft !== null && (
                <div
                  className="p-4 border text-center"
                  style={{ borderColor: `${accentColor}30`, backgroundColor: `${accentColor}05` }}
                >
                  <span className="font-headline text-2xl" style={{ color: accentColor }}>{spotsLeft}</span>
                  <span className="font-body text-white/60 ml-2">spots remaining</span>
                </div>
              )}

              {/* Contact Info */}
              <div>
                <div className="flex items-center gap-4 pb-4 border-b border-white/10 mb-6">
                  <div
                    className="w-12 h-12 flex items-center justify-center"
                    style={{ backgroundColor: `${accentColor}15` }}
                  >
                    <User className="h-6 w-6" style={{ color: accentColor }} />
                  </div>
                  <div>
                    <h2 className="font-headline text-xl tracking-wider">YOUR DETAILS</h2>
                    <p className="font-body text-sm text-white/40">We&apos;ll send confirmation to your email</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block font-body text-xs text-white/40 uppercase tracking-wider mb-2">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your name"
                        required
                        className="w-full h-14 pl-12 pr-4 bg-black border border-white/10 text-white placeholder:text-white/20 font-body text-base focus:outline-none focus:border-white/30 transition-colors"
                        style={{
                          borderColor: name.trim().length >= 2 ? `${accentColor}50` : undefined
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-body text-xs text-white/40 uppercase tracking-wider mb-2">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="w-full h-14 pl-12 pr-4 bg-black border border-white/10 text-white placeholder:text-white/20 font-body text-base focus:outline-none focus:border-white/30 transition-colors"
                        style={{
                          borderColor: isValidEmail ? `${accentColor}50` : undefined
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-body text-xs text-white/40 uppercase tracking-wider mb-2">
                      Phone (optional)
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(555) 123-4567"
                      className="w-full h-14 px-4 bg-black border border-white/10 text-white placeholder:text-white/20 font-body text-base focus:outline-none focus:border-white/30 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Plus Ones */}
              {event.rsvpAllowPlusOnes && (
                <div>
                  <div className="flex items-center gap-4 pb-4 border-b border-white/10 mb-6">
                    <div
                      className="w-12 h-12 flex items-center justify-center"
                      style={{ backgroundColor: `${accentColor}15` }}
                    >
                      <UserPlus className="h-6 w-6" style={{ color: accentColor }} />
                    </div>
                    <div>
                      <h2 className="font-headline text-xl tracking-wider">BRINGING GUESTS?</h2>
                      <p className="font-body text-sm text-white/40">You can bring up to {event.rsvpMaxPlusOnes} additional {event.rsvpMaxPlusOnes === 1 ? 'guest' : 'guests'}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-white/10">
                    <span className="font-body text-white/60">Number of additional guests</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setPlusOnes(Math.max(0, plusOnes - 1))}
                        disabled={plusOnes === 0}
                        className="w-10 h-10 flex items-center justify-center border border-white/20 hover:border-white/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        -
                      </button>
                      <span className="font-headline text-2xl w-8 text-center" style={{ color: plusOnes > 0 ? accentColor : 'rgba(255,255,255,0.3)' }}>
                        {plusOnes}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPlusOnes(Math.min(event.rsvpMaxPlusOnes, plusOnes + 1))}
                        disabled={plusOnes >= event.rsvpMaxPlusOnes}
                        className="w-10 h-10 flex items-center justify-center border border-white/20 hover:border-white/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Message */}
              <div>
                <label className="block font-body text-xs text-white/40 uppercase tracking-wider mb-2">
                  Note to organizer (optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Any dietary restrictions, accessibility needs, etc."
                  rows={3}
                  className="w-full px-4 py-3 bg-black border border-white/10 text-white placeholder:text-white/20 font-body text-base focus:outline-none focus:border-white/30 transition-colors resize-none"
                />
              </div>

              {/* Summary */}
              <div className="p-6 border border-white/10 bg-white/[0.02]">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-body text-white/60">Total guests</span>
                  <span className="font-headline text-2xl" style={{ color: accentColor }}>
                    {totalGuests}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
                  <span className="font-body text-white/60">Price</span>
                  <span className="font-headline text-2xl" style={{ color: accentColor }}>
                    FREE
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !isFormValid}
                  className="w-full h-14 font-headline text-lg tracking-wider transition-all disabled:opacity-30"
                  style={{
                    backgroundColor: isFormValid ? accentColor : 'transparent',
                    color: isFormValid ? '#000' : 'rgba(255,255,255,0.3)',
                    border: isFormValid ? 'none' : '1px solid rgba(255,255,255,0.1)'
                  }}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      CONFIRMING
                    </span>
                  ) : !isFormValid ? (
                    "ENTER YOUR DETAILS"
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Users className="h-5 w-5" />
                      CONFIRM RSVP
                    </span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}
