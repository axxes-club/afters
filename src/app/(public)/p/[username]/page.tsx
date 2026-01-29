import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Header } from "@/components/layout/header"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { 
  Calendar,
  Heart,
  Users,
  Instagram,
  Twitter,
  Globe,
  MapPin
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface PersonalProfilePageProps {
  params: Promise<{ username: string }>
}

export default async function PersonalProfilePage({ params }: PersonalProfilePageProps) {
  const { username } = await params

  // Try to find by personalProfile slug first, then by username
  const profile = await prisma.personalProfile.findUnique({
    where: { slug: username },
    include: {
      user: {
        include: {
          savedEvents: {
            where: {
              event: {
                isPublished: true,
                startsAt: { gte: new Date() }
              }
            },
            include: {
              event: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                  flyerUrl: true,
                  startsAt: true,
                  venueName: true,
                  city: true,
                  organizer: {
                    select: { slug: true }
                  }
                }
              }
            },
            take: 6,
            orderBy: { event: { startsAt: "asc" } }
          },
          follows: {
            include: {
              following: {
                select: {
                  id: true,
                  displayName: true,
                  slug: true,
                  logoUrl: true,
                }
              }
            },
            take: 6
          },
          _count: {
            select: {
              savedEvents: true,
              follows: true,
              tickets: true
            }
          }
        }
      }
    }
  })

  if (!profile || !profile.isPublic) {
    notFound()
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Cover Image */}
      <div className="relative h-48 md:h-64 bg-gradient-to-br from-blue-500/20 via-background to-background">
        {profile.coverUrl && (
          <Image
            src={profile.coverUrl}
            alt={profile.displayName}
            fill
            className="object-cover opacity-50"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>

      <main className="container mx-auto px-4 -mt-20 relative z-10 pb-24">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end gap-6 mb-8">
          <Avatar className="h-28 w-28 md:h-36 md:w-36 border-4 border-background shadow-xl">
            <AvatarImage src={profile.avatarUrl || profile.user.imageUrl || undefined} alt={profile.displayName} />
            <AvatarFallback className="text-3xl">
              {profile.displayName[0]}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold mb-1">{profile.displayName}</h1>
            <p className="text-muted-foreground mb-4">@{profile.slug}</p>

            {/* Stats */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-pink-500" />
                <span>{profile.user._count.savedEvents} saved</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span>{profile.user._count.follows} following</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-green-500" />
                <span>{profile.user._count.tickets} events attended</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-2 mt-4">
              {profile.instagramUrl && (
                <Button variant="ghost" size="icon" asChild>
                  <Link href={profile.instagramUrl} target="_blank">
                    <Instagram className="h-5 w-5" />
                  </Link>
                </Button>
              )}
              {profile.twitterUrl && (
                <Button variant="ghost" size="icon" asChild>
                  <Link href={profile.twitterUrl} target="_blank">
                    <Twitter className="h-5 w-5" />
                  </Link>
                </Button>
              )}
              {profile.websiteUrl && (
                <Button variant="ghost" size="icon" asChild>
                  <Link href={profile.websiteUrl} target="_blank">
                    <Globe className="h-5 w-5" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <p className="text-muted-foreground whitespace-pre-wrap">{profile.bio}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-8 md:grid-cols-2">
          {/* Upcoming Events */}
          {profile.user.savedEvents.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-500" />
                Interested In
              </h2>
              <div className="space-y-3">
                {profile.user.savedEvents.map(({ event }) => (
                  <Link 
                    key={event.id} 
                    href={`/e/${event.organizer.slug}/${event.slug}`}
                    className="block"
                  >
                    <Card className="overflow-hidden hover:border-primary/50 transition-colors">
                      <CardContent className="p-0">
                        <div className="flex items-center gap-4">
                          <div className="relative h-20 w-20 flex-shrink-0">
                            {event.flyerUrl ? (
                              <Image
                                src={event.flyerUrl}
                                alt={event.title}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5" />
                            )}
                          </div>
                          <div className="flex-1 py-3 pr-4">
                            <h3 className="font-medium line-clamp-1">{event.title}</h3>
                            <p className="text-sm text-muted-foreground">{formatDate(event.startsAt)}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.venueName}, {event.city}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Following */}
          {profile.user.follows.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                Following
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {profile.user.follows.map(({ following }) => (
                  <Link key={following.id} href={`/o/${following.slug}`}>
                    <Card className="hover:border-primary/50 transition-colors">
                      <CardContent className="p-4 flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={following.logoUrl || undefined} />
                          <AvatarFallback>{following.displayName[0]}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium truncate text-sm">{following.displayName}</p>
                          <p className="text-xs text-muted-foreground">@{following.slug}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Empty State */}
        {profile.user.savedEvents.length === 0 && profile.user.follows.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No public activity yet</p>
              <p className="text-muted-foreground">
                This user hasn&apos;t saved any events or followed any organizers yet.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
