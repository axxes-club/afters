import { currentUser } from "@/lib/auth/session"
import { prisma } from "./prisma"

/**
 * Ensures the signed-in person has an afters `User` row (same id as their sign-in account).
 * Handles:
 * 1. Brand new users (creates DB record)
 * 2. An older row with the same (verified) email but another id: it takes the sign-in id
 * 3. Existing users (no-op, fast path)
 *
 * Call this from getSessionUser() or middleware-like flows.
 * Uses a simple in-memory cache to avoid repeated DB lookups per request cycle.
 */

// In-memory set of known-synced user IDs (cleared on cold start / redeploy)
const syncedUsers = new Set<string>()

export async function ensureUserSynced(authUserId: string) {
  // Fast path — already confirmed this session
  if (syncedUsers.has(authUserId)) return

  // Check if user exists by id
  const existing = await prisma.user.findUnique({
    where: { id: authUserId },
    select: { id: true },
  })

  if (existing) {
    syncedUsers.add(authUserId)
    return
  }

  // User doesn't exist by ID — read the sign-in profile for the email
  const authUser = await currentUser()
  // Only a verified email may claim an existing row.
  if (!authUser || authUser.id !== authUserId || !authUser.emailVerified) return

  const email = authUser.email

  // Check if a user with this email exists under another id
  const existingByEmail = await prisma.user.findUnique({
    where: { email },
  })

  if (existingByEmail && existingByEmail.id !== authUserId) {
    // Move the row to the sign-in id (foreign keys follow: ON UPDATE CASCADE)
    await prisma.user.update({
      where: { email },
      data: {
        id: authUserId,
        firstName: authUser.firstName ?? existingByEmail.firstName,
        lastName: authUser.lastName ?? existingByEmail.lastName,
        imageUrl: authUser.imageUrl ?? existingByEmail.imageUrl,
      },
    })
  } else if (!existingByEmail) {
    // Brand new user — create DB record as ORGANIZER by default
    await prisma.user.create({
      data: {
        id: authUserId,
        email,
        firstName: authUser.firstName,
        lastName: authUser.lastName,
        imageUrl: authUser.imageUrl,
        role: "ORGANIZER",
      },
    })
  }

  syncedUsers.add(authUserId)
}
