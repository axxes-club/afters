"use client";

import { useState, useCallback, useEffect, useRef } from "react";

const STORAGE_KEY = "sidebar-width";
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;
const DEFAULT_WIDTH = 224; // w-56 = 14rem = 224px

export function useResizableSidebar(compact: boolean) {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= MIN_WIDTH && parsed <= MAX_WIDTH) {
        setWidth(parsed);
      }
    }
  }, []);

  // Save width to localStorage when it changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, String(width));
  }, [width]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (compact) return; // Don't allow resize in compact mode
      e.preventDefault();
      setIsResizing(true);
      startXRef.current = e.clientX;
      startWidthRef.current = width;
    },
    [compact, width]
  );

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startXRef.current;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidthRef.current + delta));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
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
  }, [isResizing]);

  // Reset to default on double-click
  const handleDoubleClick = useCallback(() => {
    setWidth(DEFAULT_WIDTH);
  }, []);

  return {
    width: compact ? 64 : width, // 64px = w-16 in compact mode
    isResizing,
    handleMouseDown,
    handleDoubleClick,
    minWidth: MIN_WIDTH,
    maxWidth: MAX_WIDTH,
  };
}
