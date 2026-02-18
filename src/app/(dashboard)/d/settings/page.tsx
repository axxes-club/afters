import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getEffectiveUserId } from "@/lib/auth-utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { User, Calendar, Users, ExternalLink, Pencil } from "lucide-react"
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
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden border border-white/10 bg-gradient-to-br from-white/5 via-black to-white/5">
        {/* Subtle pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }} />
        </div>
        
        <div className="relative p-8 md:p-12">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Avatar */}
            <Avatar className="w-24 h-24 border-2 border-white/10">
              <AvatarImage src={user.imageUrl || undefined} alt={user.firstName || "User"} />
              <AvatarFallback className="text-3xl font-headline bg-gradient-to-br from-[#ff1493] to-purple-600 text-white">
                {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            
            {/* Info */}
            <div className="flex-1">
              <h1 className="font-headline text-4xl md:text-5xl tracking-wide">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-white/40 font-mono text-sm mt-2">{user.email}</p>
            </div>

            {/* Badge */}
            {user.role === "SUPERADMIN" && (
              <div className="px-4 py-2 rounded-full font-mono text-xs tracking-widest bg-[#ff1493]/20 text-[#ff1493] border border-[#ff1493]/30">
                ADMIN
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Account Details */}
        <div className="border border-white/10 bg-white/[0.02]">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="font-mono text-xs tracking-widest text-white/40">ACCOUNT</h2>
            <User className="w-4 h-4 text-white/20" />
          </div>
          <div className="divide-y divide-white/5">
            <div className="p-5">
              <p className="text-[10px] font-mono text-white/30 tracking-widest mb-1">EMAIL</p>
              <p className="font-mono text-white">{user.email}</p>
            </div>
            <div className="p-5">
              <p className="text-[10px] font-mono text-white/30 tracking-widest mb-1">MEMBER SINCE</p>
              <p className="font-mono text-white">
                {new Date(user.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric"
                })}
              </p>
            </div>
            <div className="p-5">
              <p className="text-[10px] font-mono text-white/30 tracking-widest mb-1">USER ID</p>
              <code className="text-xs font-mono text-white/50 bg-white/5 px-2 py-1">{user.id.slice(0, 16)}...</code>
            </div>
          </div>
        </div>

        {/* Organizer Profile */}
        {user.organizerProfile ? (
          <div className="border border-white/10 bg-white/[0.02]">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="font-mono text-xs tracking-widest text-white/40">ORGANIZER</h2>
              <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                <Link href="/d/organizer">
                  <Pencil className="w-3 h-3 mr-1" />
                  Edit
                </Link>
              </Button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1">
                  <h3 className="font-headline text-2xl tracking-wide">{user.organizerProfile.displayName}</h3>
                  <p className="text-white/40 font-mono text-sm">@{user.organizerProfile.slug}</p>
                </div>
                <Button asChild variant="outline" size="sm" className="gap-1.5">
                  <Link href={`/o/${user.organizerProfile.slug}`} target="_blank">
                    <ExternalLink className="w-3 h-3" />
                    View
                  </Link>
                </Button>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/40 p-4 border-l-2 border-[#ff1493]">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-[#ff1493]" />
                    <span className="text-[10px] font-mono text-white/30 tracking-widest">EVENTS</span>
                  </div>
                  <p className="font-headline text-3xl">{user.organizerProfile._count.events}</p>
                </div>
                <div className="bg-black/40 p-4 border-l-2 border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-white/40" />
                    <span className="text-[10px] font-mono text-white/30 tracking-widest">FOLLOWERS</span>
                  </div>
                  <p className="font-headline text-3xl">{user.organizerProfile._count.followers}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="border border-dashed border-white/20 bg-white/[0.01] flex flex-col items-center justify-center p-12 text-center">
            <User className="w-12 h-12 text-white/10 mb-4" />
            <h3 className="font-mono text-sm text-white/50 mb-2">No organizer profile</h3>
            <p className="text-white/30 text-sm mb-6">Create a profile to start hosting events</p>
            <Button asChild>
              <Link href="/onboarding">Create Profile</Link>
            </Button>
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="border border-red-500/20 bg-red-500/5">
        <div className="p-4 border-b border-red-500/20">
          <h2 className="font-mono text-xs tracking-widest text-red-400/60">DANGER ZONE</h2>
        </div>
        <div className="p-6 flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-red-300">Delete Account</p>
            <p className="text-sm text-red-300/50">Permanently delete your account and all data</p>
          </div>
          <Button variant="outline" size="sm" disabled className="border-red-500/30 text-red-400 hover:bg-red-500/10">
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}
