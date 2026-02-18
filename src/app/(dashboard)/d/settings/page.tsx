import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getEffectiveUserId } from "@/lib/auth-utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Calendar, Users, ExternalLink, Pencil, Shield } from "lucide-react"
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
        <h1 className="text-xl sm:text-2xl font-mono font-bold tracking-tight">PROFILE</h1>
        <p className="text-white/40 text-sm font-mono mt-1">Account information</p>
      </div>

      {/* Account Card */}
      <div className="border border-white/10 bg-white/[0.02]">
        <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between">
          <span className="text-[10px] font-mono text-white/40 tracking-widest">ACCOUNT</span>
          {user.role === "SUPERADMIN" && (
            <span className="text-[10px] font-mono px-2 py-0.5 bg-[#ff1493]/10 text-[#ff1493]">
              <Shield className="w-3 h-3 inline mr-1" />
              ADMIN
            </span>
          )}
        </div>
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="w-16 h-16 border border-white/10">
              <AvatarImage src={user.imageUrl || undefined} alt={user.firstName || "User"} />
              <AvatarFallback className="text-xl font-mono bg-white/5 text-white/60">
                {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-mono font-bold truncate">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-sm text-white/40 font-mono truncate">{user.email}</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 bg-white/[0.02] border border-white/5">
              <p className="text-[10px] font-mono text-white/30 tracking-widest mb-1">EMAIL</p>
              <p className="text-sm font-mono truncate">{user.email}</p>
            </div>
            <div className="p-4 bg-white/[0.02] border border-white/5">
              <p className="text-[10px] font-mono text-white/30 tracking-widest mb-1">MEMBER SINCE</p>
              <p className="text-sm font-mono">
                {new Date(user.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric"
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Organizer Profile */}
      {user.organizerProfile ? (
        <div className="border border-white/10 bg-white/[0.02]">
          <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between">
            <span className="text-[10px] font-mono text-white/40 tracking-widest">ORGANIZER PROFILE</span>
            <Link
              href="/d/organizer"
              className="text-[10px] font-mono text-[#ff1493] hover:underline flex items-center gap-1"
            >
              <Pencil className="w-3 h-3" />
              EDIT
            </Link>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="min-w-0">
                <h3 className="text-lg font-mono font-bold truncate">{user.organizerProfile.displayName}</h3>
                <p className="text-sm text-white/40 font-mono">@{user.organizerProfile.slug}</p>
              </div>
              <Link
                href={`/o/${user.organizerProfile.slug}`}
                target="_blank"
                className="flex items-center gap-1.5 px-3 py-1.5 border border-white/10 text-xs font-mono text-white/60 hover:border-white/20 hover:text-white transition-all"
              >
                <ExternalLink className="w-3 h-3" />
                VIEW
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="border border-white/10 p-4">
                <div className="flex items-center justify-between mb-2">
                  <Calendar className="w-4 h-4 text-white/30" />
                  <span className="text-[10px] font-mono text-white/30 tracking-widest">EVENTS</span>
                </div>
                <p className="text-2xl font-mono font-bold">{user.organizerProfile._count.events}</p>
              </div>
              <div className="border border-white/10 p-4">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-4 h-4 text-white/30" />
                  <span className="text-[10px] font-mono text-white/30 tracking-widest">FOLLOWERS</span>
                </div>
                <p className="text-2xl font-mono font-bold">{user.organizerProfile._count.followers}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-dashed border-white/20 p-12 text-center">
          <p className="text-white/40 font-mono text-sm mb-4">No organizer profile</p>
          <Button asChild variant="outline" size="sm">
            <Link href="/onboarding">Create Profile</Link>
          </Button>
        </div>
      )}

      {/* Danger Zone */}
      <div className="border border-red-500/20">
        <div className="px-4 py-2 border-b border-red-500/20">
          <span className="text-[10px] font-mono text-red-400/60 tracking-widest">DANGER ZONE</span>
        </div>
        <div className="p-4 flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-sm text-red-300">Delete Account</p>
            <p className="text-xs text-red-300/50">Permanently delete your account and all data</p>
          </div>
          <Button variant="outline" size="sm" disabled className="border-red-500/30 text-red-400 text-xs">
            DELETE
          </Button>
        </div>
      </div>
    </div>
  )
}
