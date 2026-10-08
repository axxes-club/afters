import { cache } from "react"
import { headers } from "next/headers"
import { auth } from "./index"

/** The signed-in session for this request, or null. Cached per request. */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() })
})

/** The signed-in person's id (the same id as their `User` row), or null. */
export async function getUserId(): Promise<string | null> {
  return (await getSession())?.user.id ?? null
}

export type CurrentUser = {
  id: string
  email: string
  emailVerified: boolean
  firstName: string | null
  lastName: string | null
  imageUrl: string | null
}

function splitName(name: string): { firstName: string | null; lastName: string | null } {
  const [first, ...rest] = name.trim().split(/\s+/)
  return { firstName: first || null, lastName: rest.join(" ") || null }
}

/** The signed-in person as the sign-in system knows them, or null. */
export async function currentUser(): Promise<CurrentUser | null> {
  const session = await getSession()
  if (!session) return null
  const { id, email, emailVerified, name, image } = session.user
  return { id, email, emailVerified, imageUrl: image ?? null, ...splitName(name) }
}
