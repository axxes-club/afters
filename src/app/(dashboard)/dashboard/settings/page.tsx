"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import {
  User,
  CreditCard,
  Trash2,
  ExternalLink,
  Save,
  Loader2,
  Instagram,
  Twitter,
  Music,
  Globe,
  Youtube,
} from "lucide-react"

interface OrganizerProfile {
  id: string
  displayName: string
  slug: string
  bio: string | null
  logoUrl: string | null
  coverUrl: string | null
  artistType: string | null
  genres: string | null
  instagramUrl: string | null
  twitterUrl: string | null
  soundcloudUrl: string | null
  youtubeUrl: string | null
  spotifyUrl: string | null
  websiteUrl: string | null
  stripeAccountId: string | null
  stripeOnboardingComplete: boolean
  stripeChargesEnabled: boolean
  stripePayoutsEnabled: boolean
}

export default function SettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<OrganizerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")

  // Form state
  const [displayName, setDisplayName] = useState("")
  const [slug, setSlug] = useState("")
  const [bio, setBio] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [artistType, setArtistType] = useState("")
  const [instagramUrl, setInstagramUrl] = useState("")
  const [twitterUrl, setTwitterUrl] = useState("")
  const [soundcloudUrl, setSoundcloudUrl] = useState("")
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [spotifyUrl, setSpotifyUrl] = useState("")
  const [websiteUrl, setWebsiteUrl] = useState("")

  useEffect(() => {
    fetchProfile()
  }, [])

  async function fetchProfile() {
    try {
      const res = await fetch("/api/organizer/profile")
      if (res.ok) {
        const data = await res.json()
        setProfile(data)
        // Populate form fields
        setDisplayName(data.displayName || "")
        setSlug(data.slug || "")
        setBio(data.bio || "")
        setLogoUrl(data.logoUrl || "")
        setArtistType(data.artistType || "")
        setInstagramUrl(data.instagramUrl || "")
        setTwitterUrl(data.twitterUrl || "")
        setSoundcloudUrl(data.soundcloudUrl || "")
        setYoutubeUrl(data.youtubeUrl || "")
        setSpotifyUrl(data.spotifyUrl || "")
        setWebsiteUrl(data.websiteUrl || "")
      } else if (res.status === 404) {
        router.push("/dashboard/onboarding")
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
      toast.error("Failed to load profile")
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch("/api/organizer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          slug,
          bio,
          logoUrl,
          artistType,
          instagramUrl,
          twitterUrl,
          soundcloudUrl,
          youtubeUrl,
          spotifyUrl,
          websiteUrl,
        }),
      })

      if (res.ok) {
        const updatedProfile = await res.json()
        setProfile(updatedProfile)
        toast.success("Profile updated successfully")
      } else {
        const error = await res.json()
        toast.error(error.message || "Failed to update profile")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirmText !== "DELETE") {
      toast.error("Please type DELETE to confirm")
      return
    }

    setDeleting(true)

    try {
      const res = await fetch("/api/organizer/profile", {
        method: "DELETE",
      })

      if (res.ok) {
        toast.success("Account deleted successfully")
        router.push("/")
      } else {
        const error = await res.json()
        toast.error(error.message || "Failed to delete account")
      }
    } catch (error) {
      console.error("Error deleting account:", error)
      toast.error("Failed to delete account")
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!profile) {
    return null
  }

  const isStripeSetup = profile.stripeChargesEnabled && profile.stripePayoutsEnabled

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your organizer profile and account settings</p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <CardTitle>Profile Information</CardTitle>
          </div>
          <CardDescription>
            Update your public organizer profile. This information appears on your public page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name *</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your artist or brand name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Profile URL</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">afters.xxx/o/</span>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="yourname"
                  pattern="^[a-z0-9-]+$"
                  title="Only lowercase letters, numbers, and hyphens"
                  className="max-w-[200px]"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Only lowercase letters, numbers, and hyphens are allowed.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="artistType">Account Type</Label>
              <Input
                id="artistType"
                value={artistType}
                onChange={(e) => setArtistType(e.target.value)}
                placeholder="DJ, Producer, Promoter, Venue, Personal..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell people about yourself..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logoUrl">
                {artistType?.toLowerCase() === 'personal' ? 'Avatar URL' : 'Logo URL'}
              </Label>
              <Input
                id="logoUrl"
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder={artistType?.toLowerCase() === 'personal' 
                  ? "https://example.com/avatar.png" 
                  : "https://example.com/logo.png"}
              />
              <p className="text-xs text-muted-foreground">
                {artistType?.toLowerCase() === 'personal' 
                  ? "Your profile picture" 
                  : "Your brand logo or profile image"}
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <Label className="text-base font-semibold">Social Links</Label>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="instagramUrl" className="flex items-center gap-2">
                    <Instagram className="h-4 w-4" /> Instagram
                  </Label>
                  <Input
                    id="instagramUrl"
                    type="url"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    placeholder="https://instagram.com/..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="twitterUrl" className="flex items-center gap-2">
                    <Twitter className="h-4 w-4" /> Twitter/X
                  </Label>
                  <Input
                    id="twitterUrl"
                    type="url"
                    value={twitterUrl}
                    onChange={(e) => setTwitterUrl(e.target.value)}
                    placeholder="https://twitter.com/..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="soundcloudUrl" className="flex items-center gap-2">
                    <Music className="h-4 w-4" /> SoundCloud
                  </Label>
                  <Input
                    id="soundcloudUrl"
                    type="url"
                    value={soundcloudUrl}
                    onChange={(e) => setSoundcloudUrl(e.target.value)}
                    placeholder="https://soundcloud.com/..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="spotifyUrl" className="flex items-center gap-2">
                    <Music className="h-4 w-4" /> Spotify
                  </Label>
                  <Input
                    id="spotifyUrl"
                    type="url"
                    value={spotifyUrl}
                    onChange={(e) => setSpotifyUrl(e.target.value)}
                    placeholder="https://open.spotify.com/artist/..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="youtubeUrl" className="flex items-center gap-2">
                    <Youtube className="h-4 w-4" /> YouTube
                  </Label>
                  <Input
                    id="youtubeUrl"
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://youtube.com/..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="websiteUrl" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" /> Website
                  </Label>
                  <Input
                    id="websiteUrl"
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://yoursite.com"
                  />
                </div>
              </div>
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Connected Accounts Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            <CardTitle>Connected Accounts</CardTitle>
          </div>
          <CardDescription>
            Manage your connected payment and social accounts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <CreditCard className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">Stripe Connect</p>
                <p className="text-sm text-muted-foreground">Accept payments for events</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isStripeSetup ? "default" : "secondary"}>
                {isStripeSetup ? "Connected" : "Not Connected"}
              </Badge>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/settings/payouts">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Manage
                </Link>
              </Button>
            </div>
          </div>

          {!isStripeSetup && (
            <p className="text-sm text-muted-foreground">
              Connect your Stripe account to start selling tickets and receiving payouts.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <div className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
          </div>
          <CardDescription>
            Irreversible actions that affect your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-900 rounded-lg bg-red-50 dark:bg-red-950/20">
            <div>
              <p className="font-medium">Delete Organizer Profile</p>
              <p className="text-sm text-muted-foreground">
                This will delete all your events and data. This action cannot be undone.
              </p>
            </div>
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">Delete Profile</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Are you absolutely sure?</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. This will permanently delete your organizer
                    profile, all events, and associated data.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <p className="text-sm text-muted-foreground">
                    To confirm, type <span className="font-mono font-bold">DELETE</span> below:
                  </p>
                  <Input
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Type DELETE to confirm"
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={deleting || deleteConfirmText !== "DELETE"}
                  >
                    {deleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Delete Profile"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
