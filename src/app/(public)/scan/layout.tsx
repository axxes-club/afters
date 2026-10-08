"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import {
  Calendar,
  LayoutDashboard,
  ScanLine,
  ChevronLeft,
  Settings,
} from "lucide-react"
import { UserButton, SignedIn } from "@/components/auth/session"
import { FeedbackButton } from "@/components/FeedbackButton"
import { APP_VERSION_DISPLAY } from "@/lib/constants"

const navItems = [
  { href: "/b", label: "BASE", icon: LayoutDashboard, exact: true },
  { href: "/b/events", label: "EVENTS", icon: Calendar },
  { href: "/b/settings", label: "SETTINGS", icon: Settings },
  { href: "/scan", label: "SCANNER", icon: ScanLine },
]

interface UIPreferences {
  sidebarLogoMode: "afters" | "afters3x" | "custom" | "hidden"
  sidebarCustomLogoUrl: string | null
  uiAccentColor: string | null
}

export default function ScanLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)
  const [uiPrefs, setUIPrefs] = useState<UIPreferences>({
    sidebarLogoMode: "afters",
    sidebarCustomLogoUrl: null,
    uiAccentColor: null,
  })

  useEffect(() => {
    const controller = new AbortController()
    const loadPreferences = async () => {
      try {
        const res = await fetch("/api/user/preferences", { signal: controller.signal })
        const data = await res.json()
        if (data.organizerProfile) {
          setUIPrefs({
            sidebarLogoMode: data.organizerProfile.sidebarLogoMode || "afters",
            sidebarCustomLogoUrl: data.organizerProfile.sidebarCustomLogoUrl || null,
            uiAccentColor: data.organizerProfile.uiAccentColor || null,
          })
        }
      } catch {
        // Use defaults on error
      } finally {
        setIsLoading(false)
      }
    }
    loadPreferences()
    return () => controller.abort()
  }, [])

  // Apply accent color CSS variable
  const accentColor = uiPrefs.uiAccentColor || "#ff1493"

  return (
    <div className="min-h-screen bg-black text-white flex overflow-x-hidden">
      {/* Desktop Sidebar - Hidden on mobile, shown on desktop */}
      <SignedIn>
        <aside className="hidden md:flex w-56 border-r border-white/5 flex-col fixed h-full bg-black/90 backdrop-blur-sm z-50">
          {/* Logo */}
          {!isLoading && uiPrefs.sidebarLogoMode !== "hidden" && (
            <div
              id="nav-logo"
              className="h-16 flex items-center justify-center px-4 border-b border-white/5"
            >
              {uiPrefs.sidebarLogoMode === "custom" && uiPrefs.sidebarCustomLogoUrl ? (
                <Link href="/b" className="flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element -- External user-provided URL */}
                  <img
                    src={uiPrefs.sidebarCustomLogoUrl}
                    alt="Logo"
                    className="max-h-10 max-w-[180px] object-contain"
                  />
                </Link>
              ) : (
                <Link href="/b" className="font-headline text-2xl tracking-wide">
                  AFTERS<span style={{ color: accentColor }}>.</span>
                </Link>
              )}
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 py-4 px-2 space-y-1">
            {navItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 text-xs font-mono tracking-wider transition-all
                    ${isActive
                      ? "text-black"
                      : "text-white/50 hover:text-white hover:bg-white/5"
                    }
                  `}
                  style={isActive ? { backgroundColor: accentColor } : undefined}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Date/Time & Status */}
          <div className="px-3 py-4 border-t border-white/5 space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-mono text-white/30">
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}</span>
              <span className="text-white/10">|</span>
              <span>{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] font-mono text-white/30">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span>SCANNER</span>
                <span className="text-white/20">(v{APP_VERSION_DISPLAY})</span>
              </div>
              <FeedbackButton />
            </div>
          </div>

          {/* User */}
          <div className="p-3 border-t border-white/5">
            <div className="flex items-center gap-3" suppressHydrationWarning>
              <div className="flex-shrink-0">
                <UserButton />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-mono text-white/30 truncate">OPERATOR</p>
              </div>
            </div>
          </div>
        </aside>
      </SignedIn>

      {/* Mobile Bottom Toolbar */}
      <SignedIn>
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-lg border-t border-white/10 safe-area-bottom">
          <div className="flex items-center justify-around h-16 px-2">
            {navItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href)

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
              )
            })}
          </div>
        </nav>
      </SignedIn>

      {/* Mobile Header */}
      <SignedIn>
        <header className="md:hidden fixed top-0 left-0 right-0 h-14 border-b border-white/5 flex items-center gap-3 px-4 bg-black/95 backdrop-blur-sm z-40">
          {/* Back button */}
          {pathname !== "/scan" && (
            <Link
              href="/scan"
              className="flex items-center justify-center w-8 h-8 border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
          )}
          {/* Logo */}
          {!isLoading && uiPrefs.sidebarLogoMode === "custom" && uiPrefs.sidebarCustomLogoUrl ? (
            <Link href="/b" className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- External user-provided URL */}
              <img
                src={uiPrefs.sidebarCustomLogoUrl}
                alt="Logo"
                className="max-h-8 max-w-[120px] object-contain"
              />
            </Link>
          ) : !isLoading && uiPrefs.sidebarLogoMode !== "hidden" ? (
            <Link href="/b" className="flex items-center gap-2 font-headline text-xl tracking-wide">
              AFTERS<span style={{ color: accentColor }}>.</span>
            </Link>
          ) : isLoading ? (
            <div className="h-6 w-24 bg-white/10 animate-pulse rounded" />
          ) : null}
          <span className="text-xs font-mono text-white/40 ml-auto">SCANNER</span>
        </header>
      </SignedIn>

      {/* Main Content */}
      <main className="flex-1 md:ml-0 scan-layout-main">
        <SignedIn>
          <style jsx global>{`
            @media (min-width: 768px) {
              .scan-layout-main {
                margin-left: 14rem !important;
              }
            }
            @media (max-width: 767px) {
              .scan-layout-main {
                padding-top: 3.5rem;
                padding-bottom: 4rem;
              }
            }
          `}</style>
        </SignedIn>
        {children}
      </main>
    </div>
  )
}
