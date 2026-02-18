"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SignedIn, SignedOut, useClerk, useUser } from "@clerk/nextjs";
import {
  Menu,
  ShieldCheck,
  LogOut,
  User,
  LayoutDashboard,
  ScanLine,
  X,
} from "lucide-react";

const GHOST_BANNER_HEIGHT = 44;

export function Header() {
  const [open, setOpen] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isGhosting, setIsGhosting] = useState(false);
  const { signOut } = useClerk();
  const { user } = useUser();

  useEffect(() => {
    fetch("/api/user/role")
      .then((res) => res.json())
      .then((data) => {
        if (data.role === "SUPERADMIN") {
          setIsSuperAdmin(true);
        }
      })
      .catch(() => {});

    fetch("/api/admin/ghost")
      .then((res) => res.json())
      .then((data) => {
        if (data.ghosting) {
          setIsGhosting(true);
        }
      })
      .catch(() => {});
  }, []);

  const closeMenu = () => setOpen(false);

  return (
    <>
      <header
        className="fixed left-0 right-0 z-50 bg-black border-b border-white/5 font-mono"
        style={{ top: isGhosting ? `${GHOST_BANNER_HEIGHT}px` : "0" }}
      >
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link href="/" className="text-2xl font-headline text-[#ff1493]">
            .
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <SignedIn>
              <Link
                href="/b"
                className="text-xs tracking-wider text-white/50 hover:text-white transition-colors uppercase"
              >
                Dashboard
              </Link>
              <Link
                href="/scan"
                className="text-xs tracking-wider text-white/50 hover:text-white transition-colors uppercase flex items-center gap-1.5"
              >
                <ScanLine className="h-3 w-3" />
                Scan
              </Link>
              {isSuperAdmin && (
                <Link
                  href="/superadmin"
                  className="text-xs tracking-wider text-[#ff1493] hover:text-[#ff69b4] transition-colors flex items-center gap-1"
                >
                  <ShieldCheck className="h-3 w-3" />
                  Admin
                </Link>
              )}
            </SignedIn>
          </nav>

          <div className="flex items-center gap-3">
            <SignedOut>
              <Link
                href="/sign-in"
                className="hidden md:block text-xs tracking-wider text-white/50 hover:text-white transition-colors uppercase"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="hidden md:block text-xs px-4 py-2 bg-[#ff1493] text-black font-medium hover:bg-[#ff69b4] transition-colors uppercase tracking-wider"
              >
                Sign Up
              </Link>
            </SignedOut>
            <SignedIn>
              {/* User Menu Desktop */}
              <div className="hidden md:flex items-center gap-3">
                <Link
                  href="/b/account"
                  className="flex items-center gap-2 px-3 py-1.5 border border-white/10 hover:border-white/20 transition-colors"
                >
                  <div
                    className="w-6 h-6 flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: '#ff149320', color: '#ff1493' }}
                  >
                    {user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-xs text-white/70">{user?.firstName || 'Account'}</span>
                </Link>
                <button
                  onClick={() => signOut({ redirectUrl: "/" })}
                  className="p-2 text-white/30 hover:text-white/60 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </SignedIn>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setOpen(true)}
              className="md:hidden p-2 text-white/50 hover:text-white transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/80"
            onClick={closeMenu}
          />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-black border-l border-white/5 font-mono">
            <div className="flex items-center justify-between h-14 px-4 border-b border-white/5">
              <span className="text-2xl font-headline text-[#ff1493]">.</span>
              <button
                onClick={closeMenu}
                className="p-2 text-white/50 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="p-4 space-y-1">
              <SignedIn>
                <Link
                  href="/b"
                  onClick={closeMenu}
                  className="flex items-center gap-3 h-11 px-3 text-xs tracking-wider text-white/70 hover:text-white hover:bg-white/5 transition-colors uppercase"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                <Link
                  href="/scan"
                  onClick={closeMenu}
                  className="flex items-center gap-3 h-11 px-3 text-xs tracking-wider text-white/70 hover:text-white hover:bg-white/5 transition-colors uppercase"
                >
                  <ScanLine className="h-4 w-4" />
                  Scan
                </Link>
                <Link
                  href="/b/account"
                  onClick={closeMenu}
                  className="flex items-center gap-3 h-11 px-3 text-xs tracking-wider text-white/70 hover:text-white hover:bg-white/5 transition-colors uppercase"
                >
                  <User className="h-4 w-4" />
                  Account
                </Link>
                {isSuperAdmin && (
                  <Link
                    href="/superadmin"
                    onClick={closeMenu}
                    className="flex items-center gap-3 h-11 px-3 text-xs tracking-wider text-[#ff1493] hover:bg-[#ff1493]/10 transition-colors uppercase"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Superadmin
                  </Link>
                )}
                <div className="border-t border-white/5 mt-4 pt-4">
                  <button
                    onClick={() => {
                      closeMenu();
                      signOut({ redirectUrl: "/" });
                    }}
                    className="flex items-center gap-3 w-full h-11 px-3 text-xs tracking-wider text-red-400 hover:bg-red-500/10 transition-colors uppercase"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </SignedIn>

              <SignedOut>
                <div className="space-y-2 pt-2">
                  <Link
                    href="/sign-in"
                    onClick={closeMenu}
                    className="flex items-center justify-center h-11 text-xs tracking-wider border border-white/10 text-white/70 hover:text-white hover:border-white/20 transition-colors uppercase"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/sign-up"
                    onClick={closeMenu}
                    className="flex items-center justify-center h-11 text-xs tracking-wider bg-[#ff1493] text-black font-medium hover:bg-[#ff69b4] transition-colors uppercase"
                  >
                    Sign Up
                  </Link>
                </div>
              </SignedOut>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
