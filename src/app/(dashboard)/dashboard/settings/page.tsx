import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function SettingsPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  const profile = await prisma.organizerProfile.findUnique({
    where: { userId },
  })

  if (!profile) {
    redirect("/dashboard/onboarding")
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your organizer profile information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Display Name</span>
            <span className="font-medium">{profile.displayName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Profile URL</span>
            <span className="font-medium">afters.xxx/o/{profile.slug}</span>
          </div>
          {profile.bio && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bio</span>
              <span className="font-medium max-w-xs text-right">{profile.bio}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Status</CardTitle>
          <CardDescription>Your Stripe Connect account status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Onboarding</span>
            <Badge variant={profile.stripeOnboardingComplete ? "default" : "secondary"}>
              {profile.stripeOnboardingComplete ? "Complete" : "Incomplete"}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Can Accept Payments</span>
            <Badge variant={profile.stripeChargesEnabled ? "default" : "secondary"}>
              {profile.stripeChargesEnabled ? "Yes" : "No"}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Can Receive Payouts</span>
            <Badge variant={profile.stripePayoutsEnabled ? "default" : "secondary"}>
              {profile.stripePayoutsEnabled ? "Yes" : "No"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
