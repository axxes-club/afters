"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"
import Image from "next/image"
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  FileText,
  HelpCircle,
  Users,
  Loader2,
  Check,
  GripVertical,
  Clock,
  Upload,
} from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { ArtistAutocomplete } from "@/components/dashboard/ArtistAutocomplete"
import { useUploadThing } from "@/lib/uploadthing-client"

interface FAQ {
  question: string
  answer: string
}

interface LineupArtist {
  name: string
  role: string
  imageUrl: string
  socialUrl: string
  showtime?: string
  showShowtime?: boolean
}

interface PastArtist {
  name: string
  role?: string
  imageUrl?: string
  socialUrl?: string
  usedCount: number
  lastUsedAt: string
}

interface EventDetailsTabProps {
  eventId: string
  initialAbout?: string
  initialFaqs?: FAQ[]
  initialLineup?: LineupArtist[]
  initialGallery?: string[]
}

export function EventDetailsTab({
  eventId,
  initialAbout = "",
  initialFaqs = [],
  initialLineup = [],
  initialGallery = [],
}: EventDetailsTabProps) {
  const [about, setAbout] = useState(initialAbout)
  const [faqs, setFaqs] = useState<FAQ[]>(initialFaqs.length > 0 ? initialFaqs : [])
  const [lineup, setLineup] = useState<LineupArtist[]>(
    initialLineup.length > 0 ? initialLineup : []
  )
  const [gallery, setGallery] = useState<string[]>(initialGallery)
  const [saving, setSaving] = useState(false)
  const [uploadingGallery, setUploadingGallery] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    about: true,
    lineup: false,
    faqs: false,
    gallery: false,
  })

  // Gallery upload hook
  const { startUpload, isUploading } = useUploadThing("eventGallery", {
    onClientUploadComplete: (res) => {
      if (res) {
        const newUrls = res.map((file) => file.url)
        setGallery((prev) => [...prev, ...newUrls])
        toast.success(`${res.length} image${res.length > 1 ? "s" : ""} uploaded!`)
      }
      setUploadingGallery(false)
    },
    onUploadError: (error) => {
      toast.error(error.message || "Failed to upload images")
      setUploadingGallery(false)
    },
  })

  const handleGalleryUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files || files.length === 0) return

      const fileArray = Array.from(files)

      // Check max 10 total images
      if (gallery.length + fileArray.length > 10) {
        toast.error(`Maximum 10 images allowed. You can add ${10 - gallery.length} more.`)
        return
      }

      setUploadingGallery(true)
      await startUpload(fileArray)

      // Reset input
      e.target.value = ""
    },
    [gallery.length, startUpload]
  )

  const removeGalleryImage = (index: number) => {
    setGallery((prev) => prev.filter((_, i) => i !== index))
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  // Lineup management
  const addArtist = () => {
    setLineup([...lineup, { name: "", role: "", imageUrl: "", socialUrl: "", showtime: "", showShowtime: true }])
  }

  const removeArtist = (index: number) => {
    setLineup(lineup.filter((_, i) => i !== index))
  }

  const updateArtist = (index: number, field: keyof LineupArtist, value: string | boolean) => {
    setLineup(lineup.map((artist, i) =>
      i === index ? { ...artist, [field]: value } : artist
    ))
  }

  const handleSelectPastArtist = (index: number, pastArtist: PastArtist) => {
    setLineup(lineup.map((artist, i) =>
      i === index ? {
        ...artist,
        name: pastArtist.name,
        role: pastArtist.role || artist.role,
        imageUrl: pastArtist.imageUrl || artist.imageUrl,
        socialUrl: pastArtist.socialUrl || artist.socialUrl,
      } : artist
    ))
  }

  // FAQ management
  const addFaq = () => {
    setFaqs([...faqs, { question: "", answer: "" }])
  }

  const removeFaq = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index))
  }

  const updateFaq = (index: number, field: "question" | "answer", value: string) => {
    setFaqs(faqs.map((faq, i) =>
      i === index ? { ...faq, [field]: value } : faq
    ))
  }

  // Save all changes
  const handleSave = async () => {
    setSaving(true)
    try {
      const cleanLineup = lineup.filter(a => a.name.trim() !== "")
      const cleanFaqs = faqs.filter(f => f.question.trim() !== "" && f.answer.trim() !== "")

      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          about: about.trim() || null,
          faqs: cleanFaqs.length > 0 ? cleanFaqs : null,
          lineup: cleanLineup.length > 0 ? cleanLineup : null,
          gallery: gallery.length > 0 ? gallery : null,
        }),
      })

      if (res.ok) {
        toast.success("Details saved!")
      } else {
        const data = await res.json()
        toast.error(data.message || "Failed to save")
      }
    } catch {
      toast.error("Failed to save details")
    } finally {
      setSaving(false)
    }
  }

  const SectionHeader = ({
    icon,
    title,
    subtitle,
    sectionKey,
    color = "#ff1493",
    count,
  }: {
    icon: React.ReactNode
    title: string
    subtitle: string
    sectionKey: keyof typeof expandedSections
    color?: string
    count?: number
  }) => (
    <button
      onClick={() => toggleSection(sectionKey)}
      className="w-full flex items-center justify-between p-4 border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 flex items-center justify-center"
          style={{ backgroundColor: `${color}15`, borderColor: `${color}30` }}
        >
          {icon}
        </div>
        <div className="text-left">
          <div className="flex items-center gap-2">
            <h3 className="font-mono font-bold text-sm tracking-wide">{title}</h3>
            {count !== undefined && count > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-white/10 text-white/60">
                {count}
              </span>
            )}
          </div>
          <p className="text-[10px] font-mono text-white/40">{subtitle}</p>
        </div>
      </div>
      {expandedSections[sectionKey] ? (
        <ChevronUp className="w-5 h-5 text-white/40" />
      ) : (
        <ChevronDown className="w-5 h-5 text-white/40" />
      )}
    </button>
  )

  return (
    <div className="space-y-4">
      {/* About Section */}
      <div>
        <SectionHeader
          icon={<FileText className="w-5 h-5 text-primary" />}
          title="ABOUT"
          subtitle="Event description and details"
          sectionKey="about"
          count={about.length > 0 ? 1 : undefined}
        />
        {expandedSections.about && (
          <div className="p-4 border border-t-0 border-white/10 bg-black space-y-4">
            <Textarea
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder="Tell attendees about your event. What makes it special? What can they expect?"
              rows={6}
              className="bg-black border-white/10 font-mono text-sm placeholder:text-white/20 focus:border-primary/30 focus:ring-0 resize-none"
            />
            <p className="text-[10px] text-white/30 font-mono">
              {about.length} characters
            </p>
          </div>
        )}
      </div>

      {/* Lineup Section */}
      <div>
        <SectionHeader
          icon={<Users className="w-5 h-5 text-cyan-400" />}
          title="LINEUP"
          subtitle="Artists, DJs, and performers"
          sectionKey="lineup"
          color="#00d4ff"
          count={lineup.filter(a => a.name.trim()).length}
        />
        {expandedSections.lineup && (
          <div className="p-4 border border-t-0 border-white/10 bg-black space-y-4">
            {lineup.length === 0 ? (
              <div className="text-center py-8 text-white/30">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="font-mono text-sm">No artists added yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {lineup.map((artist, index) => (
                  <div key={index} className="border border-white/10 bg-white/[0.02]">
                    <div className="p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <GripVertical className="w-4 h-4 text-white/20 flex-shrink-0" />
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <ArtistAutocomplete
                            value={artist.name}
                            onChange={(v) => updateArtist(index, "name", v)}
                            onSelectArtist={(pa) => handleSelectPastArtist(index, pa)}
                            placeholder="Artist name"
                          />
                          <Input
                            value={artist.role}
                            onChange={(e) => updateArtist(index, "role", e.target.value)}
                            placeholder="Role (DJ, Producer...)"
                            className="h-10 bg-black border-white/10 font-mono text-sm"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeArtist(index)}
                          className="p-2 text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-colors flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Showtime */}
                      <div className="flex items-center gap-3 pl-7">
                        <div className="flex-1 flex items-center gap-3">
                          <Clock className="w-4 h-4 text-white/20" />
                          <Input
                            type="time"
                            value={artist.showtime || ""}
                            onChange={(e) => updateArtist(index, "showtime", e.target.value)}
                            className="h-8 w-32 bg-black border-white/10 font-mono text-sm"
                          />
                          <label className="flex items-center gap-2 text-xs font-mono text-white/40">
                            <Switch
                              checked={artist.showShowtime !== false}
                              onCheckedChange={(v) => updateArtist(index, "showShowtime", v)}
                            />
                            Show time
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={addArtist}
              className="w-full h-12 border border-dashed border-white/10 text-white/40 hover:text-white hover:border-white/30 flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="font-mono text-sm">Add artist</span>
            </button>
          </div>
        )}
      </div>

      {/* FAQs Section */}
      <div>
        <SectionHeader
          icon={<HelpCircle className="w-5 h-5 text-orange-400" />}
          title="FAQs"
          subtitle="Frequently asked questions"
          sectionKey="faqs"
          color="#ff6b00"
          count={faqs.filter(f => f.question.trim()).length}
        />
        {expandedSections.faqs && (
          <div className="p-4 border border-t-0 border-white/10 bg-black space-y-4">
            {faqs.length === 0 ? (
              <div className="text-center py-8 text-white/30">
                <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="font-mono text-sm">No FAQs added yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {faqs.map((faq, index) => (
                  <div key={index} className="border border-white/10 bg-white/[0.02] p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="text-[10px] font-mono text-orange-400 mt-2">Q{index + 1}</span>
                      <div className="flex-1 space-y-3">
                        <Input
                          value={faq.question}
                          onChange={(e) => updateFaq(index, "question", e.target.value)}
                          placeholder="Question..."
                          className="h-10 bg-black border-white/10 font-mono text-sm"
                        />
                        <Textarea
                          value={faq.answer}
                          onChange={(e) => updateFaq(index, "answer", e.target.value)}
                          placeholder="Answer..."
                          rows={2}
                          className="bg-black border-white/10 font-mono text-sm resize-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFaq(index)}
                        className="p-2 text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={addFaq}
              className="w-full h-12 border border-dashed border-white/10 text-white/40 hover:text-white hover:border-white/30 flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="font-mono text-sm">Add FAQ</span>
            </button>
          </div>
        )}
      </div>

      {/* Gallery Section */}
      <div>
        <SectionHeader
          icon={<ImageIcon className="w-5 h-5 text-purple-400" />}
          title="GALLERY"
          subtitle="Event photos and media"
          sectionKey="gallery"
          color="#a855f7"
          count={gallery.length}
        />
        {expandedSections.gallery && (
          <div className="p-4 border border-t-0 border-white/10 bg-black space-y-4">
            {/* Gallery Grid */}
            {gallery.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {gallery.map((url, index) => (
                  <div
                    key={index}
                    className="relative aspect-square group border border-white/10 bg-white/5 overflow-hidden"
                  >
                    <Image
                      src={url}
                      alt={`Gallery image ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(index)}
                        className="p-2 bg-red-500/80 hover:bg-red-500 text-white transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] font-mono text-white/80">
                        {index + 1} / {gallery.length}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Area */}
            {gallery.length < 10 && (
              <label
                className={`
                  w-full h-32 border-2 border-dashed border-white/10
                  hover:border-purple-400/50 hover:bg-purple-400/5
                  flex flex-col items-center justify-center gap-2
                  transition-all cursor-pointer
                  ${uploadingGallery || isUploading ? "opacity-50 pointer-events-none" : ""}
                `}
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGalleryUpload}
                  className="hidden"
                  disabled={uploadingGallery || isUploading}
                />
                {uploadingGallery || isUploading ? (
                  <>
                    <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                    <span className="font-mono text-sm text-white/40">Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-white/30" />
                    <span className="font-mono text-sm text-white/40">
                      Click to upload images
                    </span>
                    <span className="text-[10px] font-mono text-white/20">
                      Up to {10 - gallery.length} more • Max 4MB each
                    </span>
                  </>
                )}
              </label>
            )}

            {/* Gallery Info */}
            {gallery.length > 0 && (
              <p className="text-[10px] font-mono text-white/30">
                {gallery.length} of 10 images • Drag to reorder (coming soon)
              </p>
            )}

            {gallery.length === 0 && !uploadingGallery && !isUploading && (
              <p className="text-center text-[10px] text-white/20 font-mono py-2">
                Add photos to showcase your event venue, past events, or vibes
              </p>
            )}
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <p className="text-[10px] font-mono text-white/30">
          Changes will be applied to your public event page
        </p>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-primary text-black font-mono font-bold text-sm tracking-wider hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              SAVING...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              SAVE DETAILS
            </>
          )}
        </button>
      </div>
    </div>
  )
}
