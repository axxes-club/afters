"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Volume2, VolumeX, Radio, ChevronUp, ChevronDown, Clock } from "lucide-react"
import Link from "next/link"

interface RadioTrack {
  id: string
  title: string
  fileUrl: string
  duration: number
  artworkUrl?: string
  artistName: string
  artistSlug: string
}

interface TimelineTrack {
  id: string
  title: string
  artistName: string
  artistSlug: string
  duration: number
  artworkUrl?: string
  startTime: number
  isPlaying: boolean
}

interface RadioState {
  tracks: RadioTrack[]
  currentTrack: RadioTrack | null
  nextTrack: RadioTrack | null
  currentIndex: number
  currentPosition: number
  serverTime: number
  isLive: boolean
  timeline: TimelineTrack[]
}

export function AftersRadio() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [radioState, setRadioState] = useState<RadioState | null>(null)
  const [isMuted, setIsMuted] = useState(true) // Start muted by default
  const [volume] = useState(0.8)
  const [isLoading, setIsLoading] = useState(true)
  const [showTimeline, setShowTimeline] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [trackProgress, setTrackProgress] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const hasStartedRef = useRef(false)

  const fetchRadioState = useCallback(async () => {
    try {
      const response = await fetch("/api/radio/tracks")
      const data = await response.json()
      
      if (data.isLive && data.currentTrack) {
        setRadioState(data)
        setTrackProgress(data.currentPosition)
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

  // Auto-start playback (muted) when component loads
  useEffect(() => {
    const startPlayback = async () => {
      if (hasStartedRef.current) return
      const state = await fetchRadioState()
      if (state && audioRef.current) {
        hasStartedRef.current = true
        audioRef.current.src = state.currentTrack.fileUrl
        audioRef.current.currentTime = state.currentPosition
        audioRef.current.volume = volume
        audioRef.current.muted = true // Start muted
        audioRef.current.play().catch(console.error)
        setIsPlaying(true)
      }
    }
    startPlayback()
  }, [fetchRadioState, volume])

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
      // Update track progress
      if (radioState?.currentTrack && isPlaying) {
        setTrackProgress(prev => {
          const newProgress = prev + 1
          if (newProgress >= radioState.currentTrack!.duration) {
            fetchRadioState()
            return 0
          }
          return newProgress
        })
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [radioState, isPlaying, fetchRadioState])

  useEffect(() => {
    const pollInterval = setInterval(fetchRadioState, 30000)
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

  const handleTrackEnd = async () => {
    const freshState = await fetchRadioState()
    if (freshState && audioRef.current) {
      audioRef.current.src = freshState.currentTrack.fileUrl
      audioRef.current.currentTime = freshState.currentPosition
      audioRef.current.play().catch(console.error)
    }
  }

  const toggleMute = async () => {
    if (!audioRef.current) return
    
    // If not playing yet, start playback
    if (!isPlaying) {
      const freshState = await fetchRadioState()
      if (freshState) {
        audioRef.current.src = freshState.currentTrack.fileUrl
        audioRef.current.currentTime = freshState.currentPosition
        audioRef.current.volume = volume
        audioRef.current.muted = false
        audioRef.current.play().catch(console.error)
        setIsPlaying(true)
        setIsMuted(false)
      }
    } else {
      // Toggle mute
      audioRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const formatScheduleTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (isLoading || !radioState?.currentTrack) return null

  const progressPercent = (trackProgress / radioState.currentTrack.duration) * 100

  return (
    <>
      <audio ref={audioRef} onEnded={handleTrackEnd} className="hidden" />
      
      {/* Always-open floating player */}
      <div className="fixed bottom-4 right-4 z-50 w-80">
        <div className="bg-black/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          {/* Main Player */}
          <div className="p-4">
            {/* Header with time */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-[#ff1493]" />
                <span className="text-xs font-bold text-[#ff1493]">AFTERS RADIO</span>
                <span className="text-[8px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-medium animate-pulse">LIVE</span>
              </div>
              <div className="flex items-center gap-1 text-white/50 text-xs">
                <Clock className="h-3 w-3" />
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
            </div>

            {/* Current Track */}
            <div className="flex items-center gap-3 mb-3">
              <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-[#ff1493]/10 flex-shrink-0">
                {radioState.currentTrack.artworkUrl ? (
                  <img 
                    src={radioState.currentTrack.artworkUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Radio className="h-6 w-6 text-[#ff1493]" />
                  </div>
                )}
                {isPlaying && !isMuted && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="flex items-end gap-[2px] h-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="w-[3px] bg-[#ff1493] rounded-t-[1px] animate-music-pulse"
                          style={{ animationDelay: `${i * 0.1}s` }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {radioState.currentTrack.title}
                </p>
                {radioState.currentTrack.artistSlug && radioState.currentTrack.artistSlug !== "unknown" ? (
                  <Link 
                    href={`/a/${radioState.currentTrack.artistSlug}`}
                    className="text-xs text-white/60 hover:text-[#ff1493] transition-colors truncate block"
                  >
                    {radioState.currentTrack.artistName}
                  </Link>
                ) : (
                  <p className="text-xs text-white/60 truncate">
                    {radioState.currentTrack.artistName}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1 text-[10px] text-white/40">
                  <span>{formatTime(trackProgress)}</span>
                  <span>/</span>
                  <span>{formatTime(radioState.currentTrack.duration)}</span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mb-3">
              <div 
                className="h-full bg-[#ff1493] transition-all duration-1000 ease-linear"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <button
                onClick={toggleMute}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full transition-all",
                  !isMuted 
                    ? "bg-[#ff1493] shadow-lg shadow-[#ff1493]/30" 
                    : "bg-white/10 hover:bg-white/20"
                )}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4 text-white" />
                ) : (
                  <Volume2 className="h-4 w-4 text-white" />
                )}
              </button>

              <div className="flex items-center gap-3">
                <span className="text-[10px] text-white/40">
                  {isMuted ? "Click to listen" : "Playing"}
                </span>
                <button
                  onClick={() => setShowTimeline(!showTimeline)}
                  className="text-white/50 hover:text-white transition-colors p-2"
                >
                  {showTimeline ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Timeline Dropdown */}
          {showTimeline && radioState.timeline && (
            <div className="border-t border-white/10 max-h-64 overflow-y-auto">
              <div className="p-3 pb-1">
                <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Schedule</p>
              </div>
              <div className="px-3 pb-3 space-y-1">
                {radioState.timeline.slice(0, 8).map((track, i) => (
                  <div 
                    key={`${track.id}-${i}`}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg transition-colors",
                      track.isPlaying ? "bg-[#ff1493]/20" : "hover:bg-white/5"
                    )}
                  >
                    <span className="text-[10px] text-white/40 w-12 flex-shrink-0">
                      {formatScheduleTime(track.startTime)}
                    </span>
                    <div className="w-6 h-6 rounded bg-white/5 flex-shrink-0 overflow-hidden">
                      {track.artworkUrl ? (
                        <img src={track.artworkUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Radio className="h-2 w-2 text-white/30" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-xs truncate",
                        track.isPlaying ? "text-[#ff1493] font-medium" : "text-white/70"
                      )}>
                        {track.title}
                      </p>
                      {track.artistSlug && track.artistSlug !== "unknown" ? (
                        <Link 
                          href={`/a/${track.artistSlug}`}
                          className="text-[10px] text-white/40 hover:text-[#ff1493] transition-colors truncate block"
                        >
                          {track.artistName}
                        </Link>
                      ) : (
                        <p className="text-[10px] text-white/40 truncate">{track.artistName}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-white/30">
                      {formatTime(track.duration)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
