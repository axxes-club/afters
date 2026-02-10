"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Lock, Palette } from "lucide-react";
import Link from "next/link";
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
  const [ticketingType, setTicketingType] = useState<string>("AFTERS");
  
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

    // Filter out empty lineup entries
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
      ticketingType: ticketingType,
      externalTicketingUrl: formData.get("externalTicketingUrl") || null,
      // Underground features
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
        throw new Error(error.message || "Failed to create event");
      }

      const event = await res.json();
      toast.success("Event created! Now add ticket tiers.");
      router.push(`/dashboard/events/${event.id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Create Event</h1>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
            <CardDescription>
              Basic information about your event.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Event Flyer Upload */}
            <div className="space-y-2">
              <Label>Event Flyer</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Upload a poster or flyer for your event (recommended 3:4 ratio)
              </p>
              <FlyerUpload
                value={flyerUrl}
                onChange={setFlyerUrl}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., VOID — Warehouse Session"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Tell people what to expect..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startsAt">Start Date & Time *</Label>
                <Input
                  id="startsAt"
                  name="startsAt"
                  type="datetime-local"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endsAt">End Date & Time</Label>
                <Input id="endsAt" name="endsAt" type="datetime-local" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger>
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
              <Label htmlFor="ageRestriction">Age Restriction</Label>
              <Select value={ageRestriction} onValueChange={setAgeRestriction}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ages</SelectItem>
                  <SelectItem value="18">18+</SelectItem>
                  <SelectItem value="21">21+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Venue Section */}
        <Card>
          <CardHeader>
            <CardTitle>Venue</CardTitle>
            <CardDescription>
              Where is this event happening?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="venueName">Venue Name *</Label>
              <Input
                id="venueName"
                name="venueName"
                placeholder="e.g., The Warehouse"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="venueAddress">Venue Address *</Label>
              <Input
                id="venueAddress"
                name="venueAddress"
                placeholder="e.g., 123 Industrial Ave"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger>
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
                <Label htmlFor="state">State</Label>
                <Input id="state" name="state" placeholder="e.g., NY" />
              </div>
            </div>

            {/* Hidden Address Toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="hiddenAddress" className="cursor-pointer">
                    Hide Address Until Purchase
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Location will be revealed after ticket purchase
                  </p>
                </div>
              </div>
              <Switch
                id="hiddenAddress"
                checked={isAddressHidden}
                onCheckedChange={setIsAddressHidden}
              />
            </div>
          </CardContent>
        </Card>

        {/* Lineup Section */}
        <Card>
          <CardHeader>
            <CardTitle>Lineup</CardTitle>
            <CardDescription>
              Add artists, DJs, or performers (optional)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {lineup.map((artist, index) => (
              <div key={index} className="p-4 rounded-lg border space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Artist {index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeArtist(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input
                      value={artist.name}
                      onChange={(e) => updateArtist(index, "name", e.target.value)}
                      placeholder="Artist name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Input
                      value={artist.role}
                      onChange={(e) => updateArtist(index, "role", e.target.value)}
                      placeholder="e.g., Headliner, DJ, Live"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Image URL</Label>
                    <Input
                      value={artist.imageUrl}
                      onChange={(e) => updateArtist(index, "imageUrl", e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Social URL</Label>
                    <Input
                      value={artist.socialUrl}
                      onChange={(e) => updateArtist(index, "socialUrl", e.target.value)}
                      placeholder="Instagram/SoundCloud link"
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addArtist} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Artist
            </Button>
          </CardContent>
        </Card>

        {/* Page Style Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Page Style
            </CardTitle>
            <CardDescription>
              Customize how your event page looks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Theme</Label>
              <Select value={pageTheme} onValueChange={setPageTheme}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="underground">Underground</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Underground & Minimal themes use dark backgrounds with your accent color
              </p>
            </div>

            {pageTheme !== "default" && (
              <div className="space-y-2">
                <Label>Accent Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-12 h-12 rounded-lg cursor-pointer border-0"
                  />
                  <Input
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    placeholder="#ff1493"
                    className="max-w-[120px] font-mono"
                  />
                  <div className="flex gap-2">
                    {["#ff1493", "#00ff88", "#00d4ff", "#ff6b00", "#a855f7"].map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setAccentColor(color)}
                        className="w-8 h-8 rounded-full border-2 border-transparent hover:border-white/50 transition-colors"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ticketing Section */}
        <Card>
          <CardHeader>
            <CardTitle>Ticketing</CardTitle>
            <CardDescription>
              How will tickets be sold?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ticketingType">Ticketing Platform</Label>
              <Select value={ticketingType} onValueChange={setTicketingType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AFTERS">Afters Direct (Default)</SelectItem>
                  <SelectItem value="POSH">Posh.vip</SelectItem>
                  <SelectItem value="DICE">Dice.fm</SelectItem>
                  <SelectItem value="TICKETMASTER">Ticketmaster</SelectItem>
                  <SelectItem value="LIVENATION">Live Nation</SelectItem>
                  <SelectItem value="EVENTBRITE">Eventbrite</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {ticketingType !== "AFTERS" && (
              <div className="space-y-2">
                <Label htmlFor="externalTicketingUrl">External Ticket URL</Label>
                <Input
                  id="externalTicketingUrl"
                  name="externalTicketingUrl"
                  placeholder="https://posh.vip/e/..."
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Creating..." : "Create Event"}
        </Button>
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
