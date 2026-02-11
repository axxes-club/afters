"use client"

import { useEffect, useState, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { toast } from "sonner"
import { ArrowLeft, Minus, Plus, Ticket, Lock, Calendar, MapPin, Loader2, Mail, User } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface TicketTier {
  id: string
  name: string
  description: string | null
  price: number
  quantity: number
  quantitySold: number
  maxPerOrder: number
}

interface Event {
  id: string
  title: string
  slug: string
  startsAt: string
  venueName: string
  city: string
  flyerUrl: string | null
  accentColor: string | null
  ticketTiers: TicketTier[]
  organizer: {
    displayName: string
    slug: string
    stripeChargesEnabled: boolean
  }
}

function CheckoutForm({ orderId, accentColor }: { orderId: string; accentColor: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/orders/${orderId}`,
      },
    })

    if (error) {
      toast.error(error.message || "Payment failed")
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border border-white/10 bg-black">
        <PaymentElement
          options={{
            layout: "tabs",
          }}
        />
      </div>
      <button
        type="submit"
        className="w-full h-12 font-mono text-sm font-medium uppercase tracking-wider transition-all disabled:opacity-50"
        style={{ backgroundColor: accentColor, color: '#000' }}
        disabled={!stripe || loading}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            PROCESSING
          </span>
        ) : (
          "COMPLETE PURCHASE"
        )}
      </button>
    </form>
  )
}

export default function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [checkingOut, setCheckingOut] = useState(false)

  // Guest checkout fields
  const [guestEmail, setGuestEmail] = useState("")
  const [guestName, setGuestName] = useState("")

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

  function updateQuantity(tierId: string, delta: number) {
    setQuantities((prev) => {
      const tier = availableTiers.find((t) => t.id === tierId)
      if (!tier) return prev

      const current = prev[tierId] || 0
      const newQty = Math.max(0, Math.min(tier.maxPerOrder, current + delta))
      const available = tier.quantity - tier.quantitySold

      if (newQty > available) {
        toast.error(`Only ${available} tickets available`)
        return prev
      }

      return { ...prev, [tierId]: newQty }
    })
  }

  const availableTiers = event?.organizer.stripeChargesEnabled
    ? event.ticketTiers
    : event?.ticketTiers.filter((t) => t.price === 0) || []

  const selectedTiers = availableTiers.filter((t) => (quantities[t.id] || 0) > 0) || []
  const subtotal = selectedTiers.reduce((sum, t) => sum + t.price * (quantities[t.id] || 0), 0)
  const ticketCount = selectedTiers.reduce((sum, t) => sum + (quantities[t.id] || 0), 0)
  const platformFee = subtotal === 0 ? 0 : Math.round(subtotal * 0.1) + ticketCount * 99
  const total = subtotal + platformFee
  const isFreeOrder = total === 0

  // Validate guest info
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)
  const isGuestInfoValid = isValidEmail && guestName.trim().length >= 2

  async function handleCheckout() {
    if (!isGuestInfoValid) {
      toast.error("Please enter your name and email")
      return
    }

    if (ticketCount === 0) {
      toast.error("Select at least one ticket")
      return
    }

    setCheckingOut(true)

    try {
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event?.id,
          email: guestEmail,
          guestName: guestName.trim(),
          items: selectedTiers.map((t) => ({
            ticketTierId: t.id,
            quantity: quantities[t.id],
          })),
        }),
      })

      if (!orderRes.ok) {
        const error = await orderRes.json()
        throw new Error(error.message)
      }

      const order = await orderRes.json()
      setOrderId(order.id)

      // Free orders bypass Stripe entirely
      if (isFreeOrder) {
        const confirmRes = await fetch(`/api/orders/${order.id}/confirm-free`, {
          method: "POST",
        })

        if (!confirmRes.ok) {
          const error = await confirmRes.json()
          throw new Error(error.message)
        }

        router.push(`/orders/${order.id}`)
        return
      }

      // Paid orders go through Stripe
      const paymentRes = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      })

      if (!paymentRes.ok) {
        const error = await paymentRes.json()
        throw new Error(error.message)
      }

      const { clientSecret } = await paymentRes.json()
      setClientSecret(clientSecret)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Checkout failed")
      setCheckingOut(false)
    }
  }

  const formatCents = (cents: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100)

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-white/50" />
            <p className="text-white/30 text-xs font-mono uppercase tracking-widest">LOADING</p>
          </div>
        </div>
      </div>
    )
  }

  // Event not found
  if (!event) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center font-mono">
          <h1 className="text-xl text-white mb-2">EVENT NOT FOUND</h1>
          <Link href="/" className="text-white/50 hover:text-white text-sm">Return home</Link>
        </div>
      </div>
    )
  }

  const eventDate = new Date(event.startsAt)

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-white/5">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href={`/e/${slug}`}
            className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-xs uppercase tracking-wider"
          >
            <ArrowLeft className="h-3 w-3" />
            <span>Back</span>
          </Link>
          <Link href="/" className="text-lg font-bold tracking-tight">
            AFTERS<span style={{ color: accentColor }}>.</span>
          </Link>
          <div className="w-16" />
        </div>
      </header>

      <main className="pt-20 pb-8">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Event Header */}
          <div className="border border-white/5 mb-6">
            <div className="p-4 flex items-center gap-4">
              {event.flyerUrl && (
                <div className="hidden sm:block relative w-16 h-20 flex-shrink-0 border border-white/10">
                  <Image src={event.flyerUrl} alt={event.title} fill className="object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold tracking-tight mb-2 truncate uppercase">
                  {event.title}
                </h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/50">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" style={{ color: accentColor }} />
                    <span>{eventDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" style={{ color: accentColor }} />
                    <span>{event.venueName}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-[1fr_360px] gap-6">
            {/* Left Column */}
            <div>
              {clientSecret ? (
                /* Payment Section */
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                    <Lock className="h-4 w-4" style={{ color: accentColor }} />
                    <div>
                      <h2 className="text-sm font-bold uppercase tracking-wider">Secure Payment</h2>
                      <p className="text-xs text-white/30">Encrypted checkout via Stripe</p>
                    </div>
                  </div>

                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret,
                      appearance: {
                        theme: 'night',
                        variables: {
                          colorPrimary: accentColor,
                          colorBackground: '#000000',
                          colorText: '#ffffff',
                          colorTextSecondary: '#666666',
                          colorDanger: '#ff4444',
                          fontFamily: 'ui-monospace, monospace',
                          borderRadius: '0px',
                          spacingUnit: '4px',
                        },
                        rules: {
                          '.Input': {
                            backgroundColor: '#000000',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            fontFamily: 'ui-monospace, monospace',
                          },
                          '.Input:focus': {
                            border: `1px solid ${accentColor}`,
                          },
                          '.Tab': {
                            backgroundColor: '#000000',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            fontFamily: 'ui-monospace, monospace',
                          },
                          '.Tab--selected': {
                            backgroundColor: '#000000',
                            border: `1px solid ${accentColor}`,
                          },
                          '.Label': {
                            fontFamily: 'ui-monospace, monospace',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            fontSize: '11px',
                          },
                        },
                      },
                    }}
                  >
                    <CheckoutForm orderId={orderId!} accentColor={accentColor} />
                  </Elements>
                </div>
              ) : (
                /* Ticket Selection + Guest Info */
                <div className="space-y-6">
                  {/* Ticket Selection */}
                  <div>
                    <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                      <Ticket className="h-4 w-4" style={{ color: accentColor }} />
                      <div>
                        <h2 className="text-sm font-bold uppercase tracking-wider">Select Tickets</h2>
                        <p className="text-xs text-white/30">Choose your ticket type</p>
                      </div>
                    </div>

                    {availableTiers.length === 0 ? (
                      <div className="text-center py-12 border border-white/5 mt-4">
                        <Ticket className="h-8 w-8 mx-auto text-white/20 mb-3" />
                        <p className="text-white/30 text-xs uppercase tracking-wider">No tickets available</p>
                      </div>
                    ) : (
                      <div className="space-y-2 mt-4">
                        {availableTiers.map((tier) => {
                          const available = tier.quantity - tier.quantitySold
                          const soldOut = available <= 0
                          const qty = quantities[tier.id] || 0
                          const isSelected = qty > 0

                          return (
                            <div
                              key={tier.id}
                              className={`
                                border transition-all
                                ${isSelected ? 'border-l-2' : 'border-white/5 hover:border-white/10'}
                                ${soldOut ? 'opacity-40' : ''}
                              `}
                              style={isSelected ? { borderLeftColor: accentColor } : undefined}
                            >
                              <div className="p-4 bg-black">
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                      <h3 className="font-bold text-sm uppercase tracking-wider">{tier.name}</h3>
                                      {soldOut && (
                                        <span className="text-[10px] px-2 py-0.5 bg-white/5 text-white/30 uppercase">
                                          Sold Out
                                        </span>
                                      )}
                                    </div>
                                    {tier.description && (
                                      <p className="text-xs text-white/30 mb-2">{tier.description}</p>
                                    )}
                                    <div className="flex items-center gap-3">
                                      <span className="text-lg font-bold" style={{ color: accentColor }}>
                                        {tier.price === 0 ? 'FREE' : formatCents(tier.price)}
                                      </span>
                                      {!soldOut && (
                                        <span className="text-[10px] text-white/20 uppercase">
                                          {available} left
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {!soldOut && (
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => updateQuantity(tier.id, -1)}
                                        disabled={qty === 0}
                                        className={`
                                          w-8 h-8 flex items-center justify-center border border-white/10 transition-all
                                          ${qty === 0 ? 'opacity-20 cursor-not-allowed' : 'hover:border-white/30'}
                                        `}
                                      >
                                        <Minus className="h-3 w-3" />
                                      </button>
                                      <span
                                        className="w-10 text-center text-sm font-bold tabular-nums"
                                        style={{ color: qty > 0 ? accentColor : 'rgba(255,255,255,0.3)' }}
                                      >
                                        {qty}
                                      </span>
                                      <button
                                        onClick={() => updateQuantity(tier.id, 1)}
                                        disabled={qty >= tier.maxPerOrder || qty >= available}
                                        className={`
                                          w-8 h-8 flex items-center justify-center border transition-all
                                          ${qty >= tier.maxPerOrder || qty >= available
                                            ? 'border-white/10 opacity-20 cursor-not-allowed'
                                            : 'border-white/10 hover:border-white/30'
                                          }
                                        `}
                                      >
                                        <Plus className="h-3 w-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Guest Info Form - only show when tickets selected */}
                  {ticketCount > 0 && (
                    <div>
                      <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                        <User className="h-4 w-4" style={{ color: accentColor }} />
                        <div>
                          <h2 className="text-sm font-bold uppercase tracking-wider">Your Information</h2>
                          <p className="text-xs text-white/30">Where should we send your tickets?</p>
                        </div>
                      </div>

                      <div className="space-y-3 mt-4">
                        <div>
                          <label className="block text-[10px] text-white/30 uppercase tracking-wider mb-1.5">
                            Full Name
                          </label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                            <input
                              type="text"
                              value={guestName}
                              onChange={(e) => setGuestName(e.target.value)}
                              placeholder="Enter your name"
                              className="w-full h-11 pl-10 pr-4 bg-black border border-white/10 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-white/30 transition-colors"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] text-white/30 uppercase tracking-wider mb-1.5">
                            Email Address
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                            <input
                              type="email"
                              value={guestEmail}
                              onChange={(e) => setGuestEmail(e.target.value)}
                              placeholder="you@example.com"
                              className="w-full h-11 pl-10 pr-4 bg-black border border-white/10 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-white/30 transition-colors"
                            />
                          </div>
                          <p className="text-[10px] text-white/20 mt-1.5">
                            Tickets will be sent to this email
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:sticky lg:top-20 h-fit">
              <div className="border border-white/5">
                <div
                  className="px-4 py-3 border-b border-white/5"
                  style={{ backgroundColor: `${accentColor}10` }}
                >
                  <h3 className="text-xs font-bold uppercase tracking-wider">Order Summary</h3>
                </div>

                <div className="p-4 space-y-4">
                  {ticketCount === 0 ? (
                    <p className="text-center text-white/20 py-8 text-xs uppercase tracking-wider">
                      Select tickets to continue
                    </p>
                  ) : (
                    <>
                      {/* Selected Items */}
                      <div className="space-y-3">
                        {selectedTiers.map((tier) => (
                          <div key={tier.id} className="flex justify-between items-center text-sm">
                            <div>
                              <p className="font-medium">{tier.name}</p>
                              <p className="text-xs text-white/30">x{quantities[tier.id]}</p>
                            </div>
                            <p className="tabular-nums">
                              {formatCents(tier.price * quantities[tier.id])}
                            </p>
                          </div>
                        ))}
                      </div>

                      {!isFreeOrder && (
                        <div className="border-t border-white/5 pt-4 space-y-2 text-xs">
                          <div className="flex justify-between text-white/40">
                            <span>Subtotal</span>
                            <span className="tabular-nums">{formatCents(subtotal)}</span>
                          </div>
                          <div className="flex justify-between text-white/40">
                            <span>Service fee</span>
                            <span className="tabular-nums">{formatCents(platformFee)}</span>
                          </div>
                        </div>
                      )}

                      <div className="border-t border-white/5 pt-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold uppercase tracking-wider">Total</span>
                          <span className="text-xl font-bold tabular-nums" style={{ color: accentColor }}>
                            {isFreeOrder ? "FREE" : formatCents(total)}
                          </span>
                        </div>
                      </div>

                      {!clientSecret && (
                        <button
                          className="w-full h-12 text-xs font-bold uppercase tracking-wider mt-4 transition-all disabled:opacity-30"
                          style={{
                            backgroundColor: isGuestInfoValid ? accentColor : 'transparent',
                            color: isGuestInfoValid ? '#000' : 'rgba(255,255,255,0.3)',
                            border: isGuestInfoValid ? 'none' : '1px solid rgba(255,255,255,0.1)'
                          }}
                          onClick={handleCheckout}
                          disabled={checkingOut || !isGuestInfoValid}
                        >
                          {checkingOut ? (
                            <span className="flex items-center justify-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              {isFreeOrder ? "GETTING TICKETS" : "PROCESSING"}
                            </span>
                          ) : !isGuestInfoValid ? (
                            "ENTER YOUR INFO ABOVE"
                          ) : isFreeOrder ? (
                            "GET FREE TICKETS"
                          ) : (
                            "CONTINUE TO PAYMENT"
                          )}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="mt-3 flex items-center justify-center gap-3 text-[10px] text-white/20 uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  <span>Secure</span>
                </div>
                <span>•</span>
                <span>Powered by Stripe</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
