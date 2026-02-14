"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { URL_PREFIXES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Sparkles, ArrowRight, Zap, PartyPopper, Bot } from "lucide-react";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9\s-]/g, "") // Remove invalid chars
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .replace(/^-|-$/g, "") // Remove leading/trailing hyphens
    .slice(0, 30); // Limit length
}

export default function OnboardingPage() {
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"welcome" | "profile">("welcome");
  const [slug, setSlug] = useState("");
  const [slugError, setSlugError] = useState("");
  const t = useTranslations("onboarding");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");

  // Generate initial slug from user's name
  useEffect(() => {
    if (user?.firstName) {
      const initialSlug = generateSlug(user.firstName);
      setSlug(initialSlug || "my-profile");
    } else if (user?.fullName) {
      const initialSlug = generateSlug(user.fullName);
      setSlug(initialSlug || "my-profile");
    }
  }, [user?.firstName, user?.fullName]);

  const handleSlugChange = (value: string) => {
    // Auto-format as user types
    const formatted = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setSlug(formatted);

    if (formatted && !/^[a-z0-9-]+$/.test(formatted)) {
      setSlugError("Only lowercase letters, numbers, and hyphens allowed");
    } else if (formatted.length < 2) {
      setSlugError("Must be at least 2 characters");
    } else {
      setSlugError("");
    }
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Validate slug before submitting
    if (!slug || slug.length < 2) {
      setSlugError("Profile URL is required and must be at least 2 characters");
      return;
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      setSlugError("Only lowercase letters, numbers, and hyphens allowed");
      return;
    }

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const displayName = formData.get("displayName") as string;
    const bio = formData.get("bio") as string;

    try {
      // All users are now organizers by default
      const res = await fetch("/api/organizer/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, slug, bio }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || data.message || tErrors("generic"));
      }

      toast.success(t("profileCreated"));
      router.push("/d");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tErrors("generic"));
    } finally {
      setLoading(false);
    }
  }

  // Welcome step - hype them up!
  if (step === "welcome") {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <div className="w-full max-w-2xl text-center">
          {/* Animated background glow */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#ff1493]/20 rounded-full blur-[150px]" />
          </div>

          <div className="relative z-10 space-y-8">
            {/* Welcome badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#ff1493]/10 border border-[#ff1493]/30 rounded-full">
              <PartyPopper className="w-4 h-4 text-[#ff1493]" />
              <span className="text-sm font-mono text-[#ff1493] tracking-wider">WELCOME TO AFTERS</span>
            </div>

            {/* Main headline */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                You&apos;re about to throw
                <br />
                <span className="text-[#ff1493]">unforgettable parties</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg mx-auto">
                Creating events is stupid easy. Secret location drops, beautiful event pages,
                instant ticketing—we handle the tech so you can focus on the vibe.
              </p>
            </div>

            {/* Features quick hits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-xl mx-auto">
              <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground">
                <Zap className="w-4 h-4 text-[#ff1493]" />
                <span>Events in minutes</span>
              </div>
              <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground">
                <Sparkles className="w-4 h-4 text-[#ff1493]" />
                <span>Endless customization</span>
              </div>
              <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground">
                <PartyPopper className="w-4 h-4 text-[#ff1493]" />
                <span>Built for the underground</span>
              </div>
            </div>

            {/* Tagline */}
            <p className="text-sm font-mono text-white/40 tracking-wide">
              Templates, themes, and tools to keep every event on brand. Your party awaits.
            </p>

            {/* Aftie introduction */}
            <div className="bg-card border rounded-xl p-6 max-w-lg mx-auto text-left">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff1493] to-[#ff1493]/60 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">Meet Aftie</span>
                    <span className="text-xs px-2 py-0.5 bg-[#ff1493]/10 text-[#ff1493] rounded-full font-mono">AI</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Feeling lost in the sauce? Aftie is your personal partybot—knows everything
                    about Afters and can even create events for you. Just ask.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <Button
              onClick={() => setStep("profile")}
              size="lg"
              className="bg-[#ff1493] hover:bg-[#ff1493]/90 text-white px-8"
            >
              Let&apos;s Go
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Profile setup step
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
      <div className="w-full max-w-md">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#ff1493]/10 border border-[#ff1493]/30 rounded-full mb-4">
              <Sparkles className="w-3 h-3 text-[#ff1493]" />
              <span className="text-xs font-mono text-[#ff1493]">ALMOST THERE</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Set up your profile</h1>
            <p className="text-muted-foreground text-sm">
              This is how people will find you on Afters
            </p>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="displayName">Your name or brand</Label>
              <Input
                id="displayName"
                name="displayName"
                placeholder="e.g. DJ Pulse, Night Collective, Your Name"
                defaultValue={user?.fullName || ""}
                className="bg-background"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Your profile URL</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {URL_PREFIXES.organizer}
                </span>
                <Input
                  id="slug"
                  name="slug"
                  placeholder="yourname"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  className={`bg-background ${slugError ? "border-red-500" : ""}`}
                  required
                />
              </div>
              {slugError && (
                <p className="text-sm text-red-500">{slugError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                People will find your events at this URL
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">
                Bio <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Textarea
                id="bio"
                name="bio"
                placeholder="Tell people what kind of events you throw..."
                rows={3}
                className="bg-background resize-none"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#ff1493] hover:bg-[#ff1493]/90"
              disabled={loading || !!slugError || !slug}
            >
              {loading ? tCommon("creating") : "Create Profile"}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              You can always edit this later in settings
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
