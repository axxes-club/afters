import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserRoleSelect } from "./UserRoleSelect"
import { UserActions } from "./UserActions"
import { Users, Shield, Music, Building2, UserCircle } from "lucide-react"

export default async function UserManagement({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; role?: string }>
}) {
  const params = await searchParams
  const search = params.search || ""
  const roleFilter = params.role || ""

  const users = await prisma.user.findMany({
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
        roleFilter ? { role: roleFilter as any } : {},
      ],
    },
    include: {
      organizerProfile: true,
      artistProfile: true,
      personalProfile: true,
      _count: {
        select: { orders: true, tickets: true, follows: true, savedEvents: true }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

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
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage users, roles, and permissions.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roleStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Superadmins</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roleStats.SUPERADMIN}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizers</CardTitle>
            <Building2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roleStats.ORGANIZER}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Artists</CardTitle>
            <Music className="h-4 w-4 text-[#ff1493]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roleStats.ARTIST}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regular Users</CardTitle>
            <UserCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roleStats.USER}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <form className="flex-1 max-w-sm">
          <Input 
            name="search" 
            placeholder="Search by name, email, or username..." 
            defaultValue={search}
          />
        </form>
        <div className="flex gap-2">
          <a 
            href="/superadmin/users" 
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${!roleFilter ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
          >
            All
          </a>
          <a 
            href="/superadmin/users?role=SUPERADMIN" 
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${roleFilter === 'SUPERADMIN' ? 'bg-red-500 text-white' : 'bg-muted hover:bg-muted/80'}`}
          >
            Superadmins
          </a>
          <a 
            href="/superadmin/users?role=ORGANIZER" 
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${roleFilter === 'ORGANIZER' ? 'bg-blue-500 text-white' : 'bg-muted hover:bg-muted/80'}`}
          >
            Organizers
          </a>
          <a 
            href="/superadmin/users?role=ARTIST" 
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${roleFilter === 'ARTIST' ? 'bg-[#ff1493] text-white' : 'bg-muted hover:bg-muted/80'}`}
          >
            Artists
          </a>
        </div>
      </div>

      {/* Users Table */}
      <Card>
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
                  <th className="p-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
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
                          <span>Follows: {user._count.follows}</span>
                          <span>Saved: {user._count.savedEvents}</span>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground text-xs">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        <UserActions 
                          userId={user.id} 
                          email={user.email}
                          firstName={user.firstName || ""}
                          lastName={user.lastName || ""}
                          username={user.username || ""}
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
