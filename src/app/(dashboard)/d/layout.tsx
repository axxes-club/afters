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
import { APP_VERSION } from "@/lib/constants";

const baseNavItems = [
  { href: "/d", label: "CONTROL", icon: LayoutDashboard, exact: true },
  { href: "/d/events", label: "EVENTS", icon: Calendar, exact: false },
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [hasEvents, setHasEvents] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

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

  // Build nav items based on user permissions
  const navItems = [
    ...baseNavItems,
    ...(hasEvents ? [scannerNavItem] : []),
    ...(isSuperAdmin ? [superadminNavItem] : []),
  ];

  return (
    <AftieProvider>
      <div className="min-h-screen bg-black text-white flex overflow-x-hidden">
        {/* Desktop Sidebar - Hidden on mobile */}
        <aside className="hidden md:flex w-56 border-r border-white/5 flex-col fixed h-full bg-black/90 backdrop-blur-sm z-50">
          {/* Logo */}
          <div
            id="nav-logo"
            className="h-16 flex items-center justify-center px-4 border-b border-white/5"
          >
            <Link href="/d">
              AFTERS
              <span className="font-headline text-2xl text-[#ff1493]">.</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4 px-2 space-y-1">
            {navItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                  flex items-center gap-3 px-3 py-2.5 text-xs font-mono tracking-wider transition-all
                  ${
                    isActive
                      ? "bg-[#ff1493] text-black"
                      : "text-white/50 hover:text-white hover:bg-white/5"
                  }
                `}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Date/Time & Status */}
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
                <span className="text-white/20">(v{APP_VERSION})</span>
              </div>
              <FeedbackButton />
            </div>
          </div>

          {/* User */}
          <div className="p-3 border-t border-white/5">
            <div className="flex items-center gap-3" suppressHydrationWarning>
              <div className="flex-shrink-0">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8",
                    },
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-mono text-white/30 truncate">
                  OPERATOR
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Bottom Toolbar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-lg border-t border-white/10 safe-area-bottom">
          <div className="flex items-center justify-around h-16 px-2">
            {navItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                  flex flex-col items-center justify-center gap-1 px-4 py-2 transition-all
                  ${isActive ? "text-[#ff1493]" : "text-white/40"}
                `}
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
        <main className="flex-1 md:ml-56">
          {/* Mobile Header */}
          <header className="md:hidden h-14 border-b border-white/5 flex items-center gap-3 px-4 sticky top-0 bg-black/95 backdrop-blur-sm z-40">
            {/* Back button */}
            {pathname !== "/d" && (
              <Link
                href={
                  pathname.startsWith("/d/events/") && pathname !== "/d/events"
                    ? "/d/events"
                    : "/d"
                }
                className="flex items-center justify-center w-8 h-8 border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>
            )}
            {/* Left-aligned logo */}
            <Link href="/d">
              <span className="font-headline text-2xl text-[#ff1493]">.</span>
            </Link>
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
