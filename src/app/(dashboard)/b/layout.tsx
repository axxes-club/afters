"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Calendar,
  LayoutDashboard,
  ScanLine,
  ChevronLeft,
  ChevronRight,
  Shield,
  Settings,
  User,
  Sparkles,
  Bell,
  ArrowLeft,
  Info,
  Palette,
  MoreHorizontal,
} from "lucide-react";
// Account management is in Settings > Security
import {
  AftieProvider,
  AftieChat,
  AftieTrigger,
  AftieCommandPalette,
  AftieKeyboardListener,
  AftieConsentDialog,
} from "@/components/aftie";
import { AllAppsSwitcher } from "@/components/all-apps-switcher";
import { OrganizerSwitcher } from "@/components/layout/OrganizerSwitcher";
import { FeedbackButton } from "@/components/FeedbackButton";
import { useUIPreferences } from "@/components/providers";
import { APP_VERSION_DISPLAY } from "@/lib/constants";
import {
  SidebarEventsList,
  useResizableSidebar,
} from "@/components/layout/sidebar";

// Primary navigation (always visible at top)
const primaryNavItems = [
  { href: "/b", label: "OVERVIEW", icon: LayoutDashboard, exact: true },
];

const settingsNavItemMain = {
  href: "/b/settings",
  label: "SETTINGS",
  icon: Settings,
  exact: false,
};

const settingsNavItems = [
  { href: "/b/settings", label: "PROFILE", icon: User, exact: true },
  {
    href: "/b/settings/appearance",
    label: "APPEARANCE",
    icon: Palette,
    exact: false,
  },
  ...(process.env.NODE_ENV !== "production"
    ? [
        {
          href: "/b/settings/aftie",
          label: "AFTIE AI",
          icon: Sparkles,
          exact: false,
        },
      ]
    : []),
  {
    href: "/b/settings/notifications",
    label: "NOTIFICATIONS",
    icon: Bell,
    exact: false,
  },
  {
    href: "/b/settings/security",
    label: "SECURITY",
    icon: Shield,
    exact: false,
  },
  { href: "/b/settings/system", label: "SYSTEM", icon: Info, exact: false },
];

const scannerNavItem = {
  href: "/scan",
  label: "SCANNER",
  icon: ScanLine,
  exact: false,
};
const superadminNavItem = {
  href: "/superadmin",
  label: "ADMIN",
  icon: Shield,
  exact: false,
};

// Mobile nav items (includes Events since sidebar events list isn't visible)
const mobileNavItems = [
  { href: "/b", label: "OVERVIEW", icon: LayoutDashboard, exact: true },
  { href: "/b/events", label: "EVENTS", icon: Calendar, exact: false },
];

