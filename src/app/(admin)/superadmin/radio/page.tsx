"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent,
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
  Radio, Play, Pause, Check, X, Music, Clock, Upload, Trash2, Loader2, 
  GripVertical, Plus, ListMusic, Inbox, Pencil, Save
} from "lucide-react"
import { toast } from "sonner"
import { MultiTrackUpload, type TrackUploadData } from "@/components/RadioTrackUpload"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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
  artist?: { artistName: string; slug: string } | null
  _count?: { plays: number }
}

function SortableTrackItem({ track, onPlay, isPlaying, onRemove, onEdit, onDelete }: { 
  track: RadioTrack
  onPlay: (track: RadioTrack) => void
  isPlaying: boolean
  onRemove?: () => void
  onEdit?: () => void
  onDelete?: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: track.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }
  const displayArtist = track.artist?.artistName || track.artistName || "Unknown"
  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-3 bg-card border rounded-lg">
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground">
        <GripVertical className="h-5 w-5" />
      </button>
      <div className="relative h-12 w-12 rounded bg-[#ff1493]/10 flex-shrink-0 flex items-center justify-center">
        {track.artworkUrl ? (
          <img src={track.artworkUrl} alt="" className="h-full w-full object-cover rounded" />
        ) : (
          <Music className="h-5 w-5 text-[#ff1493]/50" />
        )}
        <button onClick={() => onPlay(track)} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded">
          {isPlaying ? <Pause className="h-5 w-5 text-white" /> : <Play className="h-5 w-5 text-white" />}
        </button>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate text-sm">{track.title}</p>
        <p className="text-xs text-muted-foreground truncate">{displayArtist}</p>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <span>{formatDuration(track.duration)}</span>
          {track.genre && <Badge variant="outline" className="text-[10px] h-4">{track.genre}</Badge>}
          {track._count && <span className="text-[#ff1493]">{track._count.plays} plays</span>}
        </div>
      </div>
      <div className="flex items-center gap-1">
        {onEdit && <Button size="icon" variant="ghost" onClick={onEdit}><Pencil className="h-4 w-4" /></Button>}
        {onRemove && <Button size="icon" variant="ghost" onClick={onRemove}><X className="h-4 w-4" /></Button>}
        {onDelete && <Button size="icon" variant="ghost" className="text-red-500" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>}
      </div>
    </div>
  )
}

function DroppableList({ id, title, icon: Icon, children, count }: { 
  id: string; title: string; icon: React.ElementType; children: React.ReactNode; count: number 
}) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <Card className={isOver ? 'ring-2 ring-primary' : ''}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="h-5 w-5 text-[#ff1493]" />{title}
          <Badge variant="secondary" className="ml-auto">{count}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent ref={setNodeRef} className="min-h-[200px]">{children}</CardContent>
    </Card>
  )
}

// Calculate EST time for a given timestamp
function formatESTTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'America/New_York'
  })
}

