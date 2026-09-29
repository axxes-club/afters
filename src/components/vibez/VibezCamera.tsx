"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useUploadThing } from "@/lib/uploadthing-client";
import { drawSource, nightFlash, toJpeg } from "@/lib/vibez-flash";

/**
 * The night-flash camera.
 *
 * This is the feature. Everything else in the feed is a grid and a moderation
 * queue; what people come for at 1am in a dark room is pointing a phone at
 * something and getting the disposable-camera look back. The afters.am version
 * existed as a plain file input, which is the one thing a room full of people
 * will not do.
 *
 * Ported from vibez.axxes.club/src/components/vibez/camera.tsx and adapted in
 * two ways: it takes its upload permission from the ticket endpoint (which
 * understands guests) rather than from headers, and it reports a caption and a
 * display name alongside the image.
 *
 * Every stage is explicit — live, review, posting, posted — because the failure
 * this is modelled on is a shutter button that looks broken when the upload is
 * refused: the person taps it, nothing visible happens, and they conclude the
 * app is dead.
 */

type Props = {
  eventId: string;
  onPosted: () => void;
  accentColor?: string | null;
};

type Stage = "live" | "review" | "posting" | "posted";

const NAME_KEY = "vz_name";

export function VibezCamera({ eventId, onPosted, accentColor }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [flash, setFlash] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("live");
  const [shot, setShot] = useState<{ url: string; blob: Blob } | null>(null);
  const [flashFx, setFlashFx] = useState(false);
  // Lazily, not in an effect: the remembered name is the initial value, and
  // setting it from an effect would render the empty string first and then
  // immediately re-render with the real one.
  //
  // The try/catch is because Safari in private mode throws on localStorage
  // access. Failing to remember a name is not worth failing to open a camera.
  const [name, setName] = useState(() => {
    try {
      return localStorage.getItem(NAME_KEY) ?? "";
    } catch {
      return "";
    }
  });
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);

  // True when this browser/context cannot open a camera at all — no
  // getUserMedia, or not a secure context (plain http on a LAN, which is exactly
  // what happens when a phone is pointed at a laptop during testing).
  // Derived during render rather than set from an effect, so the fallback
  // message is right on the first paint instead of a render later.
  const cameraUnsupported =
    typeof window !== "undefined" && !navigator.mediaDevices?.getUserMedia;

  // Start (or switch) the live camera.
  useEffect(() => {
    if (stage !== "live" || cameraUnsupported) return;
    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1440 } },
        audio: false,
      })
      .then((stream) => {
        // The effect cleaned up while the permission prompt was open. Stopping
        // the tracks is what turns the camera light off; dropping the reference
        // alone leaves it running on a phone that is now in someone's pocket.
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setCameraError(null);
      })
      .catch(() =>
        setCameraError("Camera access is blocked. You can still use your phone's camera below.")
      );

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [facing, stage, cameraUnsupported]);

  const process = useCallback(
    async (source: CanvasImageSource, w: number, h: number, mirror: boolean) => {
      const canvas = drawSource(source, w, h, mirror);
      if (flash) nightFlash(canvas);
      const blob = await toJpeg(canvas);
      setShot({ url: URL.createObjectURL(blob), blob });
      setStage("review");
    },
    [flash]
  );

  const snap = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    if (flash) {
      setFlashFx(true);
      setTimeout(() => setFlashFx(false), 260);
    }
    navigator.vibrate?.(40);
    await process(video, video.videoWidth, video.videoHeight, facing === "user");
  };

  const fromFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    try {
      const bitmap = await createImageBitmap(file);
      await process(bitmap, bitmap.width, bitmap.height, false);
    } catch {
      setError("That file couldn't be opened as a photo.");
    }
  };


  const { startUpload } = useUploadThing("vibezPost", {
    onClientUploadComplete: async (res) => {
      const fileUrl = res?.[0]?.url || res?.[0]?.ufsUrl;
      if (!fileUrl) {
        setError("The photo didn't finish uploading. Try again.");
        setStage("review");
        return;
      }
      try {
        const postRes = await fetch(`/api/events/${eventId}/vibez`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageUrl: fileUrl,
            caption: caption.trim() || undefined,
            authorName: name.trim() || undefined,
          }),
        });
        const data = await postRes.json().catch(() => ({}));
        if (!postRes.ok) {
          // The bytes are already spent, so this is the one failure we cannot
          // retry for the user. Say what went wrong and leave the shot on screen
          // so they can decide whether to try again.
          setError(data.message || "Couldn't post that photo.");
          setStage("review");
          return;
        }
        setStage("posted");
        navigator.vibrate?.([30, 60, 30]);
        onPosted();
      } catch {
        setError("Couldn't post that photo. Check your connection and try again.");
        setStage("review");
      }
    },
    onUploadError: (e) => {
      setError(e?.message || "Upload failed.");
      setStage("review");
    },
  });

  const post = async () => {
    if (!shot) return;
    try {
      localStorage.setItem(NAME_KEY, name.trim());
    } catch {
      // See the note on the initialiser: not remembering a name is fine.
    }
    setError(null);
    setStage("posting");

    try {
      // Ask the server first. A non-attendee, a banned person and someone over
      // their hourly limit are all refused here, before a single byte moves.
      const ticketRes = await fetch(`/api/events/${eventId}/vibez/upload-ticket`, {
        method: "POST",
      });
      if (!ticketRes.ok) {
        const data = await ticketRes.json().catch(() => ({}));
        setError(data.message || "You can't post to this feed.");
        setStage("review");
        return;
      }
      const { ticket } = await ticketRes.json();
      await startUpload([new File([shot.blob], `vibez-${Date.now()}.jpg`, { type: "image/jpeg" })], {
        eventId,
        ticket,
      });
    } catch {
      setError("Couldn't start the upload. Check your connection.");
      setStage("review");
    }
  };

  const retake = () => {
    if (shot) URL.revokeObjectURL(shot.url);
    setShot(null);
    setCaption("");
    setError(null);
    setStage("live");
  };

  const accent = accentColor || "#ff4d8d";


  if (stage === "posted") {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-black p-8 text-center">
        <div>
          <p className="text-5xl">🎉</p>
          <p className="mt-3 text-xl font-semibold text-white">It&apos;s on the feed!</p>
          <button
            type="button"
            onClick={retake}
            className="mt-6 rounded-full bg-white/15 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Take another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white">
      <header className="flex items-center justify-between px-4 pb-2 pt-[max(env(safe-area-inset-top),12px)]">
        <button
          type="button"
          onClick={retake}
          className="text-sm text-white/60 hover:text-white"
          aria-label="Close the camera"
        >
          ✕
        </button>
        <button
          type="button"
          onClick={() => setFlash(!flash)}
          className="rounded-full px-3 py-1 text-xs font-mono"
          style={{
            background: flash ? accent : "rgba(255,255,255,0.12)",
            color: flash ? "#000" : "#fff",
          }}
          aria-pressed={flash}
        >
          FLASH {flash ? "ON" : "OFF"}
        </button>
      </header>

      <div className="relative flex-1 overflow-hidden bg-black">
        {stage === "live" ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`h-full w-full object-cover ${facing === "user" ? "-scale-x-100" : ""}`}
            />
            {(cameraUnsupported || cameraError) && (
              <div className="absolute inset-0 grid place-items-center bg-black/80 p-6 text-center">
                <p className="text-sm text-white/70">
                  {cameraUnsupported
                    ? "This browser can't open the camera here. Use your phone's camera below."
                    : cameraError}
                </p>
              </div>
            )}
          </>
        ) : (
          shot && (
            // A blob: URL cannot go through next/image, and there is nothing to
            // optimise — it is already in memory.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shot.url} alt="Your photo" className="h-full w-full object-contain" />
          )
        )}

        {/* The shutter's own flash, so the tap feels like it did something even
            though the grade is applied to the still, not to the preview. */}
        <div
          className={`pointer-events-none absolute inset-0 bg-white transition-opacity duration-200 ${flashFx ? "opacity-100" : "opacity-0"}`}
        />
      </div>

      <footer className="px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-4">
        {stage === "live" ? (
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="size-12 rounded-full bg-white/10 text-lg backdrop-blur"
              aria-label="Use phone camera or pick a photo"
            >
              🖼
            </button>
            <button
              type="button"
              onClick={snap}
              disabled={cameraUnsupported || !!cameraError}
              className="size-20 rounded-full border-4 border-white bg-white/20 transition active:scale-90 disabled:opacity-30"
              aria-label="Take photo"
            />
            <button
              type="button"
              onClick={() => setFacing(facing === "user" ? "environment" : "user")}
              className="size-12 rounded-full bg-white/10 text-lg backdrop-blur"
              aria-label="Switch camera"
            >
              ⟲
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => fromFile(e.target.files?.[0])}
            />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                maxLength={40}
                className="w-1/3 rounded-full bg-white/10 px-4 py-2.5 text-sm outline-none placeholder:text-white/40"
                aria-label="Your name"
              />
              <input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Say something…"
                maxLength={140}
                className="flex-1 rounded-full bg-white/10 px-4 py-2.5 text-sm outline-none placeholder:text-white/40"
                aria-label="Caption"
              />
            </div>
            {error && (
              <p className="text-center text-sm text-[#ff8fb5]" role="alert">
                {error}
              </p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={retake}
                disabled={stage === "posting"}
                className="flex-1 rounded-full bg-white/15 py-3.5 font-semibold disabled:opacity-50"
              >
                Retake
              </button>
              <button
                type="button"
                onClick={post}
                disabled={stage === "posting"}
                className="flex-[2] rounded-full py-3.5 font-semibold text-black disabled:opacity-50"
                style={{ background: accent }}
              >
                {stage === "posting" ? "Posting…" : "Post to Vibez"}
              </button>
            </div>
          </div>
        )}
      </footer>
    </div>
  );
}
