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
import { User, Music, Building2 } from "lucide-react";

type ProfileType = "personal" | "organizer" | "artist";

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
  const [profileType, setProfileType] = useState<ProfileType | "">("");
  const [slug, setSlug] = useState("");
  const [slugError, setSlugError] = useState("");
  const t = useTranslations("onboarding");
  const tSettings = useTranslations("settings");
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

    // Validate profile type
    if (!profileType) {
      toast.error("Please select a profile type");
      return;
    }

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
      // Determine which API endpoint to use based on profile type
      let endpoint = "";
      let urlPrefix = "";

      if (profileType === "organizer") {
        endpoint = "/api/organizer/profile";
        urlPrefix = URL_PREFIXES.organizer;
      } else if (profileType === "artist") {
        endpoint = "/api/artist/profile";
        urlPrefix = URL_PREFIXES.artist;
      } else if (profileType === "personal") {
        endpoint = "/api/personal/profile";
        urlPrefix = URL_PREFIXES.personal;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, slug, bio }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || data.message || tErrors("generic"));
      }

      toast.success(t("profileCreated"));
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tErrors("generic"));
    } finally {
      setLoading(false);
    }
  }

  // Update URL prefix based on profile type
  const getUrlPrefix = () => {
    if (profileType === "organizer") return URL_PREFIXES.organizer;
    if (profileType === "artist") return URL_PREFIXES.artist;
    if (profileType === "personal") return URL_PREFIXES.personal;
    return URL_PREFIXES.base;
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Create Your Profile</CardTitle>
          <CardDescription>
            Choose your profile type and set up your account to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Profile Type Selection */}
            <div className="space-y-3">
              <Label>{tSettings("accountType")}</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setProfileType("personal")}
                  className={`p-4 border rounded-lg text-left transition-all ${
                    profileType === "personal"
                      ? "border-primary bg-primary/5 ring-2 ring-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <User className="w-6 h-6 mb-2" />
                  <div className="font-medium">Personal</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    For individual users attending events
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setProfileType("organizer")}
                  className={`p-4 border rounded-lg text-left transition-all ${
                    profileType === "organizer"
                      ? "border-primary bg-primary/5 ring-2 ring-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Building2 className="w-6 h-6 mb-2" />
                  <div className="font-medium">Organizer</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Host events and sell tickets
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setProfileType("artist")}
                  className={`p-4 border rounded-lg text-left transition-all ${
                    profileType === "artist"
                      ? "border-primary bg-primary/5 ring-2 ring-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Music className="w-6 h-6 mb-2" />
                  <div className="font-medium">Artist</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    DJs, producers, and musicians
                  </div>
                </button>
              </div>
            </div>

            {profileType && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="displayName">
                    {profileType === "personal"
                      ? "Display Name"
                      : profileType === "artist"
                        ? "Artist Name"
                        : "Organizer Name"}
                  </Label>
                  <Input
                    id="displayName"
                    name="displayName"
                    placeholder={
                      profileType === "personal"
                        ? "Your name"
                        : profileType === "artist"
                          ? "Your artist name"
                          : "Your name or business name"
                    }
                    defaultValue={user?.fullName || ""}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Profile URL</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {getUrlPrefix()}
                    </span>
                    <Input
                      id="slug"
                      name="slug"
                      placeholder="yourname"
                      value={slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      className={slugError ? "border-red-500" : ""}
                      required
                    />
                  </div>
                  {slugError && (
                    <p className="text-sm text-red-500">{slugError}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {tSettings("profileUrlHint")}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">
                    {profileType === "personal"
                      ? "Bio (Optional)"
                      : profileType === "artist"
                        ? "Artist Bio (Optional)"
                        : "Organizer Bio (Optional)"}
                  </Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    placeholder={
                      profileType === "personal"
                        ? "Tell us about yourself..."
                        : profileType === "artist"
                          ? "Tell fans about your music..."
                          : "Tell us about what events you host..."
                    }
                    rows={3}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || !!slugError || !slug || !profileType}
                >
                  {loading ? tCommon("creating") : t("createProfile")}
                </Button>
              </>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
