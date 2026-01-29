import { auth } from "@clerk/nextjs/server"
import { cookies } from "next/headers"
import { prisma } from "./prisma"
import { UserRole } from "@prisma/client"

const GHOST_COOKIE = 'afters-ghost-user'
const GHOST_ADMIN_COOKIE = 'afters-ghost-admin'

// Check if currently ghosting and return the ghost user ID
export async function getGhostUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const ghostUserId = cookieStore.get(GHOST_COOKIE)?.value
    const adminUserId = cookieStore.get(GHOST_ADMIN_COOKIE)?.value
    
    // Only return ghost user if both cookies exist (valid ghost session)
    if (ghostUserId && adminUserId) {
      return ghostUserId
    }
    return null
  } catch {
    return null
  }
}

// Get the real admin user ID when ghosting
export async function getRealAdminId(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    return cookieStore.get(GHOST_ADMIN_COOKIE)?.value || null
  } catch {
    return null
  }
}

// Get the effective user ID (ghost user if ghosting, real user otherwise)
export async function getEffectiveUserId(): Promise<string | null> {
  const { userId } = await auth()
  if (!userId) return null

  // Check if ghosting - if so, return the ghost user instead
  const ghostUserId = await getGhostUserId()
  return ghostUserId || userId
}

export async function getSessionUser() {
  const { userId } = await auth()
  if (!userId) return null

  // Check if ghosting - if so, return the ghost user instead
  const ghostUserId = await getGhostUserId()
  const effectiveUserId = ghostUserId || userId

  const user = await prisma.user.findUnique({
    where: { id: effectiveUserId },
    include: {
      organizerProfile: true
    }
  })

  return user
}

// Get the actual authenticated user (ignoring ghost mode)
// Use this for permission checks that should always use the real admin
export async function getRealSessionUser() {
  const { userId } = await auth()
  if (!userId) return null

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      organizerProfile: true
    }
  })

  return user
}

export async function isSuperAdmin() {
  // Always check the real user for superadmin status (not ghost)
  const user = await getRealSessionUser()
  return user?.role === UserRole.SUPERADMIN
}

export async function isAdmin() {
  // Always check the real user for admin status (not ghost)
  const user = await getRealSessionUser()
  return user?.role === UserRole.SUPERADMIN;
}

export async function isOrganizer() {
  const user = await getSessionUser()
  return user?.role === UserRole.ORGANIZER || user?.role === UserRole.SUPERADMIN;
}

export async function isArtist() {
  const user = await getSessionUser()
  // Allow all logged-in users to access artist features (to create profile)
  return !!user;
}

export async function isPersonal() {
  const user = await getSessionUser()
  return user?.role === UserRole.PERSONAL || user?.role === UserRole.USER || user?.role === UserRole.SUPERADMIN;
}

export async function requireSuperAdmin() {
  // Always check the real user for superadmin access (not ghost)
  const user = await getRealSessionUser()
  if (user?.role !== UserRole.SUPERADMIN) {
    throw new Error("Unauthorized: Superadmin access required")
  }
  return user
}

export async function requireAdmin() {
  // Always check the real user for admin access (not ghost)
  const user = await getRealSessionUser()
  if (user?.role !== UserRole.SUPERADMIN) {
    throw new Error("Unauthorized: Admin access required")
  }
  return user
}

export async function requireOrganizer() {
  const user = await getSessionUser()
  if (user?.role !== UserRole.ORGANIZER && user?.role !== UserRole.SUPERADMIN) {
    throw new Error("Unauthorized: Organizer access required")
  }
  return user
}

export async function requireArtist() {
  const user = await getSessionUser()
  if (user?.role !== UserRole.ARTIST && user?.role !== UserRole.SUPERADMIN) {
    throw new Error("Unauthorized: Artist access required")
  }
  return user
}

export async function requirePersonal() {
  const user = await getSessionUser()
  if (user?.role !== UserRole.PERSONAL && user?.role !== UserRole.USER && user?.role !== UserRole.SUPERADMIN) {
    throw new Error("Unauthorized: Personal access required")
  }
  return user
}
