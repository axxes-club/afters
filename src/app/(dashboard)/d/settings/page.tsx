import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getEffectiveUserId } from "@/lib/auth-utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldCheck, ExternalLink } from "lucide-react"
import Link from "next/link"

export default async function SettingsProfilePage() {
  const userId = await getEffectiveUserId()

  if (!userId) {
    redirect("/sign-in")
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      organizerProfile: {
        include: {
          _count: {
            select: { events: true, followers: true }
          }
        }
      },
    }
  })

  if (!user) {
    redirect("/sign-in")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-mono font-bold tracking-tight">
          PROFILE
        </h1>
        <p className="text-white/40 text-sm font-mono mt-1">
          Manage your account information
        </p>
      </div>

      {/* Account Info */}
      <Card className="border-white/10 bg-white/[0.02]">
        <CardHeader>
          <CardTitle className="text-lg font-mono">Account</CardTitle>
          <CardDescription>Your personal account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.imageUrl || undefined} alt={user.firstName || "User"} />
              <AvatarFallback className="text-xl bg-[#ff1493]/10 text-[#ff1493]">
                {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold truncate">
                  {user.firstName} {user.lastName}
                </h2>
                {user.role === "SUPERADMIN" && (
                  <Badge variant="secondary" className="gap-1 shrink-0">
                    <ShieldCheck className="h-3 w-3" />
                    Admin
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>

          <div className="grid gap-4 pt-4 border-t border-white/10">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-white/40 font-mono tracking-wider mb-1">EMAIL</p>
                <p className="font-mono truncate">{user.email}</p>
              </div>
              <div>
                <p className="text-xs text-white/40 font-mono tracking-wider mb-1">JOINED</p>
                <p className="font-mono">
                  {new Date(user.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                  })}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Organizer Profile */}
      {user.organizerProfile ? (
        <Card className="border-white/10 bg-white/[0.02]">
          <CardHeader>
            <CardTitle className="text-lg font-mono">Organizer Profile</CardTitle>
            <CardDescription>Your public organizer profile</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold truncate">{user.organizerProfile.displayName}</h3>
                <p className="text-sm text-muted-foreground">@{user.organizerProfile.slug}</p>
              </div>
              <div className="flex items-center gap-4 text-center shrink-0">
                <div>
                  <p className="text-xl font-bold">{user.organizerProfile._count.events}</p>
                  <p className="text-xs text-muted-foreground">Events</p>
                </div>
                <div>
                  <p className="text-xl font-bold">{user.organizerProfile._count.followers}</p>
                  <p className="text-xs text-muted-foreground">Followers</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-white/10">
              <Button asChild variant="outline" size="sm">
                <Link href="/d/organizer">
                  Edit Profile
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href={`/o/${user.organizerProfile.slug}`} target="_blank">
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  View Public
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-white/10 bg-white/[0.02]">
          <CardContent className="py-12 text-center">
            <p className="text-lg font-medium mb-2">No organizer profile</p>
            <p className="text-muted-foreground mb-4">
              Create an organizer profile to start hosting events.
            </p>
            <Button asChild>
              <Link href="/onboarding">Create Profile</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Danger Zone */}
      <Card className="border-red-500/20 bg-red-500/5">
        <CardHeader>
          <CardTitle className="text-lg font-mono text-red-400">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data.
              </p>
            </div>
            <Button variant="destructive" size="sm" disabled>
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
