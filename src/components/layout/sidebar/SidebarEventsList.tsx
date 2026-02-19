"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Plus, Calendar } from "lucide-react";
import Link from "next/link";
import type { SidebarEventsResponse, SidebarEvent } from "@/app/api/organizer/events/sidebar/route";
import { SidebarEventItem } from "./SidebarEventItem";
import { SidebarCollapsibleGroup } from "./SidebarCollapsibleGroup";

interface SidebarEventsListProps {
  accentColor: string;
  compact?: boolean;
}

export function SidebarEventsList({
  accentColor,
  compact = false,
}: SidebarEventsListProps) {
  const [data, setData] = useState<SidebarEventsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const fetchEvents = async () => {
      try {
        const res = await fetch("/api/organizer/events/sidebar", {
          signal: controller.signal,
        });
        const json = await res.json();
        setData(json);
      } catch {
        if (!controller.signal.aborted) {
          setData({ upcoming: [], past: [], total: 0 });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
    return () => controller.abort();
  }, []);

  // Filter events by search query
  const filteredData = useMemo(() => {
    if (!data) return null;
    if (!searchQuery.trim()) return data;

    const query = searchQuery.toLowerCase();
    const filterFn = (event: SidebarEvent) =>
      event.title.toLowerCase().includes(query);

    return {
      upcoming: data.upcoming.filter(filterFn),
      past: data.past.filter(filterFn),
      total: data.total,
    };
  }, [data, searchQuery]);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-2 px-2">
        {compact ? (
          <div className="flex flex-col gap-2 items-center py-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-10 h-12 rounded-lg bg-white/5 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <>
            <div className="h-8 rounded bg-white/5 animate-pulse" />
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-14 rounded bg-white/5 animate-pulse"
              />
            ))}
          </>
        )}
      </div>
    );
  }

  const hasEvents = (filteredData?.upcoming.length ?? 0) > 0 || (filteredData?.past.length ?? 0) > 0;
  const hasAnyEvents = (data?.total ?? 0) > 0;

  // Compact mode rendering
  if (compact) {
    if (!hasEvents) {
      return (
        <div className="flex justify-center py-2">
          <Link
            href="/b/events/new"
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-dashed border-white/10 hover:border-white/20"
            title="Create Event"
          >
            <Plus className="w-5 h-5 text-white/40" />
          </Link>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2 items-center py-2">
        {filteredData?.upcoming.map((event) => (
          <SidebarEventItem
            key={event.id}
            event={event}
            accentColor={accentColor}
            compact
          />
        ))}
        {filteredData?.past.slice(0, 3).map((event) => (
          <SidebarEventItem
            key={event.id}
            event={event}
            accentColor={accentColor}
            compact
          />
        ))}
        <Link
          href="/b/events"
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors mt-1"
          title="View All Events"
        >
          <Calendar className="w-5 h-5 text-white/40" />
        </Link>
      </div>
    );
  }

  // Full mode rendering
  return (
    <div className="flex flex-col h-full">
      {/* Search bar - only show if there are events */}
      {hasAnyEvents && (
        <div className="px-2 mb-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/30" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 pl-7 text-xs font-mono text-white placeholder:text-white/30 focus:outline-none focus:border-white/20"
            />
          </div>
        </div>
      )}

      {/* Events list */}
      <div className="flex-1 overflow-y-auto space-y-3 px-1">
        {!hasEvents ? (
          <div className="text-center py-6">
            <Calendar className="w-8 h-8 mx-auto text-white/20 mb-3" />
            <p className="text-xs font-mono text-white/40 mb-3">
              {searchQuery ? "No events found" : "No events yet"}
            </p>
            {!searchQuery && (
              <Link
                href="/b/events/new"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-black rounded transition-colors"
                style={{ backgroundColor: accentColor }}
              >
                <Plus className="w-3 h-3" />
                Create Event
              </Link>
            )}
          </div>
        ) : (
          <>
            <SidebarCollapsibleGroup
              title="UPCOMING"
              count={filteredData?.upcoming.length ?? 0}
              defaultExpanded={true}
              storageKey="upcoming"
            >
              {filteredData?.upcoming.map((event) => (
                <SidebarEventItem
                  key={event.id}
                  event={event}
                  accentColor={accentColor}
                />
              ))}
            </SidebarCollapsibleGroup>

            <SidebarCollapsibleGroup
              title="PAST"
              count={filteredData?.past.length ?? 0}
              defaultExpanded={false}
              storageKey="past"
            >
              {filteredData?.past.map((event) => (
                <SidebarEventItem
                  key={event.id}
                  event={event}
                  accentColor={accentColor}
                />
              ))}
            </SidebarCollapsibleGroup>
          </>
        )}
      </div>

      {/* View all link when filtered or many events */}
      {hasAnyEvents && (
        <div className="px-2 pt-2 border-t border-white/5">
          <Link
            href="/b/events"
            className="flex items-center justify-center gap-2 px-2 py-1.5 text-[10px] font-mono text-white/40 hover:text-white/60 tracking-wider transition-colors"
          >
            VIEW ALL EVENTS ({data?.total})
          </Link>
        </div>
      )}
    </div>
  );
}
