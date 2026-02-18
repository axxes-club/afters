"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { User, Clock, Plus } from "lucide-react"

interface PastArtist {
  name: string
  role?: string
  imageUrl?: string
  socialUrl?: string
  usedCount: number
  lastUsedAt: string
}

interface ArtistAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelectArtist?: (artist: PastArtist) => void
  placeholder?: string
  disabled?: boolean
}

export function ArtistAutocomplete({
  value,
  onChange,
  onSelectArtist,
  placeholder = "Artist name",
  disabled,
}: ArtistAutocompleteProps) {
  const [pastArtists, setPastArtists] = useState<PastArtist[]>([])
  const [suggestions, setSuggestions] = useState<PastArtist[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fetch past artists on mount
  useEffect(() => {
    async function fetchPastArtists() {
      try {
        const res = await fetch("/api/organizer/past-artists")
        const data = await res.json()
        setPastArtists(data.artists || [])
      } catch {
        // Ignore errors
      }
    }
    fetchPastArtists()
  }, [])

  // Filter suggestions based on input
  useEffect(() => {
    if (!value.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSuggestions(pastArtists.slice(0, 5)) // Show top 5 recent
    } else {
      const filtered = pastArtists.filter((artist) =>
        artist.name.toLowerCase().includes(value.toLowerCase())
      )
      setSuggestions(filtered.slice(0, 5))
    }
  }, [value, pastArtists])

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = useCallback(
    (artist: PastArtist) => {
      onChange(artist.name)
      onSelectArtist?.(artist)
      setShowSuggestions(false)
    },
    [onChange, onSelectArtist]
  )

  const listboxId = "artist-suggestions-listbox"

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showSuggestions && suggestions.length > 0}
        aria-controls={listboxId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setShowSuggestions(true)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full h-10 px-3 bg-black border border-white/10 text-white font-mono text-sm focus:border-[#ff1493]/50 focus:outline-none disabled:opacity-50"
      />

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div id={listboxId} role="listbox" aria-label="Artist suggestions" className="absolute z-50 w-full mt-1 bg-black border border-white/10 shadow-lg max-h-60 overflow-auto">
          {!value.trim() && (
            <div className="px-3 py-2 text-[10px] font-mono text-white/30 tracking-widest border-b border-white/5">
              RECENT ARTISTS
            </div>
          )}
          {suggestions.map((artist, index) => (
            <button
              key={`${artist.name}-${index}`}
              type="button"
              role="option"
              aria-selected={false}
              onClick={() => handleSelect(artist)}
              className="w-full px-3 py-2 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
            >
              {artist.imageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={artist.imageUrl}
                  alt={artist.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                  <User className="w-4 h-4 text-white/30" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{artist.name}</div>
                {artist.role && (
                  <div className="text-[10px] text-white/40 truncate">{artist.role}</div>
                )}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-white/30">
                <Clock className="w-3 h-3" />
                <span>{artist.usedCount}x</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Quick-add recent artists section
interface RecentArtistsProps {
  onSelect: (artist: PastArtist) => void
  excludeNames?: string[]
}

export function RecentArtists({ onSelect, excludeNames = [] }: RecentArtistsProps) {
  const [pastArtists, setPastArtists] = useState<PastArtist[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPastArtists() {
      try {
        const res = await fetch("/api/organizer/past-artists")
        const data = await res.json()
        setPastArtists(data.artists || [])
      } catch {
        // Ignore
      } finally {
        setLoading(false)
      }
    }
    fetchPastArtists()
  }, [])

  const availableArtists = pastArtists.filter(
    (a) => !excludeNames.includes(a.name.toLowerCase())
  )

  if (loading || availableArtists.length === 0) return null

  return (
    <div className="mt-3 pt-3 border-t border-white/5">
      <div className="text-[10px] font-mono text-white/30 tracking-widest mb-2">
        QUICK ADD FROM HISTORY
      </div>
      <div className="flex flex-wrap gap-2">
        {availableArtists.slice(0, 6).map((artist) => (
          <button
            key={artist.name}
            type="button"
            aria-label={`Add ${artist.name} to lineup`}
            onClick={() => onSelect(artist)}
            className="flex items-center gap-1.5 px-2 py-1 bg-white/5 border border-white/10 hover:border-[#ff1493]/50 hover:bg-[#ff1493]/5 transition-all text-xs"
          >
            <Plus className="w-3 h-3 text-white/40" />
            <span>{artist.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
