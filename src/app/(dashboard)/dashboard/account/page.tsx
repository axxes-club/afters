import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  CalendarDays, 
  MapPin, 
  Ticket, 
  Heart, 
  Users, 
  Settings,
  QrCode,
  ExternalLink,
  Clock,
  ShieldCheck
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default async function AccountPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      organizerProfile: true,
    }
  });

  if (!user) {
    redirect("/sign-in");
  }

  // Fetch user's tickets
  const tickets = await prisma.ticket.findMany({
    where: { userId },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          slug: true,
          startsAt: true,
          venueName: true,
          city: true,
          flyerUrl: true,
          organizer: {
            select: { slug: true }
          }
        },
      },
      ticketTier: {
        select: { name: true },
      },
    },
    orderBy: { event: { startsAt: "asc" } },
  });

  // Fetch saved events
  const savedEvents = await prisma.savedEvent.findMany({
    where: { userId },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          slug: true,
          startsAt: true,
          venueName: true,
          city: true,
          flyerUrl: true,
          ticketingType: true,
          externalTicketingUrl: true,
          organizer: {
            select: { slug: true }
          }
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Fetch following
  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    include: {
      following: {
        select: {
          id: true,
          displayName: true,
          slug: true,
          logoUrl: true,
          bio: true,
          _count: {
            select: { events: true, followers: true }
          }
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Group tickets by upcoming/past
  const now = new Date();
  const upcomingTickets = tickets.filter(t => new Date(t.event.startsAt) >= now);
  const pastTickets = tickets.filter(t => new Date(t.event.startsAt) < now);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.imageUrl || undefined} alt={user.firstName || "User"} />
            <AvatarFallback className="text-2xl">
              {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">
                {user.firstName} {user.lastName}
              </h1>
              {user.role === "SUPERADMIN" && (
                <Badge variant="secondary" className="gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  Admin
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">{user.email}</p>
            {user.organizerProfile && (
              <Link 
                href={`/o/${user.organizerProfile.slug}`}
                className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
              >
                View organizer profile
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Ticket className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tickets.length}</p>
                <p className="text-sm text-muted-foreground">Total Tickets</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-pink-500/10 rounded-full">
                <Heart className="h-6 w-6 text-pink-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{savedEvents.length}</p>
                <p className="text-sm text-muted-foreground">Saved Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-full">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{following.length}</p>
                <p className="text-sm text-muted-foreground">Following</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tickets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tickets" className="gap-2">
            <Ticket className="h-4 w-4" />
            My Tickets ({tickets.length})
          </TabsTrigger>
          <TabsTrigger value="saved" className="gap-2">
            <Heart className="h-4 w-4" />
            Saved ({savedEvents.length})
          </TabsTrigger>
          <TabsTrigger value="following" className="gap-2">
            <Users className="h-4 w-4" />
            Following ({following.length})
          </TabsTrigger>
        </TabsList>

        {/* Tickets Tab */}
        <TabsContent value="tickets" className="space-y-6">
          {tickets.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No tickets yet</p>
                <p className="text-muted-foreground mb-4">
                  Browse events and grab your tickets to upcoming shows.
                </p>
                <Button asChild>
                  <Link href="/events">Browse Events</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {upcomingTickets.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Upcoming Events ({upcomingTickets.length})
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {upcomingTickets.map((ticket) => (
                      <Card key={ticket.id} className="overflow-hidden">
                        <div className="flex">
                          <div className="relative w-24 h-24 shrink-0">
                            {ticket.event.flyerUrl ? (
                              <Image
                                src={ticket.event.flyerUrl}
                                alt={ticket.event.title}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
                            )}
                          </div>
                          <CardContent className="p-4 flex-1">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <Link 
                                  href={`/e/${ticket.event.organizer.slug}/${ticket.event.slug}`}
                                  className="font-semibold hover:underline line-clamp-1"
                                >
                                  {ticket.event.title}
                                </Link>
                                <p className="text-sm text-muted-foreground">{ticket.ticketTier.name}</p>
                              </div>
                              <Badge variant={ticket.status === "VALID" ? "default" : "secondary"}>
                                {ticket.status === "VALID" ? "Valid" : ticket.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <CalendarDays className="h-3 w-3" />
                                {formatDate(ticket.event.startsAt)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                              <MapPin className="h-3 w-3" />
                              {ticket.event.venueName}, {ticket.event.city}
                            </div>
                            <div className="flex items-center gap-2 mt-3">
                              <Button variant="outline" size="sm" asChild>
                                <Link href="/my-tickets">
                                  <QrCode className="h-3 w-3 mr-1" />
                                  View QR
                                </Link>
                              </Button>
                            </div>
                          </CardContent>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {pastTickets.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-muted-foreground">
                    Past Events ({pastTickets.length})
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2 opacity-75">
                    {pastTickets.map((ticket) => (
                      <Card key={ticket.id} className="overflow-hidden">
                        <div className="flex">
                          <div className="relative w-24 h-24 shrink-0 grayscale">
                            {ticket.event.flyerUrl ? (
                              <Image
                                src={ticket.event.flyerUrl}
                                alt={ticket.event.title}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-muted" />
                            )}
                          </div>
                          <CardContent className="p-4 flex-1">
                            <p className="font-semibold line-clamp-1">{ticket.event.title}</p>
                            <p className="text-sm text-muted-foreground">{ticket.ticketTier.name}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {formatDate(ticket.event.startsAt)}
                            </p>
                            <Badge variant="outline" className="mt-2">
                              {ticket.status === "CHECKED_IN" ? "Attended" : "Expired"}
                            </Badge>
                          </CardContent>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Saved Events Tab */}
        <TabsContent value="saved" className="space-y-4">
          {savedEvents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No saved events</p>
                <p className="text-muted-foreground mb-4">
                  Save events you&apos;re interested in to keep track of them.
                </p>
                <Button asChild>
                  <Link href="/events">Explore Events</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {savedEvents.map(({ event }) => (
                <Card key={event.id} className="overflow-hidden group">
                  <Link href={`/e/${event.organizer.slug}/${event.slug}`}>
                    <div className="relative aspect-square">
                      {event.flyerUrl ? (
                        <Image
                          src={event.flyerUrl}
                          alt={event.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                          {event.ticketingType}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h4 className="font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                        {event.title}
                      </h4>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <CalendarDays className="h-3 w-3" />
                        {formatDate(event.startsAt)}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {event.venueName}, {event.city}
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Following Tab */}
        <TabsContent value="following" className="space-y-4">
          {following.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">Not following anyone</p>
                <p className="text-muted-foreground mb-4">
                  Follow organizers to stay updated on their events.
                </p>
                <Button asChild>
                  <Link href="/events">Discover Organizers</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {following.map(({ following: org }) => (
                <Card key={org.id}>
                  <Link href={`/o/${org.slug}`}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-14 w-14">
                          <AvatarImage src={org.logoUrl || undefined} alt={org.displayName} />
                          <AvatarFallback className="text-lg">
                            {org.displayName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">{org.displayName}</h4>
                          <p className="text-sm text-muted-foreground">@{org.slug}</p>
                        </div>
                      </div>
                      {org.bio && (
                        <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                          {org.bio}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                        <span>{org._count.events} events</span>
                        <span>{org._count.followers} followers</span>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