// Timeline component showing when each track plays
function QueueTimeline({ tracks }: { tracks: RadioTrack[] }) {
  if (tracks.length === 0) return null
  
  // Calculate total duration and start time
  const totalDuration = tracks.reduce((sum, t) => sum + t.duration, 0)
  const radioEpoch = new Date("2026-01-01T00:00:00Z").getTime()
  const now = Date.now()
  const elapsedSeconds = Math.floor((now - radioEpoch) / 1000)
  const positionInPlaylist = elapsedSeconds % totalDuration
  
  // Find current track and calculate timeline
  let accumulated = 0
  let currentTrackIndex = 0
  let currentPosition = 0
  
  for (let i = 0; i < tracks.length; i++) {
    if (accumulated + tracks[i].duration > positionInPlaylist) {
      currentTrackIndex = i
      currentPosition = positionInPlaylist - accumulated
      break
    }
    accumulated += tracks[i].duration
  }
  
  // Build timeline starting from now
  const timeline: { track: RadioTrack; startTime: number; endTime: number; isPlaying: boolean }[] = []
  let timeOffset = -currentPosition * 1000 // Start from when current track began
  
  for (let i = 0; i < tracks.length; i++) {
    const trackIndex = (currentTrackIndex + i) % tracks.length
    const track = tracks[trackIndex]
    const startTime = now + timeOffset
    const endTime = startTime + (track.duration * 1000)
    
    timeline.push({
      track,
      startTime,
      endTime,
      isPlaying: i === 0
    })
    
    timeOffset += track.duration * 1000
  }
  
  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5 text-[#ff1493]" />
          Schedule Timeline (EST)
          <Badge variant="outline" className="ml-auto">
            Total: {formatDuration(totalDuration)}
          </Badge>
        </CardTitle>
        <CardDescription>When each track will play (times shown in Eastern Time)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[72px] top-0 bottom-0 w-0.5 bg-border" />
          
          <div className="space-y-1">
            {timeline.map((item, i) => (
              <div key={`${item.track.id}-${i}`} className="flex items-center gap-3 relative">
                {/* Time */}
                <div className="w-[60px] text-right flex-shrink-0">
                  <span className={`text-xs font-mono ${item.isPlaying ? 'text-[#ff1493] font-bold' : 'text-muted-foreground'}`}>
                    {formatESTTime(item.startTime)}
                  </span>
                </div>
                
                {/* Dot on timeline */}
                <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 z-10 ${
                  item.isPlaying 
                    ? 'bg-[#ff1493] border-[#ff1493] animate-pulse' 
                    : 'bg-background border-border'
                }`} />
                
                {/* Track info */}
                <div className={`flex-1 flex items-center gap-2 p-2 rounded-lg ${
                  item.isPlaying ? 'bg-[#ff1493]/10 border border-[#ff1493]/30' : 'hover:bg-muted/50'
                }`}>
                  <div className="w-8 h-8 rounded bg-[#ff1493]/10 flex items-center justify-center flex-shrink-0">
                    {item.track.artworkUrl ? (
                      <img src={item.track.artworkUrl} alt="" className="w-full h-full object-cover rounded" />
                    ) : (
                      <Music className="h-4 w-4 text-[#ff1493]/50" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${item.isPlaying ? 'font-semibold text-[#ff1493]' : ''}`}>
                      {item.track.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.track.artistName || item.track.artist?.artistName || 'Unknown'}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    {formatDuration(item.track.duration)}
                  </span>
                  {item.isPlaying && (
                    <Badge className="bg-[#ff1493] text-white text-[10px]">NOW</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Loop indicator */}
          <div className="flex items-center gap-3 mt-2 pt-2 border-t border-dashed">
            <div className="w-[60px] text-right">
              <span className="text-xs text-muted-foreground font-mono">
                {formatESTTime(now + timeOffset)}
              </span>
            </div>
            <div className="w-3 h-3 rounded-full border-2 border-dashed border-muted-foreground flex-shrink-0" />
            <span className="text-xs text-muted-foreground italic">↻ Queue loops continuously</span>
          </div>
        </div>
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
  const [uploading, setUploading] = useState(false)
  const [editTrack, setEditTrack] = useState<RadioTrack | null>(null)
  const [editForm, setEditForm] = useState({ title: '', artistName: '', genre: '', bpm: '' })
  const [currentTime, setCurrentTime] = useState(Date.now())
  
  // Update current time every second for timeline refresh
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    const audio = new Audio()
    setAudioRef(audio)
    return () => { audio.pause(); audio.src = "" }
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
        queueRes.json(), approvedRes.json(), pendingRes.json()
      ])
      setQueueTracks(queueData.tracks || [])
      const queueIds = new Set((queueData.tracks || []).map((t: RadioTrack) => t.id))
      setApprovedTracks((approvedData.tracks || []).filter((t: RadioTrack) => !queueIds.has(t.id)))
      setPendingTracks(pendingData.tracks || [])
    } catch { toast.error("Failed to fetch tracks") }
    setLoading(false)
  }, [])

  useEffect(() => { fetchAllTracks() }, [fetchAllTracks])

  const handlePlayPause = (track: RadioTrack) => {
    if (!audioRef) return
    if (playingTrack === track.id) { audioRef.pause(); setPlayingTrack(null) }
    else { audioRef.src = track.fileUrl; audioRef.play(); setPlayingTrack(track.id) }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (!over || active.id === over.id) return
    
    const oldIndex = queueTracks.findIndex(t => t.id === active.id)
    const newIndex = queueTracks.findIndex(t => t.id === over.id)
    if (oldIndex !== -1 && newIndex !== -1) {
      const newQueue = arrayMove(queueTracks, oldIndex, newIndex)
      setQueueTracks(newQueue)
      await fetch("/api/radio/admin/queue", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackIds: newQueue.map(t => t.id) })
      })
      toast.success("Queue order updated")
    }
  }

  const handleAddToQueue = async (trackId: string) => {
    await fetch("/api/radio/admin/queue", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackId })
    })
    toast.success("Added to queue")
    fetchAllTracks()
  }

  const handleRemoveFromQueue = async (trackId: string) => {
    await fetch("/api/radio/admin/queue", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackId })
    })
    toast.success("Removed from queue")
    fetchAllTracks()
  }

  const handleApprove = async (trackId: string) => {
    await fetch("/api/radio/admin", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackId, action: "approve" })
    })
    toast.success("Track approved!")
    fetchAllTracks()
  }

  const handleReject = async (trackId: string) => {
    await fetch("/api/radio/admin", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackId, action: "reject", rejectionReason: "Not approved" })
    })
    toast.success("Track rejected")
    fetchAllTracks()
  }

  const handleDelete = async (trackId: string) => {
    if (!confirm("Delete this track permanently?")) return
    await fetch("/api/radio/admin", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackId })
    })
    toast.success("Track deleted")
    fetchAllTracks()
  }

  const handleMultiUpload = async (tracks: TrackUploadData[]) => {
    setUploading(true)
    for (const track of tracks) {
      if (!track.url) continue
      await fetch("/api/radio/admin/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: track.title,
          artistName: track.artistName,
          fileUrl: track.url,
          duration: track.duration,
          genre: track.genre || null,
          bpm: track.bpm ? parseInt(track.bpm) : null
        })
      })
    }
    toast.success(`${tracks.length} track(s) uploaded!`)
    setShowUpload(false)
    setUploading(false)
    fetchAllTracks()
  }

  const openEditDialog = (track: RadioTrack) => {
    setEditTrack(track)
    setEditForm({
      title: track.title,
      artistName: track.artistName || track.artist?.artistName || '',
      genre: track.genre || '',
      bpm: track.bpm?.toString() || ''
    })
  }

  const handleSaveEdit = async () => {
    if (!editTrack) return
    await fetch("/api/radio/admin/track", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackId: editTrack.id, ...editForm, bpm: editForm.bpm ? parseInt(editForm.bpm) : null })
    })
    toast.success("Track updated")
    setEditTrack(null)
    fetchAllTracks()
  }

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin" /></div>

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Radio className="h-8 w-8 text-[#ff1493]" />AFTERS RADIO
          </h1>
          <p className="text-muted-foreground">Manage tracks and queue. Drag to reorder.</p>
        </div>
        <Button onClick={() => setShowUpload(!showUpload)}>
          <Upload className="h-4 w-4 mr-2" />{showUpload ? 'Hide Upload' : 'Upload Tracks'}
        </Button>
      </div>

      {showUpload && (
        <Card>
          <CardHeader>
            <CardTitle>Bulk Upload Tracks</CardTitle>
            <CardDescription>Upload multiple tracks at once. Metadata is auto-detected from filenames.</CardDescription>
          </CardHeader>
          <CardContent>
            <MultiTrackUpload onTracksReady={handleMultiUpload} disabled={uploading} />
          </CardContent>
        </Card>
      )}

      {/* Visual Timeline */}
      {queueTracks.length > 0 && <QueueTimeline tracks={queueTracks} key={currentTime} />}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={(e) => setActiveId(e.active.id as string)} onDragEnd={handleDragEnd}>
        <div className="grid gap-6 lg:grid-cols-2">
          <DroppableList id="queue-list" title="Radio Queue" icon={ListMusic} count={queueTracks.length}>
            {queueTracks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ListMusic className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>Queue is empty</p>
              </div>
            ) : (
              <SortableContext items={queueTracks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {queueTracks.map((track, i) => (
                    <div key={track.id} className="relative">
                      <span className="absolute -left-6 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">{i + 1}</span>
                      <SortableTrackItem track={track} onPlay={handlePlayPause} isPlaying={playingTrack === track.id}
                        onRemove={() => handleRemoveFromQueue(track.id)} onEdit={() => openEditDialog(track)} />
                    </div>
                  ))}
                </div>
              </SortableContext>
            )}
          </DroppableList>

          <DroppableList id="approved-list" title="Approved (Not in Queue)" icon={Music} count={approvedTracks.length}>
            {approvedTracks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Inbox className="h-10 w-10 mx-auto mb-2 opacity-50" /><p>No tracks available</p>
              </div>
            ) : (
              <div className="space-y-2">
                {approvedTracks.map(track => (
                  <div key={track.id} className="flex items-center gap-3 p-3 bg-card border rounded-lg">
                    <div className="h-12 w-12 rounded bg-[#ff1493]/10 flex items-center justify-center flex-shrink-0">
                      <Music className="h-5 w-5 text-[#ff1493]/50" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">{track.title}</p>
                      <p className="text-xs text-muted-foreground">{track.artistName || track.artist?.artistName}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleAddToQueue(track.id)}>
                      <Plus className="h-4 w-4 mr-1" />Add
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => openEditDialog(track)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-red-500" onClick={() => handleDelete(track.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
            )}
          </DroppableList>
        </div>

        <DragOverlay>
          {activeId && (() => {
            const t = [...queueTracks, ...approvedTracks].find(t => t.id === activeId)
            return t ? (
              <div className="flex items-center gap-3 p-3 bg-card border rounded-lg shadow-xl">
                <GripVertical className="h-5 w-5" />
                <Music className="h-5 w-5 text-[#ff1493]" />
                <span className="font-medium">{t.title}</span>
              </div>
            ) : null
          })()}
        </DragOverlay>
      </DndContext>

      {pendingTracks.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-500" />Pending Review ({pendingTracks.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {pendingTracks.map(track => (
              <Card key={track.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded bg-[#ff1493]/10 flex items-center justify-center">
                      <Music className="h-6 w-6 text-[#ff1493]/50" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{track.title}</h3>
                      <p className="text-sm text-muted-foreground">{track.artistName || track.artist?.artistName}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-green-600" onClick={() => handleApprove(track.id)}><Check className="h-4 w-4" /></Button>
                      <Button size="sm" variant="destructive" onClick={() => handleReject(track.id)}><X className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editTrack} onOpenChange={() => setEditTrack(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Track</DialogTitle>
            <DialogDescription>Update track information</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Artist Name</Label>
              <Input value={editForm.artistName} onChange={e => setEditForm(p => ({ ...p, artistName: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Genre</Label>
                <Input value={editForm.genre} onChange={e => setEditForm(p => ({ ...p, genre: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>BPM</Label>
                <Input type="number" value={editForm.bpm} onChange={e => setEditForm(p => ({ ...p, bpm: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTrack(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit}><Save className="h-4 w-4 mr-2" />Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
