"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

const STORAGE_KEY = "sidebar-width";
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;
const DEFAULT_WIDTH = 224; // w-56 = 14rem = 224px
const EVENT = "sidebar-width-change";

function readStoredWidth(): number {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return DEFAULT_WIDTH;
  const parsed = parseInt(saved, 10);
  if (isNaN(parsed) || parsed < MIN_WIDTH || parsed > MAX_WIDTH) return DEFAULT_WIDTH;
  return parsed;
}

// Notified whenever this tab writes the width, so the store below stays in sync
// across every component using the hook rather than only the one that wrote it.
function notify() {
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener(EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export function useResizableSidebar(compact: boolean) {
  // The server has no localStorage, so the first render must assume the default
  // on both sides; useSyncExternalStore handles that handshake, which is why
  // the saved width no longer has to be pushed into state from an effect.
  const storedWidth = useSyncExternalStore(subscribe, readStoredWidth, () => DEFAULT_WIDTH);

  // Live value while dragging. Null whenever we are not resizing, so the stored
  // width is what the sidebar shows at rest.
  const [dragWidth, setDragWidth] = useState<number | null>(null);

  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const width = dragWidth ?? storedWidth;

  const setWidth = useCallback((next: number) => {
    localStorage.setItem(STORAGE_KEY, String(next));
    notify();
  }, []);

  useEffect(() => {
    if (dragWidth === null) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startXRef.current;
      setDragWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidthRef.current + delta)));
    };

    const handleMouseUp = () => {
      // Commit the final width on release, then stop overriding the stored one.
      setWidth(dragWidth);
      setDragWidth(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    // Add cursor style to body during resize
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [dragWidth, setWidth]);

  const isResizing = dragWidth !== null;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (compact) return; // Don't allow resize in compact mode
      e.preventDefault();
      startXRef.current = e.clientX;
      startWidthRef.current = width;
      setDragWidth(width);
    },
    [compact, width]
  );

  // Reset to default on double-click
  const handleDoubleClick = useCallback(() => {
    setWidth(DEFAULT_WIDTH);
  }, [setWidth]);

  return {
    width: compact ? 64 : width, // 64px = w-16 in compact mode
    isResizing,
    handleMouseDown,
    handleDoubleClick,
    minWidth: MIN_WIDTH,
    maxWidth: MAX_WIDTH,
  };
}
