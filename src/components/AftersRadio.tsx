"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Play, Pause, Volume2, VolumeX, Radio } from "lucide-react"

interface RadioTrack {
  id: string
  title: string
  fileUrl: string
  duration: number
  artworkUrl?: string
  artistName: string
  artistSlug: string
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
  const [volume] = useState(0.8)
  const [isLoading, setIsLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showPlayer, setShowPlayer] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchRadioState = useCallback(async () => {
    try {
      const response = await fetch("/api/radio/tracks")
      const data = await response.json()
      
      if (data.isLive && data.currentTrack) {
        setRadioState(data)
        setShowPlayer(true)
        setIsLoading(false)
        return data
      }
      setShowPlayer(false)
      setIsLoading(false)
      return null
    } catch (error) {
      console.error("Failed to fetch radio state:", error)
      setIsLoading(false)
      return null
    }
  }, [])

  useEffect(() => {
    fetchRadioState()
    // Poll every 60 seconds to check for new tracks
    const pollInterval = setInterval(fetchRadioState, 60000)
    return () => clearInterval(pollInterval)
  }, [fetchRadioState])

  useEffect(() => {
    if (isPlaying && radioState?.isLive) {
      syncIntervalRef.current = setInterval(async () => {
        const newState = await fetchRadioState()
        if (newState && audioRef.current) {
          if (newState.currentTrack?.id !== radioState.currentTrack?.id) {
            audioRef.current.src = newState.currentTrack.fileUrl
            audioRef.current.currentTime = newState.currentPosition
            audioRef.current.play().catch(console.error)
          } else {
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

  const togglePlay = async () => {
    if (!radioState?.currentTrack) return

    if (!isPlaying) {
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

  const handleTrackEnd = async () => {
    const freshState = await fetchRadioState()
    if (freshState && audioRef.current) {
      audioRef.current.src = freshState.currentTrack.fileUrl
      audioRef.current.currentTime = freshState.currentPosition
      audioRef.current.play().catch(console.error)
    }
  }

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  if (isLoading || !showPlayer || !radioState?.currentTrack) return null

  return (
    <>
      <audio ref={audioRef} onEnded={handleTrackEnd} className="hidden" />
      
      {/* Minimal Floating Widget */}
      <div 
        className={cn(
          "fixed z-50 transition-all duration-300 ease-in-out",
          isExpanded 
            ? "bottom-4 right-4 w-72" 
            : "bottom-4 right-4"
        )}
      >
        <div 
          className={cn(
            "bg-black/95 backdrop-blur-xl border border-white/10 shadow-2xl transition-all duration-300",
            isExpanded ? "rounded-2xl p-4" : "rounded-full"
          )}
        >
          {isExpanded ? (
            // Expanded View
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4 text-[#ff1493]" />
                  <span className="text-xs font-bold text-[#ff1493]">AFTERS RADIO</span>
                  <span className="text-[8px] px-1 py-0.5 rounded bg-red-500/20 text-red-400 font-medium animate-pulse">LIVE</span>
                </div>
                <button 
                  onClick={() => setIsExpanded(false)}
                  className="text-white/50 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>
              
              <div className="flex items-center gap-3">
                {radioState.currentTrack.artworkUrl ? (
                  <img 
                    src={radioState.currentTrack.artworkUrl}
                    alt=""
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-[#ff1493]/20 flex items-center justify-center">
                    <Radio className="h-5 w-5 text-[#ff1493]" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {radioState.currentTrack.title}
                  </p>
                  <p className="text-xs text-white/50 truncate">
                    {radioState.currentTrack.artistName}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={togglePlay}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ff1493] text-white hover:bg-[#ff1493]/90 transition-all"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4 fill-current" />
                  ) : (
                    <Play className="h-4 w-4 fill-current ml-0.5" />
                  )}
                </button>
                <button
                  onClick={toggleMute}
                  className="text-white/50 hover:text-white transition-colors p-2"
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
              </div>
            </div>
          ) : (
            // Minimal Collapsed View - Just a play button
            <button
              onClick={() => setIsExpanded(true)}
              className={cn(
                "flex items-center justify-center w-14 h-14 rounded-full transition-all",
                isPlaying 
                  ? "bg-[#ff1493] shadow-lg shadow-[#ff1493]/30" 
                  : "bg-[#ff1493]/80 hover:bg-[#ff1493]"
              )}
            >
              <div className="relative">
                {isPlaying ? (
                  <>
                    <Radio className="h-6 w-6 text-white" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  </>
                ) : (
                  <Radio className="h-6 w-6 text-white" />
                )}
              </div>
            </button>
          )}
        </div>
      </div>
    </>
  )
}
