"use client"

import Link from "next/link"
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs"

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <Link href="/" className="text-2xl font-bold font-display tracking-tight">
          AFTERS<span className="text-[#ff1493]">.</span>
        </Link>

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

        <div className="flex items-center gap-4">
          <SignedOut>
            <Link
              href="/sign-in"
              className="text-sm tracking-widest hover:text-[#ff1493] transition-colors"
            >
              SIGN IN
            </Link>
            <Link
              href="/sign-up"
              className="text-sm px-4 py-2 bg-[#ff1493] text-black font-medium hover:bg-[#ff69b4] transition-colors"
            >
              GET STARTED
            </Link>
          </SignedOut>
          <SignedIn>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-9 h-9 border-2 border-[#ff1493]/50 hover:border-[#ff1493] transition-colors"
                }
              }}
            />
          </SignedIn>
        </div>
      </div>
    </header>
  )
}
