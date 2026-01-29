"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  Radio, 
  Play, 
  Pause, 
  Check, 
  X, 
  Music, 
  Clock, 
  User,
  ExternalLink,
  Trash2,
  Loader2
} from "lucide-react"
import { toast } from "sonner"

interface RadioTrack {
  id: string
  title: string
  fileUrl: string
  duration: number
  artworkUrl?: string
  genre?: string
  bpm?: number
  status: "PENDING" | "APPROVED" | "REJECTED"
  rejectionReason?: string
  submittedAt: string
  artist: {
    artistName: string
    slug: string
    avatarUrl?: string
    user: { email: string }
  }
  _count: { plays: number }
}

export default function RadioManagementPage() {
  const [tracks, setTracks] = useState<RadioTrack[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("PENDING")
  const [playingTrack, setPlayingTrack] = useState<string | null>(null)
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null)

  useEffect(() => {
    fetchTracks(activeTab)
  }, [activeTab])

  useEffect(() => {
    const audio = new Audio()
    setAudioRef(audio)
    return () => {
      audio.pause()
      audio.src = ""
    }
  }, [])

  const fetchTracks = async (status: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/radio/admin?status=${status}`)
      const data = await res.json()
      setTracks(data.tracks || [])
    } catch (error) {
      toast.error("Failed to fetch tracks")
    }
    setLoading(false)
  }

  const handlePlayPause = (track: RadioTrack) => {
    if (!audioRef) return

    if (playingTrack === track.id) {
      audioRef.pause()
      setPlayingTrack(null)
    } else {
      audioRef.src = track.fileUrl
      audioRef.play()
      setPlayingTrack(track.id)
    }
  }

  const handleApprove = async (trackId: string) => {
    try {
      const res = await fetch("/api/radio/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId, action: "approve" })
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Track approved for AFTERS RADIO!")
        fetchTracks(activeTab)
      } else {
        toast.error(data.error || "Failed to approve track")
      }
    } catch (error) {
      toast.error("Failed to approve track")
    }
  }

  const handleReject = async (trackId: string) => {
    try {
      const res = await fetch("/api/radio/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId, action: "reject", rejectionReason })
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Track rejected")
        setShowRejectModal(null)
        setRejectionReason("")
        fetchTracks(activeTab)
      } else {
        toast.error(data.error || "Failed to reject track")
      }
    } catch (error) {
      toast.error("Failed to reject track")
    }
  }

  const handleDelete = async (trackId: string) => {
    if (!confirm("Are you sure you want to delete this track?")) return
    
    try {
      const res = await fetch("/api/radio/admin", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId })
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Track deleted")
        fetchTracks(activeTab)
      }
    } catch (error) {
      toast.error("Failed to delete track")
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Radio className="h-8 w-8 text-[#ff1493]" />
            AFTERS RADIO
          </h1>
          <p className="text-muted-foreground">Manage track submissions and playlist.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="PENDING">
            Pending Review
          </TabsTrigger>
          <TabsTrigger value="APPROVED">
            Approved
          </TabsTrigger>
          <TabsTrigger value="REJECTED">
            Rejected
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : tracks.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Music className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No {activeTab.toLowerCase()} tracks</p>
                <p className="text-muted-foreground">
                  {activeTab === "PENDING" 
                    ? "No tracks waiting for review." 
                    : `No ${activeTab.toLowerCase()} tracks yet.`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {tracks.map((track) => (
                <Card key={track.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-center gap-4 p-4">
                      {/* Artwork & Play */}
                      <div className="relative h-20 w-20 rounded-lg overflow-hidden bg-[#ff1493]/10 flex-shrink-0">
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
                        <button
                          onClick={() => handlePlayPause(track)}
                          className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                        >
                          {playingTrack === track.id ? (
                            <Pause className="h-8 w-8 text-white" />
                          ) : (
                            <Play className="h-8 w-8 text-white" />
                          )}
                        </button>
                      </div>

                      {/* Track Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{track.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={track.artist.avatarUrl} />
                            <AvatarFallback>{track.artist.artistName[0]}</AvatarFallback>
                          </Avatar>
                          <span>{track.artist.artistName}</span>
                          <span>•</span>
                          <span>{track.artist.user.email}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(track.duration)}
                          </span>
                          {track.genre && <Badge variant="outline">{track.genre}</Badge>}
                          {track.bpm && <span>{track.bpm} BPM</span>}
                          {track.status === "APPROVED" && (
                            <span className="text-[#ff1493]">
                              {track._count.plays} plays
                            </span>
                          )}
                        </div>
                        {track.status === "REJECTED" && track.rejectionReason && (
                          <p className="text-xs text-red-400 mt-2">
                            Reason: {track.rejectionReason}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <a href={track.fileUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                        
                        {track.status === "PENDING" && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleApprove(track.id)}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setShowRejectModal(track.id)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}

                        {track.status !== "PENDING" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => handleDelete(track.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Reject Modal */}
                    {showRejectModal === track.id && (
                      <div className="border-t p-4 bg-muted/50">
                        <p className="text-sm font-medium mb-2">Rejection Reason</p>
                        <Textarea
                          placeholder="Provide a reason for rejection..."
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          className="mb-3"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(track.id)}
                          >
                            Confirm Rejection
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setShowRejectModal(null)
                              setRejectionReason("")
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
