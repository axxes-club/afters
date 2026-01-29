import { auth } from "@clerk/nextjs/server"
import { prisma } from "./prisma"
import { UserRole } from "@prisma/client"

export async function getSessionUser() {
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
  const user = await getSessionUser()
  return user?.role === UserRole.SUPERADMIN
}

export async function isAdmin() {
  const user = await getSessionUser()
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
  const user = await getSessionUser()
  if (user?.role !== UserRole.SUPERADMIN) {
    throw new Error("Unauthorized: Superadmin access required")
  }
  return user
}

export async function requireAdmin() {
  const user = await getSessionUser()
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
