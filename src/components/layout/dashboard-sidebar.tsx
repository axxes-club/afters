"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  CalendarDays,
  LayoutDashboard,
  Settings,
  CreditCard,
  ShieldCheck,
  User,
  Music,
  Building2,
  UserCircle,
} from "lucide-react"

const baseNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    exact: true,
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
    exact: true,
  },
]

function isNavItemActive(pathname: string, item: typeof baseNavItems[0]) {
  // Exact match
  if (pathname === item.href) return true

  // For items marked as exact, don't check startsWith
  if (item.exact) return false

  // Check if path starts with this href (for nested routes)
  return pathname.startsWith(item.href + "/")
}

export function DashboardSidebar({
  isSuperAdmin,
  isOrganizer,
  isArtist,
  isPersonal
}: {
  isSuperAdmin?: boolean
  isOrganizer?: boolean
  isArtist?: boolean
  isPersonal?: boolean
}) {
  const pathname = usePathname()

  let items = [...baseNavItems]

  // Add role-specific items
  if (isSuperAdmin) {
    items = [
      ...items,
      {
        title: "Superadmin",
        href: "/superadmin",
        icon: ShieldCheck,
      }
    ]
  }

  // Add profile section header and links
  const profileItems = []
  
  if (isOrganizer) {
    profileItems.push({
      title: "Organizer Profile",
      href: "/dashboard/organizer",
      icon: Building2,
    })
  }

  if (isArtist) {
    profileItems.push({
      title: "Artist Profile",
      href: "/dashboard/artist",
      icon: Music,
    })
  }

  // Always show personal profile option
  profileItems.push({
    title: "Personal Profile",
    href: "/dashboard/account",
    icon: UserCircle,
  })

  items = [...items, ...profileItems]

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 border-r bg-muted/30 min-h-[calc(100vh-4rem)]">
        <nav className="flex flex-col gap-2 p-4">
          {items.map((item) => {
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
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-lg border-t border-border safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-1 overflow-x-auto scrollbar-hide">
          {items.slice(0, 5).map((item) => {
            const isActive = isNavItemActive(pathname, item)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-lg text-[10px] transition-colors min-w-[3.5rem]",
                  isActive
                    ? "text-[#ff1493]"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive && "text-[#ff1493]")} />
                <span className="truncate max-w-[3.5rem]">{item.title.split(" ")[0]}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
