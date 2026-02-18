import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getEffectiveUserId } from "@/lib/auth-utils"
import { OrganizerProfileForm } from "./OrganizerProfileForm"

export default async function OrganizerPage() {
  const userId = await getEffectiveUserId()

  if (!userId) {
    redirect("/sign-in")
  }

  const profile = await prisma.organizerProfile.findUnique({
    where: { userId },
  })

  if (!profile) {
    redirect("/onboarding")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-mono font-bold tracking-tight">ORGANIZER PROFILE</h1>
        <p className="text-white/40 text-sm font-mono mt-1">Edit your organizer information</p>
      </div>

      {/* Profile Form */}
      <OrganizerProfileForm profile={profile} />
    </div>
  )
}
