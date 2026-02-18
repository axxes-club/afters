import { prisma } from "@/lib/prisma"
import type { UserRole } from "@prisma/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserRoleSelect } from "./UserRoleSelect"
import { UserActions } from "./UserActions"
import { Users, Shield, Music, Building2, UserCircle, Flag, AlertTriangle } from "lucide-react"
import Link from "next/link"

export default async function UserManagement({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; role?: string; tab?: string }>
}) {
  const params = await searchParams
  const search = params.search || ""
  const roleFilter = params.role || ""
  const tab = params.tab || "all"

  const [allUsers, flaggedUsers] = await Promise.all([
    prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { email: { contains: search, mode: "insensitive" } },
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { username: { contains: search, mode: "insensitive" } },
            ],
          },
          roleFilter ? { role: roleFilter as UserRole } : {},
        ],
      },
      include: {
        organizerProfile: {
          include: { subscription: { select: { plan: true } } }
        },
        artistProfile: true,
        personalProfile: true,
        _count: {
          select: { orders: true, tickets: true, savedEvents: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.user.findMany({
      where: { isFlagged: true },
      include: {
        organizerProfile: {
          include: { subscription: { select: { plan: true } } }
        },
        artistProfile: true,
        personalProfile: true,
        _count: {
          select: { orders: true, tickets: true, savedEvents: true }
        }
      },
      orderBy: { flaggedAt: "desc" },
    })
  ])

  const users = tab === "flagged" ? flaggedUsers : allUsers

  // Get role counts
  const roleCounts = await prisma.user.groupBy({
    by: ["role"],
    _count: true,
  })

  const roleStats = {
    total: roleCounts.reduce((sum, r) => sum + r._count, 0),
    SUPERADMIN: roleCounts.find(r => r.role === "SUPERADMIN")?._count || 0,
    ORGANIZER: roleCounts.find(r => r.role === "ORGANIZER")?._count || 0,
    ARTIST: roleCounts.find(r => r.role === "ARTIST")?._count || 0,
    USER: (roleCounts.find(r => r.role === "USER")?._count || 0) + 
          (roleCounts.find(r => r.role === "PERSONAL")?._count || 0),
    flagged: flaggedUsers.length,
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 lg:pb-6">
      <div className="border-b border-white/10 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-6 h-6 text-[#ff1493]" />
          <h1 className="text-2xl font-mono font-bold tracking-tight text-white">USER MANAGEMENT</h1>
        </div>
        <p className="text-white/40 font-mono text-sm">Manage users, roles, and permissions.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
        <div className="border border-cyan-400/30 bg-cyan-400/5 p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <Users className="h-4 w-4 text-cyan-400" />
            <span className="text-[10px] font-mono text-white/40 tracking-widest">TOTAL</span>
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-cyan-400">{roleStats.total}</div>
        </div>
        <div className="border border-red-500/30 bg-red-500/5 p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <Shield className="h-4 w-4 text-red-400" />
            <span className="text-[10px] font-mono text-white/40 tracking-widest">ADMINS</span>
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-red-400">{roleStats.SUPERADMIN}</div>
        </div>
        <div className="border border-blue-500/30 bg-blue-500/5 p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <Building2 className="h-4 w-4 text-blue-400" />
            <span className="text-[10px] font-mono text-white/40 tracking-widest">ORGS</span>
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-blue-400">{roleStats.ORGANIZER}</div>
        </div>
        <div className="border border-[#ff1493]/30 bg-[#ff1493]/5 p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <Music className="h-4 w-4 text-[#ff1493]" />
            <span className="text-[10px] font-mono text-white/40 tracking-widest">ARTISTS</span>
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-[#ff1493]">{roleStats.ARTIST}</div>
        </div>
        <div className={`col-span-2 sm:col-span-1 border p-3 sm:p-4 ${roleStats.flagged > 0 ? 'border-red-500/50 bg-red-500/10' : 'border-white/10 bg-white/[0.02]'}`}>
          <div className="flex items-center justify-between mb-2">
            <Flag className="h-4 w-4 text-red-500" />
            <span className="text-[10px] font-mono text-white/40 tracking-widest">FLAGGED</span>
          </div>
          <div className={`text-xl sm:text-2xl font-mono font-bold ${roleStats.flagged > 0 ? 'text-red-500' : 'text-white/30'}`}>{roleStats.flagged}</div>
        </div>
      </div>

      <Tabs defaultValue={tab}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <TabsList>
            <TabsTrigger value="all" asChild>
              <Link href="/superadmin/users?tab=all">All Users</Link>
            </TabsTrigger>
            <TabsTrigger value="flagged" asChild>
              <Link href="/superadmin/users?tab=flagged" className="flex items-center gap-1">
                <Flag className="h-3 w-3" />
                Flagged
                {flaggedUsers.length > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                    {flaggedUsers.length}
                  </Badge>
                )}
              </Link>
            </TabsTrigger>
          </TabsList>
          <form className="flex-1">
            <Input 
              name="search" 
              placeholder="Search users..." 
              defaultValue={search}
              className="w-full sm:max-w-sm"
            />
          </form>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-3">
          <a 
            href={`/superadmin/users?tab=${tab}`}
            className={`px-3 py-1.5 text-xs sm:text-sm rounded-md transition-colors ${!roleFilter ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
          >
            All
          </a>
          <a 
            href={`/superadmin/users?tab=${tab}&role=SUPERADMIN`}
            className={`px-3 py-1.5 text-xs sm:text-sm rounded-md transition-colors ${roleFilter === 'SUPERADMIN' ? 'bg-red-500 text-white' : 'bg-muted hover:bg-muted/80'}`}
          >
            Admins
          </a>
          <a 
            href={`/superadmin/users?tab=${tab}&role=ORGANIZER`}
            className={`px-3 py-1.5 text-xs sm:text-sm rounded-md transition-colors ${roleFilter === 'ORGANIZER' ? 'bg-blue-500 text-white' : 'bg-muted hover:bg-muted/80'}`}
          >
            Orgs
          </a>
          <a 
            href={`/superadmin/users?tab=${tab}&role=ARTIST`}
            className={`px-3 py-1.5 text-xs sm:text-sm rounded-md transition-colors ${roleFilter === 'ARTIST' ? 'bg-[#ff1493] text-white' : 'bg-muted hover:bg-muted/80'}`}
          >
            Artists
          </a>
        </div>
      </Tabs>

      {/* Users List - Mobile Cards / Desktop Table */}
      {/* Mobile View */}
      <div className="space-y-3 lg:hidden mt-4">
        {users.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              {tab === "flagged" ? "No flagged users" : "No users found"}
            </CardContent>
          </Card>
        ) : (
          users.map((user) => (
            <Card key={user.id} className={user.isFlagged ? "border-red-500/30" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={user.imageUrl || ""} />
                      <AvatarFallback>{user.firstName?.[0] || user.email[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate flex items-center gap-2">
                        {user.firstName} {user.lastName}
                        {user.isFlagged && <Flag className="h-3 w-3 text-red-500" />}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                      {user.isFlagged && user.flagReason && (
                        <p className="text-xs text-red-400 mt-1 flex items-start gap-1">
                          <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                          {user.flagReason}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2">
                        <Badge variant="outline" className="text-[10px]">
                          {user.role}
                        </Badge>
                        {user.artistProfile && (
                          <Badge variant="secondary" className="text-[10px] bg-[#ff1493]/10 text-[#ff1493]">
                            <Music className="h-3 w-3 mr-1" />
                            Artist
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <UserActions 
                    userId={user.id} 
                    email={user.email}
                    firstName={user.firstName || ""}
                    lastName={user.lastName || ""}
                    username={user.username || ""}
                    isFlagged={user.isFlagged}
                    flagReason={user.flagReason}
                    organizerProfileId={user.organizerProfile?.id || null}
                    currentPlan={user.organizerProfile?.subscription?.plan || null}
                  />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Desktop Table */}
      <Card className="hidden lg:block mt-4">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-4 text-left font-medium">User</th>
                  <th className="p-4 text-left font-medium">Role</th>
                  <th className="p-4 text-left font-medium">Profiles</th>
                  <th className="p-4 text-left font-medium">Activity</th>
                  <th className="p-4 text-left font-medium">Joined</th>
                  {tab === "flagged" && <th className="p-4 text-left font-medium">Flag Reason</th>}
                  <th className="p-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={tab === "flagged" ? 7 : 6} className="p-8 text-center text-muted-foreground">
                      {tab === "flagged" ? "No flagged users" : "No users found"}
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className={`border-b transition-colors hover:bg-muted/50 ${user.isFlagged ? "bg-red-500/5" : ""}`}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {user.isFlagged && <Flag className="h-4 w-4 text-red-500 shrink-0" />}
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.imageUrl || ""} />
                            <AvatarFallback>{user.firstName?.[0] || user.email[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-xs text-muted-foreground">{user.email}</div>
                            {user.username && (
                              <div className="text-xs text-muted-foreground">@{user.username}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <UserRoleSelect userId={user.id} initialRole={user.role} />
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {user.organizerProfile && (
                            <Badge variant="secondary" className="text-[10px]">
                              <Building2 className="h-3 w-3 mr-1" />
                              {user.organizerProfile.slug}
                            </Badge>
                          )}
                          {user.artistProfile && (
                            <Badge variant="secondary" className="text-[10px] bg-[#ff1493]/10 text-[#ff1493]">
                              <Music className="h-3 w-3 mr-1" />
                              {user.artistProfile.slug}
                            </Badge>
                          )}
                          {user.personalProfile && (
                            <Badge variant="outline" className="text-[10px]">
                              <UserCircle className="h-3 w-3 mr-1" />
                              {user.personalProfile.slug}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        <div className="flex flex-col gap-0.5 text-xs">
                          <span>Orders: {user._count.orders}</span>
                          <span>Tickets: {user._count.tickets}</span>
                          <span>Saved: {user._count.savedEvents}</span>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground text-xs">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      {tab === "flagged" && (
                        <td className="p-4">
                          <p className="text-xs text-red-400 max-w-[200px] line-clamp-2">
                            {user.flagReason || "-"}
                          </p>
                        </td>
                      )}
                      <td className="p-4 text-right">
                        <UserActions 
                          userId={user.id} 
                          email={user.email}
                          firstName={user.firstName || ""}
                          lastName={user.lastName || ""}
                          username={user.username || ""}
                          isFlagged={user.isFlagged}
                          flagReason={user.flagReason}
                          organizerProfileId={user.organizerProfile?.id || null}
                          currentPlan={user.organizerProfile?.subscription?.plan || null}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
