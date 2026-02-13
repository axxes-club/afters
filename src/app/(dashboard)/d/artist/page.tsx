import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getEffectiveUserId } from "@/lib/auth-utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Music } from "lucide-react"
import { ArtistProfileForm } from "./ArtistProfileForm"
import { VerificationRequestForm } from "@/components/dashboard/VerificationRequestForm"

export default async function ArtistPage() {
  const userId = await getEffectiveUserId()

  if (!userId) {
    redirect("/sign-in")
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      artistProfile: true
    }
  })

  if (!user) {
    redirect("/sign-in")
  }

  const artistProfile = user.artistProfile

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 lg:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2 sm:gap-3">
            <Music className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            Artist Dashboard
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage your artist profile.
          </p>
        </div>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex sm:grid-cols-none">
          <TabsTrigger value="profile" className="text-xs sm:text-sm">Profile</TabsTrigger>
          {artistProfile && (
            <TabsTrigger value="verification" className="text-xs sm:text-sm">Verify</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <ArtistProfileForm profile={artistProfile} />
        </TabsContent>

        {artistProfile && (
          <TabsContent value="verification" className="mt-6">
            <VerificationRequestForm />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
