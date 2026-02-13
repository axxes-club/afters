"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
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
  X,
  GripVertical,
  Clock,
} from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { ArtistAutocomplete } from "@/components/dashboard/ArtistAutocomplete"

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
  const [expandedSections, setExpandedSections] = useState({
    about: true,
    lineup: false,
    faqs: false,
    gallery: false,
  })

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
          icon={<FileText className="w-5 h-5 text-[#ff1493]" />}
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
              className="bg-black border-white/10 font-mono text-sm placeholder:text-white/20 focus:border-[#ff1493]/30 focus:ring-0 resize-none"
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
          <div className="p-4 border border-t-0 border-white/10 bg-black">
            <div className="text-center py-8 text-white/30">
              <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="font-mono text-sm mb-2">Gallery coming soon</p>
              <p className="text-[10px] text-white/20">Upload photos to showcase your event</p>
            </div>
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
          className="px-6 py-3 bg-[#ff1493] text-black font-mono font-bold text-sm tracking-wider hover:bg-[#ff1493]/90 disabled:opacity-50 transition-all flex items-center gap-2"
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
