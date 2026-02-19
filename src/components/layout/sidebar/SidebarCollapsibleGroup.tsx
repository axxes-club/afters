"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";

interface SidebarCollapsibleGroupProps {
  title: string;
  count: number;
  defaultExpanded?: boolean;
  storageKey?: string;
  children: React.ReactNode;
}

// Helper to get initial state from localStorage
function getInitialExpanded(storageKey: string | undefined, defaultExpanded: boolean): boolean {
  if (typeof window === "undefined" || !storageKey) {
    return defaultExpanded;
  }
  const saved = localStorage.getItem(`sidebar-group-${storageKey}`);
  return saved !== null ? saved === "true" : defaultExpanded;
}

export function SidebarCollapsibleGroup({
  title,
  count,
  defaultExpanded = true,
  storageKey,
  children,
}: SidebarCollapsibleGroupProps) {
  const [isExpanded, setIsExpanded] = useState(() =>
    getInitialExpanded(storageKey, defaultExpanded)
  );

  // Save state to localStorage
  const toggleExpanded = () => {
    const newValue = !isExpanded;
    setIsExpanded(newValue);
    if (storageKey) {
      localStorage.setItem(`sidebar-group-${storageKey}`, String(newValue));
    }
  };

  if (count === 0) {
    return null;
  }

  return (
    <div className="space-y-1">
      <button
        onClick={toggleExpanded}
        className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] font-mono text-white/40 hover:text-white/60 tracking-widest transition-colors"
      >
        <span>
          {title} ({count})
        </span>
        <ChevronRight
          className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-90" : ""}`}
        />
      </button>
      {isExpanded && <div className="space-y-0.5">{children}</div>}
    </div>
  );
}
