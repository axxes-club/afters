"use client"

import { useState, useEffect, useCallback } from "react"

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

interface PushNotificationState {
  isSupported: boolean
  permission: NotificationPermission | "default"
  isSubscribed: boolean
  isLoading: boolean
  error: string | null
}

function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray.buffer
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: true, // Assume supported until proven otherwise
    permission: "default",
    isSubscribed: false,
    isLoading: false, // Don't block UI on initial load
    error: null,
  })

  // Check if push notifications are supported (runs once on mount)
  useEffect(() => {
    const checkSupport = async () => {
      // Check if browser APIs are available
      const isSupported =
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window

      if (!isSupported) {
        setState((prev) => ({
          ...prev,
          isSupported: false,
          permission: "default",
        }))
        return
      }

      // Get current permission state
      const permission = Notification.permission

      // Check for existing subscription (with timeout to avoid hanging)
      let isSubscribed = false
      try {
        // Only check if we have permission and a service worker is already registered
        if (permission === "granted" && navigator.serviceWorker.controller) {
          const registration = await Promise.race([
            navigator.serviceWorker.ready,
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000))
          ])
          if (registration) {
            const subscription = await registration.pushManager.getSubscription()
            isSubscribed = !!subscription
          }
        }
      } catch {
        // Ignore errors when checking subscription
      }

      setState((prev) => ({
        ...prev,
        isSupported: true,
        permission,
        isSubscribed,
      }))
    }

    checkSupport()
  }, [])

  // Register service worker
  const registerServiceWorker = useCallback(async (): Promise<ServiceWorkerRegistration | null> => {
    if (!("serviceWorker" in navigator)) return null

    try {
      const registration = await navigator.serviceWorker.register("/sw.js")
      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready
      return registration
    } catch (error) {
      console.error("Service worker registration failed:", error)
      return null
    }
  }, [])

  // Request permission and subscribe
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      setState((prev) => ({ ...prev, error: "Push notifications not supported in this browser" }))
      return false
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      // Request notification permission
      const permission = await Notification.requestPermission()
      setState((prev) => ({ ...prev, permission }))

      if (permission !== "granted") {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: permission === "denied" 
            ? "Notifications blocked. Please enable them in browser settings."
            : "Permission not granted",
        }))
        return false
      }

      // Register service worker
      const registration = await registerServiceWorker()
      if (!registration) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Failed to register service worker",
        }))
        return false
      }

      // Check VAPID key
      if (!VAPID_PUBLIC_KEY) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Push notifications not configured",
        }))
        return false
      }

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      // Send subscription to server
      const response = await fetch("/api/user/notifications/push-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: btoa(
              String.fromCharCode(...new Uint8Array(subscription.getKey("p256dh")!))
            ),
            auth: btoa(
              String.fromCharCode(...new Uint8Array(subscription.getKey("auth")!))
            ),
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save subscription")
      }

      setState((prev) => ({
        ...prev,
        isSubscribed: true,
        isLoading: false,
        error: null,
      }))

      return true
    } catch (error) {
      console.error("Error subscribing to push notifications:", error)
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to enable notifications",
      }))
      return false
    }
  }, [state.isSupported, registerServiceWorker])

  // Unsubscribe
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await subscription.unsubscribe()

        await fetch("/api/user/notifications/push-subscription", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })
      }

      setState((prev) => ({
        ...prev,
        isSubscribed: false,
        isLoading: false,
        error: null,
      }))

      return true
    } catch (error) {
      console.error("Error unsubscribing:", error)
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to disable notifications",
      }))
      return false
    }
  }, [])

  return {
    ...state,
    subscribe,
    unsubscribe,
  }
}
