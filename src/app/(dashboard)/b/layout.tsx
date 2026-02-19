"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Calendar,
  LayoutDashboard,
  ScanLine,
  ChevronLeft,
  Shield,
  Settings,
  User,
  Sparkles,
  Bell,
  ArrowLeft,
  Info,
  Palette,
  Plus,
} from "lucide-react";
// Clerk account management is now in Settings > Security
import {
  AftieProvider,
  AftieChat,
  AftieTrigger,
  AftieCommandPalette,
  AftieKeyboardListener,
  AftieConsentDialog,
} from "@/components/aftie";
import { FeedbackButton } from "@/components/FeedbackButton";
import { useUIPreferences } from "@/components/providers";
import { APP_VERSION_DISPLAY } from "@/lib/constants";
import { SidebarEventsList, useResizableSidebar } from "@/components/layout/sidebar";

// Primary navigation (always visible at top)
const primaryNavItems = [
  { href: "/b", label: "OVERVIEW", icon: LayoutDashboard, exact: true },
];

const settingsNavItemMain = { href: "/b/settings", label: "SETTINGS", icon: Settings, exact: false };

const settingsNavItems = [
  { href: "/b/settings", label: "PROFILE", icon: User, exact: true },
  { href: "/b/settings/appearance", label: "APPEARANCE", icon: Palette, exact: false },
  ...(process.env.NODE_ENV !== "production"
    ? [{ href: "/b/settings/aftie", label: "AFTIE AI", icon: Sparkles, exact: false }]
    : []),
  { href: "/b/settings/notifications", label: "NOTIFICATIONS", icon: Bell, exact: false },
  { href: "/b/settings/security", label: "SECURITY", icon: Shield, exact: false },
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { preferences } = useUIPreferences();
  const [hasEvents, setHasEvents] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const loadEventCount = async () => {
      try {
        const res = await fetch("/api/organizer/events/count", { signal: controller.signal });
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
        const res = await fetch("/api/user/role", { signal: controller.signal });
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

  // Mobile: Full nav including Events (since sidebar list isn't visible on mobile)
  const mobileMainNav = [
    ...mobileNavItems,
    ...(hasEvents ? [scannerNavItem] : []),
    settingsNavItemMain,
    ...(isSuperAdmin ? [superadminNavItem] : []),
  ];

  // Mobile nav items
  const mobileNavItemsFinal = isInSettings ? settingsNavItems : mobileMainNav;

  return (
    <AftieProvider>
      <div className="min-h-screen bg-black text-white flex overflow-x-hidden">
        {/* Desktop Sidebar - Hidden on mobile */}
        <aside
          className={`hidden md:flex border-r border-white/5 flex-col fixed h-full bg-black/90 backdrop-blur-sm z-50 ${isResizing ? "" : "transition-all duration-200"}`}
          style={{ width: sidebarWidthPx }}
        >
          {/* Logo with Quick Create */}
          {sidebarLogoMode !== "hidden" && (
            <div
              id="nav-logo"
              className={`h-16 flex items-center justify-between ${sidebarCompact ? "px-2" : "px-4"} border-b border-white/5`}
            >
              {sidebarLogoMode === "custom" && sidebarCustomLogoUrl ? (
                <Link href="/b" className="flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element -- External user-provided URL */}
                  <img
                    src={sidebarCustomLogoUrl}
                    alt="Logo"
                    className={`object-contain ${sidebarCompact ? "max-h-8 max-w-[48px]" : "max-h-10 max-w-[140px]"}`}
                  />
                </Link>
              ) : (
                <Link href="/b" className={`font-headline tracking-wide ${sidebarCompact ? "text-xl" : "text-2xl"}`}>
                  {sidebarCompact ? (
                    <span style={{ color: accentColor }}>.</span>
                  ) : (
                    <>AFTERS<span style={{ color: accentColor }}>.</span></>
                  )}
                </Link>
              )}
              {/* Quick Create Button */}
              {!sidebarCompact && !isInSettings && (
                <Link
                  href="/b/events/new"
                  className="w-7 h-7 flex items-center justify-center rounded bg-white/5 hover:bg-white/10 transition-colors"
                  title="Create Event"
                >
                  <Plus className="w-4 h-4 text-white/50" />
                </Link>
              )}
            </div>
          )}

          {/* Primary Navigation */}
          <nav className={`py-3 ${sidebarCompact ? "px-1" : "px-2"} space-y-1 border-b border-white/5`}>
            {/* Back button when in settings */}
            {isInSettings && (
              <Link
                href="/b"
                className={`flex items-center ${sidebarCompact ? "justify-center" : "gap-3"} px-3 py-2.5 text-xs font-mono tracking-wider transition-all text-white/50 hover:text-white hover:bg-white/5 mb-2 border-b border-white/5 pb-3`}
                title={sidebarCompact ? "Back to Base" : undefined}
              >
                <ArrowLeft className="w-4 h-4 flex-shrink-0" />
                {!sidebarCompact && <span>BASE</span>}
              </Link>
            )}

            {/* Section label when in settings */}
            {isInSettings && !sidebarCompact && (
              <div className="px-3 py-2 text-[10px] font-mono text-white/30 tracking-widest">
                SETTINGS
              </div>
            )}

            {(isInSettings ? settingsNavItems : desktopTopNav).map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                  flex items-center ${sidebarCompact ? "justify-center" : "gap-3"} px-3 py-2.5 text-xs font-mono tracking-wider transition-all
                  ${
                    isActive
                      ? "text-black"
                      : "text-white/50 hover:text-white hover:bg-white/5"
                  }
                `}
                  style={isActive ? { backgroundColor: accentColor } : undefined}
                  title={sidebarCompact ? item.label : undefined}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
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
            <nav className={`py-2 ${sidebarCompact ? "px-1" : "px-2"} space-y-1 border-t border-white/5`}>
              {desktopBottomNav.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center ${sidebarCompact ? "justify-center" : "gap-3"} px-3 py-2.5 text-xs font-mono tracking-wider transition-all
                      ${
                        isActive
                          ? "text-black"
                          : "text-white/50 hover:text-white hover:bg-white/5"
                      }
                    `}
                    style={isActive ? { backgroundColor: accentColor } : undefined}
                    title={sidebarCompact ? item.label : undefined}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    {!sidebarCompact && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Spacer to push footer to bottom when in settings */}
          {isInSettings && <div className="flex-1" />}

          {/* Status Footer */}
          <div className={`${sidebarCompact ? "p-2" : "px-3 py-4"} border-t border-white/5`}>
            {sidebarCompact ? (
              /* Compact: just show online indicator */
              <div className="flex items-center justify-center">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Online" />
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
                    <span className="text-white/20">(v{APP_VERSION_DISPLAY})</span>
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
                style={isResizing ? { backgroundColor: accentColor } : undefined}
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
                className="flex flex-col items-center justify-center gap-1 px-4 py-2 transition-all text-white/40"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-[10px] font-mono tracking-wider">BASE</span>
              </Link>
            )}
            {mobileNavItemsFinal.slice(0, isInSettings ? 4 : undefined).map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center justify-center gap-1 px-4 py-2 transition-all"
                  style={{ color: isActive ? accentColor : "rgba(255,255,255,0.4)" }}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-[10px] font-mono tracking-wider">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Main Content */}
        <main
          className={`flex-1 ml-0 ${isResizing ? "" : "transition-all duration-200"}`}
          style={{ ["--sidebar-width" as string]: `${sidebarWidthPx}px` }}
        >
          <style jsx>{`
            @media (min-width: 768px) {
              main {
                margin-left: var(--sidebar-width) !important;
              }
            }
          `}</style>
          {/* Mobile Header */}
          <header className="md:hidden h-14 border-b border-white/5 flex items-center gap-3 px-4 sticky top-0 bg-black/95 backdrop-blur-sm z-40">
            {/* Back button */}
            {pathname !== "/b" && (
              <Link
                href={
                  // Settings subpage -> settings root
                  isInSettings && pathname !== "/b/settings"
                    ? "/b/settings"
                    // Settings root -> dashboard
                    : isInSettings
                    ? "/b"
                    // Events subpage -> events list
                    : pathname.startsWith("/b/events/") && pathname !== "/b/events"
                    ? "/b/events"
                    // Default -> dashboard
                    : "/b"
                }
                className="flex items-center justify-center w-8 h-8 border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>
            )}
            {/* Left-aligned logo + settings indicator */}
            {sidebarLogoMode === "custom" && sidebarCustomLogoUrl ? (
              <Link href="/b" className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element -- External user-provided URL */}
                <img
                  src={sidebarCustomLogoUrl}
                  alt="Logo"
                  className="max-h-8 max-w-[120px] object-contain"
                />
                {isInSettings && (
                  <span className="text-xs font-mono text-white/40">/ SETTINGS</span>
                )}
              </Link>
            ) : sidebarLogoMode !== "hidden" ? (
              <Link href="/b" className="flex items-center gap-2 font-headline text-xl tracking-wide">
                AFTERS<span style={{ color: accentColor }}>.</span>
                {isInSettings && (
                  <span className="text-xs font-mono text-white/40 ml-1">/ SETTINGS</span>
                )}
              </Link>
            ) : (
              <Link href="/b" className="flex items-center gap-2">
                {isInSettings && (
                  <span className="text-xs font-mono text-white/40">SETTINGS</span>
                )}
              </Link>
            )}
          </header>

          {/* Page Content */}
          <div className="p-4 md:p-6 pb-24 md:pb-6 overflow-x-hidden">
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
