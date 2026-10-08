"use client"

import { createAuthClient } from "better-auth/react"
import { emailOTPClient } from "better-auth/client/plugins"

/** Same-origin: the browser talks to /api/auth on whichever afters host it is on. */
export const authClient = createAuthClient({ plugins: [emailOTPClient()] })

export type SessionUser = {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  imageUrl: string | null
}

/** Signed-in state for client components. `isLoaded` is false until the session has been read once. */
export function useAuth() {
  const { data, isPending } = authClient.useSession()
  return { isLoaded: !isPending, isSignedIn: Boolean(data), userId: data?.user.id ?? null }
}

/** The signed-in person, in the shape afters' components read. */
export function useUser(): { isLoaded: boolean; isSignedIn: boolean; user: SessionUser | null } {
  const { data, isPending } = authClient.useSession()
  if (!data) return { isLoaded: !isPending, isSignedIn: false, user: null }
  const [first, ...rest] = data.user.name.trim().split(/\s+/)
  return {
    isLoaded: true,
    isSignedIn: true,
    user: {
      id: data.user.id,
      email: data.user.email,
      firstName: first || null,
      lastName: rest.join(" ") || null,
      imageUrl: data.user.image ?? null,
    },
  }
}

/** Sign out, then leave with a full page load so no signed-in UI lingers. */
export async function signOut(redirectUrl = "/") {
  await authClient.signOut()
  window.location.assign(redirectUrl)
}
