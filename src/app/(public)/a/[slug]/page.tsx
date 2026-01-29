import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Header } from "@/components/layout/header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { 
  Music, 
  Play, 
  Radio, 
  CheckCircle, 
  ExternalLink,
  Instagram,
  Twitter,
  Globe
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface ArtistPageProps {
  params: Promise<{ slug: string }>
}

export default async function ArtistProfilePage({ params }: ArtistPageProps) {
  const { slug } = await params

  const artist = await prisma.artistProfile.findUnique({
    where: { slug },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          imageUrl: true,
        }
      },
      radioTracks: {
        where: { status: "APPROVED" },
        include: {
          _count: {
            select: { plays: true }
          }
        },
        orderBy: { approvedAt: "desc" }
      }
    }
  })

  if (!artist) {
    notFound()
  }

  // Calculate total radio plays
  const totalPlays = artist.radioTracks.reduce((sum, track) => sum + track._count.plays, 0)

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Cover Image */}
      <div className="relative h-64 md:h-80 bg-gradient-to-br from-primary/20 via-background to-background">
        {artist.coverUrl && (
          <Image
            src={artist.coverUrl}
            alt={artist.artistName}
            fill
            className="object-cover opacity-50"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>

      <main className="container mx-auto px-4 -mt-32 relative z-10 pb-24">
        {/* Artist Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end gap-6 mb-8">
          <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-background shadow-xl">
            <AvatarImage src={artist.avatarUrl || artist.user.imageUrl || undefined} alt={artist.artistName} />
            <AvatarFallback className="text-4xl bg-primary/10">
              {artist.artistName[0]}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold">{artist.artistName}</h1>
              {artist.isVerified && (
                <CheckCircle className="h-6 w-6 text-primary fill-primary/20" />
              )}
            </div>
            <p className="text-muted-foreground mb-4">@{artist.slug}</p>
            
            {artist.genres && (
              <div className="flex flex-wrap gap-2 mb-4">
                {artist.genres.split(",").map((genre) => (
                  <Badge key={genre} variant="secondary">
                    {genre.trim()}
                  </Badge>
                ))}
              </div>
            )}

            {/* Social Links */}
            <div className="flex items-center gap-3">
              {artist.spotifyUrl && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={artist.spotifyUrl} target="_blank">
                    <Music className="h-4 w-4 mr-2" />
                    Spotify
                  </Link>
                </Button>
              )}
              {artist.soundcloudUrl && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={artist.soundcloudUrl} target="_blank">
                    <Music className="h-4 w-4 mr-2" />
                    SoundCloud
                  </Link>
                </Button>
              )}
              {artist.instagramUrl && (
                <Button variant="ghost" size="icon" asChild>
                  <Link href={artist.instagramUrl} target="_blank">
                    <Instagram className="h-5 w-5" />
                  </Link>
                </Button>
              )}
              {artist.twitterUrl && (
                <Button variant="ghost" size="icon" asChild>
                  <Link href={artist.twitterUrl} target="_blank">
                    <Twitter className="h-5 w-5" />
                  </Link>
                </Button>
              )}
              {artist.websiteUrl && (
                <Button variant="ghost" size="icon" asChild>
                  <Link href={artist.websiteUrl} target="_blank">
                    <Globe className="h-5 w-5" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        {artist.bio && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="font-semibold mb-2">About</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">{artist.bio}</p>
            </CardContent>
          </Card>
        )}

        {/* AFTERS RADIO Section */}
        {artist.radioTracks.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Radio className="h-6 w-6 text-[#ff1493]" />
                <h2 className="text-xl font-bold">On AFTERS RADIO</h2>
              </div>
              <Badge variant="secondary" className="bg-[#ff1493]/10 text-[#ff1493]">
                {totalPlays.toLocaleString()} total plays
              </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {artist.radioTracks.map((track) => (
                <Card key={track.id} className="group overflow-hidden hover:border-[#ff1493]/50 transition-colors">
                  <CardContent className="p-0">
                    <div className="flex items-center gap-4 p-4">
                      <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-[#ff1493]/10 flex-shrink-0">
                        {track.artworkUrl ? (
                          <Image
                            src={track.artworkUrl}
                            alt={track.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Music className="h-8 w-8 text-[#ff1493]/50" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Play className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{track.title}</h3>
                        {track.genre && (
                          <p className="text-xs text-muted-foreground">{track.genre}</p>
                        )}
                        <p className="text-xs text-[#ff1493]">
                          {track._count.plays.toLocaleString()} plays on AFTERS RADIO
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {artist.radioTracks.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Radio className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No tracks on AFTERS RADIO yet</p>
              <p className="text-muted-foreground">
                This artist hasn&apos;t submitted any tracks to AFTERS RADIO yet.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
