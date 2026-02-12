"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Lock, Palette, Calendar, MapPin, Users, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { FlyerUpload } from "@/components/FlyerUpload";
import { AuthGuard } from "@/components/AuthGuard";

const US_CITIES = [
  "New York",
  "Brooklyn",
  "Charlotte",
  "Raleigh",
  "Los Angeles",
  "Miami",
  "Las Vegas",
  "Chicago",
  "Atlanta",
  "Houston",
  "Dallas",
  "Phoenix",
  "San Francisco",
  "Detroit",
  "Denver",
  "Seattle",
  "Portland",
  "Austin",
  "Nashville",
  "Philadelphia",
  "Boston",
  "Washington DC",
  "New Orleans",
];

interface LineupArtist {
  name: string;
  role: string;
  imageUrl: string;
  socialUrl: string;
}

function NewEventForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [flyerUrl, setFlyerUrl] = useState<string | null>(null);
  const [city, setCity] = useState<string>("");
  const [timezone, setTimezone] = useState<string>("America/New_York");
  const [ageRestriction, setAgeRestriction] = useState<string>("21");
  const [title, setTitle] = useState<string>("");

  // Underground features
  const [isAddressHidden, setIsAddressHidden] = useState(false);
  const [pageTheme, setPageTheme] = useState<string>("default");
  const [accentColor, setAccentColor] = useState<string>("#ff1493");
  const [lineup, setLineup] = useState<LineupArtist[]>([]);

  const addArtist = () => {
    setLineup([...lineup, { name: "", role: "", imageUrl: "", socialUrl: "" }]);
  };

  const removeArtist = (index: number) => {
    setLineup(lineup.filter((_, i) => i !== index));
  };

  const updateArtist = (index: number, field: keyof LineupArtist, value: string) => {
    const updated = [...lineup];
    updated[index][field] = value;
    setLineup(updated);
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!city) {
      toast.error("Please select a city");
      return;
    }

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const cleanLineup = lineup.filter(a => a.name.trim() !== "");

    const data = {
      title: formData.get("title"),
      description: formData.get("description"),
      startsAt: formData.get("startsAt"),
      endsAt: formData.get("endsAt") || null,
      timezone: timezone,
      venueName: formData.get("venueName"),
      venueAddress: formData.get("venueAddress"),
      city: city,
      state: formData.get("state"),
      ageRestriction: ageRestriction === "all" ? null : parseInt(ageRestriction),
      flyerUrl: flyerUrl,
      isAddressHidden,
      pageTheme,
      accentColor: pageTheme !== "default" ? accentColor : null,
      lineup: cleanLineup.length > 0 ? cleanLineup : null,
    };

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create party");
      }

      const event = await res.json();
      toast.success("Party created! Now add ticket tiers.");
      router.push(`/d/events/${event.id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  }

  const currentAccent = pageTheme !== "default" ? accentColor : "#ff1493";

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
        <Link
          href="/d/events"
          className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back to parties</span>
        </Link>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-display">
          <span className="text-gradient">CREATE</span>
          <span className="text-white"> EVENT</span>
        </h1>
        <p className="text-white/50 mt-2">Set up your party and start selling tickets</p>
      </div>

      <form onSubmit={onSubmit}>
        <div className="grid lg:grid-cols-[400px_1fr] gap-8">
          {/* Left Column - Flyer Preview */}
          <div
            className="lg:sticky lg:top-24 h-fit space-y-6 animate-fade-in-up"
            style={{ animationDelay: '0.2s', opacity: 0 }}
          >
            {/* Flyer Upload Card */}
            <div
              className="rounded-2xl border border-white/10 overflow-hidden transition-all duration-300"
              style={{
                boxShadow: flyerUrl ? `0 0 60px ${currentAccent}20` : 'none'
              }}
            >
              <div className="p-4 border-b border-white/10 bg-white/[0.02]">
                <h3 className="font-bold text-sm tracking-wider uppercase text-white/60">Party Flyer</h3>
              </div>
              <div className="p-4">
                <FlyerUpload
                  value={flyerUrl}
                  onChange={setFlyerUrl}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Live Preview Card */}
            {(title || flyerUrl) && (
              <div
                className="rounded-2xl border border-white/10 overflow-hidden animate-scale-in"
                style={{ backgroundColor: `${currentAccent}05` }}
              >
                <div className="p-4 border-b border-white/10">
                  <h3 className="font-bold text-sm tracking-wider uppercase text-white/60">Preview</h3>
                </div>
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    {flyerUrl && (
                      <div className="relative w-16 h-20 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                        <Image src={flyerUrl} alt="Preview" fill className="object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-lg truncate" style={{ color: title ? 'white' : 'rgba(255,255,255,0.3)' }}>
                        {title || 'Party Title'}
                      </h4>
                      <p className="text-sm text-white/40 truncate">
                        {city || 'City'} • {ageRestriction === 'all' ? 'All Ages' : `${ageRestriction}+`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Form */}
          <div className="space-y-6">
            {/* Party Details Section */}
            <section
              className="rounded-2xl border border-white/10 overflow-hidden animate-fade-in-up"
              style={{ animationDelay: '0.3s', opacity: 0 }}
            >
              <div className="p-5 border-b border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#ff1493]/20 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-[#ff1493]" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">Party Details</h2>
                    <p className="text-sm text-white/40">Basic information about your party</p>
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-white/70">Party Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="e.g., VOID — Warehouse Session"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-12 bg-white/[0.03] border-white/10 focus:border-[#ff1493] focus:ring-[#ff1493]/20 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-white/70">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Tell people what to expect..."
                    rows={4}
                    className="bg-white/[0.03] border-white/10 focus:border-[#ff1493] focus:ring-[#ff1493]/20 transition-all resize-none"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startsAt" className="text-white/70">Start Date & Time *</Label>
                    <Input
                      id="startsAt"
                      name="startsAt"
                      type="datetime-local"
                      required
                      className="h-12 bg-white/[0.03] border-white/10 focus:border-[#ff1493] focus:ring-[#ff1493]/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endsAt" className="text-white/70">End Date & Time</Label>
                    <Input
                      id="endsAt"
                      name="endsAt"
                      type="datetime-local"
                      className="h-12 bg-white/[0.03] border-white/10 focus:border-[#ff1493] focus:ring-[#ff1493]/20"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white/70">Timezone</Label>
                    <Select value={timezone} onValueChange={setTimezone}>
                      <SelectTrigger className="h-12 bg-white/[0.03] border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70">Age Restriction</Label>
                    <Select value={ageRestriction} onValueChange={setAgeRestriction}>
                      <SelectTrigger className="h-12 bg-white/[0.03] border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Ages</SelectItem>
                        <SelectItem value="18">18+</SelectItem>
                        <SelectItem value="21">21+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </section>

            {/* Venue Section */}
            <section
              className="rounded-2xl border border-white/10 overflow-hidden animate-fade-in-up"
              style={{ animationDelay: '0.4s', opacity: 0 }}
            >
              <div className="p-5 border-b border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#00d4ff]/20 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-[#00d4ff]" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">Venue</h2>
                    <p className="text-sm text-white/40">Where is this party happening?</p>
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="venueName" className="text-white/70">Venue Name *</Label>
                  <Input
                    id="venueName"
                    name="venueName"
                    placeholder="e.g., The Warehouse"
                    required
                    className="h-12 bg-white/[0.03] border-white/10 focus:border-[#00d4ff] focus:ring-[#00d4ff]/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="venueAddress" className="text-white/70">Venue Address *</Label>
                  <Input
                    id="venueAddress"
                    name="venueAddress"
                    placeholder="e.g., 123 Industrial Ave"
                    required
                    className="h-12 bg-white/[0.03] border-white/10 focus:border-[#00d4ff] focus:ring-[#00d4ff]/20"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white/70">City *</Label>
                    <Select value={city} onValueChange={setCity}>
                      <SelectTrigger className="h-12 bg-white/[0.03] border-white/10">
                        <SelectValue placeholder="Select city" />
                      </SelectTrigger>
                      <SelectContent>
                        {US_CITIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-white/70">State</Label>
                    <Input
                      id="state"
                      name="state"
                      placeholder="e.g., NY"
                      className="h-12 bg-white/[0.03] border-white/10 focus:border-[#00d4ff] focus:ring-[#00d4ff]/20"
                    />
                  </div>
                </div>

                {/* Hidden Address Toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#ff6b00]/20 flex items-center justify-center">
                      <Lock className="h-5 w-5 text-[#ff6b00]" />
                    </div>
                    <div>
                      <Label htmlFor="hiddenAddress" className="cursor-pointer font-medium">
                        Hide Address Until Purchase
                      </Label>
                      <p className="text-sm text-white/40">
                        Location revealed after ticket purchase
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="hiddenAddress"
                    checked={isAddressHidden}
                    onCheckedChange={setIsAddressHidden}
                  />
                </div>
              </div>
            </section>

            {/* Lineup Section */}
            <section
              className="rounded-2xl border border-white/10 overflow-hidden animate-fade-in-up"
              style={{ animationDelay: '0.5s', opacity: 0 }}
            >
              <div className="p-5 border-b border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#a855f7]/20 flex items-center justify-center">
                    <Users className="h-5 w-5 text-[#a855f7]" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">Lineup</h2>
                    <p className="text-sm text-white/40">Add artists, DJs, or performers (optional)</p>
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-4">
                {lineup.map((artist, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-4 animate-scale-in"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#a855f7]">
                        Artist {index + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeArtist(index)}
                        className="text-white/40 hover:text-red-400 hover:bg-red-400/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white/70">Name *</Label>
                        <Input
                          value={artist.name}
                          onChange={(e) => updateArtist(index, "name", e.target.value)}
                          placeholder="Artist name"
                          className="bg-white/[0.03] border-white/10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white/70">Role</Label>
                        <Input
                          value={artist.role}
                          onChange={(e) => updateArtist(index, "role", e.target.value)}
                          placeholder="e.g., Headliner, DJ"
                          className="bg-white/[0.03] border-white/10"
                        />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white/70">Image URL</Label>
                        <Input
                          value={artist.imageUrl}
                          onChange={(e) => updateArtist(index, "imageUrl", e.target.value)}
                          placeholder="https://..."
                          className="bg-white/[0.03] border-white/10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white/70">Social URL</Label>
                        <Input
                          value={artist.socialUrl}
                          onChange={(e) => updateArtist(index, "socialUrl", e.target.value)}
                          placeholder="Instagram/SoundCloud"
                          className="bg-white/[0.03] border-white/10"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addArtist}
                  className="w-full h-12 border-dashed border-white/20 hover:border-[#a855f7] hover:bg-[#a855f7]/10 transition-all"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Artist
                </Button>
              </div>
            </section>

            {/* Page Style Section */}
            <section
              className="rounded-2xl border border-white/10 overflow-hidden animate-fade-in-up"
              style={{ animationDelay: '0.6s', opacity: 0 }}
            >
              <div className="p-5 border-b border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#00ff88]/20 flex items-center justify-center">
                    <Palette className="h-5 w-5 text-[#00ff88]" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">Page Style</h2>
                    <p className="text-sm text-white/40">Customize your party page look</p>
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-5">
                <div className="space-y-2">
                  <Label className="text-white/70">Theme</Label>
                  <Select value={pageTheme} onValueChange={setPageTheme}>
                    <SelectTrigger className="h-12 bg-white/[0.03] border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="underground">Underground</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-white/40">
                    Underground & Minimal themes use dark backgrounds with your accent color
                  </p>
                </div>

                {pageTheme !== "default" && (
                  <div className="space-y-3 animate-fade-in">
                    <Label className="text-white/70">Accent Color</Label>
                    <div className="flex items-center gap-4">
                      <div
                        className="relative w-14 h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer"
                        style={{ borderColor: accentColor }}
                      >
                        <input
                          type="color"
                          value={accentColor}
                          onChange={(e) => setAccentColor(e.target.value)}
                          className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                        />
                        <div
                          className="absolute inset-0"
                          style={{ backgroundColor: accentColor }}
                        />
                      </div>
                      <Input
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        placeholder="#ff1493"
                        className="max-w-[120px] font-mono bg-white/[0.03] border-white/10"
                      />
                      <div className="flex gap-2">
                        {["#ff1493", "#00ff88", "#00d4ff", "#ff6b00", "#a855f7"].map(color => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setAccentColor(color)}
                            className="w-10 h-10 rounded-xl transition-all hover:scale-110"
                            style={{
                              backgroundColor: color,
                              boxShadow: accentColor === color ? `0 0 20px ${color}60` : 'none',
                              border: accentColor === color ? '2px solid white' : '2px solid transparent'
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Submit Button */}
            <div className="animate-fade-in-up" style={{ animationDelay: '0.7s', opacity: 0 }}>
              <Button
                type="submit"
                className="w-full h-14 text-lg font-bold btn-glow transition-all"
                style={{
                  backgroundColor: currentAccent,
                  '--accent-color': currentAccent
                } as React.CSSProperties}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Creating Party...
                  </span>
                ) : (
                  "Create Party"
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function NewEventPage() {
  return (
    <AuthGuard>
      <NewEventForm />
    </AuthGuard>
  );
}
