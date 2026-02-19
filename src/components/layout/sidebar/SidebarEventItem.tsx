"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SidebarEvent } from "@/app/api/organizer/events/sidebar/route";

interface SidebarEventItemProps {
  event: SidebarEvent;
  accentColor: string;
  compact?: boolean;
}

export function SidebarEventItem({
  event,
  accentColor,
  compact = false,
}: SidebarEventItemProps) {
  const pathname = usePathname();
  const isActive = pathname.startsWith(`/b/event-editor/${event.id}`);

  // Format date as "MAR 15" or "Today" / "Tomorrow"
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    if (isToday) return "TODAY";
    if (isTomorrow) return "TOMORROW";

    return date
      .toLocaleDateString("en-US", { month: "short", day: "numeric" })
      .toUpperCase();
  };

  if (compact) {
    return (
      <Link
        href={`/b/event-editor/${event.id}/overview`}
        className={`
          block w-10 h-12 rounded-lg overflow-hidden transition-all
          ${isActive ? "ring-2 ring-offset-1 ring-offset-black" : "opacity-80 hover:opacity-100 hover:scale-105"}
        `}
        style={
          isActive
            ? ({ "--tw-ring-color": accentColor } as React.CSSProperties)
            : undefined
        }
        title={`${event.title} - ${formatDate(event.startsAt)}`}
      >
        {event.flyerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.flyerUrl}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-sm font-headline font-bold bg-gradient-to-br from-white/10 to-white/5 border border-white/10"
            style={{ color: `${accentColor}80` }}
          >
            {event.title.charAt(0).toUpperCase()}
          </div>
        )}
      </Link>
    );
  }

  return (
    <Link
      href={`/b/event-editor/${event.id}/overview`}
      className={`
        flex items-center gap-3 px-2 py-2 rounded transition-all group
        ${isActive ? "text-black" : "text-white/70 hover:text-white hover:bg-white/5"}
      `}
      style={isActive ? { backgroundColor: accentColor } : undefined}
    >
      {/* Flyer thumbnail */}
      <div className="w-8 h-10 rounded overflow-hidden flex-shrink-0 bg-white/5">
        {event.flyerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.flyerUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] font-mono text-white/30">
            {event.title.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Event info */}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-mono truncate tracking-wide">
          {event.title.toUpperCase()}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className={`text-[10px] font-mono ${isActive ? "text-black/60" : "text-white/40"}`}
          >
            {formatDate(event.startsAt)}
          </span>
          {!event.isPublished && (
            <span
              className={`text-[9px] font-mono px-1 py-0.5 rounded ${
                isActive ? "bg-black/20 text-black/70" : "bg-yellow-500/20 text-yellow-500"
              }`}
            >
              DRAFT
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
