import { prisma } from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ExternalLink, CheckCircle2, XCircle, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function OrgManagement({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const params = await searchParams
  const search = params.search || ""

  const orgs = await prisma.organizerProfile.findMany({
    where: {
      OR: [
        { displayName: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ],
    },
    include: {
      user: true,
      _count: {
        select: { events: true, followers: true }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground">Manage organizer profiles and Stripe connectivity.</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <form className="flex-1 max-w-sm">
          <Input 
            name="search" 
            placeholder="Search organizations..." 
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
                  <th className="p-4 text-left font-medium">Organization</th>
                  <th className="p-4 text-left font-medium">Owner</th>
                  <th className="p-4 text-left font-medium">Stripe Status</th>
                  <th className="p-4 text-left font-medium">Activity</th>
                  <th className="p-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orgs.map((org) => (
                  <tr key={org.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={org.logoUrl || ""} />
                          <AvatarFallback>{org.displayName[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{org.displayName}</div>
                          <div className="text-xs text-muted-foreground">@{org.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-xs">
                        <div>{org.user.firstName} {org.user.lastName}</div>
                        <div className="text-muted-foreground">{org.user.email}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      {org.stripeAccountId ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1 text-xs">
                            {org.stripeChargesEnabled ? (
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                            ) : (
                              <XCircle className="h-3 w-3 text-red-500" />
                            )}
                            Charges: {org.stripeChargesEnabled ? "Active" : "Disabled"}
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            {org.stripePayoutsEnabled ? (
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                            ) : (
                              <XCircle className="h-3 w-3 text-red-500" />
                            )}
                            Payouts: {org.stripePayoutsEnabled ? "Active" : "Disabled"}
                          </div>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-yellow-500 border-yellow-500/20 bg-yellow-500/10">
                          <AlertTriangle className="h-3 w-3 mr-1" /> No Stripe Account
                        </Badge>
                      )}
                    </td>
                    <td className="p-4 text-muted-foreground text-xs">
                      <div>Events: {org._count.events}</div>
                      <div>Followers: {org._count.followers}</div>
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/o/${org.slug}`} target="_blank">
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
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
