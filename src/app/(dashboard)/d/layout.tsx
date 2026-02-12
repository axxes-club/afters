"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Calendar,
  LayoutDashboard,
  Zap
} from "lucide-react"
import { UserButton } from "@clerk/nextjs"

const navItems = [
  { href: "/d", label: "CONTROL", icon: LayoutDashboard, exact: true },
  { href: "/d/events", label: "EVENTS", icon: Calendar },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar - Control Room Style */}
      <aside className="w-16 md:w-56 border-r border-white/5 flex flex-col fixed h-full bg-black/90 backdrop-blur-sm z-50">
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-white/5">
          <Link href="/d" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#ff1493] flex items-center justify-center">
              <Zap className="w-5 h-5 text-black" />
            </div>
            <span className="hidden md:block font-mono text-sm font-bold tracking-tight">
              AFTERS<span className="text-[#ff1493]">.</span>
            </span>
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
                <span className="hidden md:block">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Status Indicator */}
        <div className="px-3 py-4 border-t border-white/5">
          <div className="hidden md:flex items-center gap-2 text-[10px] font-mono text-white/30">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span>SYSTEM ONLINE</span>
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
            <div className="hidden md:block flex-1 min-w-0">
              <p className="text-[10px] font-mono text-white/30 truncate">OPERATOR</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-16 md:ml-56">
        {/* Top Bar */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 sticky top-0 bg-black/80 backdrop-blur-sm z-40">
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-white/30">
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}</span>
              <span className="text-white/10">|</span>
              <span>{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
