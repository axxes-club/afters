import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getEffectiveUserId } from "@/lib/auth-utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { 
  Building2, 
  CalendarDays, 
  Users, 
  Ticket, 
  DollarSign,
  TrendingUp,
  ExternalLink,
  Plus,
  Eye,
  CreditCard,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { OrganizerProfileForm } from "./OrganizerProfileForm"

export default async function OrganizerPage() {
  const userId = await getEffectiveUserId()

  if (!userId) {
    redirect("/sign-in")
  }

  const profile = await prisma.organizerProfile.findUnique({
    where: { userId },
    include: {
      events: {
        orderBy: { startsAt: "desc" },
        include: {
          _count: { select: { tickets: true, orders: true, views: true } },
          ticketTiers: true
        }
      },
      followers: {
        take: 20,
        orderBy: { createdAt: "desc" },
        include: {
          follower: {
            select: { id: true, firstName: true, lastName: true, imageUrl: true, email: true }
          }
        }
      },
      _count: {
        select: { events: true, followers: true }
      }
    }
  })

  if (!profile) {
    redirect("/onboarding")
  }

  // Calculate stats
  const totalTicketsSold = profile.events.reduce((sum, event) => sum + event._count.tickets, 0)
  const totalViews = profile.events.reduce((sum, event) => sum + event._count.views, 0)
  
  // Get revenue
  const revenueData = await prisma.order.aggregate({
    where: {
      event: { organizerId: profile.id },
      status: "PAID"
    },
    _sum: { subtotal: true }
  })
  const totalRevenue = revenueData._sum.subtotal || 0

  // Upcoming events
  const upcomingEvents = profile.events.filter(e => new Date(e.startsAt) > new Date())
  const pastEvents = profile.events.filter(e => new Date(e.startsAt) <= new Date())

  // Format currency
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100)
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
            <AvatarImage src={profile.logoUrl || undefined} />
            <AvatarFallback className="text-xl sm:text-2xl bg-[#ff1493]/10 text-[#ff1493]">
              {profile.displayName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
              {profile.displayName}
            </h1>
            <p className="text-muted-foreground text-sm">
              @{profile.slug} · {profile._count.followers} followers
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/o/${profile.slug}`} target="_blank">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Public Page
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/dashboard/events/new">
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Link>
          </Button>
        </div>
      </div>

      {/* Stripe Status Banner */}
      {!profile.stripeChargesEnabled && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0" />
                <div>
                  <p className="font-medium text-sm">Complete Stripe Setup</p>
                  <p className="text-xs text-muted-foreground">Connect your Stripe account to receive payments for ticket sales.</p>
                </div>
              </div>
              <Button asChild size="sm" className="shrink-0">
                <Link href="/dashboard/settings/payouts">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Setup Payouts
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {profile.stripeChargesEnabled && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Stripe Connected</span>
              <span className="text-xs text-muted-foreground">· You can accept payments</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-muted-foreground">Events</span>
                <CalendarDays className="h-4 w-4 text-muted-foreground hidden sm:block" />
              </div>
              <p className="text-xl sm:text-2xl font-bold">{profile._count.events}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-muted-foreground">Tickets Sold</span>
                <Ticket className="h-4 w-4 text-muted-foreground hidden sm:block" />
              </div>
              <p className="text-xl sm:text-2xl font-bold">{totalTicketsSold.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-muted-foreground">Revenue</span>
                <DollarSign className="h-4 w-4 text-muted-foreground hidden sm:block" />
              </div>
              <p className="text-xl sm:text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-muted-foreground">Followers</span>
                <Users className="h-4 w-4 text-muted-foreground hidden sm:block" />
              </div>
              <p className="text-xl sm:text-2xl font-bold">{profile._count.followers.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="events">
        <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex">
          <TabsTrigger value="events" className="text-xs sm:text-sm">Events</TabsTrigger>
          <TabsTrigger value="followers" className="text-xs sm:text-sm">Followers</TabsTrigger>
          <TabsTrigger value="profile" className="text-xs sm:text-sm">Edit Profile</TabsTrigger>
        </TabsList>

        {/* Events Tab */}
        <TabsContent value="events" className="mt-4 space-y-4">
          {/* Upcoming Events */}
          {upcomingEvents.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Upcoming Events ({upcomingEvents.length})
              </h3>
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <Card key={event.id}>
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        {event.flyerUrl && (
                          <div className="w-full sm:w-24 h-32 sm:h-24 rounded-lg overflow-hidden bg-muted shrink-0">
                            <img src={event.flyerUrl} alt={event.title} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h4 className="font-semibold truncate">{event.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {new Date(event.startsAt).toLocaleDateString('en-US', { 
                                  weekday: 'short', 
                                  month: 'short', 
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit'
                                })}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">{event.venueName}</p>
                            </div>
                            <Badge variant={event.status === "PUBLISHED" ? "default" : "secondary"}>
                              {event.status}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Ticket className="h-3 w-3" />
                              {event._count.tickets} sold
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {event._count.views} views
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-3">
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/dashboard/events/${event.id}`}>Manage</Link>
                            </Button>
                            <Button asChild variant="ghost" size="sm">
                              <Link href={`/e/${event.slug}`} target="_blank">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                View
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Past Events */}
          {pastEvents.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Past Events ({pastEvents.length})
              </h3>
              <div className="space-y-2">
                {pastEvents.slice(0, 5).map((event) => (
                  <Card key={event.id} className="bg-muted/30">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium truncate text-sm">{event.title}</h4>
                          <p className="text-xs text-muted-foreground">
                            {new Date(event.startsAt).toLocaleDateString()} · {event._count.tickets} tickets sold
                          </p>
                        </div>
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/dashboard/events/${event.id}/analytics`}>
                            <TrendingUp className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {profile.events.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No events yet</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Create your first event to start selling tickets.
                </p>
                <Button asChild>
                  <Link href="/dashboard/events/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Event
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Followers Tab */}
        <TabsContent value="followers" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Followers</CardTitle>
              <CardDescription>
                {profile._count.followers} people are following your events
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profile.followers.length === 0 ? (
                <div className="py-8 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-sm">
                    No followers yet. Share your events to grow your audience!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {profile.followers.map((follow) => (
                    <div key={follow.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={follow.follower.imageUrl || undefined} />
                        <AvatarFallback>
                          {follow.follower.firstName?.[0] || follow.follower.email?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {follow.follower.firstName} {follow.follower.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Followed {new Date(follow.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Edit Profile Tab */}
        <TabsContent value="profile" className="mt-4">
          <OrganizerProfileForm profile={profile} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
