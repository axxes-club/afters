"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Save, Globe, Upload } from "lucide-react"
import { URL_PREFIXES } from "@/lib/constants"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface OrganizerProfile {
  id: string
  displayName: string
  slug: string
  bio?: string | null
  logoUrl?: string | null
  coverUrl?: string | null
  genres?: string | null
  artistType?: string | null
  websiteUrl?: string | null
  instagramUrl?: string | null
  twitterUrl?: string | null
  youtubeUrl?: string | null
  spotifyUrl?: string | null
  soundcloudUrl?: string | null
}

interface Props {
  profile: OrganizerProfile
}

export function OrganizerProfileForm({ profile }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    displayName: profile.displayName || "",
    slug: profile.slug || "",
    bio: profile.bio || "",
    logoUrl: profile.logoUrl || "",
    coverUrl: profile.coverUrl || "",
    genres: profile.genres || "",
    artistType: profile.artistType || "",
    websiteUrl: profile.websiteUrl || "",
    instagramUrl: profile.instagramUrl || "",
    twitterUrl: profile.twitterUrl || "",
    youtubeUrl: profile.youtubeUrl || "",
    spotifyUrl: profile.spotifyUrl || "",
    soundcloudUrl: profile.soundcloudUrl || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/organizer/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      const data = await res.json()
      
      if (res.ok) {
        toast.success("Profile updated!")
        router.refresh()
      } else {
        toast.error(data.error || "Failed to save profile")
      }
    } catch (error) {
      toast.error("Something went wrong")
    }

    setLoading(false)
  }

  const generateSlug = () => {
    const slug = formData.displayName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
    setFormData({ ...formData, slug })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Organizer Profile</CardTitle>
          <CardDescription>
            This information will be displayed on your public organizer page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Logo Preview */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={formData.logoUrl || undefined} />
              <AvatarFallback className="text-2xl">{formData.displayName?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input
                id="logoUrl"
                value={formData.logoUrl}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="displayName">Organizer Name *</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="Your organizer or business name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Profile URL *</Label>
              <div className="flex gap-2">
                <div className="flex items-center px-3 bg-muted rounded-l-md border border-r-0 text-sm text-muted-foreground whitespace-nowrap">
                  {URL_PREFIXES.organizer}
                </div>
                <Input
                  id="slug"
                  className="rounded-l-none"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                  placeholder="your-org"
                  required
                />
              </div>
              <Button type="button" variant="link" size="sm" className="p-0 h-auto text-xs" onClick={generateSlug}>
                Generate from name
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio / Description</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell people about your event business, the events you produce, your mission..."
              rows={4}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="artistType">Type</Label>
              <Input
                id="artistType"
                value={formData.artistType}
                onChange={(e) => setFormData({ ...formData, artistType: e.target.value })}
                placeholder="Event Promoter, Nightclub, Festival, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="genres">Genres</Label>
              <Input
                id="genres"
                value={formData.genres}
                onChange={(e) => setFormData({ ...formData, genres: e.target.value })}
                placeholder="House, Techno, Hip-Hop, etc."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="coverUrl">Cover Image URL</Label>
            <Input
              id="coverUrl"
              value={formData.coverUrl}
              onChange={(e) => setFormData({ ...formData, coverUrl: e.target.value })}
              placeholder="https://..."
            />
            <p className="text-xs text-muted-foreground">Recommended: 1500x500px</p>
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-[#ff1493]" />
            <CardTitle>Social Links</CardTitle>
          </div>
          <CardDescription>Connect your social media profiles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="websiteUrl">Website</Label>
              <Input
                id="websiteUrl"
                value={formData.websiteUrl}
                onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagramUrl">Instagram</Label>
              <Input
                id="instagramUrl"
                value={formData.instagramUrl}
                onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                placeholder="https://instagram.com/..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="twitterUrl">Twitter / X</Label>
              <Input
                id="twitterUrl"
                value={formData.twitterUrl}
                onChange={(e) => setFormData({ ...formData, twitterUrl: e.target.value })}
                placeholder="https://twitter.com/..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="youtubeUrl">YouTube</Label>
              <Input
                id="youtubeUrl"
                value={formData.youtubeUrl}
                onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                placeholder="https://youtube.com/..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="spotifyUrl">Spotify</Label>
              <Input
                id="spotifyUrl"
                value={formData.spotifyUrl}
                onChange={(e) => setFormData({ ...formData, spotifyUrl: e.target.value })}
                placeholder="https://open.spotify.com/..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="soundcloudUrl">SoundCloud</Label>
              <Input
                id="soundcloudUrl"
                value={formData.soundcloudUrl}
                onChange={(e) => setFormData({ ...formData, soundcloudUrl: e.target.value })}
                placeholder="https://soundcloud.com/..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Button type="submit" disabled={loading} className="w-full sm:w-auto" size="lg">
        {loading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Save className="h-4 w-4 mr-2" />
        )}
        Save Changes
      </Button>
    </form>
  )
}
