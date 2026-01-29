import { prisma } from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserRoleSelect } from "./UserRoleSelect"

export default async function UserManagement({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const params = await searchParams
  const search = params.search || ""

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ],
    },
    include: {
      organizerProfile: true,
      _count: {
        select: { orders: true, tickets: true }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage roles and permissions for your citizens.</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <form className="flex-1 max-w-sm">
          <Input 
            name="search" 
            placeholder="Search users..." 
            defaultValue={search}
          />
        </form>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-4 text-left font-medium">User</th>
                  <th className="p-4 text-left font-medium">Role</th>
                  <th className="p-4 text-left font-medium">Activity</th>
                  <th className="p-4 text-left font-medium">Joined</th>
                  <th className="p-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.imageUrl || ""} />
                          <AvatarFallback>{user.firstName?.[0] || user.email[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                          {user.organizerProfile && (
                            <Badge variant="secondary" className="mt-1 text-[10px] py-0">
                              Organizer: {user.organizerProfile.slug}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <UserRoleSelect userId={user.id} initialRole={user.role} />
                    </td>
                    <td className="p-4 text-muted-foreground">
                      <div className="flex flex-col gap-1">
                        <span>Orders: {user._count.orders}</span>
                        <span>Tickets: {user._count.tickets}</span>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      {/* More actions could go here */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
