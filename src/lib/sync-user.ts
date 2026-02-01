import { currentUser } from "@clerk/nextjs/server"
import { prisma } from "./prisma"

/**
 * Ensures the authenticated Clerk user exists in our database.
 * Handles:
 * 1. Brand new users (creates DB record)
 * 2. Dev→prod migration (matches by email, updates Clerk ID)
 * 3. Existing users (no-op, fast path)
 *
 * Call this from getSessionUser() or middleware-like flows.
 * Uses a simple in-memory cache to avoid repeated DB lookups per request cycle.
 */

// In-memory set of known-synced user IDs (cleared on cold start / redeploy)
const syncedUsers = new Set<string>()

export async function ensureUserSynced(clerkUserId: string) {
  // Fast path — already confirmed this session
  if (syncedUsers.has(clerkUserId)) return

  // Check if user exists by Clerk ID
  const existing = await prisma.user.findUnique({
    where: { id: clerkUserId },
    select: { id: true },
  })

  if (existing) {
    syncedUsers.add(clerkUserId)
    return
  }

  // User doesn't exist by ID — fetch Clerk profile for email
  const clerkUser = await currentUser()
  if (!clerkUser) return

  const email = clerkUser.emailAddresses.find(
    (e) => e.id === clerkUser.primaryEmailAddressId
  )?.emailAddress

  if (!email) return

  // Check if a user with this email exists (dev→prod migration)
  const existingByEmail = await prisma.user.findUnique({
    where: { email },
  })

  if (existingByEmail && existingByEmail.id !== clerkUserId) {
    // Migrate: update old ID to new production Clerk ID
    await prisma.user.update({
      where: { email },
      data: {
        id: clerkUserId,
        firstName: clerkUser.firstName ?? existingByEmail.firstName,
        lastName: clerkUser.lastName ?? existingByEmail.lastName,
        imageUrl: clerkUser.imageUrl ?? existingByEmail.imageUrl,
      },
    })
  } else if (!existingByEmail) {
    // Brand new user — create DB record
    await prisma.user.create({
      data: {
        id: clerkUserId,
        email,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        imageUrl: clerkUser.imageUrl,
      },
    })
  }

  syncedUsers.add(clerkUserId)
}
