import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getEffectiveUserId } from "@/lib/auth-utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Calendar, Code2 } from "lucide-react";
import Link from "next/link";

export default async function AccountPage() {
  const userId = await getEffectiveUserId();

  if (!userId) {
    redirect("/sign-in");
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
  });

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.imageUrl || undefined} alt={user.firstName || "User"} />
            <AvatarFallback className="text-2xl">
              {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">
                {user.firstName} {user.lastName}
              </h1>
              {user.role === "SUPERADMIN" && (
                <Badge variant="secondary" className="gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  Admin
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Organizer Profile Info */}
      {user.organizerProfile && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">{user.organizerProfile.displayName}</h2>
                <p className="text-sm text-muted-foreground">@{user.organizerProfile.slug}</p>
              </div>
              <div className="flex items-center gap-6 text-center">
                <div>
                  <p className="text-2xl font-bold">{user.organizerProfile._count.events}</p>
                  <p className="text-sm text-muted-foreground">Events</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{user.organizerProfile._count.followers}</p>
                  <p className="text-sm text-muted-foreground">Followers</p>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t flex gap-2">
              <Button asChild>
                <Link href="/d/events">
                  <Calendar className="h-4 w-4 mr-2" />
                  View Events
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/d/organizer">
                  Edit Profile
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Developer Tools */}
      {user.organizerProfile && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#ff1493]/10">
                  <Code2 className="h-5 w-5 text-[#ff1493]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Developer Tools</h2>
                  <p className="text-sm text-muted-foreground">
                    Access API keys and documentation
                  </p>
                </div>
              </div>
              <Button variant="outline" asChild>
                <Link href="/d/developers">
                  Manage API Keys
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No organizer profile */}
      {!user.organizerProfile && (
        <Card>
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
    </div>
  );
}
