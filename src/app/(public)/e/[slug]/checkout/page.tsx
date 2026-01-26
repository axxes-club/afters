"use client"

import { useEffect, useState, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { toast } from "sonner"
import { ArrowLeft, Minus, Plus } from "lucide-react"
import Link from "next/link"

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
  ticketTiers: TicketTier[]
  organizer: {
    displayName: string
    slug: string
  }
}

function CheckoutForm({ orderId }: { orderId: string }) {
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button type="submit" className="w-full" size="lg" disabled={!stripe || loading}>
        {loading ? "Processing..." : "Pay Now"}
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
      // Need to find event by slug - for now use a search
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

  function updateQuantity(tierId: string, delta: number) {
    setQuantities((prev) => {
      const tier = event?.ticketTiers.find((t) => t.id === tierId)
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

  const selectedTiers = event?.ticketTiers.filter((t) => (quantities[t.id] || 0) > 0) || []
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
      // Create order
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

      // Create payment intent
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

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <p className="text-center">Loading...</p>
        </main>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <p className="text-center">Event not found</p>
        </main>
      </div>
    )
  }

  const formatCents = (cents: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100)

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <Link href={`/e/${slug}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to event
          </Link>
        </div>

        <h1 className="text-2xl font-bold mb-2">{event.title}</h1>
        <p className="text-muted-foreground mb-6">
          {new Date(event.startsAt).toLocaleDateString()} at {event.venueName}
        </p>

        {clientSecret ? (
          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
              <CardDescription>Complete your purchase</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 bg-muted rounded-lg">
                <div className="flex justify-between mb-2">
                  <span>Subtotal</span>
                  <span>{formatCents(subtotal)}</span>
                </div>
                <div className="flex justify-between mb-2 text-sm text-muted-foreground">
                  <span>Service fee</span>
                  <span>{formatCents(platformFee)}</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-2">
                  <span>Total</span>
                  <span>{formatCents(total)}</span>
                </div>
              </div>

              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: { theme: "stripe" },
                }}
              >
                <CheckoutForm orderId={orderId!} />
              </Elements>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Select Tickets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {event.ticketTiers.map((tier) => {
                  const available = tier.quantity - tier.quantitySold
                  const soldOut = available <= 0
                  const qty = quantities[tier.id] || 0

                  return (
                    <div
                      key={tier.id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${soldOut ? "opacity-50" : ""}`}
                    >
                      <div>
                        <p className="font-medium">{tier.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCents(tier.price)} &bull; {available} available
                        </p>
                      </div>
                      {!soldOut && (
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(tier.id, -1)}
                            disabled={qty === 0}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">{qty}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(tier.id, 1)}
                            disabled={qty >= tier.maxPerOrder || qty >= available}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      {soldOut && <span className="text-sm text-muted-foreground">Sold out</span>}
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {ticketCount > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedTiers.map((tier) => (
                    <div key={tier.id} className="flex justify-between mb-2">
                      <span>
                        {tier.name} x {quantities[tier.id]}
                      </span>
                      <span>{formatCents(tier.price * quantities[tier.id])}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm text-muted-foreground mb-2">
                    <span>Service fee (10% + $0.99/ticket)</span>
                    <span>{formatCents(platformFee)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-2">
                    <span>Total</span>
                    <span>{formatCents(total)}</span>
                  </div>

                  <Button
                    className="w-full mt-4"
                    size="lg"
                    onClick={handleCheckout}
                    disabled={checkingOut}
                  >
                    {checkingOut ? "Processing..." : isSignedIn ? "Continue to Payment" : "Sign in to Checkout"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  )
}
