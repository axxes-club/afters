"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react"

export function AftersRadio() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [tracks, setTracks] = useState<string[]>([])
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    console.log("AFTERS VERSION 0.0.1")
    async function fetchTracks() {
      try {
        const response = await fetch("/api/radio/tracks")
        const data = await response.json()
        if (data.tracks && data.tracks.length > 0) {
          setTracks(data.tracks)
          setIsLoaded(true)
        }
      } catch (error) {
        console.error("Failed to fetch tracks:", error)
      }
    }
    fetchTracks()
  }, [])

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch((e) => {
          console.error("Audio play failed:", e)
          setIsPlaying(false)
        })
      } else {
        audioRef.current.pause()
      }
    }
  }, [isPlaying, currentTrackIndex])

  const togglePlay = () => {
    if (tracks.length === 0) return
    setIsPlaying(!isPlaying)
  }

  const handleNext = () => {
    if (tracks.length === 0) return
    setCurrentTrackIndex((prev) => (prev + 1) % tracks.length)
  }

  const handlePrev = () => {
    if (tracks.length === 0) return
    setCurrentTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length)
  }

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleTrackEnd = () => {
    handleNext()
  }

  const getCurrentTrackName = () => {
    if (tracks.length === 0) return ""
    const path = tracks[currentTrackIndex]
    const filename = path.split("/").pop() || ""
    return decodeURIComponent(filename.replace(/\.[^/.]+$/, ""))
  }

  if (!isLoaded || tracks.length === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/80 backdrop-blur-xl supports-[backdrop-filter]:bg-black/50">
      <audio
        ref={audioRef}
        src={tracks[currentTrackIndex]}
        onEnded={handleTrackEnd}
        className="hidden"
      />
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Track Info */}
        <div className="flex w-1/3 items-center gap-4 overflow-hidden">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-[#ff1493]/10">
            <div className="flex items-end gap-[2px] h-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "w-[3px] bg-[#ff1493] rounded-t-[1px]",
                    isPlaying ? "animate-music-pulse" : "h-[2px]"
                  )}
                  style={{
                    animationDelay: `${i * 0.1}s`,
                    height: isPlaying ? undefined : "2px",
                  }}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs font-bold text-[#ff1493]">AFTERS RADIO</span>
            <span className="truncate text-sm font-medium text-white/90">
              {getCurrentTrackName()}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex w-1/3 justify-center gap-6">
          <button
            onClick={handlePrev}
            className="text-white/50 hover:text-white transition-colors"
            aria-label="Previous track"
          >
            <SkipBack className="h-5 w-5" />
          </button>
          
          <button
            onClick={togglePlay}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black hover:scale-105 transition-transform"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5 fill-current" />
            ) : (
              <Play className="h-5 w-5 fill-current ml-0.5" />
            )}
          </button>
          
          <button
            onClick={handleNext}
            className="text-white/50 hover:text-white transition-colors"
            aria-label="Next track"
          >
            <SkipForward className="h-5 w-5" />
          </button>
        </div>

        {/* Volume / Extra */}
        <div className="flex w-1/3 justify-end">
          <button
            onClick={toggleMute}
            className="text-white/50 hover:text-white transition-colors"
          >
            {isMuted ? (
              <VolumeX className="h-5 w-5" />
            ) : (
              <Volume2 className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}