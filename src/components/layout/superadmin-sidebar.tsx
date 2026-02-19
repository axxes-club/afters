"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Users,
  CalendarDays,
  ShieldCheck,
  Activity,
  LayoutDashboard,
  Receipt,
  Ticket,
  Languages,
  BadgeCheck,
  Settings,
  MessageSquare,
} from "lucide-react";

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
    title: "Events",
    href: "/superadmin/events",
    icon: CalendarDays,
  },
  {
    title: "Verification",
    href: "/superadmin/verification",
    icon: BadgeCheck,
  },
  {
    title: "Feedback",
    href: "/superadmin/feedback",
    icon: MessageSquare,
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
  {
    title: "Site Settings",
    href: "/superadmin/settings",
    icon: Settings,
  },
];

export function SuperadminSidebar() {
  const pathname = usePathname();

  return (
    <>
      <aside className="hidden lg:block w-64 border-r border-white/10 bg-black/80 backdrop-blur-xl min-h-[calc(100vh-4rem)]">
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <h2 className="font-mono font-bold text-lg tracking-tight text-white">SUPERADMIN</h2>
          </div>
          <p className="text-[10px] text-primary/80 font-mono mt-1 tracking-wider">
            Power corrupts; absolute power is kind of fun.
          </p>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 text-xs font-mono tracking-wide transition-all",
                  isActive
                    ? "bg-primary text-black font-bold"
                    : "text-white/60 hover:bg-white/5 hover:text-white border border-transparent hover:border-white/10",
                )}
              >
                <item.icon className={cn("h-4 w-4", isActive ? "text-black" : "text-primary")} />
                {item.title.toUpperCase()}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-4 left-0 right-0 px-4">
          <div className="border border-primary/20 bg-primary/5 p-3">
            <p className="text-[8px] font-mono text-primary/60 tracking-widest">SYSTEM STATUS</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              <span className="text-[10px] font-mono text-green-400">OPERATIONAL</span>
            </div>
          </div>
        </div>
      </aside>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-xl border-t border-primary/20 safe-area-bottom">
        <div className="flex items-center h-16 px-1 overflow-x-auto scrollbar-hide">
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            // Shorten long titles for mobile
            const shortTitle =
              item.title === "Translations"
                ? "i18n"
                : item.title === "Roles & Perms"
                  ? "Roles"
                  : item.title === "System Status"
                    ? "Status"
                    : item.title === "Verification"
                      ? "Verify"
                      : item.title;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 text-[9px] font-mono transition-colors min-w-[3rem] shrink-0",
                  isActive
                    ? "text-primary"
                    : "text-white/40 hover:text-white",
                )}
              >
                <item.icon
                  className={cn("h-5 w-5", isActive && "text-primary")}
                />
                <span className="truncate uppercase tracking-wider">{shortTitle}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
