"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Crown,
  Shield,
  Scan,
  Edit,
  MessageSquare,
  DollarSign,
  Loader2,
  CheckCircle2,
} from "lucide-react";

const ROLE_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; color: string; description: string }
> = {
  ADMIN: {
    label: "Admin",
    icon: Crown,
    color: "bg-pink/10 text-pink border-pink/20",
    description: "Full access to manage events, staff, analytics, and settings",
  },
  SCANNER: {
    label: "Scanner",
    icon: Scan,
    color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    description: "Scan and verify tickets at event doors",
  },
  EDITOR: {
    label: "Editor",
    icon: Edit,
    color: "bg-green-500/10 text-green-400 border-green-500/20",
    description: "Create and edit events, manage event content",
  },
  SUPPORT: {
    label: "Support",
    icon: MessageSquare,
    color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    description: "Handle attendee messages and view ticket info",
  },
  FINANCE: {
    label: "Finance",
    icon: DollarSign,
    color: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    description: "View analytics, exports, and financial data",
  },
};

interface InviteAcceptClientProps {
  token: string;
  organizerName: string;
  organizerLogo: string | null;
  role: string;
}

export function InviteAcceptClient({
  token,
  organizerName,
  organizerLogo,
  role,
}: InviteAcceptClientProps) {
  const router = useRouter();
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const roleConfig = ROLE_CONFIG[role] || ROLE_CONFIG.SCANNER;
  const RoleIcon = roleConfig.icon;

  async function handleAccept() {
    setAccepting(true);
    try {
      const res = await fetch("/api/staff/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (res.ok) {
        setAccepted(true);
        toast.success(`You've joined ${organizerName} as ${roleConfig.label}!`);
        setTimeout(() => router.push("/d"), 2000);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to accept invite");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setAccepting(false);
    }
  }

  if (accepted) {
    return (
      <div className="text-center max-w-md mx-auto px-4">
        <div className="size-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="size-8 text-green-500" />
        </div>
        <h1 className="font-display text-2xl font-bold text-white mb-2">
          Welcome to the team!
        </h1>
        <p className="text-muted-foreground">
          You&apos;ve joined <span className="text-white font-semibold">{organizerName}</span> as{" "}
          <span className="text-white font-semibold">{roleConfig.label}</span>.
          Redirecting to dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4">
      <div className="relative rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
        {/* Organizer logo/name */}
        <div className="mb-6">
          {organizerLogo ? (
            <img
              src={organizerLogo}
              alt={organizerName}
              className="size-16 rounded-full mx-auto mb-4 border border-white/10"
            />
          ) : (
            <div className="size-16 rounded-full bg-pink/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="size-8 text-pink" />
            </div>
          )}
          <h1 className="font-display text-2xl font-bold text-white mb-2">
            Staff Invite
          </h1>
          <p className="text-muted-foreground">
            <span className="text-white font-semibold">{organizerName}</span>{" "}
            invited you to join their team
          </p>
        </div>

        {/* Role info */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <RoleIcon className="size-5 text-pink" />
            <Badge variant="outline" className={roleConfig.color}>
              {roleConfig.label}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {roleConfig.description}
          </p>
        </div>

        {/* Accept button */}
        <Button
          size="lg"
          onClick={handleAccept}
          disabled={accepting}
          className="w-full py-6 text-base font-bold glow-pink hover:scale-[1.02] transition-transform"
        >
          {accepting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Joining...
            </>
          ) : (
            "Accept Invite"
          )}
        </Button>

        <p className="text-xs text-muted-foreground/60 mt-4">
          By accepting, you&apos;ll get access to {organizerName}&apos;s dashboard based on
          your assigned role.
        </p>
      </div>
    </div>
  );
}