import { useIsDesktop } from "@/hooks/useIsDesktop";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { preferences, updatePreferences, isLoading } = useUIPreferences();
  const [hasEvents, setHasEvents] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const isDesktop = useIsDesktop();

  useEffect(() => {
    const controller = new AbortController();
    const loadEventCount = async () => {
      try {
        const res = await fetch("/api/organizer/events/count", {
          signal: controller.signal,
        });
        const data = await res.json();
        setHasEvents(data.count > 0);
      } catch {
        if (!controller.signal.aborted) {
          setHasEvents(false);
        }
      }
    };
    loadEventCount();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const loadRole = async () => {
      try {
        const res = await fetch("/api/user/role", {
          signal: controller.signal,
        });
        const data = await res.json();
        setIsSuperAdmin(data.role === "SUPERADMIN");
      } catch {
        if (!controller.signal.aborted) {
          setIsSuperAdmin(false);
        }
      }
    };
    loadRole();
    return () => controller.abort();
  }, []);

  // Get preferences from context (site-wide provider handles CSS variables)
  const accentColor = preferences.accentColor;
  const sidebarCompact = preferences.sidebarCompact;
  const sidebarLogoMode = preferences.sidebarLogoMode;
  const sidebarCustomLogoUrl = preferences.sidebarCustomLogoUrl;

  // Resizable sidebar
  const {
    width: sidebarWidthPx,
    isResizing,
    handleMouseDown,
    handleDoubleClick,
  } = useResizableSidebar(sidebarCompact);

  // More menu state for mobile nav overflow
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Close more menu on outside click
  useEffect(() => {
    if (!moreMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        moreMenuRef.current &&
        !moreMenuRef.current.contains(e.target as Node)
      ) {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [moreMenuOpen]);

  // Close more menu on route change
  const closeMoreMenu = useCallback(() => setMoreMenuOpen(false), []);
  useEffect(() => {
    // Only close the menu if it's currently open to avoid unnecessary state updates
    if (moreMenuOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Close menu on route change is a valid sync pattern
      closeMoreMenu();
    }
  }, [pathname, closeMoreMenu, moreMenuOpen]);

  // Check if we're in settings section
  const isInSettings = pathname.startsWith("/b/settings");

  // Desktop: Top nav (Overview/BASE) - above events
  const desktopTopNav = [
    ...primaryNavItems, // Overview/BASE
  ];

  // Desktop: Bottom nav (Scanner, Settings, Admin) - below events list
  const desktopBottomNav = [
    ...(hasEvents ? [scannerNavItem] : []),
    settingsNavItemMain,
    ...(isSuperAdmin ? [superadminNavItem] : []),
  ];

  // Mobile: Primary nav items (always visible in bottom bar)
  const mobilePrimaryNav = [
    ...mobileNavItems,
    ...(hasEvents ? [scannerNavItem] : []),
  ];

  // Mobile: Overflow items (hidden behind "More" menu)
  const mobileOverflowNav = [
    settingsNavItemMain,
    ...(isSuperAdmin ? [superadminNavItem] : []),
  ];

  // Mobile settings: primary items (first 3) and overflow (rest)
  const mobileSettingsPrimary = settingsNavItems.slice(0, 3);
  const mobileSettingsOverflow = settingsNavItems.slice(3);

  return (
    <AftieProvider>
      <div className="min-h-screen bg-black text-white flex overflow-x-hidden">
        {/* Desktop Sidebar - Hidden on mobile */}
        <aside
          className={`hidden md:flex border-r border-white/5 flex-col fixed h-full bg-black/90 backdrop-blur-sm z-50 ${isResizing ? "" : "transition-all duration-200"}`}
          style={{ width: sidebarWidthPx }}
        >
          {/* Logo with Quick Create */}
          {!isLoading && sidebarLogoMode !== "hidden" && (
            <div
              id="nav-logo"
              className={`flex border-b border-white/5 ${sidebarCompact ? "h-auto flex-col items-center gap-2 py-3 px-2" : "h-16 flex-row items-center justify-between px-4"} ${sidebarLogoMode === "afters3x" && !sidebarCompact ? "extra-large-logo" : ""}`}
            >
              {sidebarLogoMode === "custom" && sidebarCustomLogoUrl ? (
                <Link
                  href="/b"
                  className={`flex items-center justify-center ${sidebarCompact ? "w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 transition-colors overflow-hidden" : ""}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- External user-provided URL */}
                  <img
                    src={sidebarCustomLogoUrl}
                    alt="Logo"
                    className={`object-contain ${sidebarCompact ? "max-h-7 max-w-[36px]" : "max-h-10 max-w-[140px]"}`}
                  />
                </Link>
              ) : (
                <Link
                  href="/b"
                  className={`font-headline tracking-wide ${sidebarCompact ? "text-lg flex items-center justify-center w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 transition-colors" : sidebarLogoMode === "afters3x" ? "text-4xl" : "text-2xl"}`}
                >
                  {sidebarCompact ? (
                    <span style={{ color: accentColor }} className="font-bold">
                      A
                    </span>
                  ) : (
                    <>
                      AFTERS<span style={{ color: accentColor }}>.</span>
                    </>
                  )}
                </Link>
              )}
              {/* Compact/expand toggle - below logo when collapsed, right of logo when expanded */}
              {!isInSettings && (
                <button
                  type="button"
                  role="switch"
                  aria-checked={sidebarCompact}
                  onClick={() => {
                    const next = !sidebarCompact;
                    updatePreferences({ sidebarCompact: next });
                    fetch("/api/user/preferences", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        sidebarLogoMode: preferences.sidebarLogoMode,
                        sidebarCustomLogoUrl: preferences.sidebarCustomLogoUrl,
                        sidebarCompact: next,
                        uiAccentColor: preferences.accentColor,
                        uiFontSize: preferences.fontSize,
                      }),
                    }).catch(() => {});
                  }}
                  className={`flex items-center justify-center rounded font-mono text-white/60 hover:text-white hover:bg-white/10 transition-colors ${sidebarCompact ? "w-10 h-10" : "w-7 h-7"}`}
                  title={sidebarCompact ? "Expand sidebar" : "Compact sidebar"}
                  style={sidebarCompact ? { color: accentColor } : undefined}
                >
                  {sidebarCompact ? (
                    <ChevronRight className="w-5 h-5" aria-hidden />
                  ) : (
                    <ChevronLeft className="w-4 h-4" aria-hidden />
                  )}
                </button>
              )}
            </div>
          )}

          {/* Primary Navigation */}
          <nav
            className={`py-3 ${sidebarCompact ? "px-2" : "px-2"} space-y-1 border-b border-white/5`}
          >
            {/* Back button when in settings */}
            {isInSettings && (
              <Link
                href="/b"
                className={`flex items-center ${sidebarCompact ? "justify-center w-10 h-10 mx-auto rounded-lg bg-white/5 hover:bg-white/10" : "gap-3 px-3"} py-2.5 text-xs font-mono tracking-wider transition-all text-white/50 hover:text-white mb-2 ${!sidebarCompact && "border-b border-white/5 pb-3"}`}
                title={sidebarCompact ? "Back to Base" : undefined}
              >
                <ArrowLeft
                  className={`${sidebarCompact ? "w-5 h-5" : "w-4 h-4"} flex-shrink-0`}
                />
                {!sidebarCompact && <span>BASE</span>}
              </Link>
            )}

            {/* Section label when in settings */}
            {isInSettings && !sidebarCompact && (
              <div className="px-3 py-2 text-[10px] font-mono text-white/30 tracking-widest">
                SETTINGS
              </div>
            )}

            {
            // 
            (isInSettings ? settingsNavItems : desktopTopNav).map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center ${sidebarCompact ? "justify-center w-10 h-10 mx-auto rounded-lg" : "gap-3 px-3 rounded"} py-2.5 text-xs font-mono tracking-wider transition-all
                    ${
                      isActive
                        ? "text-black"
                        : sidebarCompact
                          ? "text-white/50 hover:text-white bg-white/5 hover:bg-white/10"
                          : "text-white/50 hover:text-white hover:bg-white/5"
                    }
                  `}
                  style={
                    isActive ? { backgroundColor: accentColor } : undefined
                  }
                  title={sidebarCompact ? item.label : undefined}
                >
                  <item.icon
                    className={`${sidebarCompact ? "w-5 h-5" : "w-4 h-4"} flex-shrink-0`}
                  />
                  {!sidebarCompact && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Events List Section - Only show when not in settings */}
          {!isInSettings && (
            <div className="flex-1 overflow-hidden flex flex-col py-3">
              {!sidebarCompact && (
                <div className="px-4 pb-2 text-[10px] font-mono text-white/30 tracking-widest">
                  EVENTS
                </div>
              )}
              <div className="flex-1 overflow-y-auto">
                <SidebarEventsList
                  accentColor={accentColor}
                  compact={sidebarCompact}
                />
              </div>
            </div>
          )}

          {/* Bottom Nav (Overview + Scanner) - Only show when not in settings */}
          {!isInSettings && (
            <nav
              className={`py-3 ${sidebarCompact ? "px-2" : "px-2"} space-y-1 border-t border-white/5`}
            >
              {desktopBottomNav.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center ${sidebarCompact ? "justify-center w-10 h-10 mx-auto rounded-lg" : "gap-3 px-3 rounded"} py-2.5 text-xs font-mono tracking-wider transition-all
                      ${
                        isActive
                          ? "text-black"
                          : sidebarCompact
                            ? "text-white/50 hover:text-white bg-white/5 hover:bg-white/10"
                            : "text-white/50 hover:text-white hover:bg-white/5"
                      }
                    `}
                    style={
                      isActive ? { backgroundColor: accentColor } : undefined
                    }
                    title={sidebarCompact ? item.label : undefined}
                  >
                    <item.icon
                      className={`${sidebarCompact ? "w-5 h-5" : "w-4 h-4"} flex-shrink-0`}
                    />
                    {!sidebarCompact && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Spacer to push footer to bottom when in settings */}
          {isInSettings && <div className="flex-1" />}

          <div className="px-2 pb-2 font-mono text-white/60"><AllAppsSwitcher compact={sidebarCompact} /></div>
          <OrganizerSwitcher compact={sidebarCompact} />

          {/* Status Footer */}
          <div
            className={`${sidebarCompact ? "py-3" : "px-3 py-4"} border-t border-white/5`}
          >
            {sidebarCompact ? (
              /* Compact: show online indicator in a subtle container */
              <div className="flex items-center justify-center">
                <div
                  className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center"
                  title="Online"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                </div>
              </div>
            ) : (
              /* Full: date, status, version, feedback */
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-mono text-white/30">
                  <span>
                    {new Date()
                      .toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })
                      .toUpperCase()}
                  </span>
                  <span className="text-white/10">|</span>
                  <span>
                    {new Date().toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-white/30">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span>ONLINE</span>
                    <span className="text-white/20">
                      (v{APP_VERSION_DISPLAY})
                    </span>
                  </div>
                  <FeedbackButton />
                </div>
              </div>
            )}
          </div>

          {/* Resize Handle */}
          {!sidebarCompact && (
            <div
              className="absolute top-0 -right-2 w-5 h-full cursor-col-resize group z-50 flex items-center justify-end pr-1"
              onMouseDown={handleMouseDown}
              onDoubleClick={handleDoubleClick}
              title="Drag to resize, double-click to reset"
            >
              {/* Visible drag indicator */}
              <div
                className={`w-1 rounded-full transition-all ${
                  isResizing
                    ? "h-24"
                    : "h-12 bg-white/20 group-hover:bg-white/40 group-hover:h-16"
                }`}
                style={
                  isResizing ? { backgroundColor: accentColor } : undefined
                }
              />
            </div>
          )}
        </aside>

        {/* Mobile Bottom Toolbar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-lg border-t border-white/10 safe-area-bottom">
          <div className="flex items-center justify-around h-16 px-2">
            {/* Show back button on mobile when in settings */}
            {isInSettings && (
              <Link
                href="/b"
                className="flex flex-col items-center justify-center gap-1 px-3 py-2 transition-all text-white/40"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-[10px] font-mono tracking-wider">
                  BASE
                </span>
              </Link>
            )}
            {/* Primary nav items */}
            {(isInSettings ? mobileSettingsPrimary : mobilePrimaryNav).map(
              (item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex flex-col items-center justify-center gap-1 px-3 py-2 transition-all"
                    style={{
                      color: isActive ? accentColor : "rgba(255,255,255,0.4)",
                    }}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-[10px] font-mono tracking-wider">
                      {item.label}
                    </span>
                  </Link>
                );
              },
            )}
            <div className="font-mono text-white/60"><AllAppsSwitcher compact /></div>
            <OrganizerSwitcher compact />
            {/* More menu for overflow items */}
            {(isInSettings ? mobileSettingsOverflow : mobileOverflowNav)
              .length > 0 && (
              <div className="relative" ref={moreMenuRef}>
                <button
                  onClick={() => setMoreMenuOpen((prev) => !prev)}
                  className="flex flex-col items-center justify-center gap-1 px-3 py-2 transition-all"
                  style={{
                    color:
                      moreMenuOpen ||
                      (isInSettings
                        ? mobileSettingsOverflow
                        : mobileOverflowNav
                      ).some((item) =>
                        item.exact
                          ? pathname === item.href
                          : pathname.startsWith(item.href),
                      )
                        ? accentColor
                        : "rgba(255,255,255,0.4)",
                  }}
                >
                  <MoreHorizontal className="w-5 h-5" />
                  <span className="text-[10px] font-mono tracking-wider">
                    MORE
                  </span>
                </button>
                {/* Popup menu */}
                {moreMenuOpen && (
                  <div className="absolute bottom-full right-0 mb-2 min-w-[160px] bg-black/95 backdrop-blur-lg border border-white/10 rounded-lg overflow-hidden shadow-xl">
                    {(isInSettings
                      ? mobileSettingsOverflow
                      : mobileOverflowNav
                    ).map((item) => {
                      const isActive = item.exact
                        ? pathname === item.href
                        : pathname.startsWith(item.href);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMoreMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-xs font-mono tracking-wider transition-all"
                          style={{
                            color: isActive
                              ? accentColor
                              : "rgba(255,255,255,0.6)",
                            backgroundColor: isActive
                              ? "rgba(255,255,255,0.05)"
                              : undefined,
                          }}
                        >
                          <item.icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </nav>

        {/* Main Content - inline marginLeft so desktop has no gap beside sidebar */}
        <main
          className={`flex-1 ${isResizing ? "" : "transition-all duration-200"}`}
          style={
            isDesktop
              ? { marginLeft: `${sidebarWidthPx}px`, ["--sidebar-width" as string]: `${sidebarWidthPx}px` }
              : undefined
          }
        >
          {/* Mobile Header */}
          <header
            className={`md:hidden h-14 border-b border-white/5 flex items-center gap-3 px-4 sticky top-0 bg-black/95 backdrop-blur-sm z-40 ${sidebarLogoMode === "afters3x" ? "extra-large-logo" : ""}`}
          >
            {/* Back button */}
            {pathname !== "/b" && (
              <Link
                href={
                  // Settings subpage -> settings root
                  isInSettings && pathname !== "/b/settings"
                    ? "/b/settings"
                    : // Settings root -> dashboard
                      isInSettings
                      ? "/b"
                      : // Events subpage -> events list
                        pathname.startsWith("/b/events/") &&
                          pathname !== "/b/events"
                        ? "/b/events"
                        : // Default -> dashboard
                          "/b"
                }
                className="flex items-center justify-center w-8 h-8 border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>
            )}
            {/* Left-aligned logo + settings indicator */}
            {!isLoading && sidebarLogoMode === "custom" && sidebarCustomLogoUrl ? (
              <Link href="/b" className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element -- External user-provided URL */}
                <img
                  src={sidebarCustomLogoUrl}
                  alt="Logo"
                  className="max-h-8 max-w-[120px] object-contain"
                />
                {isInSettings && (
                  <span className="text-xs font-mono text-white/40">
                    / SETTINGS
                  </span>
                )}
              </Link>
            ) : !isLoading && sidebarLogoMode !== "hidden" ? (
              <Link
                href="/b"
                className={`flex items-center gap-2 font-headline tracking-wide ${sidebarLogoMode === "afters3x" ? "text-2xl" : "text-xl"}`}
              >
                AFTERS<span style={{ color: accentColor }}>.</span>
                {isInSettings && (
                  <span className="text-xs font-mono text-white/40 ml-1">
                    / SETTINGS
                  </span>
                )}
              </Link>
            ) : isLoading ? (
              <div className="h-6 w-24 bg-white/10 animate-pulse rounded" />
            ) : (
              <Link href="/b" className="flex items-center gap-2">
                {isInSettings && (
                  <span className="text-xs font-mono text-white/40">
                    SETTINGS
                  </span>
                )}
              </Link>
            )}
          </header>

          {/* Page Content - even horizontal gutter (consistent padding so no weird gap beside sidebar) */}
          <div className="py-4 md:py-6 md:px-6 pb-24 md:pb-6 overflow-x-hidden max-w-screen min-w-0">
            {children}
          </div>
        </main>

        {/* Aftie AI Assistant */}
        <AftieKeyboardListener />
        <AftieTrigger />
        <AftieChat />
        <AftieCommandPalette />
        <AftieConsentDialog />
      </div>
    </AftieProvider>
  );
}
