"use client"

import { useEffect, useState, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { toast } from "sonner"
import { ArrowLeft, Minus, Plus, Ticket, Lock, Calendar, MapPin, Loader2, Mail, User, Shield, CreditCard } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

// Ticket payments are direct charges on the organizer's payout account, so Stripe.js
// is loaded for that account (one instance per account).
const stripeByAccount = new Map<string, ReturnType<typeof loadStripe>>()
function stripeFor(stripeAccount: string) {
  if (!stripeByAccount.has(stripeAccount)) {
    stripeByAccount.set(stripeAccount, loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!, { stripeAccount }))
  }
  return stripeByAccount.get(stripeAccount)!
}

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

// Order page URL; the token lets guest buyers (no account) view their order
function orderPath(orderId: string, accessToken: string | null) {
  return `/orders/${orderId}${accessToken ? `?token=${encodeURIComponent(accessToken)}` : ""}`
}

function CheckoutForm({
  orderId,
  accessToken,
  accentColor,
}: {
  orderId: string
  accessToken: string | null
  accentColor: string
}) {
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
        return_url: `${window.location.origin}${orderPath(orderId, accessToken)}`,
      },
    })

    if (error) {
      toast.error(error.message || "Payment failed")
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border border-white/10 bg-black rounded-none overflow-hidden">
        <PaymentElement
          options={{
            layout: "tabs",
          }}
        />
      </div>
      <button
        type="submit"
        className="btn-premium w-full h-14 font-headline text-lg tracking-wider transition-all disabled:opacity-50"
        style={{ backgroundColor: accentColor, color: '#000' }}
        disabled={!stripe || loading}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin" />
            PROCESSING
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <CreditCard className="h-5 w-5" />
            COMPLETE PURCHASE
          </span>
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
  const [stripeAccount, setStripeAccount] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [orderAccessToken, setOrderAccessToken] = useState<string | null>(null)
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
      setOrderAccessToken(order.accessToken ?? null)

      // Free orders bypass Stripe entirely
      if (isFreeOrder) {
        const confirmRes = await fetch(`/api/orders/${order.id}/confirm-free`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: guestEmail }),
        })

        if (!confirmRes.ok) {
          const error = await confirmRes.json()
          throw new Error(error.message)
        }

        router.push(orderPath(order.id, order.accessToken ?? null))
        return
      }

      // Paid orders go through Stripe
      const paymentRes = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, email: guestEmail }),
      })

      if (!paymentRes.ok) {
        const error = await paymentRes.json()
        throw new Error(error.message)
      }

      const payment = await paymentRes.json()
      if (["succeeded", "processing"].includes(payment.paymentStatus)) {
        router.push(orderPath(order.id, order.accessToken ?? null))
        return
      }
      setStripeAccount(payment.stripeAccount)
      setClientSecret(payment.clientSecret)
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
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="w-16 h-16 border-2 border-white/10 rounded-full" />
              <div className="absolute inset-0 w-16 h-16 border-2 border-t-[#ff1493] rounded-full animate-spin" />
            </div>
            <p className="text-white/30 font-body text-sm uppercase tracking-[0.2em]">Loading checkout</p>
          </div>
        </div>
      </div>
    )
  }

  // Event not found
  if (!event) {
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

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Noise texture overlay */}
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
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Event Mini-Header */}
          <div className="mb-8 reveal-up">
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

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-[1fr_400px] gap-8">
            {/* Left Column */}
            <div className="space-y-8">
              {clientSecret ? (
                /* Payment Section */
                <div className="reveal-up space-y-6">
                  <div className="flex items-center gap-4 pb-4 border-b border-white/10">
                    <div
                      className="w-12 h-12 flex items-center justify-center"
                      style={{ backgroundColor: `${accentColor}15` }}
                    >
                      <Shield className="h-6 w-6" style={{ color: accentColor }} />
                    </div>
                    <div>
                      <h2 className="font-headline text-xl tracking-wider">SECURE PAYMENT</h2>
                      <p className="font-body text-sm text-white/40">256-bit encrypted checkout</p>
                    </div>
                  </div>

                  <Elements
                    stripe={stripeAccount ? stripeFor(stripeAccount) : null}
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
                          fontFamily: 'Outfit, system-ui, sans-serif',
                          borderRadius: '0px',
                          spacingUnit: '4px',
                        },
                        rules: {
                          '.Input': {
                            backgroundColor: '#000000',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            fontFamily: 'Outfit, system-ui, sans-serif',
                            padding: '14px',
                          },
                          '.Input:focus': {
                            border: `2px solid ${accentColor}`,
                            boxShadow: `0 0 0 1px ${accentColor}40`,
                          },
                          '.Tab': {
                            backgroundColor: '#000000',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            fontFamily: 'Bebas Neue, Impact, sans-serif',
                            letterSpacing: '0.05em',
                          },
                          '.Tab--selected': {
                            backgroundColor: '#000000',
                            border: `2px solid ${accentColor}`,
                          },
                          '.Label': {
                            fontFamily: 'Outfit, system-ui, sans-serif',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            fontSize: '11px',
                            color: 'rgba(255,255,255,0.5)',
                          },
                        },
                      },
                    }}
                  >
                    <CheckoutForm orderId={orderId!} accessToken={orderAccessToken} accentColor={accentColor} />
                  </Elements>
                </div>
              ) : (
                /* Ticket Selection + Guest Info */
                <div className="space-y-8">
                  {/* Ticket Selection */}
                  <div className="reveal-up">
                    <div className="flex items-center gap-4 pb-4 border-b border-white/10 mb-6">
                      <div
                        className="w-12 h-12 flex items-center justify-center"
                        style={{ backgroundColor: `${accentColor}15` }}
                      >
                        <Ticket className="h-6 w-6" style={{ color: accentColor }} />
                      </div>
                      <div>
                        <h2 className="font-headline text-xl tracking-wider">SELECT TICKETS</h2>
                        <p className="font-body text-sm text-white/40">Choose your ticket type</p>
                      </div>
                    </div>

                    {availableTiers.length === 0 ? (
                      <div className="text-center py-16 border border-white/5">
                        <Ticket className="h-12 w-12 mx-auto text-white/10 mb-4" />
                        <p className="font-headline text-xl text-white/30">NO TICKETS AVAILABLE</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {availableTiers.map((tier) => {
                          const available = tier.quantity - tier.quantitySold
                          const soldOut = available <= 0
                          const qty = quantities[tier.id] || 0
                          const isSelected = qty > 0

                          return (
                            <div
                              key={tier.id}
                              className={`
                                ticket-card border transition-all
                                ${isSelected
                                  ? 'border-l-4 border-white/20'
                                  : 'border-white/5 hover:border-white/15'
                                }
                                ${soldOut ? 'opacity-40' : ''}
                              `}
                              style={isSelected ? { borderLeftColor: accentColor } : undefined}
                            >
                              <div className="p-5">
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2">
                                      <h3 className="font-headline text-xl tracking-wide">{tier.name}</h3>
                                      {soldOut && (
                                        <span className="px-2 py-0.5 bg-white/5 text-white/30 font-mono text-[10px] uppercase">
                                          Sold Out
                                        </span>
                                      )}
                                    </div>
                                    {tier.description && (
                                      <p className="font-body text-sm text-white/40 mb-3">{tier.description}</p>
                                    )}
                                    <div className="flex items-center gap-4">
                                      <span className="font-headline text-2xl" style={{ color: accentColor }}>
                                        {tier.price === 0 ? 'FREE' : formatCents(tier.price)}
                                      </span>
                                      {!soldOut && (
                                        <span className="font-body text-xs text-white/30 uppercase tracking-wider">
                                          {available} available
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
                                          w-10 h-10 flex items-center justify-center border transition-all
                                          ${qty === 0
                                            ? 'border-white/5 opacity-30 cursor-not-allowed'
                                            : 'border-white/20 hover:border-white/40 hover:bg-white/5'
                                          }
                                        `}
                                      >
                                        <Minus className="h-4 w-4" />
                                      </button>
                                      <span
                                        className="w-12 text-center font-headline text-xl"
                                        style={{ color: qty > 0 ? accentColor : 'rgba(255,255,255,0.2)' }}
                                      >
                                        {qty}
                                      </span>
                                      <button
                                        onClick={() => updateQuantity(tier.id, 1)}
                                        disabled={qty >= tier.maxPerOrder || qty >= available}
                                        className={`
                                          w-10 h-10 flex items-center justify-center border transition-all
                                          ${qty >= tier.maxPerOrder || qty >= available
                                            ? 'border-white/5 opacity-30 cursor-not-allowed'
                                            : 'border-white/20 hover:border-white/40 hover:bg-white/5'
                                          }
                                        `}
                                      >
                                        <Plus className="h-4 w-4" />
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
                    <div className="reveal-up">
                      <div className="flex items-center gap-4 pb-4 border-b border-white/10 mb-6">
                        <div
                          className="w-12 h-12 flex items-center justify-center"
                          style={{ backgroundColor: `${accentColor}15` }}
                        >
                          <User className="h-6 w-6" style={{ color: accentColor }} />
                        </div>
                        <div>
                          <h2 className="font-headline text-xl tracking-wider">YOUR DETAILS</h2>
                          <p className="font-body text-sm text-white/40">Where should we send your tickets?</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block font-body text-xs text-white/40 uppercase tracking-wider mb-2">
                            Full Name
                          </label>
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20" />
                            <input
                              type="text"
                              value={guestName}
                              onChange={(e) => setGuestName(e.target.value)}
                              placeholder="Enter your name"
                              className="w-full h-14 pl-12 pr-4 bg-black border border-white/10 text-white placeholder:text-white/20 font-body text-base focus:outline-none focus:border-white/30 transition-colors"
                              style={{
                                borderColor: guestName.trim().length >= 2 ? `${accentColor}50` : undefined
                              }}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block font-body text-xs text-white/40 uppercase tracking-wider mb-2">
                            Email Address
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20" />
                            <input
                              type="email"
                              value={guestEmail}
                              onChange={(e) => setGuestEmail(e.target.value)}
                              placeholder="you@example.com"
                              className="w-full h-14 pl-12 pr-4 bg-black border border-white/10 text-white placeholder:text-white/20 font-body text-base focus:outline-none focus:border-white/30 transition-colors"
                              style={{
                                borderColor: isValidEmail ? `${accentColor}50` : undefined
                              }}
                            />
                          </div>
                          <p className="font-body text-xs text-white/30 mt-2">
                            Your tickets will be sent to this email address
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
              <div className="border border-white/10 overflow-hidden">
                {/* Header */}
                <div
                  className="h-2"
                  style={{ backgroundColor: accentColor }}
                />
                <div
                  className="px-6 py-4 border-b border-white/10"
                  style={{ backgroundColor: `${accentColor}08` }}
                >
                  <h3 className="font-headline text-xl tracking-wider">ORDER SUMMARY</h3>
                </div>

                <div className="p-6">
                  {ticketCount === 0 ? (
                    <div className="text-center py-12">
                      <Ticket className="h-10 w-10 mx-auto text-white/10 mb-4" />
                      <p className="font-body text-white/30 text-sm">Select tickets to continue</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Selected Items */}
                      <div className="space-y-4">
                        {selectedTiers.map((tier) => (
                          <div key={tier.id} className="flex justify-between items-center">
                            <div>
                              <p className="font-headline text-base">{tier.name}</p>
                              <p className="font-body text-xs text-white/40">Qty: {quantities[tier.id]}</p>
                            </div>
                            <p className="font-headline text-lg" style={{ color: accentColor }}>
                              {formatCents(tier.price * quantities[tier.id])}
                            </p>
                          </div>
                        ))}
                      </div>

                      {!isFreeOrder && (
                        <div className="border-t border-white/5 pt-4 space-y-3">
                          <div className="flex justify-between text-white/40 font-body text-sm">
                            <span>Subtotal</span>
                            <span>{formatCents(subtotal)}</span>
                          </div>
                          <div className="flex justify-between text-white/40 font-body text-sm">
                            <span>Service fee</span>
                            <span>{formatCents(platformFee)}</span>
                          </div>
                        </div>
                      )}

                      <div className="border-t border-white/10 pt-4">
                        <div className="flex justify-between items-center">
                          <span className="font-headline text-lg tracking-wider">TOTAL</span>
                          <span className="font-headline text-3xl" style={{ color: accentColor }}>
                            {isFreeOrder ? "FREE" : formatCents(total)}
                          </span>
                        </div>
                      </div>

                      {!clientSecret && (
                        <button
                          className="btn-premium w-full h-14 font-headline text-lg tracking-wider transition-all disabled:opacity-30"
                          style={{
                            backgroundColor: isGuestInfoValid ? accentColor : 'transparent',
                            color: isGuestInfoValid ? '#000' : 'rgba(255,255,255,0.3)',
                            border: isGuestInfoValid ? 'none' : '1px solid rgba(255,255,255,0.1)'
                          }}
                          onClick={handleCheckout}
                          disabled={checkingOut || !isGuestInfoValid}
                        >
                          {checkingOut ? (
                            <span className="flex items-center justify-center gap-3">
                              <Loader2 className="h-5 w-5 animate-spin" />
                              {isFreeOrder ? "GETTING TICKETS" : "PROCESSING"}
                            </span>
                          ) : !isGuestInfoValid ? (
                            "ENTER YOUR DETAILS"
                          ) : isFreeOrder ? (
                            <span className="flex items-center justify-center gap-2">
                              <Ticket className="h-5 w-5" />
                              GET FREE TICKETS
                            </span>
                          ) : (
                            <span className="flex items-center justify-center gap-2">
                              <Lock className="h-5 w-5" />
                              CONTINUE TO PAYMENT
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Trust Indicators */}
                <div className="px-6 py-4 bg-white/[0.02] border-t border-white/5">
                  <div className="flex items-center justify-center gap-4 text-white/30 font-body text-xs">
                    <div className="flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5" />
                      <span>Secure checkout</span>
                    </div>
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    <span>Powered by Stripe</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
