"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Play, Pause, Volume2, VolumeX, Radio, User } from "lucide-react"
import Link from "next/link"

interface RadioTrack {
  id: string
  title: string
  fileUrl: string
  duration: number
  artworkUrl?: string
  artistName: string
  artistSlug: string
  artistAvatar?: string
}

interface RadioState {
  tracks: RadioTrack[]
  currentTrack: RadioTrack | null
  currentIndex: number
  currentPosition: number
  serverTime: number
  isLive: boolean
}

export function AftersRadio() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [radioState, setRadioState] = useState<RadioState | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(0.8)
  const [isLoading, setIsLoading] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch radio state from server
  const fetchRadioState = useCallback(async () => {
    try {
      const response = await fetch("/api/radio/tracks")
      const data = await response.json()
      
      if (data.isLive && data.currentTrack) {
        setRadioState(data)
        setIsLoading(false)
        return data
      }
      setIsLoading(false)
      return null
    } catch (error) {
      console.error("Failed to fetch radio state:", error)
      setIsLoading(false)
      return null
    }
  }, [])

  // Initial load
  useEffect(() => {
    fetchRadioState()
  }, [fetchRadioState])

  // Sync playback position periodically
  useEffect(() => {
    if (isPlaying && radioState?.isLive) {
      // Re-sync every 30 seconds to prevent drift
      syncIntervalRef.current = setInterval(async () => {
        const newState = await fetchRadioState()
        if (newState && audioRef.current) {
          // Check if we need to switch tracks
          if (newState.currentTrack?.id !== radioState.currentTrack?.id) {
            audioRef.current.src = newState.currentTrack.fileUrl
            audioRef.current.currentTime = newState.currentPosition
            audioRef.current.play().catch(console.error)
          } else {
            // Check if we've drifted more than 3 seconds
            const drift = Math.abs(audioRef.current.currentTime - newState.currentPosition)
            if (drift > 3) {
              audioRef.current.currentTime = newState.currentPosition
            }
          }
        }
      }, 30000)
    }

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current)
      }
    }
  }, [isPlaying, radioState, fetchRadioState])

  // Handle play/pause
  const togglePlay = async () => {
    if (!radioState?.currentTrack) return

    if (!isPlaying) {
      // Fetch fresh state before playing
      const freshState = await fetchRadioState()
      if (freshState && audioRef.current) {
        audioRef.current.src = freshState.currentTrack.fileUrl
        audioRef.current.currentTime = freshState.currentPosition
        audioRef.current.volume = volume
        audioRef.current.play().catch(console.error)
        setIsPlaying(true)
      }
    } else {
      audioRef.current?.pause()
      setIsPlaying(false)
    }
  }

  // Handle track end - move to next track
  const handleTrackEnd = async () => {
    const freshState = await fetchRadioState()
    if (freshState && audioRef.current) {
      audioRef.current.src = freshState.currentTrack.fileUrl
      audioRef.current.currentTime = freshState.currentPosition
      audioRef.current.play().catch(console.error)
    }
  }

  // Volume controls
  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  if (isLoading) return null
  if (!radioState?.isLive || !radioState.currentTrack) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/90 backdrop-blur-xl supports-[backdrop-filter]:bg-black/70">
      <audio
        ref={audioRef}
        onEnded={handleTrackEnd}
        className="hidden"
      />
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Track Info */}
        <div className="flex w-1/3 items-center gap-4 overflow-hidden">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-[#ff1493]/10 overflow-hidden">
            {radioState.currentTrack.artworkUrl ? (
              <img 
                src={radioState.currentTrack.artworkUrl} 
                alt={radioState.currentTrack.title}
                className="h-full w-full object-cover"
              />
            ) : (
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
            )}
            {isPlaying && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <Radio className="h-4 w-4 text-[#ff1493] animate-pulse" />
              </div>
            )}
          </div>
          <div className="flex flex-col overflow-hidden">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#ff1493]">AFTERS RADIO</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-medium">LIVE</span>
            </div>
            <span className="truncate text-sm font-medium text-white/90">
              {radioState.currentTrack.title}
            </span>
            <Link 
              href={`/a/${radioState.currentTrack.artistSlug}`}
              className="truncate text-xs text-white/50 hover:text-white/70 transition-colors flex items-center gap-1"
            >
              <User className="h-3 w-3" />
              {radioState.currentTrack.artistName}
            </Link>
          </div>
        </div>

        {/* Controls */}
        <div className="flex w-1/3 justify-center gap-6">
          <button
            onClick={togglePlay}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ff1493] text-white hover:bg-[#ff1493]/90 hover:scale-105 transition-all shadow-lg shadow-[#ff1493]/20"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5 fill-current" />
            ) : (
              <Play className="h-5 w-5 fill-current ml-0.5" />
            )}
          </button>
        </div>

        {/* Volume / Extra */}
        <div className="flex w-1/3 items-center justify-end gap-4">
          <span className="text-xs text-white/40 hidden sm:block">
            Everyone hears the same thing
          </span>
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
