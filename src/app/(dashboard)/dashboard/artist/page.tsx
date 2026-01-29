import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getEffectiveUserId } from "@/lib/auth-utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Radio, 
  Music, 
  Play, 
  Clock, 
  TrendingUp, 
  Upload,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3
} from "lucide-react"
import Link from "next/link"
import { ArtistProfileForm } from "./ArtistProfileForm"
import { TrackSubmissionForm } from "./TrackSubmissionForm"
import { VerificationRequestForm } from "@/components/dashboard/VerificationRequestForm"

export default async function ArtistPage() {
  const userId = await getEffectiveUserId()

  if (!userId) {
    redirect("/sign-in")
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      artistProfile: {
        include: {
          radioTracks: {
            include: {
              _count: { select: { plays: true } }
            },
            orderBy: { createdAt: "desc" }
          }
        }
      }
    }
  })

  if (!user) {
    redirect("/sign-in")
  }

  const artistProfile = user.artistProfile

  // Calculate analytics
  const totalTracks = artistProfile?.radioTracks.length || 0
  const approvedTracks = artistProfile?.radioTracks.filter(t => t.status === "APPROVED").length || 0
  const pendingTracks = artistProfile?.radioTracks.filter(t => t.status === "PENDING").length || 0
  const totalPlays = artistProfile?.radioTracks.reduce((sum, t) => sum + t._count.plays, 0) || 0

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 lg:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2 sm:gap-3">
            <Music className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            Artist Dashboard
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage your artist profile and submit tracks to AFTERS RADIO.
          </p>
        </div>
        {artistProfile && (
          <Button asChild className="w-full sm:w-auto">
            <Link href={`/a/${artistProfile.slug}`} target="_blank">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Profile
            </Link>
          </Button>
        )}
      </div>

      {/* Stats */}
      {artistProfile && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <Card>
            <CardContent className="p-3 sm:pt-6 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                <div className="p-2 sm:p-3 bg-[#ff1493]/10 rounded-full">
                  <Radio className="h-5 w-5 sm:h-6 sm:w-6 text-[#ff1493]" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold">{approvedTracks}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">On Radio</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:pt-6 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                <div className="p-2 sm:p-3 bg-yellow-500/10 rounded-full">
                  <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold">{pendingTracks}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:pt-6 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                <div className="p-2 sm:p-3 bg-green-500/10 rounded-full">
                  <Play className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold">{totalPlays.toLocaleString()}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Plays</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:pt-6 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                <div className="p-2 sm:p-3 bg-blue-500/10 rounded-full">
                  <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold">{totalTracks}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Tracks</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue={artistProfile ? "tracks" : "profile"}>
        <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex sm:grid-cols-none">
          <TabsTrigger value="profile" className="text-xs sm:text-sm">Profile</TabsTrigger>
          {artistProfile && (
            <>
              <TabsTrigger value="tracks" className="text-xs sm:text-sm">Tracks</TabsTrigger>
              <TabsTrigger value="submit" className="text-xs sm:text-sm">Submit</TabsTrigger>
              <TabsTrigger value="verification" className="text-xs sm:text-sm">Verify</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <ArtistProfileForm profile={artistProfile} />
        </TabsContent>

        {artistProfile && (
          <>
            <TabsContent value="tracks" className="mt-6">
              {artistProfile.radioTracks.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Music className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-2">No tracks submitted yet</p>
                    <p className="text-muted-foreground mb-4">
                      Submit your first track to be featured on AFTERS RADIO!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {artistProfile.radioTracks.map((track) => (
                    <Card key={track.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-[#ff1493]/10 flex-shrink-0">
                            {track.artworkUrl ? (
                              <img
                                src={track.artworkUrl}
                                alt={track.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center">
                                <Music className="h-8 w-8 text-[#ff1493]/50" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">{track.title}</h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDuration(track.duration)}
                              </span>
                              {track.genre && <span>{track.genre}</span>}
                              {track.bpm && <span>{track.bpm} BPM</span>}
                            </div>
                            {track.status === "REJECTED" && track.rejectionReason && (
                              <p className="text-xs text-red-400 mt-1">
                                Rejection reason: {track.rejectionReason}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            {track.status === "APPROVED" && (
                              <div className="text-right">
                                <p className="text-lg font-bold text-[#ff1493]">
                                  {track._count.plays.toLocaleString()}
                                </p>
                                <p className="text-xs text-muted-foreground">plays</p>
                              </div>
                            )}
                            <Badge variant={
                              track.status === "APPROVED" ? "default" :
                              track.status === "PENDING" ? "secondary" : "destructive"
                            }>
                              {track.status === "APPROVED" && <CheckCircle className="h-3 w-3 mr-1" />}
                              {track.status === "PENDING" && <AlertCircle className="h-3 w-3 mr-1" />}
                              {track.status === "REJECTED" && <XCircle className="h-3 w-3 mr-1" />}
                              {track.status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="submit" className="mt-6">
              <TrackSubmissionForm />
            </TabsContent>

            <TabsContent value="verification" className="mt-6">
              <VerificationRequestForm />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  )
}
