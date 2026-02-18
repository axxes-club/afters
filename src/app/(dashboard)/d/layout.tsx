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
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import {
  AftieProvider,
  AftieChat,
  AftieTrigger,
  AftieCommandPalette,
  AftieKeyboardListener,
  AftieConsentDialog,
} from "@/components/aftie";
import { FeedbackButton } from "@/components/FeedbackButton";
import { APP_VERSION_DISPLAY } from "@/lib/constants";

const baseNavItems = [
  { href: "/d", label: "BASE", icon: LayoutDashboard, exact: true },
  { href: "/d/events", label: "EVENTS", icon: Calendar, exact: false },
  { href: "/d/settings", label: "SETTINGS", icon: Settings, exact: false },
];

const settingsNavItems = [
  { href: "/d/settings", label: "PROFILE", icon: User, exact: true },
  { href: "/d/settings/appearance", label: "APPEARANCE", icon: Palette, exact: false },
  ...(process.env.NODE_ENV !== "production"
    ? [{ href: "/d/settings/aftie", label: "AFTIE AI", icon: Sparkles, exact: false }]
    : []),
  { href: "/d/settings/notifications", label: "NOTIFICATIONS", icon: Bell, exact: false },
  { href: "/d/settings/security", label: "SECURITY", icon: Shield, exact: false },
  { href: "/d/settings/system", label: "SYSTEM", icon: Info, exact: false },
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

interface UIPreferences {
  sidebarLogoMode: "afters" | "custom" | "hidden";
  sidebarCustomLogoUrl: string | null;
  sidebarCompact: boolean;
  uiAccentColor: string | null;
  uiFontSize: "small" | "normal" | "large";
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [hasEvents, setHasEvents] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [uiPrefs, setUIPrefs] = useState<UIPreferences>({
    sidebarLogoMode: "afters",
    sidebarCustomLogoUrl: null,
    sidebarCompact: false,
    uiAccentColor: null,
    uiFontSize: "normal",
  });

  // Check if user has events to show/hide scanner
  useEffect(() => {
    fetch("/api/organizer/events/count")
      .then((res) => res.json())
      .then((data) => setHasEvents(data.count > 0))
      .catch(() => setHasEvents(false));
  }, []);

  // Check if user is superadmin
  useEffect(() => {
    fetch("/api/user/role")
      .then((res) => res.json())
      .then((data) => setIsSuperAdmin(data.role === "SUPERADMIN"))
      .catch(() => setIsSuperAdmin(false));
  }, []);

  // Load UI preferences
  useEffect(() => {
    fetch("/api/user/preferences")
      .then((res) => res.json())
      .then((data) => {
        if (data.organizerProfile) {
          setUIPrefs({
            sidebarLogoMode: data.organizerProfile.sidebarLogoMode || "afters",
            sidebarCustomLogoUrl: data.organizerProfile.sidebarCustomLogoUrl || null,
            sidebarCompact: data.organizerProfile.sidebarCompact || false,
            uiAccentColor: data.organizerProfile.uiAccentColor || null,
            uiFontSize: data.organizerProfile.uiFontSize || "normal",
          });
        }
      })
      .catch(() => {});
  }, []);

  // Apply accent color CSS variable
  const accentColor = uiPrefs.uiAccentColor || "#ff1493";
  
  // Font size scaling
  const fontSizeClass = {
    small: "text-sm",
    normal: "text-base", 
    large: "text-lg",
  }[uiPrefs.uiFontSize];
  
  // Sidebar width based on compact mode
  const sidebarWidth = uiPrefs.sidebarCompact ? "w-16" : "w-56";
  const mainMargin = uiPrefs.sidebarCompact ? "md:ml-16" : "md:ml-56";

  // Check if we're in settings section
  const isInSettings = pathname.startsWith("/d/settings");

  // Build nav items based on context and permissions
  const mainNavItems = [
    ...baseNavItems,
    ...(hasEvents ? [scannerNavItem] : []),
    ...(isSuperAdmin ? [superadminNavItem] : []),
  ];

  // Use settings nav when in settings, otherwise main nav
  const navItems = isInSettings ? settingsNavItems : mainNavItems;

  return (
    <AftieProvider>
      <div 
        className="min-h-screen bg-black text-white flex overflow-x-hidden"
        style={{ "--accent-color": accentColor } as React.CSSProperties}
      >
        {/* Desktop Sidebar - Hidden on mobile */}
        <aside className={`hidden md:flex ${sidebarWidth} border-r border-white/5 flex-col fixed h-full bg-black/90 backdrop-blur-sm z-50 transition-all duration-200`}>
          {/* Logo */}
          {uiPrefs.sidebarLogoMode !== "hidden" && (
            <div
              id="nav-logo"
              className={`h-16 flex items-center justify-center ${uiPrefs.sidebarCompact ? "px-2" : "px-4"} border-b border-white/5`}
            >
              {uiPrefs.sidebarLogoMode === "custom" && uiPrefs.sidebarCustomLogoUrl ? (
                <Link href="/d" className="flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element -- External user-provided URL */}
                  <img
                    src={uiPrefs.sidebarCustomLogoUrl}
                    alt="Logo"
                    className={`object-contain ${uiPrefs.sidebarCompact ? "max-h-8 max-w-[48px]" : "max-h-10 max-w-[180px]"}`}
                  />
                </Link>
              ) : (
                <Link href="/d" className={`font-headline tracking-wide ${uiPrefs.sidebarCompact ? "text-xl" : "text-2xl"}`}>
                  {uiPrefs.sidebarCompact ? (
                    <span style={{ color: accentColor }}>.</span>
                  ) : (
                    <>AFTERS<span style={{ color: accentColor }}>.</span></>
                  )}
                </Link>
              )}
            </div>
          )}

          {/* Navigation */}
          <nav className={`flex-1 py-4 ${uiPrefs.sidebarCompact ? "px-1" : "px-2"} space-y-1`}>
            {/* Back button when in settings */}
            {isInSettings && (
              <Link
                href="/d"
                className={`flex items-center ${uiPrefs.sidebarCompact ? "justify-center" : "gap-3"} px-3 py-2.5 text-xs font-mono tracking-wider transition-all text-white/50 hover:text-white hover:bg-white/5 mb-2 border-b border-white/5 pb-3`}
                title={uiPrefs.sidebarCompact ? "Back to Base" : undefined}
              >
                <ArrowLeft className="w-4 h-4 flex-shrink-0" />
                {!uiPrefs.sidebarCompact && <span>BASE</span>}
              </Link>
            )}
            
            {/* Section label when in settings */}
            {isInSettings && !uiPrefs.sidebarCompact && (
              <div className="px-3 py-2 text-[10px] font-mono text-white/30 tracking-widest">
                SETTINGS
              </div>
            )}

            {navItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                  flex items-center ${uiPrefs.sidebarCompact ? "justify-center" : "gap-3"} px-3 py-2.5 text-xs font-mono tracking-wider transition-all
                  ${
                    isActive
                      ? "text-black"
                      : "text-white/50 hover:text-white hover:bg-white/5"
                  }
                `}
                  style={isActive ? { backgroundColor: accentColor } : undefined}
                  title={uiPrefs.sidebarCompact ? item.label : undefined}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {!uiPrefs.sidebarCompact && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Date/Time & Status - Hidden when compact */}
          {!uiPrefs.sidebarCompact && (
            <div className="px-3 py-4 border-t border-white/5 space-y-3">
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

          {/* User */}
          <div className={`${uiPrefs.sidebarCompact ? "p-2" : "p-3"} border-t border-white/5`}>
            <div className={`flex items-center ${uiPrefs.sidebarCompact ? "justify-center" : "gap-3"}`} suppressHydrationWarning>
              <div className="flex-shrink-0">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8",
                    },
                  }}
                />
              </div>
              {!uiPrefs.sidebarCompact && (
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-mono text-white/30 truncate">
                    OPERATOR
                  </p>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Mobile Bottom Toolbar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-lg border-t border-white/10 safe-area-bottom">
          <div className="flex items-center justify-around h-16 px-2">
            {/* Show back button on mobile when in settings */}
            {isInSettings && (
              <Link
                href="/d"
                className="flex flex-col items-center justify-center gap-1 px-4 py-2 transition-all text-white/40"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-[10px] font-mono tracking-wider">BASE</span>
              </Link>
            )}
            {navItems.slice(0, isInSettings ? 4 : undefined).map((item) => {
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
        <main className={`flex-1 ${mainMargin} ${fontSizeClass} transition-all duration-200`}>
          {/* Mobile Header */}
          <header className="md:hidden h-14 border-b border-white/5 flex items-center gap-3 px-4 sticky top-0 bg-black/95 backdrop-blur-sm z-40">
            {/* Back button */}
            {pathname !== "/d" && (
              <Link
                href={
                  // Settings subpage -> settings root
                  isInSettings && pathname !== "/d/settings"
                    ? "/d/settings"
                    // Settings root -> dashboard
                    : isInSettings
                    ? "/d"
                    // Events subpage -> events list
                    : pathname.startsWith("/d/events/") && pathname !== "/d/events"
                    ? "/d/events"
                    // Default -> dashboard
                    : "/d"
                }
                className="flex items-center justify-center w-8 h-8 border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>
            )}
            {/* Left-aligned logo + settings indicator */}
            {uiPrefs.sidebarLogoMode === "custom" && uiPrefs.sidebarCustomLogoUrl ? (
              <Link href="/d" className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element -- External user-provided URL */}
                <img
                  src={uiPrefs.sidebarCustomLogoUrl}
                  alt="Logo"
                  className="max-h-8 max-w-[120px] object-contain"
                />
                {isInSettings && (
                  <span className="text-xs font-mono text-white/40">/ SETTINGS</span>
                )}
              </Link>
            ) : uiPrefs.sidebarLogoMode !== "hidden" ? (
              <Link href="/d" className="flex items-center gap-2 font-headline text-xl tracking-wide">
                AFTERS<span style={{ color: accentColor }}>.</span>
                {isInSettings && (
                  <span className="text-xs font-mono text-white/40 ml-1">/ SETTINGS</span>
                )}
              </Link>
            ) : (
              <Link href="/d" className="flex items-center gap-2">
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
