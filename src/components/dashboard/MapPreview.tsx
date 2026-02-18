"use client"

import { useState } from "react"
import { Map, ExternalLink, Maximize2, X } from "lucide-react"

interface MapPreviewProps {
  venueName: string
  venueAddress: string
  city: string
  state?: string | null
  mapStyle?: "dark" | "light" | "satellite" | "streets"
  mapZoom?: number
  className?: string
}

export function MapPreview({
  venueName,
  venueAddress,
  city,
  state,
  mapStyle = "dark",
  mapZoom = 15,
  className = "",
}: MapPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  // Build full address for geocoding
  const fullAddress = `${venueAddress}, ${city}${state ? `, ${state}` : ""}`
  const encodedAddress = encodeURIComponent(fullAddress)
  const encodedVenue = encodeURIComponent(venueName)

  // OpenStreetMap embed URL (no API key needed)
  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=-74.02,40.7,-73.95,40.75&layer=mapnik&marker=${encodedAddress}`
  
  // Use Nominatim-based embed which handles address search
  // This embeds a map centered on the address
  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodedAddress}&t=m&z=${mapZoom}&output=embed&iwloc=near`

  // Google Maps directions URL (for "Open in Maps" button)
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`
  
  // Apple Maps URL (fallback for iOS)
  const appleMapsUrl = `https://maps.apple.com/?q=${encodedAddress}`

  const handleOpenMaps = () => {
    // Detect if iOS for Apple Maps, otherwise use Google Maps
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    window.open(isIOS ? appleMapsUrl : googleMapsUrl, "_blank")
  }

  // Map style filter for dark mode effect on the iframe
  const getMapFilter = () => {
    switch (mapStyle) {
      case "dark":
        return "invert(90%) hue-rotate(180deg) brightness(0.9) contrast(1.1)"
      case "satellite":
        return "none"
      case "light":
      case "streets":
      default:
        return "none"
    }
  }

  return (
    <>
      {/* Main Preview */}
      <div className={`relative border border-white/10 bg-black overflow-hidden group ${className}`}>
        {/* Loading State */}
        {isLoading && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/[0.02] z-10">
            <div className="flex items-center gap-2 text-white/30">
              <Map className="w-5 h-5 animate-pulse" />
              <span className="text-xs font-mono">Loading map...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/[0.02] z-10 p-4">
            <Map className="w-8 h-8 text-white/20 mb-2" />
            <p className="text-xs font-mono text-white/40 text-center mb-3">Unable to load map</p>
            <button
              onClick={handleOpenMaps}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono text-[#ff1493] border border-[#ff1493]/30 hover:bg-[#ff1493]/10 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Open in Maps
            </button>
          </div>
        )}

        {/* Map iframe */}
        <div className="relative w-full h-48">
          <iframe
            src={mapEmbedUrl}
            className="absolute inset-0 w-full h-full border-0"
            style={{ filter: getMapFilter() }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false)
              setHasError(true)
            }}
            title={`Map of ${venueName}`}
            aria-label={`Map showing location of ${venueName} at ${fullAddress}`}
          />
        </div>

        {/* Overlay Controls */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        
        <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="text-xs font-mono text-white/80 truncate max-w-[60%]">
            {venueName}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(true)}
              className="p-1.5 bg-black/60 hover:bg-black/80 border border-white/10 transition-colors"
              title="Expand map"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleOpenMaps}
              className="p-1.5 bg-[#ff1493]/80 hover:bg-[#ff1493] transition-colors"
              title="Open in Maps"
            >
              <ExternalLink className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>

        {/* Venue Label */}
        <div className="absolute top-3 left-3 px-2 py-1 bg-black/70 border border-white/10">
          <p className="text-[10px] font-mono text-white/60 tracking-wider">{city}{state ? `, ${state}` : ""}</p>
        </div>
      </div>

      {/* Expanded Modal */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="relative w-full max-w-4xl h-[70vh] border border-white/10 bg-black">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black to-transparent">
              <div>
                <h3 className="font-mono text-sm font-bold">{venueName}</h3>
                <p className="text-xs text-white/40 font-mono">{fullAddress}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenMaps}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono bg-[#ff1493] hover:bg-[#ff1493]/80 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Open in Maps
                </button>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-2 hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Full Map */}
            <iframe
              src={mapEmbedUrl}
              className="absolute inset-0 w-full h-full border-0"
              style={{ filter: getMapFilter() }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`Map of ${venueName}`}
            />
          </div>
        </div>
      )}
    </>
  )
}
