"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  const t = useTranslations('settings')
  const tCommon = useTranslations('common')
  const tSocial = useTranslations('social')
  const tDashboard = useTranslations('dashboard')
  
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
      toast.error(t('failedToLoad'))
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
        toast.success(t('profileUpdated'))
      } else {
        const error = await res.json()
        toast.error(error.message || t('failedToUpdate'))
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error(t('failedToUpdate'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirmText !== "DELETE") {
      toast.error(t('pleaseTypeDelete'))
      return
    }

    setDeleting(true)

    try {
      const res = await fetch("/api/organizer/profile", {
        method: "DELETE",
      })

      if (res.ok) {
        toast.success(t('profileDeleted'))
        router.push("/")
      } else {
        const error = await res.json()
        toast.error(error.message || t('failedToDelete'))
      }
    } catch (error) {
      console.error("Error deleting account:", error)
      toast.error(t('failedToDelete'))
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
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <CardTitle>{t('profile')}</CardTitle>
          </div>
          <CardDescription>
            {t('profileDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">{t('displayName')} *</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t('displayNamePlaceholder')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">{t('profileUrl')}</Label>
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
                {t('profileUrlHint')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="artistType">{t('accountType')}</Label>
              <Select value={artistType} onValueChange={setArtistType}>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectAccountType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="organizer">{t('organizer')}</SelectItem>
                  <SelectItem value="artist">{t('artist')}</SelectItem>
                  <SelectItem value="personal">{t('personal')}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t('accountTypeHint')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">{t('bio')}</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={t('bioPlaceholder')}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logoUrl">
                {artistType?.toLowerCase() === 'personal' ? t('avatarUrl') : t('logoUrl')}
              </Label>
              <Input
                id="logoUrl"
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder={artistType?.toLowerCase() === 'personal' 
                  ? t('avatarUrlPlaceholder')
                  : t('logoUrlPlaceholder')}
              />
              <p className="text-xs text-muted-foreground">
                {artistType?.toLowerCase() === 'personal' 
                  ? t('avatarUrlHint')
                  : t('logoUrlHint')}
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <Label className="text-base font-semibold">{t('socialLinks')}</Label>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="instagramUrl" className="flex items-center gap-2">
                    <Instagram className="h-4 w-4" /> {tSocial('instagram')}
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
                    <Twitter className="h-4 w-4" /> {tSocial('twitter')}
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
                    <Music className="h-4 w-4" /> {tSocial('soundcloud')}
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
                    <Music className="h-4 w-4" /> {tSocial('spotify')}
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
                    <Youtube className="h-4 w-4" /> {tSocial('youtube')}
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
                    <Globe className="h-4 w-4" /> {tSocial('website')}
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
                  {tCommon('saving')}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {t('saveChanges')}
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
            <CardTitle>{t('connectedAccounts')}</CardTitle>
          </div>
          <CardDescription>
            {t('connectedAccountsDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <CreditCard className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">{tDashboard('stripeConnect')}</p>
                <p className="text-sm text-muted-foreground">{tDashboard('acceptPayments')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isStripeSetup ? "default" : "secondary"}>
                {isStripeSetup ? tCommon('connected') : tCommon('notConnected')}
              </Badge>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/settings/payouts">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  {tCommon('manage')}
                </Link>
              </Button>
            </div>
          </div>

          {!isStripeSetup && (
            <p className="text-sm text-muted-foreground">
              {tDashboard('connectStripeHint')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <div className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            <CardTitle className="text-red-600">{t('dangerZone')}</CardTitle>
          </div>
          <CardDescription>
            {t('dangerZoneDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-900 rounded-lg bg-red-50 dark:bg-red-950/20">
            <div>
              <p className="font-medium">{t('deleteOrganizerProfile')}</p>
              <p className="text-sm text-muted-foreground">
                {t('deleteProfileWarning')}
              </p>
            </div>
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">{t('deleteProfile')}</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('deleteConfirmTitle')}</DialogTitle>
                  <DialogDescription>
                    {t('deleteConfirmDescription')}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <p className="text-sm text-muted-foreground">
                    {t('deleteConfirmInstruction')}
                  </p>
                  <Input
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder={t('deleteConfirmPlaceholder')}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                    {tCommon('cancel')}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={deleting || deleteConfirmText !== "DELETE"}
                  >
                    {deleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {tCommon('deleting')}
                      </>
                    ) : (
                      t('deleteProfile')
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
