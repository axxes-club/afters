// Afters Push Notification Service Worker

self.addEventListener("push", (event) => {
  if (!event.data) return

  try {
    const data = event.data.json()

    const options = {
      body: data.body || "",
      icon: data.icon || "/icon-192.png",
      badge: data.badge || "/icon-192.png",
      data: {
        url: data.url || "/",
      },
      tag: data.tag || "afters-notification",
      requireInteraction: data.requireInteraction || false,
    }

    event.waitUntil(
      self.registration.showNotification(data.title || "Afters", options)
    )
  } catch (error) {
    console.error("Error showing notification:", error)
  }
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const url = event.notification.data?.url || "/"

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})

// Handle subscription change (browser may refresh subscription)
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    fetch("/api/user/notifications/push-subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: event.newSubscription?.endpoint,
        keys: {
          p256dh: event.newSubscription?.toJSON().keys?.p256dh,
          auth: event.newSubscription?.toJSON().keys?.auth,
        },
      }),
    })
  )
})
