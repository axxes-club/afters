"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Users,
  CalendarDays,
  Building2,
  ShieldCheck,
  Activity,
  LayoutDashboard,
  Radio,
  Receipt,
  Ticket,
  Languages,
} from "lucide-react"

const navItems = [
  {
    title: "Overview",
    href: "/superadmin",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    title: "Users",
    href: "/superadmin/users",
    icon: Users,
  },
  {
    title: "Events",
    href: "/superadmin/events",
    icon: CalendarDays,
  },
  {
    title: "Orders",
    href: "/superadmin/orders",
    icon: Receipt,
  },
  {
    title: "Tickets",
    href: "/superadmin/tickets",
    icon: Ticket,
  },
  {
    title: "Organizations",
    href: "/superadmin/organizations",
    icon: Building2,
  },
  {
    title: "AFTERS RADIO",
    href: "/superadmin/radio",
    icon: Radio,
  },
  {
    title: "Translations",
    href: "/superadmin/translations",
    icon: Languages,
  },
  {
    title: "Roles & Perms",
    href: "/superadmin/roles",
    icon: ShieldCheck,
  },
  {
    title: "System Status",
    href: "/superadmin/status",
    icon: Activity,
  },
]

export function SuperadminSidebar() {
  const pathname = usePathname()

  return (
    <>
      <aside className="hidden lg:block w-64 border-r bg-muted/30 min-h-[calc(100vh-4rem)]">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-lg tracking-tight">Superadmin</h2>
          <p className="text-xs text-muted-foreground italic text-[#ff1493]">Power corrupts; absolute power is kind of fun.</p>
        </div>
        <nav className="flex flex-col gap-2 p-4">
          {navItems.map((item) => {
            const isActive = item.exact 
              ? pathname === item.href 
              : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors font-medium",
                  isActive
                    ? "bg-[#ff1493] text-white"
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

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-lg border-t border-border">
        <div className="flex items-center justify-around h-16 px-2 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = item.exact 
              ? pathname === item.href 
              : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg text-[10px] transition-colors min-w-[3.5rem]",
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
