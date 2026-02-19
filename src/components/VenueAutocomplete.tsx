"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Clock } from "lucide-react";

interface VenueSuggestion {
  venueName: string;
  venueAddress: string;
  city: string;
  state: string | null;
  count: number;
}

interface VenueAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelectVenue: (venue: VenueSuggestion) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
  onBlur?: () => void;
  "aria-label"?: string;
  "aria-required"?: boolean;
  "aria-describedby"?: string;
}

export function VenueAutocomplete({
  value,
  onChange,
  onSelectVenue,
  placeholder = "e.g., The Warehouse",
  className = "",
  error = false,
  onBlur,
  ...ariaProps
}: VenueAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<VenueSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch venue history on mount
  useEffect(() => {
    const fetchVenues = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/organizer/venues");
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
        }
      } catch {
        // Ignore errors, suggestions are optional
      } finally {
        setLoading(false);
      }
    };

    fetchVenues();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter suggestions based on input
  const filteredSuggestions = suggestions.filter(
    (s) =>
      s.venueName.toLowerCase().includes(value.toLowerCase()) ||
      s.venueAddress.toLowerCase().includes(value.toLowerCase())
  );

  const handleSelect = (venue: VenueSuggestion) => {
    onChange(venue.venueName);
    onSelectVenue(venue);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setShowDropdown(true);
  };

  const handleFocus = () => {
    if (suggestions.length > 0) {
      setShowDropdown(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={() => {
          // Delay to allow click on suggestion
          setTimeout(() => {
            onBlur?.();
          }, 150);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`h-12 md:h-14 bg-black font-mono text-sm md:text-base placeholder:text-white/20 focus:ring-0 ${
          error
            ? "border-red-500 focus:border-red-500"
            : "border-white/10 focus:border-white/30"
        } ${className}`}
        autoComplete="off"
        {...ariaProps}
      />

      {/* Suggestions dropdown */}
      {showDropdown && filteredSuggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-black border border-white/10 rounded-md shadow-lg max-h-60 overflow-y-auto">
          <div className="px-3 py-2 text-[10px] font-mono text-white/30 tracking-widest border-b border-white/5">
            RECENT VENUES
          </div>
          {filteredSuggestions.map((venue, index) => (
            <button
              key={`${venue.venueName}-${venue.venueAddress}-${index}`}
              type="button"
              onClick={() => handleSelect(venue)}
              className="w-full px-3 py-3 text-left hover:bg-white/5 transition-colors flex items-start gap-3 border-b border-white/5 last:border-0"
            >
              <MapPin className="w-4 h-4 text-white/30 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-mono text-sm text-white truncate">
                  {venue.venueName}
                </div>
                <div className="font-mono text-xs text-white/40 truncate mt-0.5">
                  {venue.venueAddress}, {venue.city}{venue.state ? `, ${venue.state}` : ""}
                </div>
              </div>
              {venue.count > 1 && (
                <div className="flex items-center gap-1 text-[10px] font-mono text-white/30">
                  <Clock className="w-3 h-3" />
                  {venue.count}x
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Loading indicator */}
      {loading && showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-black border border-white/10 rounded-md shadow-lg p-4">
          <div className="flex items-center gap-2 text-white/40 font-mono text-sm">
            <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            Loading venues...
          </div>
        </div>
      )}
    </div>
  );
}
