"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useUploadThing } from "@/lib/uploadthing-client";
import { Camera, Loader2, User } from "lucide-react";

export interface VibezPostType {
  id: string;
  eventId: string;
  userId: string | null;
  authorName: string;
  authorImageUrl: string | null;
  imageUrl: string;
  createdAt: string;
}

interface VibezFeedProps {
  eventId: string;
  canPost?: boolean;
  accentColor?: string | null;
}

export function VibezFeed({ eventId, canPost = true, accentColor }: VibezFeedProps) {
  const [posts, setPosts] = useState<VibezPostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`/api/events/${eventId}/vibez`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts ?? []);
      } else {
        const data = await res.json();
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
        if (postRes.ok) {
          const data = await postRes.json();
          setPosts((prev) => [data.post, ...prev]);
        } else {
          const data = await postRes.json();
          setError(data.message || "Failed to post");
        }
      } catch {
        setError("Failed to post");
      } finally {
        setPosting(false);
      }
    },
    onUploadError: () => {
      setError("Upload failed");
      setPosting(false);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setPosting(true);
    setError(null);
    startUpload([file]);
    e.target.value = "";
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
          {posts.map((post) => (
            <div
              key={post.id}
              className="border border-white/10 bg-white/[0.02] overflow-hidden"
            >
              <div className="relative aspect-square bg-white/5">
                <Image
                  src={post.imageUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, 33vw"
                  unoptimized={post.imageUrl.startsWith("blob:")}
                />
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
                <span className="text-[10px] font-mono text-white/50 truncate">
                  {post.authorName}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
