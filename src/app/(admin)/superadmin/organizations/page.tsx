import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Plus,
  Building2,
  Users,
  CheckCircle,
  Trash2
} from "lucide-react"
import Link from "next/link"
import { createOrganization, deleteOrganization, verifyOrganization } from "./actions"
import { revalidatePath } from "next/cache"

export default async function OrgManagement({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; tab?: string }>
}) {
  const params = await searchParams
  const search = params.search || ""
  const tab = params.tab || "organizers"

  // Fetch organizer profiles
  const organizerProfiles = await prisma.organizerProfile.findMany({
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

  // Fetch organizations
  const organizations = await prisma.organization.findMany({
    where: {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground">Manage organizer profiles and organizations.</p>
        </div>
      </div>

      <Tabs defaultValue={tab}>
        <TabsList>
          <TabsTrigger value="organizers" className="gap-2">
            <Users className="h-4 w-4" />
            Organizer Profiles ({organizerProfiles.length})
          </TabsTrigger>
          <TabsTrigger value="organizations" className="gap-2">
            <Building2 className="h-4 w-4" />
            Organizations ({organizations.length})
          </TabsTrigger>
          <TabsTrigger value="create" className="gap-2">
            <Plus className="h-4 w-4" />
            Create Organization
          </TabsTrigger>
        </TabsList>

        {/* Organizer Profiles Tab */}
        <TabsContent value="organizers" className="mt-6">
          <div className="flex items-center gap-4 mb-4">
            <form className="flex-1 max-w-sm">
              <Input 
                name="search" 
                placeholder="Search organizer profiles..." 
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
                    {organizerProfiles.map((org) => (
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
                              <AlertTriangle className="h-3 w-3 mr-1" /> No Stripe
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
        </TabsContent>

        {/* Organizations Tab */}
        <TabsContent value="organizations" className="mt-6">
          <div className="flex items-center gap-4 mb-4">
            <form className="flex-1 max-w-sm">
              <Input 
                name="search" 
                placeholder="Search organizations..." 
                defaultValue={search}
              />
            </form>
          </div>

          {organizations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No organizations yet</p>
                <p className="text-muted-foreground">Create your first organization using the Create tab.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {organizations.map((org) => (
                <Card key={org.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={org.logoUrl || ""} />
                          <AvatarFallback>{org.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {org.name}
                            {org.isVerified && (
                              <CheckCircle className="h-4 w-4 text-blue-500" />
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">@{org.slug}</div>
                        </div>
                      </div>
                    </div>
                    
                    {org.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {org.description}
                      </p>
                    )}

                    {(org.city || org.state) && (
                      <p className="text-xs text-muted-foreground mb-4">
                        {[org.city, org.state].filter(Boolean).join(", ")}
                      </p>
                    )}

                    <div className="flex items-center gap-2">
                      <form action={async () => {
                        "use server"
                        await verifyOrganization(org.id, !org.isVerified)
                      }}>
                        <Button type="submit" variant="outline" size="sm">
                          {org.isVerified ? "Unverify" : "Verify"}
                        </Button>
                      </form>
                      <form action={async () => {
                        "use server"
                        await deleteOrganization(org.id)
                      }}>
                        <Button type="submit" variant="ghost" size="sm" className="text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </form>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Create Organization Tab */}
        <TabsContent value="create" className="mt-6">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Create New Organization</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createOrganization} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Organization Name *</Label>
                    <Input id="name" name="name" placeholder="Insomniac Events" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug *</Label>
                    <Input id="slug" name="slug" placeholder="insomniac" required />
                    <p className="text-xs text-muted-foreground">URL-friendly identifier</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    name="description" 
                    placeholder="A brief description of the organization..."
                    rows={3}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" placeholder="contact@insomniac.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="websiteUrl">Website</Label>
                    <Input id="websiteUrl" name="websiteUrl" placeholder="https://insomniac.com" />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" name="city" placeholder="Los Angeles" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input id="state" name="state" placeholder="CA" />
                  </div>
                </div>

                <Button type="submit" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Organization
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
