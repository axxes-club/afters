"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Save, Palette, Globe, Building2 } from "lucide-react"
import { URL_PREFIXES } from "@/lib/constants"
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
  tiktokUrl?: string | null
  bandcampUrl?: string | null
  beatportUrl?: string | null
  appleMusicUrl?: string | null
  accentColor?: string | null
  headerStyle?: string | null
  showPlayCount?: boolean
  showUpcoming?: boolean
  tagline?: string | null
  location?: string | null
  bookingEmail?: string | null
  pressKitUrl?: string | null
  riderUrl?: string | null
  label?: string | null
  management?: string | null
  agency?: string | null
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
    tagline: profile?.tagline || "",
    location: profile?.location || "",
    // Socials
    spotifyUrl: profile?.spotifyUrl || "",
    soundcloudUrl: profile?.soundcloudUrl || "",
    instagramUrl: profile?.instagramUrl || "",
    twitterUrl: profile?.twitterUrl || "",
    websiteUrl: profile?.websiteUrl || "",
    youtubeUrl: profile?.youtubeUrl || "",
    tiktokUrl: profile?.tiktokUrl || "",
    bandcampUrl: profile?.bandcampUrl || "",
    beatportUrl: profile?.beatportUrl || "",
    appleMusicUrl: profile?.appleMusicUrl || "",
    // Customization
    accentColor: profile?.accentColor || "#ff1493",
    headerStyle: profile?.headerStyle || "default",
    showPlayCount: profile?.showPlayCount ?? true,
    showUpcoming: profile?.showUpcoming ?? true,
    // Professional
    bookingEmail: profile?.bookingEmail || "",
    pressKitUrl: profile?.pressKitUrl || "",
    riderUrl: profile?.riderUrl || "",
    label: profile?.label || "",
    management: profile?.management || "",
    agency: profile?.agency || "",
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
    } catch {
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
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>{profile ? "Edit Artist Profile" : "Create Artist Profile"}</CardTitle>
            <CardDescription>
              {profile 
                ? "Update your artist information."
                : "Set up your artist profile to submit tracks to AFTERS RADIO."
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                    {URL_PREFIXES.artist}
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
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder="Your signature quote or catchphrase"
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">A short phrase that defines you (max 100 chars)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell your story..."
                rows={5}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="genres">Genres</Label>
                <Input
                  id="genres"
                  value={formData.genres}
                  onChange={(e) => setFormData({ ...formData, genres: e.target.value })}
                  placeholder="House, Techno, Bass"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Los Angeles, CA"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customization */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              <CardTitle>Customization</CardTitle>
            </div>
            <CardDescription>Personalize how your profile looks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="accentColor">Accent Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    id="accentColor"
                    value={formData.accentColor}
                    onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                    className="w-16 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={formData.accentColor}
                    onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                    placeholder="#ff1493"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="headerStyle">Header Style</Label>
                <Select value={formData.headerStyle} onValueChange={(v) => setFormData({ ...formData, headerStyle: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="gradient">Gradient</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="bold">Bold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Play Count</Label>
                  <p className="text-xs text-muted-foreground">Display how many times your tracks have been played</p>
                </div>
                <Switch
                  checked={formData.showPlayCount}
                  onCheckedChange={(v) => setFormData({ ...formData, showPlayCount: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Upcoming Events</Label>
                  <p className="text-xs text-muted-foreground">Display upcoming events on your profile</p>
                </div>
                <Switch
                  checked={formData.showUpcoming}
                  onCheckedChange={(v) => setFormData({ ...formData, showUpcoming: v })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social Links */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <CardTitle>Social & Music Platforms</CardTitle>
            </div>
            <CardDescription>Connect your profiles across the web</CardDescription>
          </CardHeader>
          <CardContent>
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
                <Label htmlFor="appleMusicUrl">Apple Music</Label>
                <Input
                  id="appleMusicUrl"
                  value={formData.appleMusicUrl}
                  onChange={(e) => setFormData({ ...formData, appleMusicUrl: e.target.value })}
                  placeholder="https://music.apple.com/artist/..."
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
                <Label htmlFor="bandcampUrl">Bandcamp</Label>
                <Input
                  id="bandcampUrl"
                  value={formData.bandcampUrl}
                  onChange={(e) => setFormData({ ...formData, bandcampUrl: e.target.value })}
                  placeholder="https://yourname.bandcamp.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="beatportUrl">Beatport</Label>
                <Input
                  id="beatportUrl"
                  value={formData.beatportUrl}
                  onChange={(e) => setFormData({ ...formData, beatportUrl: e.target.value })}
                  placeholder="https://www.beatport.com/artist/..."
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
                <Label htmlFor="instagramUrl">Instagram</Label>
                <Input
                  id="instagramUrl"
                  value={formData.instagramUrl}
                  onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                  placeholder="https://instagram.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tiktokUrl">TikTok</Label>
                <Input
                  id="tiktokUrl"
                  value={formData.tiktokUrl}
                  onChange={(e) => setFormData({ ...formData, tiktokUrl: e.target.value })}
                  placeholder="https://tiktok.com/@..."
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
                <Label htmlFor="websiteUrl">Website</Label>
                <Input
                  id="websiteUrl"
                  value={formData.websiteUrl}
                  onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle>Professional</CardTitle>
            </div>
            <CardDescription>Business and booking information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bookingEmail">Booking Email</Label>
                <Input
                  id="bookingEmail"
                  type="email"
                  value={formData.bookingEmail}
                  onChange={(e) => setFormData({ ...formData, bookingEmail: e.target.value })}
                  placeholder="booking@yourname.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="label">Record Label</Label>
                <Input
                  id="label"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="Your label name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="management">Management</Label>
                <Input
                  id="management"
                  value={formData.management}
                  onChange={(e) => setFormData({ ...formData, management: e.target.value })}
                  placeholder="Management company"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agency">Booking Agency</Label>
                <Input
                  id="agency"
                  value={formData.agency}
                  onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
                  placeholder="Agency name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pressKitUrl">Press Kit URL</Label>
                <Input
                  id="pressKitUrl"
                  value={formData.pressKitUrl}
                  onChange={(e) => setFormData({ ...formData, pressKitUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="riderUrl">Tech Rider URL</Label>
                <Input
                  id="riderUrl"
                  value={formData.riderUrl}
                  onChange={(e) => setFormData({ ...formData, riderUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button type="submit" disabled={loading} className="w-full" size="lg">
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {profile ? "Save All Changes" : "Create Profile"}
        </Button>
      </form>
    </div>
  )
}
