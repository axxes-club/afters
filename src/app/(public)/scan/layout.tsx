"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Calendar,
  LayoutDashboard,
  ScanLine,
} from "lucide-react"
import { UserButton, SignedIn } from "@clerk/nextjs"

const navItems = [
  { href: "/d", label: "CONTROL", icon: LayoutDashboard, exact: true },
  { href: "/d/events", label: "EVENTS", icon: Calendar },
  { href: "/scan", label: "SCANNER", icon: ScanLine },
]

export default function ScanLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-black text-white flex overflow-x-hidden">
      {/* Desktop Sidebar - Hidden on mobile, shown on desktop */}
      <SignedIn>
        <aside className="hidden md:flex w-56 border-r border-white/5 flex-col fixed h-full bg-black/90 backdrop-blur-sm z-50">
          {/* Logo */}
          <div className="h-16 flex items-center justify-center px-4 border-b border-white/5">
            <Link href="/d">
              <span className="font-headline text-2xl text-[#ff1493]">.</span>
            </Link>
          </div>

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
                      ? "bg-[#ff1493] text-black"
                      : "text-white/50 hover:text-white hover:bg-white/5"
                    }
                  `}
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
            <div className="flex items-center gap-2 text-[10px] font-mono text-white/30">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span>SCANNER MODE</span>
            </div>
          </div>

          {/* User */}
          <div className="p-3 border-t border-white/5">
            <div className="flex items-center gap-3">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8",
                  }
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-mono text-white/30 truncate">OPERATOR</p>
              </div>
            </div>
          </div>
        </aside>
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
          `}</style>
        </SignedIn>
        {children}
      </main>
    </div>
  )
}
