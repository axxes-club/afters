"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth/client";

export interface UIPreferences {
  accentColor: string;
  fontSize: "small" | "normal" | "large";
  sidebarCompact: boolean;
  sidebarLogoMode: "afters" | "afters3x" | "custom" | "hidden";
  sidebarCustomLogoUrl: string | null;
}

const DEFAULT_PREFERENCES: UIPreferences = {
  accentColor: "#ff1493",
  fontSize: "normal",
  sidebarCompact: false,
  sidebarLogoMode: "afters",
  sidebarCustomLogoUrl: null,
};

// Font size scale factors
const FONT_SIZE_SCALES = {
  small: 0.875,   // 87.5% = 14px base
  normal: 1,      // 100% = 16px base
  large: 1.125,   // 112.5% = 18px base
} as const;

interface UIPreferencesContextValue {
  preferences: UIPreferences;
  isLoading: boolean;
  updatePreferences: (updates: Partial<UIPreferences>) => void;
  refreshPreferences: () => Promise<void>;
}

const UIPreferencesContext = createContext<UIPreferencesContextValue | null>(null);

export function UIPreferencesProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const [preferences, setPreferences] = useState<UIPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPreferences = useCallback(async () => {
    if (!isSignedIn) {
      setPreferences(DEFAULT_PREFERENCES);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/user/preferences");
      if (res.ok) {
        const data = await res.json();
        if (data.organizerProfile) {
          setPreferences({
            accentColor: data.organizerProfile.uiAccentColor || DEFAULT_PREFERENCES.accentColor,
            fontSize: data.organizerProfile.uiFontSize || DEFAULT_PREFERENCES.fontSize,
            sidebarCompact: data.organizerProfile.sidebarCompact || DEFAULT_PREFERENCES.sidebarCompact,
            sidebarLogoMode: data.organizerProfile.sidebarLogoMode || DEFAULT_PREFERENCES.sidebarLogoMode,
            sidebarCustomLogoUrl: data.organizerProfile.sidebarCustomLogoUrl || DEFAULT_PREFERENCES.sidebarCustomLogoUrl,
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch UI preferences:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn]);

  // Fetch preferences when auth state changes
  useEffect(() => {
    if (isLoaded) {
      fetchPreferences();
    }
  }, [isLoaded, isSignedIn, fetchPreferences]);

  // Apply CSS variables to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Set accent color
    root.style.setProperty("--accent-color", preferences.accentColor);
    root.style.setProperty("--accent-color-rgb", hexToRgb(preferences.accentColor));
    
    // Set font size scale
    const scale = FONT_SIZE_SCALES[preferences.fontSize];
    root.style.setProperty("--font-scale", String(scale));
    root.style.fontSize = `${scale * 100}%`;
    
  }, [preferences]);

  const updatePreferences = useCallback((updates: Partial<UIPreferences>) => {
    setPreferences(prev => ({ ...prev, ...updates }));
  }, []);

  const refreshPreferences = useCallback(async () => {
    setIsLoading(true);
    await fetchPreferences();
  }, [fetchPreferences]);

  return (
    <UIPreferencesContext.Provider
      value={{
        preferences,
        isLoading,
        updatePreferences,
        refreshPreferences,
      }}
    >
      {children}
    </UIPreferencesContext.Provider>
  );
}

export function useUIPreferences() {
  const context = useContext(UIPreferencesContext);
  if (!context) {
    throw new Error("useUIPreferences must be used within a UIPreferencesProvider");
  }
  return context;
}

// Optional hook for components that may be outside the provider
export function useUIPreferencesOptional() {
  return useContext(UIPreferencesContext);
}

// Helper to convert hex to RGB for alpha support
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "255, 20, 147"; // Default pink
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}
