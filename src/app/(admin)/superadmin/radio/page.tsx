"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  useDroppable
} from "@dnd-kit/core"
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { 
  Radio, 
  Play, 
  Pause, 
  Check, 
  X, 
  Music, 
  Clock, 
  Upload,
  ExternalLink,
  Trash2,
  Loader2,
  GripVertical,
  Plus,
  ListMusic,
  Inbox
} from "lucide-react"
import { toast } from "sonner"

interface RadioTrack {
  id: string
  title: string
  artistName?: string
  fileUrl: string
  duration: number
  artworkUrl?: string
  genre?: string
  bpm?: number
  status: "PENDING" | "APPROVED" | "REJECTED"
  queuePosition?: number | null
  rejectionReason?: string
  submittedAt: string
  artist?: {
    artistName: string
    slug: string
    avatarUrl?: string
    user?: { email: string }
  } | null
  _count?: { plays: number }
}

// Sortable Track Item Component
function SortableTrackItem({ 
  track, 
  onPlay, 
  isPlaying, 
  onRemoveFromQueue,
  onDelete,
  showQueueActions = false
}: { 
  track: RadioTrack
  onPlay: (track: RadioTrack) => void
  isPlaying: boolean
  onRemoveFromQueue?: (id: string) => void
  onDelete?: (id: string) => void
  showQueueActions?: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const displayArtistName = track.artist?.artistName || track.artistName || "Unknown Artist"

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`flex items-center gap-3 p-3 bg-card border rounded-lg ${isDragging ? 'shadow-lg ring-2 ring-primary' : ''}`}
    >
      {/* Drag Handle */}
      <button 
        {...attributes} 
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      {/* Artwork & Play */}
      <div className="relative h-12 w-12 rounded overflow-hidden bg-[#ff1493]/10 flex-shrink-0">
        {track.artworkUrl ? (
          <img src={track.artworkUrl} alt={track.title} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <Music className="h-5 w-5 text-[#ff1493]/50" />
          </div>
        )}
        <button
          onClick={() => onPlay(track)}
          className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
        >
          {isPlaying ? <Pause className="h-5 w-5 text-white" /> : <Play className="h-5 w-5 text-white" />}
        </button>
      </div>

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate text-sm">{track.title}</p>
        <p className="text-xs text-muted-foreground truncate">{displayArtistName}</p>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <span>{formatDuration(track.duration)}</span>
          {track.genre && <Badge variant="outline" className="text-[10px] h-4">{track.genre}</Badge>}
          {track._count && <span className="text-[#ff1493]">{track._count.plays} plays</span>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {showQueueActions && onRemoveFromQueue && (
          <Button size="icon" variant="ghost" onClick={() => onRemoveFromQueue(track.id)} title="Remove from queue">
            <X className="h-4 w-4" />
          </Button>
        )}
        {onDelete && (
          <Button size="icon" variant="ghost" className="text-red-500" onClick={() => onDelete(track.id)} title="Delete track">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

// Track Card for non-sortable display
function TrackCard({ 
  track, 
  onPlay, 
  isPlaying, 
  onAddToQueue,
  onApprove,
  onReject,
  onDelete
}: { 
  track: RadioTrack
  onPlay: (track: RadioTrack) => void
  isPlaying: boolean
  onAddToQueue?: (id: string) => void
  onApprove?: (id: string) => void
  onReject?: (id: string, reason: string) => void
  onDelete?: (id: string) => void
}) {
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const displayArtistName = track.artist?.artistName || track.artistName || "Unknown Artist"

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center gap-4 p-4">
          {/* Artwork & Play */}
          <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-[#ff1493]/10 flex-shrink-0">
            {track.artworkUrl ? (
              <img src={track.artworkUrl} alt={track.title} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <Music className="h-6 w-6 text-[#ff1493]/50" />
              </div>
            )}
            <button
              onClick={() => onPlay(track)}
              className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
            >
              {isPlaying ? <Pause className="h-6 w-6 text-white" /> : <Play className="h-6 w-6 text-white" />}
            </button>
          </div>

          {/* Track Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{track.title}</h3>
            <p className="text-sm text-muted-foreground">{displayArtistName}</p>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(track.duration)}
              </span>
              {track.genre && <Badge variant="outline">{track.genre}</Badge>}
              {track.bpm && <span>{track.bpm} BPM</span>}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {track.status === "APPROVED" && onAddToQueue && track.queuePosition === null && (
              <Button size="sm" variant="outline" onClick={() => onAddToQueue(track.id)}>
                <Plus className="h-4 w-4 mr-1" />
                Add to Queue
              </Button>
            )}
            {track.status === "PENDING" && onApprove && (
              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => onApprove(track.id)}>
                <Check className="h-4 w-4 mr-1" />
                Approve
              </Button>
            )}
            {track.status === "PENDING" && onReject && (
              <Button size="sm" variant="destructive" onClick={() => setShowRejectInput(true)}>
                <X className="h-4 w-4 mr-1" />
                Reject
              </Button>
            )}
            {onDelete && (
              <Button size="icon" variant="ghost" className="text-red-500" onClick={() => onDelete(track.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {showRejectInput && onReject && (
          <div className="border-t p-4 bg-muted/50">
            <Textarea
              placeholder="Rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="mb-2"
            />
            <div className="flex gap-2">
              <Button size="sm" variant="destructive" onClick={() => {
                onReject(track.id, rejectionReason)
                setShowRejectInput(false)
                setRejectionReason("")
              }}>
                Confirm
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowRejectInput(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Droppable List Component
function DroppableList({ 
  id, 
  title, 
  icon: Icon,
  children,
  count 
}: { 
  id: string
  title: string
  icon: React.ElementType
  children: React.ReactNode
  count: number
}) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <Card className={`${isOver ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="h-5 w-5 text-[#ff1493]" />
          {title}
          <Badge variant="secondary" className="ml-auto">{count}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent ref={setNodeRef} className="min-h-[200px]">
        {children}
      </CardContent>
    </Card>
  )
}

export default function RadioManagementPage() {
  const [queueTracks, setQueueTracks] = useState<RadioTrack[]>([])
  const [approvedTracks, setApprovedTracks] = useState<RadioTrack[]>([])
  const [pendingTracks, setPendingTracks] = useState<RadioTrack[]>([])
  const [loading, setLoading] = useState(true)
  const [playingTrack, setPlayingTrack] = useState<string | null>(null)
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    title: "",
    artistName: "",
    fileUrl: "",
    duration: "",
    artworkUrl: "",
    genre: "",
    bpm: ""
  })
  const [uploading, setUploading] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    const audio = new Audio()
    setAudioRef(audio)
    return () => {
      audio.pause()
      audio.src = ""
    }
  }, [])

  const fetchAllTracks = useCallback(async () => {
    setLoading(true)
    try {
      const [queueRes, approvedRes, pendingRes] = await Promise.all([
        fetch("/api/radio/admin/queue"),
        fetch("/api/radio/admin?status=APPROVED"),
        fetch("/api/radio/admin?status=PENDING")
      ])

      const [queueData, approvedData, pendingData] = await Promise.all([
        queueRes.json(),
        approvedRes.json(),
        pendingRes.json()
      ])

      setQueueTracks(queueData.tracks || [])
      // Filter out tracks that are already in the queue
      const queueIds = new Set((queueData.tracks || []).map((t: RadioTrack) => t.id))
      setApprovedTracks((approvedData.tracks || []).filter((t: RadioTrack) => !queueIds.has(t.id)))
      setPendingTracks(pendingData.tracks || [])
    } catch (error) {
      toast.error("Failed to fetch tracks")
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAllTracks()
  }, [fetchAllTracks])

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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeTrack = [...queueTracks, ...approvedTracks].find(t => t.id === active.id)
    if (!activeTrack) return

    // Reordering within queue
    if (active.id !== over.id && queueTracks.find(t => t.id === active.id) && queueTracks.find(t => t.id === over.id)) {
      const oldIndex = queueTracks.findIndex(t => t.id === active.id)
      const newIndex = queueTracks.findIndex(t => t.id === over.id)
      const newQueue = arrayMove(queueTracks, oldIndex, newIndex)
      setQueueTracks(newQueue)

      // Save new order to server
      try {
        await fetch("/api/radio/admin/queue", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trackIds: newQueue.map(t => t.id) })
        })
        toast.success("Queue order updated")
      } catch (error) {
        toast.error("Failed to update queue order")
        fetchAllTracks()
      }
    }
  }

  const handleDragOver = async (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeTrack = approvedTracks.find(t => t.id === active.id)
    
    // Moving from approved to queue
    if (activeTrack && over.id === "queue-list") {
      setApprovedTracks(prev => prev.filter(t => t.id !== active.id))
      setQueueTracks(prev => [...prev, activeTrack])
    }
  }

  const handleAddToQueue = async (trackId: string) => {
    try {
      const res = await fetch("/api/radio/admin/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId })
      })
      if (res.ok) {
        toast.success("Track added to queue")
        fetchAllTracks()
      }
    } catch (error) {
      toast.error("Failed to add to queue")
    }
  }

  const handleRemoveFromQueue = async (trackId: string) => {
    try {
      const res = await fetch("/api/radio/admin/queue", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId })
      })
      if (res.ok) {
        toast.success("Track removed from queue")
        fetchAllTracks()
      }
    } catch (error) {
      toast.error("Failed to remove from queue")
    }
  }

  const handleApprove = async (trackId: string) => {
    try {
      const res = await fetch("/api/radio/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId, action: "approve" })
      })
      if (res.ok) {
        toast.success("Track approved!")
        fetchAllTracks()
      }
    } catch (error) {
      toast.error("Failed to approve track")
    }
  }

  const handleReject = async (trackId: string, reason: string) => {
    try {
      const res = await fetch("/api/radio/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId, action: "reject", rejectionReason: reason })
      })
      if (res.ok) {
        toast.success("Track rejected")
        fetchAllTracks()
      }
    } catch (error) {
      toast.error("Failed to reject track")
    }
  }

  const handleDelete = async (trackId: string) => {
    if (!confirm("Delete this track permanently?")) return
    try {
      const res = await fetch("/api/radio/admin", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId })
      })
      if (res.ok) {
        toast.success("Track deleted")
        fetchAllTracks()
      }
    } catch (error) {
      toast.error("Failed to delete track")
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadForm.title || !uploadForm.fileUrl || !uploadForm.duration) {
      toast.error("Title, file URL, and duration are required")
      return
    }

    setUploading(true)
    try {
      const res = await fetch("/api/radio/admin/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...uploadForm,
          duration: parseInt(uploadForm.duration),
          bpm: uploadForm.bpm ? parseInt(uploadForm.bpm) : null
        })
      })
      
      if (res.ok) {
        toast.success("Track uploaded and added to queue!")
        setUploadForm({ title: "", artistName: "", fileUrl: "", duration: "", artworkUrl: "", genre: "", bpm: "" })
        setShowUpload(false)
        fetchAllTracks()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to upload track")
      }
    } catch (error) {
      toast.error("Failed to upload track")
    }
    setUploading(false)
  }

  const activeTrack = activeId ? [...queueTracks, ...approvedTracks].find(t => t.id === activeId) : null

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Radio className="h-8 w-8 text-[#ff1493]" />
            AFTERS RADIO
          </h1>
          <p className="text-muted-foreground">Manage tracks and queue. Drag tracks to reorder.</p>
        </div>
        <Button onClick={() => setShowUpload(!showUpload)}>
          <Upload className="h-4 w-4 mr-2" />
          Upload Track
        </Button>
      </div>

      {/* Upload Form */}
      {showUpload && (
        <Card>
          <CardHeader>
            <CardTitle>Upload New Track</CardTitle>
            <CardDescription>Add a track directly to AFTERS RADIO (auto-approved)</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Track Title *</Label>
                <Input
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Track name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Artist Name *</Label>
                <Input
                  value={uploadForm.artistName}
                  onChange={(e) => setUploadForm(p => ({ ...p, artistName: e.target.value }))}
                  placeholder="Artist or DJ name"
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Audio File URL *</Label>
                <Input
                  value={uploadForm.fileUrl}
                  onChange={(e) => setUploadForm(p => ({ ...p, fileUrl: e.target.value }))}
                  placeholder="https://... (direct link to MP3)"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Duration (seconds) *</Label>
                <Input
                  type="number"
                  value={uploadForm.duration}
                  onChange={(e) => setUploadForm(p => ({ ...p, duration: e.target.value }))}
                  placeholder="180"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Artwork URL</Label>
                <Input
                  value={uploadForm.artworkUrl}
                  onChange={(e) => setUploadForm(p => ({ ...p, artworkUrl: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>Genre</Label>
                <Input
                  value={uploadForm.genre}
                  onChange={(e) => setUploadForm(p => ({ ...p, genre: e.target.value }))}
                  placeholder="House, Techno, etc."
                />
              </div>
              <div className="space-y-2">
                <Label>BPM</Label>
                <Input
                  type="number"
                  value={uploadForm.bpm}
                  onChange={(e) => setUploadForm(p => ({ ...p, bpm: e.target.value }))}
                  placeholder="128"
                />
              </div>
              <div className="md:col-span-2 flex gap-2">
                <Button type="submit" disabled={uploading}>
                  {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  Add to Radio
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowUpload(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Queue Management with Drag and Drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Current Queue */}
          <DroppableList id="queue-list" title="Radio Queue" icon={ListMusic} count={queueTracks.length}>
            {queueTracks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ListMusic className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>Queue is empty</p>
                <p className="text-sm">Drag tracks here or click "Add to Queue"</p>
              </div>
            ) : (
              <SortableContext items={queueTracks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {queueTracks.map((track, index) => (
                    <div key={track.id} className="relative">
                      <span className="absolute -left-6 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
                        {index + 1}
                      </span>
                      <SortableTrackItem
                        track={track}
                        onPlay={handlePlayPause}
                        isPlaying={playingTrack === track.id}
                        onRemoveFromQueue={handleRemoveFromQueue}
                        showQueueActions
                      />
                    </div>
                  ))}
                </div>
              </SortableContext>
            )}
          </DroppableList>

          {/* Approved Tracks (not in queue) */}
          <DroppableList id="approved-list" title="Approved Tracks" icon={Music} count={approvedTracks.length}>
            {approvedTracks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Inbox className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>No approved tracks available</p>
                <p className="text-sm">Upload or approve tracks below</p>
              </div>
            ) : (
              <SortableContext items={approvedTracks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {approvedTracks.map(track => (
                    <SortableTrackItem
                      key={track.id}
                      track={track}
                      onPlay={handlePlayPause}
                      isPlaying={playingTrack === track.id}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </SortableContext>
            )}
          </DroppableList>
        </div>

        <DragOverlay>
          {activeTrack && (
            <div className="flex items-center gap-3 p-3 bg-card border rounded-lg shadow-xl opacity-90">
              <GripVertical className="h-5 w-5 text-muted-foreground" />
              <div className="h-12 w-12 rounded bg-[#ff1493]/10 flex items-center justify-center">
                <Music className="h-5 w-5 text-[#ff1493]" />
              </div>
              <div>
                <p className="font-medium text-sm">{activeTrack.title}</p>
                <p className="text-xs text-muted-foreground">{activeTrack.artist?.artistName || activeTrack.artistName}</p>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Pending Tracks Section */}
      {pendingTracks.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            Pending Review ({pendingTracks.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {pendingTracks.map(track => (
              <TrackCard
                key={track.id}
                track={track}
                onPlay={handlePlayPause}
                isPlaying={playingTrack === track.id}
                onApprove={handleApprove}
                onReject={handleReject}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
