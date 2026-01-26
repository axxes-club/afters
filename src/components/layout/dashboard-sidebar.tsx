"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  CalendarDays,
  LayoutDashboard,
  Settings,
  CreditCard,
} from "lucide-react"

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    exact: true, // Only match exact path
  },
  {
    title: "Events",
    href: "/dashboard/events",
    icon: CalendarDays,
  },
  {
    title: "Payouts",
    href: "/dashboard/settings/payouts",
    icon: CreditCard,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    exact: true, // Only match exact path, not /settings/payouts
  },
]

function isNavItemActive(pathname: string, item: typeof navItems[0]) {
  // Exact match
  if (pathname === item.href) return true
  
  // For items marked as exact, don't check startsWith
  if (item.exact) return false
  
  // Check if path starts with this href (for nested routes)
  return pathname.startsWith(item.href + "/")
}

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 border-r bg-muted/30 min-h-[calc(100vh-4rem)]">
        <nav className="flex flex-col gap-2 p-4">
          {navItems.map((item) => {
            const isActive = isNavItemActive(pathname, item)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-lg border-t border-border">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const isActive = isNavItemActive(pathname, item)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs transition-colors min-w-[4rem]",
                  isActive
                    ? "text-[#ff1493]"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive && "text-[#ff1493]")} />
                <span className="truncate">{item.title}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
