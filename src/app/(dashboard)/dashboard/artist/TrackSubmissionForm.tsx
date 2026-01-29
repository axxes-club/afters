"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Upload, Music, Radio } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function TrackSubmissionForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    fileUrl: "",
    duration: "",
    artworkUrl: "",
    genre: "",
    bpm: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/radio/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      const data = await res.json()
      
      if (data.success) {
        toast.success("Track submitted for review!")
        setFormData({
          title: "",
          fileUrl: "",
          duration: "",
          artworkUrl: "",
          genre: "",
          bpm: "",
        })
        router.refresh()
      } else {
        toast.error(data.error || "Failed to submit track")
      }
    } catch (error) {
      toast.error("Something went wrong")
    }

    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Radio className="h-5 w-5 text-[#ff1493]" />
          Submit to AFTERS RADIO
        </CardTitle>
        <CardDescription>
          Submit your original tracks or mixes to be featured on AFTERS RADIO. 
          Our team will review submissions and approve tracks that fit our sound.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-lg border border-dashed p-6 text-center bg-muted/30">
            <Music className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
            <h4 className="font-medium mb-2">Track Requirements</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• High quality audio (320kbps MP3, WAV, or FLAC)</li>
              <li>• Original productions or official remixes only</li>
              <li>• Electronic/dance music genres</li>
              <li>• No explicit content in vocals</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Track Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="My Amazing Track"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fileUrl">Audio File URL *</Label>
            <Input
              id="fileUrl"
              value={formData.fileUrl}
              onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
              placeholder="https://... (direct link to audio file)"
              required
            />
            <p className="text-xs text-muted-foreground">
              Upload your track to a hosting service (Dropbox, Google Drive, etc.) and paste the direct link here.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (seconds) *</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="180"
                min="30"
                max="3600"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="genre">Genre</Label>
              <Input
                id="genre"
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                placeholder="House, Techno, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bpm">BPM</Label>
              <Input
                id="bpm"
                type="number"
                value={formData.bpm}
                onChange={(e) => setFormData({ ...formData, bpm: e.target.value })}
                placeholder="128"
                min="60"
                max="200"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="artworkUrl">Artwork URL</Label>
            <Input
              id="artworkUrl"
              value={formData.artworkUrl}
              onChange={(e) => setFormData({ ...formData, artworkUrl: e.target.value })}
              placeholder="https://... (square image, min 500x500)"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-[#ff1493] hover:bg-[#ff1493]/90">
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Submit for Review
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
