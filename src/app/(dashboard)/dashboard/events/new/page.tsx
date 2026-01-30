"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { ArrowLeft } from "lucide-react";
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
];

function NewEventForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [flyerUrl, setFlyerUrl] = useState<string | null>(null);
  const [city, setCity] = useState<string>("");
  const [timezone, setTimezone] = useState<string>("America/New_York");
  const [ageRestriction, setAgeRestriction] = useState<string>("all");
  const [ticketingType, setTicketingType] = useState<string>("AFTERS");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    console.log("Form submitted");

    if (!city) {
      toast.error("Please select a city");
      return;
    }

    setLoading(true);

    const formData = new FormData(e.currentTarget);

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
      ageRestriction: ageRestriction === "all" ? null : ageRestriction,
      flyerUrl: flyerUrl,
      ticketingType: ticketingType,
      externalTicketingUrl: formData.get("externalTicketingUrl") || null,
    };

    console.log("Event data:", data);

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      console.log("API response status:", res.status);

      if (!res.ok) {
        const error = await res.json();
        console.error("API error:", error);
        throw new Error(error.message || "Failed to create event");
      }

      const event = await res.json();
      console.log("Event created:", event);
      toast.success("Event created! Now add ticket tiers.");
      router.push(`/dashboard/events/${event.id}`);
    } catch (error) {
      console.error("Error creating event:", error);
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

      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
          <CardDescription>
            Fill in the basic information about your event.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
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
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., Summer Nights Rooftop Party"
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
                <Label htmlFor="startsAt">Start Date & Time</Label>
                <Input
                  id="startsAt"
                  name="startsAt"
                  type="datetime-local"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endsAt">End Date & Time (optional)</Label>
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
                  <SelectItem value="America/Los_Angeles">
                    Pacific Time
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="venueName">Venue Name</Label>
              <Input
                id="venueName"
                name="venueName"
                placeholder="e.g., Skyline Rooftop"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="venueAddress">Venue Address</Label>
              <Input
                id="venueAddress"
                name="venueAddress"
                placeholder="e.g., 123 Main St"
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

            <div className="space-y-2">
              <Label htmlFor="ageRestriction">Age Restriction</Label>
              <Select value={ageRestriction} onValueChange={setAgeRestriction}>
                <SelectTrigger>
                  <SelectValue placeholder="All ages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ages</SelectItem>
                  <SelectItem value="18">18+</SelectItem>
                  <SelectItem value="21">21+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4 border-t pt-6">
              <h3 className="font-semibold">Ticketing</h3>
              <div className="space-y-2">
                <Label htmlFor="ticketingType">Ticketing Platform</Label>
                <Select value={ticketingType} onValueChange={setTicketingType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AFTERS">
                      Afters Direct (Default)
                    </SelectItem>
                    <SelectItem value="POSH">Posh.vip</SelectItem>
                    <SelectItem value="DICE">Dice.fm</SelectItem>
                    <SelectItem value="TICKETMASTER">Ticketmaster</SelectItem>
                    <SelectItem value="LIVENATION">Live Nation</SelectItem>
                    <SelectItem value="EVENTBRITE">Eventbrite</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="externalTicketingUrl">
                  External Ticketing URL (Optional)
                </Label>
                <Input
                  id="externalTicketingUrl"
                  name="externalTicketingUrl"
                  placeholder="https://posh.vip/e/..."
                />
                <p className="text-xs text-muted-foreground">
                  If using a third-party platform, provide the link here.
                </p>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create Event"}
            </Button>
          </form>
        </CardContent>
      </Card>
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
