"use client"

import Link from "next/link"
import { LogOut, Settings } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { signOut, useAuth, useUser } from "@/lib/auth/client"

/** Renders its children only once the session is known to exist. */
export function SignedIn({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth()
  return isLoaded && isSignedIn ? <>{children}</> : null
}

/** Renders its children only once the session is known to be absent. */
export function SignedOut({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth()
  return isLoaded && !isSignedIn ? <>{children}</> : null
}

/** The signed-in person's avatar, opening a small account menu. */
export function UserButton({ className }: { className?: string }) {
  const { user } = useUser()
  if (!user) return null
  const initial = (user.firstName?.[0] || user.email[0] || "?").toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className={cn("w-8 h-8 flex items-center justify-center overflow-hidden bg-[#ff1493]/20 text-[#ff1493] text-xs font-mono font-bold outline-none focus-visible:ring-2 focus-visible:ring-[#ff1493]", className)}
      >
        {user.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          initial
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 rounded-none bg-black border-white/10 font-mono">
        <DropdownMenuLabel className="text-xs font-normal text-white/50 truncate">{user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem asChild className="text-xs">
          <Link href="/b/settings/security">
            <Settings className="w-3.5 h-3.5 mr-2" />
            Account and security
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="text-xs" onSelect={() => void signOut("/")}>
          <LogOut className="w-3.5 h-3.5 mr-2" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
