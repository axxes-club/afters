"use client"

import { useState } from "react"
import Link from "next/link"
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import { Menu, X } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

export function Header() {
  const [open, setOpen] = useState(false)

  const closeMenu = () => setOpen(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="text-xl md:text-2xl font-bold font-display tracking-tight">
          AFTERS<span className="text-[#ff1493]">.</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/events"
            className="text-sm tracking-widest hover:text-[#ff1493] transition-colors"
          >
            EVENTS
          </Link>
          <SignedIn>
            <Link
              href="/dashboard"
              className="text-sm tracking-widest hover:text-[#ff1493] transition-colors"
            >
              DASHBOARD
            </Link>
            <Link
              href="/my-tickets"
              className="text-sm tracking-widest hover:text-[#ff1493] transition-colors"
            >
              TICKETS
            </Link>
          </SignedIn>
        </nav>

        <div className="flex items-center gap-3 md:gap-4">
          <SignedOut>
            {/* Desktop auth buttons */}
            <Link
              href="/sign-in"
              className="hidden md:block text-sm tracking-widest hover:text-[#ff1493] transition-colors"
            >
              SIGN IN
            </Link>
            <Link
              href="/sign-up"
              className="hidden md:block text-sm px-4 py-2 bg-[#ff1493] text-black font-medium hover:bg-[#ff69b4] transition-colors"
            >
              GET STARTED
            </Link>
          </SignedOut>
          <SignedIn>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8 md:w-9 md:h-9 border-2 border-[#ff1493]/50 hover:border-[#ff1493] transition-colors"
                }
              }}
            />
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
                <Link
                  href="/events"
                  onClick={closeMenu}
                  className="flex items-center h-12 px-4 rounded-lg text-sm tracking-widest hover:bg-[#ff1493]/10 hover:text-[#ff1493] transition-colors"
                >
                  EVENTS
                </Link>
                
                <SignedIn>
                  <Link
                    href="/dashboard"
                    onClick={closeMenu}
                    className="flex items-center h-12 px-4 rounded-lg text-sm tracking-widest hover:bg-[#ff1493]/10 hover:text-[#ff1493] transition-colors"
                  >
                    DASHBOARD
                  </Link>
                  <Link
                    href="/my-tickets"
                    onClick={closeMenu}
                    className="flex items-center h-12 px-4 rounded-lg text-sm tracking-widest hover:bg-[#ff1493]/10 hover:text-[#ff1493] transition-colors"
                  >
                    MY TICKETS
                  </Link>
                </SignedIn>

                <SignedOut>
                  <div className="border-t border-[#ff1493]/20 mt-4 pt-4 space-y-2">
                    <Link
                      href="/sign-in"
                      onClick={closeMenu}
                      className="flex items-center justify-center h-12 px-4 rounded-lg text-sm tracking-widest border border-[#ff1493]/30 hover:bg-[#ff1493]/10 transition-colors"
                    >
                      SIGN IN
                    </Link>
                    <Link
                      href="/sign-up"
                      onClick={closeMenu}
                      className="flex items-center justify-center h-12 px-4 rounded-lg text-sm tracking-widest bg-[#ff1493] text-black font-medium hover:bg-[#ff69b4] transition-colors"
                    >
                      GET STARTED
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
