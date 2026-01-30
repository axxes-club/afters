"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Radio,
  Music,
  Clock,
  Volume2,
  VolumeX,
  Play,
  Headphones,
  Mic2,
  Waves,
  Users,
  Disc3,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface TimelineTrack {
  id: string;
  title: string;
  artistName: string;
  artistSlug: string;
  duration: number;
  artworkUrl?: string;
  startTime: number;
  isPlaying: boolean;
}

interface RadioState {
  currentTrack: {
    id: string;
    title: string;
    fileUrl: string;
    duration: number;
    artworkUrl?: string;
    artistName: string;
    artistSlug: string;
  } | null;
  nextTrack: {
    id: string;
    title: string;
    duration: number;
    artworkUrl?: string;
    artistName: string;
    artistSlug: string;
  } | null;
  currentPosition: number;
  isLive: boolean;
  timeline: TimelineTrack[];
}

function formatDuration(s: number) {
  const mins = Math.floor(s / 60);
  const secs = Math.floor(s % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatScheduleTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/New_York",
  });
}

/* ─── Live Player Hero ─── */
function LivePlayer({ radioState, trackProgress }: { radioState: RadioState; trackProgress: number }) {
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio();
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  const togglePlay = async () => {
    if (!audioRef.current || !radioState.currentTrack) return;

    if (!isPlaying) {
      // Fetch fresh state for accurate sync
      const res = await fetch("/api/radio/tracks");
      const fresh = await res.json();
      if (fresh.currentTrack) {
        audioRef.current.src = fresh.currentTrack.fileUrl;
        audioRef.current.currentTime = fresh.currentPosition;
        audioRef.current.volume = 0.8;
        audioRef.current.muted = false;
        audioRef.current.play().catch(console.error);
        setIsPlaying(true);
        setIsMuted(false);
      }
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const track = radioState.currentTrack;
  if (!track) return null;

  const progressPercent = (trackProgress / track.duration) * 100;

  return (
    <div className="relative rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
      {/* Glow background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] rounded-full bg-pink/10 blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] rounded-full bg-pink/5 blur-[80px]" />
      </div>

      <div className="relative p-8 sm:p-12">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          {/* Artwork */}
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden bg-pink/10 flex-shrink-0 group">
            {track.artworkUrl ? (
              <img src={track.artworkUrl} alt={track.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Radio className="size-16 text-pink/40" />
              </div>
            )}
            {/* Play overlay */}
            {isPlaying && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="flex items-end gap-1 h-8">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="w-1.5 bg-pink rounded-t animate-music-pulse"
                      style={{
                        animationDelay: `${i * 0.12}s`,
                        height: `${12 + Math.random() * 20}px`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            {/* Vinyl spin effect */}
            {isPlaying && (
              <div className="absolute -inset-1 rounded-2xl border-2 border-pink/20 animate-pulse pointer-events-none" />
            )}
          </div>

          {/* Track Info + Controls */}
          <div className="flex-1 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-2 mb-3">
              <Radio className="size-4 text-pink" />
              <span className="text-xs font-bold text-pink font-display tracking-wide">
                AFTERS RADIO
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold animate-pulse">
                LIVE
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-white font-display mb-1">
              {track.title}
            </h2>
            {track.artistSlug && track.artistSlug !== "unknown" ? (
              <Link
                href={`/a/${track.artistSlug}`}
                className="text-lg text-white/60 hover:text-pink transition-colors"
              >
                {track.artistName}
              </Link>
            ) : (
              <p className="text-lg text-white/60">{track.artistName}</p>
            )}

            {/* Progress bar */}
            <div className="mt-4 mb-2">
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-pink transition-all duration-1000 ease-linear rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between mt-1 text-xs text-white/40 font-mono">
                <span>{formatDuration(trackProgress)}</span>
                <span>{formatDuration(track.duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 justify-center lg:justify-start mt-4">
              <Button
                onClick={togglePlay}
                size="lg"
                className={
                  isPlaying
                    ? "bg-white/10 hover:bg-white/20 text-white"
                    : "glow-pink hover:scale-[1.02] transition-transform"
                }
              >
                {isPlaying ? (
                  <>
                    <Volume2 className="size-5 mr-2" />
                    Listening
                  </>
                ) : (
                  <>
                    <Play className="size-5 mr-2" />
                    Tune In
                  </>
                )}
              </Button>
              {isPlaying && (
                <Button variant="outline" size="icon" onClick={toggleMute} className="rounded-full">
                  {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                </Button>
              )}
            </div>

            {/* Up next */}
            {radioState.nextTrack && (
              <div className="mt-6 flex items-center gap-3 justify-center lg:justify-start">
                <span className="text-xs text-white/30 uppercase tracking-wide font-display">
                  Up Next
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center overflow-hidden">
                    {radioState.nextTrack.artworkUrl ? (
                      <img
                        src={radioState.nextTrack.artworkUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Music className="size-3 text-white/30" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-white/70">{radioState.nextTrack.title}</p>
                    <p className="text-xs text-white/40">{radioState.nextTrack.artistName}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Schedule Timeline ─── */
function ScheduleTimeline({ timeline }: { timeline: TimelineTrack[] }) {
  if (timeline.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <Clock className="size-5 text-pink" />
        <h2 className="font-display text-2xl font-bold text-white">Schedule</h2>
        <Badge variant="outline" className="text-xs text-white/40 border-white/10">
          Eastern Time
        </Badge>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <div className="divide-y divide-white/5">
          {timeline.map((track, i) => (
            <div
              key={`${track.id}-${i}`}
              className={`flex items-center gap-4 p-4 transition-colors ${
                track.isPlaying
                  ? "bg-pink/[0.08] border-l-2 border-l-pink"
                  : "hover:bg-white/[0.02] border-l-2 border-l-transparent"
              }`}
            >
              {/* Time */}
              <div className="w-16 flex-shrink-0 text-right">
                <span
                  className={`text-sm font-mono ${
                    track.isPlaying ? "text-pink font-bold" : "text-white/40"
                  }`}
                >
                  {formatScheduleTime(track.startTime)}
                </span>
              </div>

              {/* Artwork */}
              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-pink/10 flex-shrink-0">
                {track.artworkUrl ? (
                  <img src={track.artworkUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music className="size-5 text-pink/30" />
                  </div>
                )}
                {track.isPlaying && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="flex items-end gap-[2px] h-3">
                      {[1, 2, 3].map((j) => (
                        <div
                          key={j}
                          className="w-[2px] bg-pink rounded-t animate-music-pulse"
                          style={{ animationDelay: `${j * 0.1}s` }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Track Info */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium truncate ${
                    track.isPlaying ? "text-pink font-semibold" : "text-white/80"
                  }`}
                >
                  {track.title}
                </p>
                {track.artistSlug && track.artistSlug !== "unknown" ? (
                  <Link
                    href={`/a/${track.artistSlug}`}
                    className="text-xs text-white/40 hover:text-pink transition-colors truncate block"
                  >
                    {track.artistName}
                  </Link>
                ) : (
                  <p className="text-xs text-white/40 truncate">{track.artistName}</p>
                )}
              </div>

              {/* Duration */}
              <span className="text-xs text-white/30 font-mono flex-shrink-0">
                {formatDuration(track.duration)}
              </span>

              {/* Now badge */}
              {track.isPlaying && (
                <Badge className="bg-pink text-white text-[10px] font-display flex-shrink-0">
                  NOW
                </Badge>
              )}
            </div>
          ))}
        </div>

        {/* Loop indicator */}
        <div className="px-4 py-3 border-t border-dashed border-white/10 flex items-center gap-2">
          <span className="text-xs text-white/30 italic">↻ Queue loops continuously — 24/7</span>
        </div>
      </div>
    </section>
  );
}

/* ─── Main Page ─── */
export default function RadioPage() {
  const [radioState, setRadioState] = useState<RadioState | null>(null);
  const [loading, setLoading] = useState(true);
  const [trackProgress, setTrackProgress] = useState(0);

  const fetchRadioState = useCallback(async () => {
    try {
      const res = await fetch("/api/radio/tracks");
      const data = await res.json();
      if (data.isLive && data.currentTrack) {
        setRadioState(data);
        setTrackProgress(data.currentPosition);
      }
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRadioState();
    const poll = setInterval(fetchRadioState, 30000);
    return () => clearInterval(poll);
  }, [fetchRadioState]);

  // Tick progress every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTrackProgress((prev) => {
        if (!radioState?.currentTrack) return prev;
        const next = prev + 1;
        if (next >= radioState.currentTrack.duration) {
          fetchRadioState();
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [radioState, fetchRadioState]);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-black pt-16">
        {/* ═══════════════ HERO ═══════════════ */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-pink/5 blur-[120px]" />
          </div>

          <div className="relative max-w-5xl mx-auto px-4 pt-16 pb-8">
            {/* Title */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-pink/30 bg-pink/5 text-pink text-sm font-medium">
                <Radio className="size-4" />
                <span className="font-display tracking-wide">24/7 ELECTRONIC MUSIC</span>
              </div>

              <h1 className="font-display text-5xl sm:text-7xl font-bold tracking-tight mb-4">
                <span className="text-white">AFTERS</span>{" "}
                <span className="text-gradient">RADIO</span>
              </h1>

              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                Non-stop underground electronic music. Curated by the Afters community.
                Featuring artists from our platform — live, 24/7.
              </p>
            </div>

            {/* Live Player */}
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <Disc3 className="size-10 text-pink animate-spin" />
              </div>
            ) : radioState?.currentTrack ? (
              <LivePlayer radioState={radioState} trackProgress={trackProgress} />
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center">
                <Radio className="size-12 text-white/20 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2 font-display">Station Offline</h3>
                <p className="text-muted-foreground">
                  AFTERS RADIO is setting up. Check back soon — we&apos;re curating the playlist.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ═══════════════ SCHEDULE ═══════════════ */}
        {radioState?.timeline && radioState.timeline.length > 0 && (
          <section className="max-w-5xl mx-auto px-4 py-16">
            <ScheduleTimeline timeline={radioState.timeline} />
          </section>
        )}

        {/* ═══════════════ ABOUT AFTERS RADIO ═══════════════ */}
        <section className="max-w-5xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
              What is <span className="text-gradient">AFTERS RADIO</span>?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A 24/7 internet radio station built into Afters — showcasing the artists who play
              the events you love. Discover new music before the party starts.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Waves,
                title: "24/7 Streaming",
                description:
                  "Always on. Always playing. Tune in any time — the music never stops.",
              },
              {
                icon: Mic2,
                title: "Artist Submissions",
                description:
                  "Artists on Afters can submit their tracks for rotation. Get heard by the nightlife community.",
              },
              {
                icon: Headphones,
                title: "Curated Queue",
                description:
                  "Every track is hand-approved. Quality over quantity — only the best makes it to air.",
              },
              {
                icon: Users,
                title: "Community Driven",
                description:
                  "Powered by the artists and organizers who make the scene. The soundtrack to your nightlife.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-white/5 bg-white/[0.02] p-6 hover:border-pink/20 hover:bg-pink/[0.02] transition-all duration-300"
              >
                <div className="size-10 rounded-lg bg-pink/10 flex items-center justify-center mb-4 group-hover:bg-pink/20 transition-colors">
                  <feature.icon className="size-5 text-pink" />
                </div>
                <h3 className="font-display text-white font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════ ARTIST CTA ═══════════════ */}
        <section className="max-w-4xl mx-auto px-4 py-16 pb-32">
          <div className="relative rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-pink/10 via-transparent to-pink/5" />
            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-pink/30 via-pink/5 to-transparent pointer-events-none" />

            <div className="relative p-8 sm:p-12 text-center">
              <Sparkles className="size-8 text-pink mx-auto mb-6" />
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-4">
                Want your music on AFTERS RADIO?
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto mb-8 leading-relaxed">
                Create an artist profile on Afters and submit your tracks.
                Our team reviews every submission — if it fits the vibe, you&apos;re on air.
                <span className="text-pink font-bold"> Free for all artists.</span>
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/sign-up">
                  <Button
                    size="lg"
                    className="text-base font-bold px-10 py-6 glow-pink hover:scale-[1.02] transition-transform"
                  >
                    <Music className="size-5 mr-2" />
                    Create Artist Profile
                  </Button>
                </Link>
                <Link href="/events">
                  <Button variant="outline" size="lg" className="text-base font-bold px-10 py-6">
                    Browse Events
                    <ArrowRight className="size-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
