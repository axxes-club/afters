"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { CheckCircle, AlertCircle, ExternalLink } from "lucide-react"

interface OrganizerProfile {
  id: string
  stripeAccountId: string | null
  stripeOnboardingComplete: boolean
  stripeChargesEnabled: boolean
  stripePayoutsEnabled: boolean
}

function PayoutsContent() {
  const searchParams = useSearchParams()
  const [profile, setProfile] = useState<OrganizerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    fetchProfile()

    if (searchParams.get("success") === "true") {
      toast.success("Stripe setup completed! Refreshing status...")
      fetchProfile()
    }

    if (searchParams.get("refresh") === "true") {
      toast.info("Please complete your Stripe setup")
    }
  }, [searchParams])

  async function fetchProfile() {
    try {
      const res = await fetch("/api/organizer/profile")
      if (res.ok) {
        const data = await res.json()
        setProfile(data)
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleConnectStripe() {
    setConnecting(true)
    try {
      const res = await fetch("/api/stripe/connect/onboarding", {
        method: "POST",
      })

      if (!res.ok) {
        throw new Error("Failed to create onboarding link")
      }

      const { url } = await res.json()
      window.location.href = url
    } catch {
      toast.error("Failed to start Stripe setup")
      setConnecting(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  const isFullySetup = profile?.stripeChargesEnabled && profile?.stripePayoutsEnabled

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Stripe Connect</CardTitle>
          <CardDescription>
            Connect your Stripe account to receive payments from ticket sales.
            Payouts are processed daily.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isFullySetup ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Your account is fully set up!</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-yellow-600">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Setup required</span>
            </div>
          )}

          <div className="grid gap-2">
            <div className="flex items-center justify-between py-2">
              <span>Onboarding</span>
              <Badge variant={profile?.stripeOnboardingComplete ? "default" : "secondary"}>
                {profile?.stripeOnboardingComplete ? "Complete" : "Incomplete"}
              </Badge>
            </div>
            <div className="flex items-center justify-between py-2">
              <span>Accept Payments</span>
              <Badge variant={profile?.stripeChargesEnabled ? "default" : "secondary"}>
                {profile?.stripeChargesEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <div className="flex items-center justify-between py-2">
              <span>Receive Payouts</span>
              <Badge variant={profile?.stripePayoutsEnabled ? "default" : "secondary"}>
                {profile?.stripePayoutsEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </div>

          {!isFullySetup && (
            <Button onClick={handleConnectStripe} disabled={connecting}>
              <ExternalLink className="mr-2 h-4 w-4" />
              {connecting ? "Redirecting..." : "Complete Stripe Setup"}
            </Button>
          )}

          {isFullySetup && (
            <Button variant="outline" onClick={handleConnectStripe} disabled={connecting}>
              <ExternalLink className="mr-2 h-4 w-4" />
              {connecting ? "Redirecting..." : "Update Stripe Settings"}
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fee Structure</CardTitle>
          <CardDescription>
            Here&apos;s how fees work when you sell tickets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between">
              <span>Platform fee</span>
              <span className="font-medium">10% + $0.99 per ticket</span>
            </li>
            <li className="flex justify-between">
              <span>Stripe processing</span>
              <span className="font-medium">~2.9% + $0.30</span>
            </li>
            <li className="flex justify-between border-t pt-2">
              <span>Payout schedule</span>
              <span className="font-medium">Daily (next business day)</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </>
  )
}

export default function PayoutsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Payouts</h1>
      <Suspense fallback={
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      }>
        <PayoutsContent />
      </Suspense>
    </div>
  )
}
