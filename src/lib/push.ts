import webpush from "web-push"
import { prisma } from "@/lib/prisma"

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    "mailto:support@afters.live",
    vapidPublicKey,
    vapidPrivateKey
  )
}

interface PushPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  url?: string
  tag?: string
  requireInteraction?: boolean
}

type NotificationType =
  | "ticketSales"
  | "eventReminders"
  | "checkInSummaries"
  | "productUpdates"

/**
 * Send a push notification to a specific user
 */
export async function sendPushNotification(
  userId: string,
  payload: PushPayload,
  notificationType?: NotificationType
): Promise<{ sent: number; failed: number }> {
  let sent = 0
  let failed = 0

  // If notification type specified, check user preferences
  if (notificationType) {
    const preferences = await prisma.notificationPreference.findUnique({
      where: { userId },
    })

    if (preferences) {
      const preferenceKey = `push${notificationType.charAt(0).toUpperCase()}${notificationType.slice(1)}` as keyof typeof preferences
      if (preferences[preferenceKey] === false) {
        // User has disabled this notification type
        return { sent: 0, failed: 0 }
      }
    }
  }

  // Get all push subscriptions for the user
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  })

  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        },
        JSON.stringify(payload)
      )
      sent++
    } catch (error) {
      failed++
      console.error("Error sending push notification:", error)

      // If subscription is expired or invalid, remove it
      if (error instanceof webpush.WebPushError && error.statusCode === 410) {
        await prisma.pushSubscription.delete({
          where: { id: subscription.id },
        })
      }
    }
  }

  return { sent, failed }
}

/**
 * Send a push notification to multiple users
 */
export async function sendPushNotificationToUsers(
  userIds: string[],
  payload: PushPayload,
  notificationType?: NotificationType
): Promise<{ sent: number; failed: number }> {
  let totalSent = 0
  let totalFailed = 0

  for (const userId of userIds) {
    const { sent, failed } = await sendPushNotification(
      userId,
      payload,
      notificationType
    )
    totalSent += sent
    totalFailed += failed
  }

  return { sent: totalSent, failed: totalFailed }
}

/**
 * Send notification for ticket sale
 */
export async function notifyTicketSale(
  organizerUserId: string,
  eventTitle: string,
  ticketCount: number,
  amount: number
): Promise<void> {
  await sendPushNotification(
    organizerUserId,
    {
      title: "Ticket Sale",
      body: `${ticketCount} ticket${ticketCount > 1 ? "s" : ""} sold for ${eventTitle} ($${(amount / 100).toFixed(2)})`,
      url: "/d/events",
      tag: "ticket-sale",
    },
    "ticketSales"
  )
}

/**
 * Send event reminder notification
 */
export async function notifyEventReminder(
  organizerUserId: string,
  eventTitle: string,
  hoursUntilStart: number
): Promise<void> {
  await sendPushNotification(
    organizerUserId,
    {
      title: "Event Reminder",
      body: `${eventTitle} starts in ${hoursUntilStart} hour${hoursUntilStart > 1 ? "s" : ""}`,
      url: "/d/events",
      tag: "event-reminder",
      requireInteraction: true,
    },
    "eventReminders"
  )
}

/**
 * Send check-in summary notification
 */
export async function notifyCheckInSummary(
  organizerUserId: string,
  eventTitle: string,
  checkedIn: number,
  total: number
): Promise<void> {
  await sendPushNotification(
    organizerUserId,
    {
      title: "Check-in Summary",
      body: `${eventTitle}: ${checkedIn}/${total} guests checked in`,
      url: "/d/events",
      tag: "check-in-summary",
    },
    "checkInSummaries"
  )
}

/**
 * Send product update notification
 */
export async function notifyProductUpdate(
  userIds: string[],
  title: string,
  body: string,
  url?: string
): Promise<void> {
  await sendPushNotificationToUsers(
    userIds,
    {
      title,
      body,
      url: url || "/d",
      tag: "product-update",
    },
    "productUpdates"
  )
}
