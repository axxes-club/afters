import { headers } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get("stripe-signature")

  if (!signature) {
    return new NextResponse("Missing stripe-signature header", { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return new NextResponse("Webhook signature verification failed", { status: 400 })
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      const orderId = paymentIntent.metadata.orderId

      if (orderId) {
        // Update order status and generate tickets
        const order = await prisma.order.update({
          where: { id: orderId },
          data: {
            status: "PAID",
            paidAt: new Date(),
            stripeChargeId: paymentIntent.latest_charge as string,
          },
          include: {
            items: {
              include: {
                ticketTier: true,
              },
            },
          },
        })

        // Generate tickets for each order item
        for (const item of order.items) {
          for (let i = 0; i < item.quantity; i++) {
            const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`

            await prisma.ticket.create({
              data: {
                ticketNumber,
                orderId: order.id,
                eventId: order.eventId,
                ticketTierId: item.ticketTierId,
                userId: order.userId,
              },
            })
          }

          // Update ticket tier sold count
          await prisma.ticketTier.update({
            where: { id: item.ticketTierId },
            data: {
              quantitySold: {
                increment: item.quantity,
              },
            },
          })
        }
      }
      break
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      const orderId = paymentIntent.metadata.orderId

      if (orderId) {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: "CANCELLED",
          },
        })
      }
      break
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const organizerProfileId = subscription.metadata.organizerProfileId;

      if (organizerProfileId) {
        const planMap: Record<string, string> = {
          active: "ACTIVE",
          trialing: "TRIALING",
          past_due: "PAST_DUE",
          canceled: "CANCELLED",
          incomplete: "INCOMPLETE",
        };

        await prisma.subscription.upsert({
          where: { organizerProfileId },
          create: {
            organizerProfileId,
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: subscription.customer as string,
            stripePriceId: subscription.items.data[0]?.price.id,
            plan: "SIGNATURE",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            status: (planMap[subscription.status] || "ACTIVE") as any,
            trialEndsAt: subscription.trial_end
              ? new Date(subscription.trial_end * 1000)
              : null,
            currentPeriodStart: subscription.items.data[0]?.current_period_start
              ? new Date(subscription.items.data[0].current_period_start * 1000)
              : null,
            currentPeriodEnd: subscription.items.data[0]?.current_period_end
              ? new Date(subscription.items.data[0].current_period_end * 1000)
              : null,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          },
          update: {
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: subscription.customer as string,
            stripePriceId: subscription.items.data[0]?.price.id,
            plan: "SIGNATURE",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            status: (planMap[subscription.status] || "ACTIVE") as any,
            trialEndsAt: subscription.trial_end
              ? new Date(subscription.trial_end * 1000)
              : null,
            currentPeriodStart: subscription.items.data[0]?.current_period_start
              ? new Date(subscription.items.data[0].current_period_start * 1000)
              : null,
            currentPeriodEnd: subscription.items.data[0]?.current_period_end
              ? new Date(subscription.items.data[0].current_period_end * 1000)
              : null,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          },
        });
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const organizerProfileId = subscription.metadata.organizerProfileId;

      if (organizerProfileId) {
        await prisma.subscription.update({
          where: { organizerProfileId },
          data: {
            plan: "FREE",
            status: "CANCELLED",
            cancelAtPeriodEnd: false,
          },
        });

        // Deactivate all staff members when downgrading
        await prisma.staffMember.updateMany({
          where: { organizerProfileId },
          data: { status: "SUSPENDED" },
        });
      }
      break;
    }

    case "account.updated": {
      // Stripe Connect account status update
      const account = event.data.object as Stripe.Account

      await prisma.organizerProfile.updateMany({
        where: { stripeAccountId: account.id },
        data: {
          stripeOnboardingComplete: account.details_submitted ?? false,
          stripeChargesEnabled: account.charges_enabled ?? false,
          stripePayoutsEnabled: account.payouts_enabled ?? false,
        },
      })
      break
    }
  }

  return new NextResponse("OK", { status: 200 })
}
