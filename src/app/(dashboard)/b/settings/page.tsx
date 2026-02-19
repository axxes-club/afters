"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Pencil, Shield, Save, Loader2, Globe, X, Check } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { URL_PREFIXES } from "@/lib/constants"

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
  _count?: { events: number }
}

interface User {
  id: string
  email: string
  firstName?: string | null
  lastName?: string | null
  imageUrl?: string | null
  role: string
  createdAt: string
  organizerProfile?: OrganizerProfile | null
}

export default function SettingsProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    displayName: "",
    slug: "",
    bio: "",
    logoUrl: "",
    coverUrl: "",
    genres: "",
    artistType: "",
    websiteUrl: "",
    instagramUrl: "",
    twitterUrl: "",
    youtubeUrl: "",
    spotifyUrl: "",
    soundcloudUrl: "",
  })

  useEffect(() => {
    fetch("/api/user/profile")
      .then((res) => res.json())
      .then((data) => {
        setUser(data)
        if (data.organizerProfile) {
          setFormData({
            displayName: data.organizerProfile.displayName || "",
            slug: data.organizerProfile.slug || "",
            bio: data.organizerProfile.bio || "",
            logoUrl: data.organizerProfile.logoUrl || "",
            coverUrl: data.organizerProfile.coverUrl || "",
            genres: data.organizerProfile.genres || "",
            artistType: data.organizerProfile.artistType || "",
            websiteUrl: data.organizerProfile.websiteUrl || "",
            instagramUrl: data.organizerProfile.instagramUrl || "",
            twitterUrl: data.organizerProfile.twitterUrl || "",
            youtubeUrl: data.organizerProfile.youtubeUrl || "",
            spotifyUrl: data.organizerProfile.spotifyUrl || "",
            soundcloudUrl: data.organizerProfile.soundcloudUrl || "",
          })
        }
        setLoading(false)
      })
      .catch(() => {
        toast.error("Failed to load profile")
        setLoading(false)
      })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/organizer/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        const updated = await res.json()
        setUser((prev) =>
          prev ? { ...prev, organizerProfile: { ...prev.organizerProfile, ...updated } } : prev
        )
        toast.success("Profile updated!")
        setEditing(false)
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to save")
      }
    } catch {
      toast.error("Something went wrong")
    }
    setSaving(false)
  }

  const generateSlug = () => {
    const slug = formData.displayName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
    setFormData({ ...formData, slug })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-white/40" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-white/40 font-mono">Failed to load profile</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-mono font-bold tracking-tight">PROFILE</h1>
        <p className="text-white/40 text-sm font-mono mt-1">Manage your account and organizer profile</p>
      </div>

      {/* Account Card */}
      <div className="border border-white/10 bg-white/[0.02]">
        <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between">
          <span className="text-[10px] font-mono text-white/40 tracking-widest">ACCOUNT</span>
          {user.role === "SUPERADMIN" && (
            <span className="text-[10px] font-mono px-2 py-0.5 bg-primary/10 text-primary">
              <Shield className="w-3 h-3 inline mr-1" />
              ADMIN
            </span>
          )}
        </div>
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="w-16 h-16 border border-white/10">
              <AvatarImage src={user.imageUrl || undefined} alt={user.firstName || "User"} />
              <AvatarFallback className="text-xl font-mono bg-white/5 text-white/60">
                {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-mono font-bold truncate">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-sm text-white/40 font-mono truncate">{user.email}</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 bg-white/[0.02] border border-white/5">
              <p className="text-[10px] font-mono text-white/30 tracking-widest mb-1">EMAIL</p>
              <p className="text-sm font-mono truncate">{user.email}</p>
            </div>
            <div className="p-4 bg-white/[0.02] border border-white/5">
              <p className="text-[10px] font-mono text-white/30 tracking-widest mb-1">MEMBER SINCE</p>
              <p className="text-sm font-mono">
                {new Date(user.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Organizer Profile */}
      {user.organizerProfile ? (
        <div className="border border-white/10 bg-white/[0.02]">
          <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between">
            <span className="text-[10px] font-mono text-white/40 tracking-widest">ORGANIZER PROFILE</span>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="text-[10px] font-mono text-primary hover:underline flex items-center gap-1"
              >
                <Pencil className="w-3 h-3" />
                EDIT
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditing(false)}
                  className="text-[10px] font-mono text-white/40 hover:text-white flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  CANCEL
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="text-[10px] font-mono text-primary hover:underline flex items-center gap-1"
                >
                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  SAVE
                </button>
              </div>
            )}
          </div>

          {!editing ? (
            // View Mode
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="w-14 h-14 border border-white/10">
                  <AvatarImage src={user.organizerProfile.logoUrl || undefined} />
                  <AvatarFallback className="text-xl font-mono bg-white/5 text-white/60">
                    {user.organizerProfile.displayName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h3 className="text-lg font-mono font-bold truncate">{user.organizerProfile.displayName}</h3>
                  <p className="text-sm text-white/40 font-mono">@{user.organizerProfile.slug}</p>
                </div>
              </div>

              {user.organizerProfile.bio && (
                <p className="text-sm text-white/60 mb-4 whitespace-pre-wrap">{user.organizerProfile.bio}</p>
              )}

              <div className="border border-white/10 p-4">
                <div className="flex items-center justify-between mb-2">
                  <Calendar className="w-4 h-4 text-white/30" />
                  <span className="text-[10px] font-mono text-white/30 tracking-widest">EVENTS</span>
                </div>
                <p className="text-2xl font-mono font-bold">{user.organizerProfile._count?.events || 0}</p>
              </div>
            </div>
          ) : (
            // Edit Mode
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border border-white/10">
                    <AvatarImage src={formData.logoUrl || undefined} />
                    <AvatarFallback className="text-2xl font-mono bg-white/5">
                      {formData.displayName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="logoUrl" className="text-xs font-mono text-white/40">
                      Logo URL
                    </Label>
                    <Input
                      id="logoUrl"
                      value={formData.logoUrl}
                      onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                      placeholder="https://..."
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="displayName" className="text-xs font-mono text-white/40">
                      Organizer Name *
                    </Label>
                    <Input
                      id="displayName"
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      placeholder="Your organizer name"
                      required
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug" className="text-xs font-mono text-white/40">
                      Profile URL *
                    </Label>
                    <div className="flex">
                      <div className="flex items-center px-3 bg-white/5 border border-r-0 border-white/10 text-xs text-white/40 whitespace-nowrap">
                        {URL_PREFIXES.organizer}
                      </div>
                      <Input
                        id="slug"
                        className="rounded-l-none bg-white/5 border-white/10"
                        value={formData.slug}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                          })
                        }
                        placeholder="your-org"
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={generateSlug}
                      className="text-[10px] font-mono text-primary hover:underline"
                    >
                      Generate from name
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-xs font-mono text-white/40">
                    Bio / Description
                  </Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell people about your events..."
                    rows={3}
                    className="bg-white/5 border-white/10 resize-none"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="artistType" className="text-xs font-mono text-white/40">
                      Type
                    </Label>
                    <Input
                      id="artistType"
                      value={formData.artistType}
                      onChange={(e) => setFormData({ ...formData, artistType: e.target.value })}
                      placeholder="Event Promoter, Nightclub, etc."
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="genres" className="text-xs font-mono text-white/40">
                      Genres
                    </Label>
                    <Input
                      id="genres"
                      value={formData.genres}
                      onChange={(e) => setFormData({ ...formData, genres: e.target.value })}
                      placeholder="House, Techno, Hip-Hop, etc."
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="w-4 h-4 text-primary" />
                  <span className="text-xs font-mono text-white/40 tracking-widest">SOCIAL LINKS</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="websiteUrl" className="text-xs font-mono text-white/40">
                      Website
                    </Label>
                    <Input
                      id="websiteUrl"
                      value={formData.websiteUrl}
                      onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                      placeholder="https://..."
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagramUrl" className="text-xs font-mono text-white/40">
                      Instagram
                    </Label>
                    <Input
                      id="instagramUrl"
                      value={formData.instagramUrl}
                      onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                      placeholder="https://instagram.com/..."
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twitterUrl" className="text-xs font-mono text-white/40">
                      Twitter / X
                    </Label>
                    <Input
                      id="twitterUrl"
                      value={formData.twitterUrl}
                      onChange={(e) => setFormData({ ...formData, twitterUrl: e.target.value })}
                      placeholder="https://twitter.com/..."
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="youtubeUrl" className="text-xs font-mono text-white/40">
                      YouTube
                    </Label>
                    <Input
                      id="youtubeUrl"
                      value={formData.youtubeUrl}
                      onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                      placeholder="https://youtube.com/..."
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="spotifyUrl" className="text-xs font-mono text-white/40">
                      Spotify
                    </Label>
                    <Input
                      id="spotifyUrl"
                      value={formData.spotifyUrl}
                      onChange={(e) => setFormData({ ...formData, spotifyUrl: e.target.value })}
                      placeholder="https://open.spotify.com/..."
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="soundcloudUrl" className="text-xs font-mono text-white/40">
                      SoundCloud
                    </Label>
                    <Input
                      id="soundcloudUrl"
                      value={formData.soundcloudUrl}
                      onChange={(e) => setFormData({ ...formData, soundcloudUrl: e.target.value })}
                      placeholder="https://soundcloud.com/..."
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="border border-dashed border-white/20 p-12 text-center">
          <p className="text-white/40 font-mono text-sm mb-4">No organizer profile</p>
          <Button asChild variant="outline" size="sm">
            <Link href="/b">Create Profile</Link>
          </Button>
        </div>
      )}

      {/* Danger Zone */}
      <div className="border border-red-500/20">
        <div className="px-4 py-2 border-b border-red-500/20">
          <span className="text-[10px] font-mono text-red-400/60 tracking-widest">DANGER ZONE</span>
        </div>
        <div className="p-4 flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-sm text-red-300">Delete Account</p>
            <p className="text-xs text-red-300/50">Permanently delete your account and all data</p>
          </div>
          <Button variant="outline" size="sm" disabled className="border-red-500/30 text-red-400 text-xs">
            DELETE
          </Button>
        </div>
      </div>
    </div>
  )
}
