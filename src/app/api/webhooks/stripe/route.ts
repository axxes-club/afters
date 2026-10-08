import { after, NextResponse } from "next/server"
import Stripe from "stripe"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import { formatInTimezone } from "@/lib/utils"
import { generateTicketPDF } from "@/lib/pdf-ticket"
import { getWalletPassUrl, isAppleWalletConfigured } from "@/lib/apple-wallet"
import { sendEmail, generateTicketEmailHtml, generateOrganizerSaleEmailHtml } from "@/lib/email"
import { notifyTicketSale } from "@/lib/push"

export async function POST(req: Request) {
  const body = await req.text()
  const signature = req.headers.get("stripe-signature")

  if (!signature) {
    return new NextResponse("Missing stripe-signature header", { status: 400 })
  }

  // Platform subscriptions and connected-account payments have different secrets.
  const secrets = [process.env.STRIPE_WEBHOOK_SECRET, process.env.STRIPE_CONNECT_WEBHOOK_SECRET]
    .filter((secret): secret is string => Boolean(secret))
  let event: Stripe.Event | undefined
  for (const secret of secrets) {
    try {
      event = stripe.webhooks.constructEvent(body, signature, secret)
      break
    } catch {
      // Try the other configured endpoint secret; never trust an unverified body.
    }
  }
  if (!event) {
    return new NextResponse("Webhook signature verification failed", { status: 400 })
  }
  // Live Connect endpoints also receive test events. They must not fulfil live orders.
  if (!event.livemode && /^(sk|rk)_live_/.test(process.env.STRIPE_SECRET_KEY || "")) {
    return new NextResponse("OK", { status: 200 })
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const orderId = paymentIntent.metadata.orderId

        if (orderId) {
          // Update order status and generate tickets
          const result = await prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
              where: { id: orderId },
              include: {
                items: { include: { ticketTier: true } },
                event: { include: { organizer: true } },
                user: true,
              },
            })
            // Unrelated payments are not ticket orders; retries of fulfilled orders are no-ops.
            if (!order || order.status !== "PENDING") return null
            // Use the same lock as order reservations so sold and pending counts
            // cannot be observed across different fulfillment states.
            await tx.$queryRaw`SELECT "id" FROM "Event" WHERE "id" = ${order.eventId} FOR UPDATE`
            if (order.stripePaymentIntentId !== paymentIntent.id ||
                order.total !== paymentIntent.amount ||
                order.total !== paymentIntent.amount_received ||
                paymentIntent.currency !== "usd" ||
                (event.account && event.account !== order.event.organizer.stripeAccountId)) {
              throw new Error("Payment does not match its ticket order")
            }
            // Claim the pending order under the database row lock. A concurrent retry
            // waits here, sees PAID, and cannot issue a second set of tickets.
            const claimed = await tx.order.updateMany({
              where: { id: order.id, status: "PENDING", stripePaymentIntentId: paymentIntent.id },
              data: {
                status: "PAID", paidAt: new Date(),
                stripeChargeId: typeof paymentIntent.latest_charge === "string"
                  ? paymentIntent.latest_charge : paymentIntent.latest_charge?.id ?? null,
              },
            })
            if (claimed.count !== 1) return null

            const createdTickets: Parameters<typeof generateTicketPDF>[0] = []

            // Generate tickets for each order item
            for (const item of order.items) {
              for (let i = 0; i < item.quantity; i++) {
                const ticketNumber = `AFT-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`

                const ticket = await tx.ticket.create({
                  data: {
                    ticketNumber,
                    orderId: order.id,
                    eventId: order.eventId,
                    ticketTierId: item.ticketTierId,
                    userId: order.userId || null, // null for guest orders
                  },
                })

                // Determine holder name - use guest name or user name
                const holderName = order.guestName
                  || (order.user?.firstName && order.user?.lastName
                    ? `${order.user.firstName} ${order.user.lastName}`
                    : undefined)

                createdTickets.push({
                  ticketNumber: ticket.ticketNumber,
                  ticketId: ticket.id,
                  tierName: item.ticketTier.name,
                  eventTitle: order.event.title,
                  eventDate: formatInTimezone(new Date(order.event.startsAt), order.event.timezone, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  }),
                  venueName: order.event.venueName,
                  venueAddress: `${order.event.venueAddress}, ${order.event.city}${order.event.state ? `, ${order.event.state}` : ''}`,
                  holderName,
                  isTestTicket: false,
                })
              }

              // Update ticket tier sold count
              await tx.ticketTier.update({
                where: { id: item.ticketTierId },
                data: {
                  quantitySold: {
                    increment: item.quantity,
                  },
                },
              })
            }

            return { order, createdTickets }
          }, { timeout: 15000 })
          if (!result) break
          const { order, createdTickets } = result

          // Generate PDF and send email in background
          after(
            async () => {
              try {
                const pdfBuffer = await generateTicketPDF(createdTickets)

                const emailHtml = generateTicketEmailHtml({
                  eventTitle: order.event.title,
                  eventDate: formatInTimezone(new Date(order.event.startsAt), order.event.timezone, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    timeZoneName: 'short',
                  }),
                  venueName: order.event.venueName,
                  venueAddress: `${order.event.venueAddress}, ${order.event.city}${order.event.state ? `, ${order.event.state}` : ''}`,
                  ticketCount: createdTickets.length,
                  orderNumber: order.orderNumber,
                  walletPasses: isAppleWalletConfigured()
                    ? createdTickets.map((t) => ({ ticketNumber: t.ticketNumber, url: getWalletPassUrl(t.ticketId) }))
                    : undefined,
                })

                await sendEmail({
                  to: order.email,
                  subject: `Your Tickets for ${order.event.title}`,
                  html: emailHtml,
                  attachments: [{
                    filename: `tickets-${order.orderNumber}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf',
                  }],
                })

                console.log(`Sent ${createdTickets.length} tickets to ${order.email}`)

                // Notify organizer of the sale (push + email)
                const organizer = await prisma.organizerProfile.findFirst({
                  where: { id: order.event.organizerId },
                  include: { user: true },
                })

                if (organizer?.user) {
                  // Send push notification to organizer
                  await notifyTicketSale(
                    organizer.userId,
                    order.event.title,
                    createdTickets.length,
                    order.total
                  )

                  // Check if organizer wants email notifications for sales
                  const prefs = await prisma.notificationPreference.findUnique({
                    where: { userId: organizer.userId },
                  })

                  if (!prefs || prefs.emailTicketSales) {
                    const saleEmailHtml = generateOrganizerSaleEmailHtml({
                      eventTitle: order.event.title,
                      ticketCount: createdTickets.length,
                      amount: order.total,
                      buyerEmail: order.email,
                      orderNumber: order.orderNumber,
                    })

                    await sendEmail({
                      to: organizer.user.email,
                      subject: `💰 ${createdTickets.length} ticket${createdTickets.length > 1 ? 's' : ''} sold for ${order.event.title}`,
                      html: saleEmailHtml,
                    })

                    console.log(`Notified organizer ${organizer.user.email} of sale`)
                  }
                }
              } catch (emailError) {
                console.error('Failed to send ticket email:', emailError)
              }
            }
          )
        }
        break
      }

      case "payment_intent.payment_failed": {
        // A card decline is retryable on the same PaymentIntent. It does not cancel
        // the order, and a late failure must never undo a successful payment.
        break
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        if (event.account) break; // Subscriptions belong to the platform account.
        const subscription = event.data.object as Stripe.Subscription;
        const organizerProfileId = subscription.metadata.organizerProfileId;

        if (organizerProfileId) {
          const statusMap: Record<string, string> = {
            active: "ACTIVE",
            trialing: "TRIALING",
            past_due: "PAST_DUE",
            canceled: "CANCELLED",
            incomplete: "INCOMPLETE",
          };

          // Determine internal plan from metadata or subscription state
          const metaPlan = subscription.metadata.plan; // e.g. "SIGNATURE_30D"
          let plan: string;

          if (metaPlan && ["SIGNATURE_30D", "SIGNATURE_180D", "SIGNATURE_360D", "SIGNATURE_TRIAL_7D"].includes(metaPlan)) {
            plan = metaPlan;
          } else if (subscription.status === "trialing") {
            plan = "SIGNATURE_TRIAL_7D";
          } else {
            // Derive from interval: 1 month = 30D, 6 months = 180D, 1 year = 360D
            const item = subscription.items.data[0];
            const interval = item?.price?.recurring?.interval;
            const count = item?.price?.recurring?.interval_count || 1;
            if (interval === "year") {
              plan = "SIGNATURE_360D";
            } else if (interval === "month" && count >= 6) {
              plan = "SIGNATURE_180D";
            } else {
              plan = "SIGNATURE_30D";
            }
          }

          // If trialing, override to TRIAL plan
          if (subscription.status === "trialing") {
            plan = "SIGNATURE_TRIAL_7D";
          }

          // If active and was trial, upgrade to the paid plan from metadata
          if (subscription.status === "active" && plan === "SIGNATURE_TRIAL_7D") {
            plan = metaPlan && metaPlan !== "SIGNATURE_TRIAL_7D" ? metaPlan : "SIGNATURE_30D";
          }

          const subData = {
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: subscription.customer as string,
            stripePriceId: subscription.items.data[0]?.price.id,
            plan,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            status: (statusMap[subscription.status] || "ACTIVE") as any,
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
          };

          await prisma.subscription.upsert({
            where: { organizerProfileId },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            create: { organizerProfileId, ...subData } as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            update: subData as any,
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        if (event.account) break; // Subscriptions belong to the platform account.
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
  } catch (error) {
    console.error("Stripe webhook processing failed:", error)
    return new NextResponse("Webhook processing failed", { status: 500 })
  }
}
