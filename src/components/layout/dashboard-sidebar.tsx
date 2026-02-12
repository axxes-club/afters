"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import {
  CalendarDays,
  LayoutDashboard,
  Settings,
  CreditCard,
  Music,
  Building2,
  UserCircle,
  Ticket,
  Users,
  ScanLine,
  LucideIcon,
} from "lucide-react";

interface NavItem {
  titleKey: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
}

const mainNavItems: NavItem[] = [
  {
    titleKey: "dashboard",
    href: "/d",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    titleKey: "events",
    href: "/d/events",
    icon: CalendarDays,
  },
  {
    titleKey: "payouts",
    href: "/d/settings/payouts",
    icon: CreditCard,
  },
  {
    titleKey: "settings",
    href: "/d/settings",
    icon: Settings,
    exact: true,
  },
];

const organizerNavItems: NavItem[] = [
  {
    titleKey: "staff",
    href: "/d/staff",
    icon: Users,
  },
  {
    titleKey: "scanner",
    href: "/scan",
    icon: ScanLine,
  },
];

function isNavItemActive(
  pathname: string,
  item: { href: string; exact?: boolean },
) {
  // Exact match
  if (pathname === item.href) return true;

  // For items marked as exact, don't check startsWith
  if (item.exact) return false;

  // Check if path starts with this href (for nested routes)
  return pathname.startsWith(item.href + "/");
}

export function DashboardSidebar({
  isSuperAdmin,
  isOrganizer,
  isArtist,
  isPersonal,
}: {
  isSuperAdmin?: boolean;
  isOrganizer?: boolean;
  isArtist?: boolean;
  isPersonal?: boolean;
}) {
  const pathname = usePathname();
  const t = useTranslations("sidebar");

  // Users can only have ONE profile type at a time
  // Show the appropriate profile link based on their type
  const profileItems: NavItem[] = [];

  if (isOrganizer) {
    profileItems.push({
      titleKey: "organizerProfile",
      href: "/d/organizer",
      icon: Building2,
    });
  } else if (isArtist) {
    profileItems.push({
      titleKey: "artistProfile",
      href: "/d/artist",
      icon: Music,
    });
  } else if (isPersonal) {
    profileItems.push({
      titleKey: "personalProfile",
      href: "/d/account",
      icon: UserCircle,
    });
  }

  // Combined items for mobile nav (no divider there)
  const allItems = [...mainNavItems, ...profileItems];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 border-r bg-muted/30 min-h-[calc(100vh-4rem)]">
        <nav className="flex flex-col gap-2 p-4">
          {/* Main Navigation */}
          {mainNavItems.map((item) => {
            const isActive = isNavItemActive(pathname, item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted",
                )}
              >
                <item.icon className="h-4 w-4" />
                {t(item.titleKey)}
              </Link>
            );
          })}

          {/* Organizer-only items */}
          {isOrganizer && organizerNavItems.map((item) => {
            const isActive = isNavItemActive(pathname, item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted",
                )}
              >
                <item.icon className="h-4 w-4" />
                {t(item.titleKey)}
              </Link>
            );
          })}

          {/* Divider */}
          <Separator className="my-2" />

          {/* Profile Section Label */}
          <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t("profiles")}
          </p>

          {/* Profile Items */}
          {profileItems.map((item) => {
            const isActive = isNavItemActive(pathname, item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted",
                )}
              >
                <item.icon className="h-4 w-4" />
                {t(item.titleKey)}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-lg border-t border-border safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-1 overflow-x-auto scrollbar-hide">
          {allItems.slice(0, 5).map((item) => {
            const isActive = isNavItemActive(pathname, item);
            const title = t(item.titleKey);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-lg text-[10px] transition-colors min-w-[3.5rem]",
                  isActive
                    ? "text-[#ff1493]"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <item.icon
                  className={cn("h-5 w-5", isActive && "text-[#ff1493]")}
                />
                <span className="truncate max-w-[3.5rem]">
                  {title.split(" ")[0]}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
