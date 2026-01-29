"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { SignedIn, SignedOut, useClerk, useUser } from "@clerk/nextjs"
import { Menu, ShieldCheck, LogOut, Settings, User, LayoutDashboard } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"
import { useTranslations } from "next-intl"

export function Header() {
  const t = useTranslations('nav')
  const [open, setOpen] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const { signOut } = useClerk()
  const { user } = useUser()

  useEffect(() => {
    fetch("/api/user/role")
      .then(res => res.json())
      .then(data => {
        if (data.role === "SUPERADMIN") {
          setIsSuperAdmin(true)
        }
      })
      .catch(() => {})
  }, [])

  const closeMenu = () => setOpen(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="text-xl md:text-2xl font-bold font-display tracking-tight">
          AFTERS<span className="text-[#ff1493]">.</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <SignedIn>
            <Link
              href="/dashboard"
              className="text-sm tracking-widest hover:text-[#ff1493] transition-colors uppercase"
            >
              {t('dashboard')}
            </Link>
          </SignedIn>
          <Link
            href="/events"
            className="text-sm tracking-widest hover:text-[#ff1493] transition-colors uppercase"
          >
            {t('events')}
          </Link>
          <SignedIn>
            <Link
              href="/my-tickets"
              className="text-sm tracking-widest hover:text-[#ff1493] transition-colors uppercase"
            >
              {t('myTickets')}
            </Link>
            {isSuperAdmin && (
              <Link
                href="/superadmin"
                className="text-sm tracking-widest text-[#ff1493] hover:text-[#ff69b4] transition-colors flex items-center gap-1"
              >
                <ShieldCheck className="h-4 w-4" />
                ADMIN
              </Link>
            )}
          </SignedIn>
          <LanguageSwitcher />
        </nav>

        <div className="flex items-center gap-3 md:gap-4">
          {/* Mobile Language Switcher */}
          <div className="md:hidden">
            <LanguageSwitcher />
          </div>
          
          <SignedOut>
            {/* Desktop auth buttons */}
            <Link
              href="/sign-in"
              className="hidden md:block text-sm tracking-widest hover:text-[#ff1493] transition-colors uppercase"
            >
              {t('signIn')}
            </Link>
            <Link
              href="/sign-up"
              className="hidden md:block text-sm px-4 py-2 bg-[#ff1493] text-black font-medium hover:bg-[#ff69b4] transition-colors"
            >
              {t('signUp')}
            </Link>
          </SignedOut>
          <SignedIn>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="focus:outline-none focus:ring-2 focus:ring-[#ff1493]/50 rounded-full">
                  <Avatar className="h-8 w-8 md:h-9 md:w-9 border-2 border-[#ff1493]/50 hover:border-[#ff1493] transition-colors cursor-pointer">
                    <AvatarImage src={user?.imageUrl} />
                    <AvatarFallback className="bg-[#ff1493]/10 text-[#ff1493] text-sm">
                      {user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.emailAddresses?.[0]?.emailAddress}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="cursor-pointer">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/account" className="cursor-pointer">
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings" className="cursor-pointer">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                {isSuperAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/superadmin" className="cursor-pointer text-[#ff1493]">
                        <ShieldCheck className="h-4 w-4 mr-2" />
                        Superadmin
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => signOut({ redirectUrl: "/" })}
                  className="cursor-pointer text-red-500 focus:text-red-500"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SignedIn>

          {/* Mobile Menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-background/95 backdrop-blur-lg border-l border-[#ff1493]/20">
              <SheetHeader className="border-b border-[#ff1493]/20 pb-4">
                <SheetTitle className="text-left font-display text-xl tracking-tight">
                  AFTERS<span className="text-[#ff1493]">.</span>
                </SheetTitle>
              </SheetHeader>
              
              <nav className="flex flex-col gap-1 mt-6">
                <SignedIn>
                  <Link
                    href="/dashboard"
                    onClick={closeMenu}
                    className="flex items-center h-12 px-4 rounded-lg text-sm tracking-widest hover:bg-[#ff1493]/10 hover:text-[#ff1493] transition-colors uppercase"
                  >
                    {t('dashboard')}
                  </Link>
                </SignedIn>
                <Link
                  href="/events"
                  onClick={closeMenu}
                  className="flex items-center h-12 px-4 rounded-lg text-sm tracking-widest hover:bg-[#ff1493]/10 hover:text-[#ff1493] transition-colors uppercase"
                >
                  {t('events')}
                </Link>
                <SignedIn>
                  <Link
                    href="/my-tickets"
                    onClick={closeMenu}
                    className="flex items-center h-12 px-4 rounded-lg text-sm tracking-widest hover:bg-[#ff1493]/10 hover:text-[#ff1493] transition-colors uppercase"
                  >
                    {t('myTickets')}
                  </Link>
                  {isSuperAdmin && (
                    <Link
                      href="/superadmin"
                      onClick={closeMenu}
                      className="flex items-center h-12 px-4 rounded-lg text-sm tracking-widest text-[#ff1493] hover:bg-[#ff1493]/10 transition-colors gap-2"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      SUPERADMIN
                    </Link>
                  )}
                </SignedIn>

                <SignedOut>
                  <div className="border-t border-[#ff1493]/20 mt-4 pt-4 space-y-2">
                    <Link
                      href="/sign-in"
                      onClick={closeMenu}
                      className="flex items-center justify-center h-12 px-4 rounded-lg text-sm tracking-widest border border-[#ff1493]/30 hover:bg-[#ff1493]/10 transition-colors uppercase"
                    >
                      {t('signIn')}
                    </Link>
                    <Link
                      href="/sign-up"
                      onClick={closeMenu}
                      className="flex items-center justify-center h-12 px-4 rounded-lg text-sm tracking-widest bg-[#ff1493] text-black font-medium hover:bg-[#ff69b4] transition-colors uppercase"
                    >
                      {t('signUp')}
                    </Link>
                  </div>
                </SignedOut>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
