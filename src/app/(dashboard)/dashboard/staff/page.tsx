"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Users,
  UserPlus,
  Scan,
  Edit,
  MessageSquare,
  DollarSign,
  Crown,
  Trash2,
  Mail,
  Clock,
  Loader2,
  Copy,
  Sparkles,
} from "lucide-react";

/* ─── Types ─── */

interface StaffUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  username: string | null;
}

interface StaffMember {
  id: string;
  role: string;
  status: string;
  addedAt: string;
  user: StaffUser;
}

interface StaffInvite {
  id: string;
  email: string;
  role: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

/* ─── Config ─── */

const ROLE_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; badgeClass: string }
> = {
  ADMIN: {
    label: "Admin",
    icon: Crown,
    badgeClass: "bg-pink/10 text-pink border-pink/20",
  },
  SCANNER: {
    label: "Scanner",
    icon: Scan,
    badgeClass: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  EDITOR: {
    label: "Editor",
    icon: Edit,
    badgeClass: "bg-green-500/10 text-green-400 border-green-500/20",
  },
  SUPPORT: {
    label: "Support",
    icon: MessageSquare,
    badgeClass: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
  FINANCE: {
    label: "Finance",
    icon: DollarSign,
    badgeClass: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  },
};

const STATUS_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  ACTIVE: {
    label: "Active",
    badgeClass: "bg-green-500/10 text-green-400 border-green-500/20",
  },
  SUSPENDED: {
    label: "Suspended",
    badgeClass: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  },
  REMOVED: {
    label: "Removed",
    badgeClass: "bg-red-500/10 text-red-400 border-red-500/20",
  },
};

/* ─── Page ─── */

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [invites, setInvites] = useState<StaffInvite[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite dialog
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("SCANNER");
  const [inviting, setInviting] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  const fetchStaff = useCallback(async () => {
    try {
      const res = await fetch("/api/staff");
      if (res.ok) {
        const data = await res.json();
        setStaff(data.staff);
        setInvites(data.invites);
      } else {
        toast.error("Failed to load staff");
      }
    } catch {
      toast.error("Failed to load staff");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  async function handleInvite() {
    if (!inviteEmail || !inviteRole) return;
    setInviting(true);
    try {
      const res = await fetch("/api/staff/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Invite sent!");
        setInviteUrl(data.inviteUrl);
        fetchStaff();
      } else {
        toast.error(data.error || "Failed to send invite");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setInviting(false);
    }
  }

  async function handleUpdateRole(staffId: string, role: string) {
    try {
      const res = await fetch("/api/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId, role }),
      });
      if (res.ok) {
        toast.success("Role updated");
        fetchStaff();
      } else {
        toast.error("Failed to update role");
      }
    } catch {
      toast.error("Something went wrong");
    }
  }

  async function handleRemoveStaff(staffId: string) {
    try {
      const res = await fetch(`/api/staff?id=${staffId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Staff member removed");
        fetchStaff();
      } else {
        toast.error("Failed to remove staff member");
      }
    } catch {
      toast.error("Something went wrong");
    }
  }

  async function handleRevokeInvite(inviteId: string) {
    try {
      const res = await fetch(`/api/staff/invite?id=${inviteId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Invite revoked");
        fetchStaff();
      } else {
        toast.error("Failed to revoke invite");
      }
    } catch {
      toast.error("Something went wrong");
    }
  }

  function copyInviteUrl(url: string) {
    navigator.clipboard.writeText(url);
    toast.success("Invite link copied!");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ─── Staff Management UI ───
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Staff</h1>
          <p className="text-muted-foreground">
            Manage your team members and their access
          </p>
        </div>
        <Dialog
          open={inviteOpen}
          onOpenChange={(open) => {
            setInviteOpen(open);
            if (!open) {
              setInviteEmail("");
              setInviteRole("SCANNER");
              setInviteUrl(null);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="glow-pink">
              <UserPlus className="size-4 mr-2" />
              Invite Staff
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite a Team Member</DialogTitle>
              <DialogDescription>
                Send an invite link. They&apos;ll need an Afters account to accept.
              </DialogDescription>
            </DialogHeader>

            {inviteUrl ? (
              <div className="space-y-4 py-4">
                <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4 text-center">
                  <Sparkles className="size-6 text-green-400 mx-auto mb-2" />
                  <p className="text-sm text-green-400 font-medium mb-3">
                    Invite created! Share this link:
                  </p>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={inviteUrl}
                      className="text-xs bg-black/50"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyInviteUrl(inviteUrl)}
                    >
                      <Copy className="size-4" />
                    </Button>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setInviteOpen(false);
                      setInviteUrl(null);
                      setInviteEmail("");
                    }}
                  >
                    Done
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              <>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="invite-email">Email</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      placeholder="teammate@email.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ROLE_CONFIG).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <config.icon className="size-4" />
                              {config.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {inviteRole === "ADMIN" &&
                        "Full access to manage events, staff, analytics, and settings."}
                      {inviteRole === "SCANNER" &&
                        "Can scan and verify tickets at events."}
                      {inviteRole === "EDITOR" &&
                        "Can create and edit events."}
                      {inviteRole === "SUPPORT" &&
                        "Can handle attendee messages and view tickets."}
                      {inviteRole === "FINANCE" &&
                        "Can view analytics, exports, and financial data."}
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setInviteOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleInvite}
                    disabled={inviting || !inviteEmail}
                    className="glow-pink"
                  >
                    {inviting ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="size-4 mr-2" />
                        Send Invite
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Staff Members */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="size-5" />
            <CardTitle>Team Members</CardTitle>
          </div>
          <CardDescription>
            {staff.length} active team member{staff.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {staff.length === 0 ? (
            <div className="text-center py-12">
              <Users className="size-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No team members yet</p>
              <p className="text-sm text-muted-foreground/60">
                Invite your first team member to get started
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {staff.map((member) => {
                const roleConf =
                  ROLE_CONFIG[member.role] || ROLE_CONFIG.SCANNER;
                const statusConf =
                  STATUS_CONFIG[member.status] || STATUS_CONFIG.ACTIVE;

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {member.user.imageUrl ? (
                        <img
                          src={member.user.imageUrl}
                          alt=""
                          className="size-10 rounded-full border border-white/10"
                        />
                      ) : (
                        <div className="size-10 rounded-full bg-pink/10 flex items-center justify-center">
                          <Users className="size-5 text-pink" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-white">
                          {member.user.firstName} {member.user.lastName}
                          {member.user.username && (
                            <span className="text-muted-foreground ml-1">
                              @{member.user.username}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {member.user.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className={statusConf.badgeClass}
                      >
                        {statusConf.label}
                      </Badge>

                      <Select
                        value={member.role}
                        onValueChange={(val) =>
                          handleUpdateRole(member.id, val)
                        }
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(ROLE_CONFIG).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <config.icon className="size-3.5" />
                                {config.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={() => handleRemoveStaff(member.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invites */}
      {invites.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="size-5" />
              <CardTitle>Pending Invites</CardTitle>
            </div>
            <CardDescription>
              {invites.length} pending invite{invites.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invites.map((invite) => {
                const roleConf =
                  ROLE_CONFIG[invite.role] || ROLE_CONFIG.SCANNER;
                const expiresAt = new Date(invite.expiresAt);
                const daysLeft = Math.ceil(
                  (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                );

                return (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-white/5 bg-white/[0.02]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                        <Mail className="size-5 text-yellow-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {invite.email}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="size-3" />
                          <span>
                            Expires in {daysLeft} day{daysLeft !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className={roleConf.badgeClass}
                      >
                        {roleConf.label}
                      </Badge>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-white"
                        onClick={() =>
                          copyInviteUrl(
                            `${window.location.origin}/invite/${invite.token}`
                          )
                        }
                      >
                        <Copy className="size-3.5 mr-1" />
                        Copy Link
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={() => handleRevokeInvite(invite.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
