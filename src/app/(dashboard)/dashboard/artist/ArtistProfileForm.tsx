"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface ArtistProfile {
  id: string
  artistName: string
  slug: string
  bio?: string | null
  avatarUrl?: string | null
  coverUrl?: string | null
  genres?: string | null
  spotifyUrl?: string | null
  soundcloudUrl?: string | null
  instagramUrl?: string | null
  twitterUrl?: string | null
  websiteUrl?: string | null
  youtubeUrl?: string | null
}

interface Props {
  profile: ArtistProfile | null
}

export function ArtistProfileForm({ profile }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    artistName: profile?.artistName || "",
    slug: profile?.slug || "",
    bio: profile?.bio || "",
    genres: profile?.genres || "",
    spotifyUrl: profile?.spotifyUrl || "",
    soundcloudUrl: profile?.soundcloudUrl || "",
    instagramUrl: profile?.instagramUrl || "",
    twitterUrl: profile?.twitterUrl || "",
    websiteUrl: profile?.websiteUrl || "",
    youtubeUrl: profile?.youtubeUrl || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/artist/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      const data = await res.json()
      
      if (data.success) {
        toast.success(profile ? "Profile updated!" : "Artist profile created!")
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
    const slug = formData.artistName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
    setFormData({ ...formData, slug })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{profile ? "Edit Artist Profile" : "Create Artist Profile"}</CardTitle>
        <CardDescription>
          {profile 
            ? "Update your artist information and social links."
            : "Set up your artist profile to submit tracks to AFTERS RADIO."
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="artistName">Artist / DJ Name *</Label>
              <Input
                id="artistName"
                value={formData.artistName}
                onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
                placeholder="Your artist name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Profile URL *</Label>
              <div className="flex gap-2">
                <div className="flex items-center px-3 bg-muted rounded-l-md border border-r-0 text-sm text-muted-foreground">
                  afters.xxx/a/
                </div>
                <Input
                  id="slug"
                  className="rounded-l-none"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                  placeholder="your-name"
                  required
                />
              </div>
              <Button type="button" variant="link" size="sm" className="p-0 h-auto" onClick={generateSlug}>
                Generate from name
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell us about yourself..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="genres">Genres</Label>
            <Input
              id="genres"
              value={formData.genres}
              onChange={(e) => setFormData({ ...formData, genres: e.target.value })}
              placeholder="House, Techno, Bass (comma separated)"
            />
          </div>

          <div className="border-t pt-6">
            <h4 className="font-medium mb-4">Social Links</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="spotifyUrl">Spotify</Label>
                <Input
                  id="spotifyUrl"
                  value={formData.spotifyUrl}
                  onChange={(e) => setFormData({ ...formData, spotifyUrl: e.target.value })}
                  placeholder="https://open.spotify.com/artist/..."
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
                <Label htmlFor="twitterUrl">Twitter</Label>
                <Input
                  id="twitterUrl"
                  value={formData.twitterUrl}
                  onChange={(e) => setFormData({ ...formData, twitterUrl: e.target.value })}
                  placeholder="https://twitter.com/..."
                />
              </div>
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
                <Label htmlFor="youtubeUrl">YouTube</Label>
                <Input
                  id="youtubeUrl"
                  value={formData.youtubeUrl}
                  onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                  placeholder="https://youtube.com/..."
                />
              </div>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {profile ? "Save Changes" : "Create Profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
