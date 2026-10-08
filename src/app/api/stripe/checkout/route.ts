import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"
import { hasPayoutController } from "@/lib/payouts"

/**
 * POST /api/stripe/checkout — the card payment for a pending paid order.
 *
 * A direct charge on the organizer's payout account (src/lib/payouts.ts): the
 * buyer pays the order total, Stripe's fee comes out of the organizer's share,
 * and afters' service fee (`platformFee`) is the application fee. The browser
 * confirms the payment against the organizer's account, so the response says
 * which account that is.
 */
export async function POST(req: Request) {
  try {
    const { orderId, email: confirmEmail } = await req.json()

    if (!orderId) {
      return NextResponse.json({ message: "Order ID required" }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { event: { include: { organizer: true } } },
    })

    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 })
    }

    // Security: the caller must know the email the order was placed with.
    if (!confirmEmail || String(confirmEmail).toLowerCase() !== order.email.toLowerCase()) {
      return NextResponse.json({ message: "Invalid confirmation" }, { status: 403 })
    }

    // Security: Prevent checkout of stale orders (older than 1 hour)
    const ONE_HOUR = 60 * 60 * 1000
    if (Date.now() - new Date(order.createdAt).getTime() > ONE_HOUR) {
      return NextResponse.json({ message: "Order has expired. Please create a new order." }, { status: 400 })
    }

    if (order.status !== "PENDING") {
      return NextResponse.json({ message: "Order already processed" }, { status: 400 })
    }

    if (order.total <= 0) {
      return NextResponse.json({ message: "This order is free; no payment needed" }, { status: 400 })
    }

    const stripeAccount = order.event.organizer.stripeAccountId
    if (!stripeAccount) {
      return NextResponse.json({ message: "This organizer isn't set up to take payments yet" }, { status: 400 })
    }
    // Read live, not from the cached flag: a suspended account must not take money.
    const account = await stripe.accounts.retrieve(stripeAccount)
    if (!account.charges_enabled || !hasPayoutController(account)) {
      return NextResponse.json({ message: "This organizer isn't set up to take payments yet" }, { status: 400 })
    }

    // A retry (back button, double click) reuses the order's payment instead of making a second one.
    if (order.stripePaymentIntentId) {
      // A network error cannot justify another charge: the first may have succeeded.
      const existing = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId, {}, { stripeAccount })
      if (existing.amount !== order.total) {
        return NextResponse.json({ message: "Payment amount does not match this order" }, { status: 409 })
      }
      if (existing.status !== "canceled") {
        return NextResponse.json({ clientSecret: existing.client_secret, stripeAccount, paymentStatus: existing.status })
      }
    }

    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: order.total,
        currency: "usd",
        application_fee_amount: order.platformFee,
        automatic_payment_methods: { enabled: true },
        metadata: {
          orderId: order.id,
          eventId: order.eventId,
          organizerProfileId: order.event.organizerId,
          userId: order.userId || "guest",
        },
        receipt_email: order.email,
        description: `Tickets for ${order.event.title}`,
      },
      { stripeAccount, idempotencyKey: `afters-order:${order.id}:${order.stripePaymentIntentId ?? "first"}` }
    )

    const assigned = await prisma.order.updateMany({
      where: {
        id: orderId, status: "PENDING", stripePaymentIntentId: order.stripePaymentIntentId,
        createdAt: { gte: new Date(Date.now() - ONE_HOUR) },
      },
      data: { stripePaymentIntentId: paymentIntent.id },
    })
    if (assigned.count !== 1) {
      const current = await prisma.order.findUnique({ where: { id: orderId } })
      if (current?.stripePaymentIntentId !== paymentIntent.id || !["PENDING", "PAID"].includes(current.status)) {
        // Expiration can race a slow Stripe create. Never expose its client secret
        // once the reservation has been released.
        await stripe.paymentIntents.cancel(paymentIntent.id, {}, { stripeAccount })
        return NextResponse.json({ message: "Order has expired. Please create a new order." }, { status: 409 })
      }
    }

    return NextResponse.json({ clientSecret: paymentIntent.client_secret, stripeAccount })
  } catch (error) {
    console.error("Error creating payment intent:", error)
    return NextResponse.json({ message: "Failed to create payment" }, { status: 500 })
  }
}
