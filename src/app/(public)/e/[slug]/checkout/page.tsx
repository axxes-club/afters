"use client"

import { useEffect, useState, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { ArrowLeft, Minus, Plus, Ticket, Lock, Calendar, MapPin, Loader2 } from "lucide-react"
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
      <div className="rounded-xl overflow-hidden border border-white/10 bg-white/[0.02]">
        <PaymentElement
          options={{
            layout: "tabs",
          }}
        />
      </div>
      <Button
        type="submit"
        className="w-full h-14 text-base font-bold btn-glow transition-all"
        style={{
          backgroundColor: accentColor,
          '--accent-color': accentColor
        } as React.CSSProperties}
        disabled={!stripe || loading}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Processing...
          </span>
        ) : (
          "Complete Purchase"
        )}
      </Button>
    </form>
  )
}

export default function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const { isSignedIn, isLoaded } = useUser()
  const router = useRouter()

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [checkingOut, setCheckingOut] = useState(false)

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
  const platformFee = Math.round(subtotal * 0.1) + ticketCount * 99
  const total = subtotal + platformFee

  async function handleCheckout() {
    if (!isSignedIn) {
      router.push(`/sign-in?redirect_url=${encodeURIComponent(window.location.pathname)}`)
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
  if (!isLoaded || loading) {
    return (
      <div
        className="min-h-screen bg-black"
        style={{ '--accent-color': '#ff1493' } as React.CSSProperties}
      >
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 border-2 border-white/10 rounded-full" />
              <div
                className="absolute inset-0 w-12 h-12 border-2 border-t-[#ff1493] rounded-full animate-spin"
              />
            </div>
            <p className="text-white/50 text-sm font-mono tracking-wider">LOADING</p>
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
          <h1 className="text-2xl font-bold text-white mb-2">Event not found</h1>
          <Link href="/" className="text-[#ff1493] hover:underline">Return home</Link>
        </div>
      </div>
    )
  }

  const eventDate = new Date(event.startsAt)

  return (
    <div
      className="min-h-screen bg-black text-white"
      style={{ '--accent-color': accentColor } as React.CSSProperties}
    >
      {/* Floating Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={`/e/${slug}`} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back</span>
          </Link>
          <Link href="/" className="text-xl font-bold tracking-tight font-display">
            AFTERS<span style={{ color: accentColor }}>.</span>
          </Link>
          <div className="w-16" /> {/* Spacer for centering */}
        </div>
      </header>

      <main className="pt-24 pb-8">
        <div className="container mx-auto px-4">
          {/* Event Header Card */}
          <div
            className="relative rounded-2xl overflow-hidden mb-8 animate-fade-in-up"
            style={{ animationDelay: '0.1s', opacity: 0 }}
          >
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent" />
            {event.flyerUrl && (
              <div className="absolute inset-0 opacity-10">
                <Image src={event.flyerUrl} alt="" fill className="object-cover blur-2xl" />
              </div>
            )}

            <div className="relative p-6 md:p-8 flex items-center gap-6">
              {/* Mini Flyer */}
              {event.flyerUrl && (
                <div className="hidden sm:block relative w-24 h-32 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                  <Image src={event.flyerUrl} alt={event.title} fill className="object-cover" />
                </div>
              )}

              {/* Event Info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-3 truncate">
                  {event.title}
                </h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/60">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" style={{ color: accentColor }} />
                    <span>{eventDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" style={{ color: accentColor }} />
                    <span>{event.venueName}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-[1fr_400px] gap-8">
            {/* Left Column - Ticket Selection or Payment */}
            <div
              className="animate-fade-in-up"
              style={{ animationDelay: '0.2s', opacity: 0 }}
            >
              {clientSecret ? (
                /* Payment Section */
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${accentColor}20` }}
                    >
                      <Lock className="h-5 w-5" style={{ color: accentColor }} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Secure Payment</h2>
                      <p className="text-sm text-white/50">Your payment is encrypted and secure</p>
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
                          colorBackground: '#0a0a0a',
                          colorText: '#ffffff',
                          colorTextSecondary: '#888888',
                          colorDanger: '#ff4444',
                          fontFamily: 'system-ui, sans-serif',
                          borderRadius: '12px',
                          spacingUnit: '4px',
                        },
                        rules: {
                          '.Input': {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                          },
                          '.Input:focus': {
                            border: `1px solid ${accentColor}`,
                            boxShadow: `0 0 0 1px ${accentColor}40`,
                          },
                          '.Tab': {
                            backgroundColor: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                          },
                          '.Tab--selected': {
                            backgroundColor: `${accentColor}15`,
                            border: `1px solid ${accentColor}50`,
                          },
                        },
                      },
                    }}
                  >
                    <CheckoutForm orderId={orderId!} accentColor={accentColor} />
                  </Elements>
                </div>
              ) : (
                /* Ticket Selection */
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${accentColor}20` }}
                    >
                      <Ticket className="h-5 w-5" style={{ color: accentColor }} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Select Tickets</h2>
                      <p className="text-sm text-white/50">Choose your ticket type</p>
                    </div>
                  </div>

                  {availableTiers.length === 0 ? (
                    <div className="text-center py-16 rounded-2xl border border-white/10 bg-white/[0.02]">
                      <Ticket className="h-12 w-12 mx-auto text-white/20 mb-4" />
                      <p className="text-white/60">No tickets available at this time</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {availableTiers.map((tier, index) => {
                        const available = tier.quantity - tier.quantitySold
                        const soldOut = available <= 0
                        const qty = quantities[tier.id] || 0
                        const isSelected = qty > 0

                        return (
                          <div
                            key={tier.id}
                            className={`
                              relative rounded-xl border transition-all duration-200 overflow-hidden
                              animate-fade-in-up
                              ${isSelected
                                ? 'border-transparent'
                                : 'border-white/10 hover:border-white/20'
                              }
                              ${soldOut ? 'opacity-50' : 'card-hover'}
                            `}
                            style={{
                              animationDelay: `${0.1 * (index + 1)}s`,
                              opacity: 0,
                              ...(isSelected && {
                                boxShadow: `0 0 0 2px ${accentColor}, 0 0 30px ${accentColor}30`,
                              })
                            }}
                          >
                            {/* Accent border indicator */}
                            <div
                              className="absolute left-0 top-0 bottom-0 w-1 transition-opacity"
                              style={{
                                backgroundColor: accentColor,
                                opacity: isSelected ? 1 : 0
                              }}
                            />

                            <div className="p-5 bg-white/[0.02]">
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-3 mb-1">
                                    <h3 className="font-bold text-lg">{tier.name}</h3>
                                    {soldOut && (
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/50">
                                        SOLD OUT
                                      </span>
                                    )}
                                  </div>
                                  {tier.description && (
                                    <p className="text-sm text-white/50 mb-2">{tier.description}</p>
                                  )}
                                  <div className="flex items-center gap-3">
                                    <span
                                      className="text-xl font-bold"
                                      style={{ color: accentColor }}
                                    >
                                      {tier.price === 0 ? 'FREE' : formatCents(tier.price)}
                                    </span>
                                    {!soldOut && (
                                      <span className="text-xs text-white/40">
                                        {available} left
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {!soldOut && (
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => updateQuantity(tier.id, -1)}
                                      disabled={qty === 0}
                                      className={`
                                        w-10 h-10 rounded-full flex items-center justify-center
                                        border border-white/20 transition-all
                                        ${qty === 0
                                          ? 'opacity-30 cursor-not-allowed'
                                          : 'hover:border-white/40 hover:bg-white/5'
                                        }
                                      `}
                                    >
                                      <Minus className="h-4 w-4" />
                                    </button>
                                    <span
                                      className="w-12 text-center text-xl font-bold tabular-nums"
                                      style={{ color: qty > 0 ? accentColor : undefined }}
                                    >
                                      {qty}
                                    </span>
                                    <button
                                      onClick={() => updateQuantity(tier.id, 1)}
                                      disabled={qty >= tier.maxPerOrder || qty >= available}
                                      className={`
                                        w-10 h-10 rounded-full flex items-center justify-center
                                        border transition-all
                                        ${qty >= tier.maxPerOrder || qty >= available
                                          ? 'border-white/20 opacity-30 cursor-not-allowed'
                                          : 'border-white/20 hover:border-white/40 hover:bg-white/5'
                                        }
                                      `}
                                      style={qty < tier.maxPerOrder && qty < available ? {
                                        borderColor: `${accentColor}50`,
                                        backgroundColor: `${accentColor}10`,
                                      } : undefined}
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
              )}
            </div>

            {/* Right Column - Order Summary */}
            <div
              className="lg:sticky lg:top-24 h-fit animate-fade-in-up"
              style={{ animationDelay: '0.3s', opacity: 0 }}
            >
              <div className="glass-card rounded-2xl overflow-hidden">
                <div
                  className="px-6 py-4 border-b border-white/10"
                  style={{ backgroundColor: `${accentColor}10` }}
                >
                  <h3 className="font-bold text-lg">Order Summary</h3>
                </div>

                <div className="p-6 space-y-4">
                  {ticketCount === 0 ? (
                    <p className="text-center text-white/40 py-8">
                      Select tickets to continue
                    </p>
                  ) : (
                    <>
                      {/* Selected Items */}
                      <div className="space-y-3">
                        {selectedTiers.map((tier) => (
                          <div key={tier.id} className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{tier.name}</p>
                              <p className="text-sm text-white/50">x{quantities[tier.id]}</p>
                            </div>
                            <p className="font-medium">
                              {formatCents(tier.price * quantities[tier.id])}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-white/10 pt-4 space-y-2">
                        <div className="flex justify-between text-sm text-white/60">
                          <span>Subtotal</span>
                          <span>{formatCents(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-white/60">
                          <span>Service fee</span>
                          <span>{formatCents(platformFee)}</span>
                        </div>
                      </div>

                      <div className="border-t border-white/10 pt-4">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold">Total</span>
                          <span
                            className="text-2xl font-bold"
                            style={{ color: accentColor }}
                          >
                            {formatCents(total)}
                          </span>
                        </div>
                      </div>

                      {!clientSecret && (
                        <Button
                          className="w-full h-14 text-base font-bold mt-4 btn-glow"
                          style={{
                            backgroundColor: accentColor,
                            '--accent-color': accentColor
                          } as React.CSSProperties}
                          onClick={handleCheckout}
                          disabled={checkingOut}
                        >
                          {checkingOut ? (
                            <span className="flex items-center gap-2">
                              <Loader2 className="h-5 w-5 animate-spin" />
                              Processing...
                            </span>
                          ) : isSignedIn ? (
                            "Continue to Payment"
                          ) : (
                            "Sign in to Continue"
                          )}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="mt-4 flex items-center justify-center gap-4 text-xs text-white/30">
                <div className="flex items-center gap-1.5">
                  <Lock className="h-3 w-3" />
                  <span>Secure checkout</span>
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
