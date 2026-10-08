"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import type { StripeConnectInstance } from "@stripe/connect-js"
import {
  ConnectComponentsProvider, ConnectAccountManagement, ConnectBalances,
  ConnectDocuments, ConnectNotificationBanner, ConnectPayments, ConnectPayouts,
} from "@stripe/react-connect-js"

const views = [
  ["balances", "Balance"], ["payouts", "Payouts"], ["payments", "Payments"],
  ["documents", "Documents"], ["account", "Bank and account details"],
] as const

export function PayoutFinancialScreens({ view }: { view: string | null }) {
  const [instance, setInstance] = useState<StripeConnectInstance | null>(null)
  const [error, setError] = useState<string | null>(null)
  const selected = views.some(([name]) => name === view) ? view : "balances"

  useEffect(() => {
    let mounted = true
    // Load only in the browser, after the owner-only payout status check.
    void import("@stripe/connect-js").then(({ loadConnectAndInitialize }) => {
      if (!mounted) return
      const connect = loadConnectAndInitialize({
        publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
        fetchClientSecret: async () => {
          const response = await fetch("/api/stripe/connect/session", { method: "POST", cache: "no-store" })
          const body = await response.json()
          if (!response.ok || !body.clientSecret) {
            throw new Error(body.message || "Couldn't open payment management")
          }
          return body.clientSecret
        },
        appearance: { variables: {
          colorPrimary: "#ff1493", colorBackground: "#000000", colorText: "#ffffff",
          colorSecondaryText: "#a1a1aa", borderRadius: "0px", fontFamily: "monospace",
        } },
      })
      setInstance(connect)
    }).catch(() => { if (mounted) setError("Couldn't load payment management. Reload to try again.") })
    // Stripe requires logout only on app sign-out, never when a component unmounts.
    return () => { mounted = false }
  }, [])

  const onLoadError = () => setError("Couldn't load payment management. Reload to try again.")
  return (
    <section className="border border-white/10 p-4 space-y-4" aria-label="Payment management">
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
      {!instance ? <p className="text-sm text-white/50">Loading payment management...</p> : (
        <ConnectComponentsProvider connectInstance={instance}>
          <ConnectNotificationBanner onLoadError={onLoadError} />
          <nav className="flex flex-wrap gap-2" aria-label="Payment management screens">
            {views.map(([name, label]) => (
              <Link key={name} href={`/b/settings/payouts?view=${name}`} prefetch={false}
                aria-current={selected === name ? "page" : undefined}
                className={`px-3 py-2 text-xs font-mono border ${selected === name ? "border-primary text-primary" : "border-white/10 text-white/50"}`}>
                {label}
              </Link>
            ))}
          </nav>
          {selected === "balances" && <ConnectBalances onLoadError={onLoadError} />}
          {selected === "payouts" && <ConnectPayouts onLoadError={onLoadError} />}
          {selected === "payments" && <ConnectPayments onLoadError={onLoadError} />}
          {selected === "documents" && <ConnectDocuments onLoadError={onLoadError} />}
          {selected === "account" && <ConnectAccountManagement onLoadError={onLoadError} />}
        </ConnectComponentsProvider>
      )}
    </section>
  )
}
