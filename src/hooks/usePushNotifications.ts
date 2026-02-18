"use client"

import { useState, useEffect, useCallback } from "react"

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

interface PushNotificationState {
  isSupported: boolean
  permission: NotificationPermission | "loading"
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
    isSupported: false,
    permission: "loading",
    isSubscribed: false,
    isLoading: true,
    error: null,
  })

  // Check if push notifications are supported
  useEffect(() => {
    const checkSupport = async () => {
      const isSupported =
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window

      if (!isSupported) {
        setState((prev) => ({
          ...prev,
          isSupported: false,
          permission: "denied",
          isLoading: false,
        }))
        return
      }

      // Get current permission
      const permission = Notification.permission

      // Check if already subscribed
      let isSubscribed = false
      try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        isSubscribed = !!subscription
      } catch {
        // Ignore errors when checking subscription
      }

      setState({
        isSupported: true,
        permission,
        isSubscribed,
        isLoading: false,
        error: null,
      })
    }

    checkSupport()
  }, [])

  // Register service worker
  const registerServiceWorker = useCallback(async (): Promise<ServiceWorkerRegistration | null> => {
    if (!("serviceWorker" in navigator)) return null

    try {
      const registration = await navigator.serviceWorker.register("/sw.js")
      return registration
    } catch (error) {
      console.error("Service worker registration failed:", error)
      return null
    }
  }, [])

  // Request permission and subscribe
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      setState((prev) => ({ ...prev, error: "Push notifications not supported" }))
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
          error: "Notification permission denied",
        }))
        return false
      }

      // Register service worker if not already registered
      const registration = await registerServiceWorker()
      if (!registration) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Failed to register service worker",
        }))
        return false
      }

      // Wait for the service worker to be ready
      const swRegistration = await navigator.serviceWorker.ready

      // Subscribe to push
      if (!VAPID_PUBLIC_KEY) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: "VAPID key not configured",
        }))
        return false
      }

      const subscription = await swRegistration.pushManager.subscribe({
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
        throw new Error("Failed to save subscription to server")
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
        error: error instanceof Error ? error.message : "Failed to subscribe",
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
        // Unsubscribe from push
        await subscription.unsubscribe()

        // Remove from server
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
      console.error("Error unsubscribing from push notifications:", error)
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to unsubscribe",
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
