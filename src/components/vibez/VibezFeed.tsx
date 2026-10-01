"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Camera, Loader2, User, Flag, Trash2, RotateCcw } from "lucide-react";
import { VibezCamera } from "./VibezCamera";
import { localProxyUrl } from "@/lib/gcs/local-proxy-url.mjs";

export interface VibezPostType {
  id: string;
  eventId: string;
  userId: string | null;
  authorName: string;
  authorImageUrl: string | null;
  imageUrl: string;
  createdAt: string;
  caption?: string | null;
  /** Clerk id or `tkt_…` for a guest. The identity "mine" is decided on this. */
  authorSubject?: string | null;
  removedAt?: string | null;
  removedBy?: string | null;
  removedReason?: string | null;
  /** Set once the image itself is gone, so a restore cannot show a broken tile. */
  filePurgedAt?: string | null;
  reportCount?: number;
}

interface VibezFeedProps {
  eventId: string;
  accentColor?: string | null;
}

const REASONS = [
  { value: "spam", label: "Spam" },
  { value: "abusive", label: "Abusive" },
  { value: "explicit", label: "Explicit" },
  { value: "private", label: "Something private" },
  { value: "other", label: "Other" },
] as const;

export function VibezFeed({ eventId, accentColor }: VibezFeedProps) {
  const [posts, setPosts] = useState<VibezPostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [reason, setReason] = useState<string>("other");
  // Both of these used to be props passed down from a page that guessed them
  // from `isSignedIn`. That is how a signed-in non-attendee was shown an upload
  // button that could only fail. The feed API now answers for this viewer and
  // the client believes it.
  const [isModerator, setModerator] = useState(false);
  const [canPost, setCanPost] = useState(false);
  const [subject, setSubject] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`/api/events/${eventId}/vibez`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts ?? []);
        if (typeof data.canModerate === "boolean") setModerator(data.canModerate);
        if (typeof data.canPost === "boolean") setCanPost(data.canPost);
        if (typeof data.subject === "string") setSubject(data.subject);
        if (typeof data.isGuest === "boolean") setIsGuest(data.isGuest);
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

  /*
   * The upload path that used to live here — the useUploadThing hook, the ticket
   * fetch, the file input — is now VibezCamera. It contained no camera, which is
   * the whole problem: a night-flash feed you can only post to by digging
   * through the phone's file picker is not a photobooth.
   */

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
      {canPost ? (
        <div className="flex items-center gap-3 border border-white/10 bg-white/[0.02] p-3">
          <button
            type="button"
            onClick={() => setCameraOpen(true)}
            className="flex items-center justify-center gap-2 border px-4 py-2 text-xs font-mono font-bold transition-colors hover:opacity-90"
            style={{ borderColor: accent, color: accent }}
          >
            <Camera className="w-4 h-4" />
            Take a photo
          </button>
          {error && posts.length > 0 && (
            <p className="text-xs text-red-400/80 font-mono">{error}</p>
          )}
        </div>
      ) : (
        /* The server has already decided this. Showing a button to someone it
           will refuse was the old behaviour, and it is worse than showing none:
           they tap it, spend the effort, and get a rejection. */
        <p className="border border-white/10 bg-white/[0.02] p-3 text-xs text-white/40 font-mono">
          {isGuest
            ? "Your ticket gives you access to this feed."
            : "This feed is for people with a ticket to this event."}
        </p>
      )}

      {cameraOpen && (
        <VibezCamera
          eventId={eventId}
          accentColor={accentColor}
          onPosted={() => {
            setCameraOpen(false);
            void fetchPosts();
          }}
        />
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
            const mine = Boolean(subject) && (post.authorSubject === subject || post.userId === subject);
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
                  ) : post.filePurgedAt ? (
                    // Reachable only if a moderator restores a post whose file has
                    // since been purged. The API now refuses that, but the tile
                    // has to survive a row that got there some other way.
                    <div className="flex h-full items-center justify-center px-2 text-center">
                      <p className="text-[10px] font-mono text-white/40">No longer available</p>
                    </div>
                  ) : (
                    <Image
                      src={localProxyUrl(post.imageUrl)}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, 33vw"
                      unoptimized={post.imageUrl.startsWith("blob:") || post.imageUrl.includes("/api/assets/gcp?")}
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
                      src={localProxyUrl(post.authorImageUrl)}
                      unoptimized={post.authorImageUrl.includes("/api/assets/gcp?")}
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

                {post.caption && (
                  <p className="px-2 pb-2 text-[11px] leading-snug text-white/70">
                    {post.caption}
                  </p>
                )}

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
