"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useUploadThing } from "@/lib/uploadthing-client";
import { Camera, Loader2, User, Flag, Trash2, RotateCcw } from "lucide-react";

export interface VibezPostType {
  id: string;
  eventId: string;
  userId: string | null;
  authorName: string;
  authorImageUrl: string | null;
  imageUrl: string;
  createdAt: string;
  removedAt?: string | null;
  removedBy?: string | null;
  removedReason?: string | null;
  reportCount?: number;
}

interface VibezFeedProps {
  eventId: string;
  canPost?: boolean;
  canModerate?: boolean;
  /** The signed-in person, so they can tell their own posts apart. */
  currentUserId?: string | null;
  accentColor?: string | null;
}

const REASONS = [
  { value: "spam", label: "Spam" },
  { value: "abusive", label: "Abusive" },
  { value: "explicit", label: "Explicit" },
  { value: "private", label: "Something private" },
  { value: "other", label: "Other" },
] as const;

export function VibezFeed({
  eventId,
  canPost = true,
  canModerate = false,
  currentUserId = null,
  accentColor,
}: VibezFeedProps) {
  const [posts, setPosts] = useState<VibezPostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [reason, setReason] = useState<string>("other");
  const [isModerator, setModerator] = useState(canModerate);

  const fetchPosts = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`/api/events/${eventId}/vibez`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts ?? []);
        if (typeof data.canModerate === "boolean") setModerator(data.canModerate);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Could not load feed");
      }
    } catch {
      setError("Could not load feed");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchPosts();
    const interval = setInterval(fetchPosts, 15000);
    return () => clearInterval(interval);
  }, [fetchPosts]);

  const { startUpload } = useUploadThing("vibezPost", {
    onClientUploadComplete: async (res) => {
      const fileUrl = res?.[0]?.url || res?.[0]?.ufsUrl;
      if (!fileUrl) {
        setPosting(false);
        return;
      }
      try {
        const postRes = await fetch(`/api/events/${eventId}/vibez`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: fileUrl }),
        });
        const data = await postRes.json().catch(() => ({}));
        if (postRes.ok) {
          setPosts((prev) => [data.post, ...prev]);
        } else {
          setError(data.message || "Failed to post");
        }
      } catch {
        setError("Failed to post");
      } finally {
        setPosting(false);
      }
    },
    onUploadError: (e) => {
      setError(e?.message || "Upload failed");
      setPosting(false);
    },
  });

  /**
   * Ask the server whether we may upload, then upload carrying that ticket.
   * The bytes only move after the server has said yes, so a non-attendee
   * never spends our bandwidth finding out they cannot post.
   */
  const beginUpload = async (files: File[]) => {
    setPosting(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/vibez/upload-ticket`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "You can't post to this feed");
      }
      const { ticket } = await res.json();
      await startUpload(files, { eventId, ticket });
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Upload failed");
      setPosting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    void beginUpload([file]);
    e.target.value = "";
  };

  /** Take a post down. The author can do this on their own; so can a moderator. */
  const remove = async (post: VibezPostType) => {
    setBusyId(post.id);
    try {
      const res = await fetch(`/api/events/${eventId}/vibez`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id }),
      });
      if (res.ok) {
        setPosts((prev) =>
          isModerator
            ? prev.map((p) => (p.id === post.id ? { ...p, removedAt: new Date().toISOString() } : p))
            : prev.filter((p) => p.id !== post.id)
        );
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Could not remove that post");
      }
    } catch {
      setError("Could not remove that post");
    } finally {
      setBusyId(null);
    }
  };

  /** Put a removed post back. Moderators only. */
  const restore = async (post: VibezPostType) => {
    setBusyId(post.id);
    try {
      const res = await fetch(`/api/events/${eventId}/vibez`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id }),
      });
      if (res.ok) {
        setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, removedAt: null } : p)));
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Could not restore that post");
      }
    } catch {
      setError("Could not restore that post");
    } finally {
      setBusyId(null);
    }
  };

  /** Flag a post for a moderator. One report per person per post. */
  const report = async (post: VibezPostType) => {
    setBusyId(post.id);
    try {
      const res = await fetch(`/api/events/${eventId}/vibez/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id, reason }),
      });
      if (res.ok) {
        setPosts((prev) =>
          prev.map((p) => (p.id === post.id ? { ...p, reportCount: (p.reportCount ?? 0) + 1 } : p))
        );
        setReportingId(null);
        setReason("other");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Could not send that report");
        setReportingId(null);
      }
    } catch {
      setError("Could not send that report");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-white/40" />
      </div>
    );
  }

  if (error && posts.length === 0) {
    return (
      <div className="border border-white/10 bg-white/[0.02] p-6 text-center">
        <p className="text-sm text-white/50 font-mono">{error}</p>
      </div>
    );
  }

  const accent = accentColor || "var(--color-primary, #fff)";

  return (
    <div className="space-y-4">
      {canPost && (
        <div className="flex items-center gap-3 border border-white/10 bg-white/[0.02] p-3">
          <label className="flex items-center gap-2 cursor-pointer flex-1 max-w-[200px]">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
              disabled={posting}
            />
            <span
              className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-mono font-bold border transition-colors hover:opacity-90"
              style={{ borderColor: accent, color: accent }}
            >
              {posting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
              {posting ? "Posting…" : "Add photo"}
            </span>
          </label>
          {error && posts.length > 0 && (
            <p className="text-xs text-red-400/80 font-mono">{error}</p>
          )}
        </div>
      )}

      {posts.length === 0 ? (
        <div className="border border-white/10 bg-white/[0.02] p-8 text-center">
          <Camera className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-sm text-white/40 font-mono">
            No posts yet. Be the first to share a moment!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {posts.map((post) => {
            const removed = Boolean(post.removedAt);
            const mine = Boolean(currentUserId) && post.userId === currentUserId;
            const mayRemove = !removed && (mine || isModerator);
            const mayReport =
              !removed && !mine && reportingId !== post.id && (post.reportCount ?? 0) === 0;

            return (
              <div
                key={post.id}
                className={`border bg-white/[0.02] overflow-hidden ${
                  removed ? "border-red-500/30 opacity-50" : "border-white/10"
                }`}
              >
                <div className="relative aspect-square bg-white/5">
                  {removed ? (
                    <div className="flex h-full items-center justify-center px-2 text-center">
                      <p className="text-[10px] font-mono text-white/40">
                        Removed{post.removedReason === "author" ? " by its author" : ""}
                      </p>
                    </div>
                  ) : (
                    <Image
                      src={post.imageUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, 33vw"
                      unoptimized={post.imageUrl.startsWith("blob:")}
                    />
                  )}

                  {/* Reports get a quiet marker so moderators can triage. */}
                  {(post.reportCount ?? 0) > 0 && !removed && (
                    <span
                      className="absolute top-1 left-1 flex items-center gap-1 bg-black/70 px-1.5 py-0.5 text-[10px] font-mono text-amber-300"
                      title={`${post.reportCount} report(s)`}
                    >
                      <Flag className="w-3 h-3" />
                      {post.reportCount}
                    </span>
                  )}

                  {(mayRemove || isModerator) && (
                    <div className="absolute top-1 right-1 flex gap-1">
                      {removed && isModerator ? (
                        <button
                          type="button"
                          onClick={() => restore(post)}
                          disabled={busyId === post.id}
                          className="flex h-6 w-6 items-center justify-center bg-black/70 text-white/80 hover:text-white disabled:opacity-50"
                          title="Restore this post"
                          aria-label="Restore this post"
                        >
                          {busyId === post.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <RotateCcw className="w-3 h-3" />
                          )}
                        </button>
                      ) : mayRemove ? (
                        <button
                          type="button"
                          onClick={() => remove(post)}
                          disabled={busyId === post.id}
                          className="flex h-6 w-6 items-center justify-center bg-black/70 text-white/80 hover:text-red-300 disabled:opacity-50"
                          title="Remove this post"
                          aria-label="Remove this post"
                        >
                          {busyId === post.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                        </button>
                      ) : null}
                    </div>
                  )}
                </div>

                <div className="p-2 flex items-center gap-2">
                  {post.authorImageUrl ? (
                    <Image
                      src={post.authorImageUrl}
                      alt=""
                      width={20}
                      height={20}
                      className="rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                      <User className="w-3 h-3 text-white/60" />
                    </div>
                  )}
                  <span className="text-[10px] font-mono text-white/50 truncate flex-1">
                    {post.authorName}
                  </span>
                  {mayReport && (
                    <button
                      type="button"
                      onClick={() => setReportingId(post.id)}
                      className="text-white/30 hover:text-amber-300"
                      title="Report this post"
                      aria-label="Report this post"
                    >
                      <Flag className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {reportingId === post.id && (
                  <div className="border-t border-white/10 p-2 space-y-2">
                    <p className="text-[10px] font-mono text-white/40">
                      What&apos;s wrong with this?
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {REASONS.map((r) => (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => {
                            setReason(r.value);
                            report(post);
                          }}
                          className={`px-1.5 py-0.5 text-[10px] font-mono border ${
                            reason === r.value
                              ? "border-white/40 text-white"
                              : "border-white/10 text-white/50 hover:border-white/30"
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setReportingId(null)}
                      className="text-[10px] font-mono text-white/30 hover:text-white/60"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
