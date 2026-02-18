"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { User, Key, Sparkles, CreditCard, Bell, Shield } from "lucide-react"

const settingsNav = [
  { href: "/d/settings", label: "PROFILE", icon: User, exact: true },
  { href: "/d/settings/api-keys", label: "API KEYS", icon: Key },
  { href: "/d/settings/aftie", label: "AFTIE AI", icon: Sparkles },
  { href: "/d/settings/billing", label: "BILLING", icon: CreditCard },
  { href: "/d/settings/notifications", label: "NOTIFICATIONS", icon: Bell },
  { href: "/d/settings/security", label: "SECURITY", icon: Shield },
]

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-mono font-bold tracking-tight">
          SETTINGS
        </h1>
        <p className="text-white/40 text-sm font-mono mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* Settings Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <nav className="lg:w-48 shrink-0">
          {/* Mobile: Horizontal scroll */}
          <div className="lg:hidden max-w-[100vw] -mx-4 px-4">
            <div 
              className="flex items-center gap-1 border-b border-white/10 overflow-x-auto scrollbar-hide pb-px"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {settingsNav.map((item) => {
                const isActive = item.exact 
                  ? pathname === item.href 
                  : pathname.startsWith(item.href)
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2.5 text-xs font-mono tracking-wider transition-colors border-b-2 -mb-[1px] whitespace-nowrap flex items-center gap-1.5 ${
                      isActive
                        ? "text-[#ff1493] border-[#ff1493]"
                        : "text-white/40 border-transparent hover:text-white/60"
                    }`}
                  >
                    <item.icon className="w-3.5 h-3.5" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Desktop: Vertical sidebar */}
          <div className="hidden lg:block space-y-1">
            {settingsNav.map((item) => {
              const isActive = item.exact 
                ? pathname === item.href 
                : pathname.startsWith(item.href)
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 text-xs font-mono tracking-wider transition-all border-l-2 ${
                    isActive
                      ? "text-[#ff1493] border-[#ff1493] bg-[#ff1493]/5"
                      : "text-white/50 border-transparent hover:text-white hover:bg-white/5 hover:border-white/20"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  )
}
