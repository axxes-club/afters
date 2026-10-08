"use server"

import { prisma } from "@/lib/prisma"
import { requireSuperAdmin } from "@/lib/auth-utils"
import { UserRole } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"

// Only this email can have the SUPERADMIN role
const ALLOWED_SUPERADMIN_EMAIL = "viscasillas@me.com"

export async function updateUserRole(userId: string, role: UserRole) {
  await requireSuperAdmin()

  // Check if target user is a SUPERADMIN - they cannot have their role changed
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, email: true }
  })

  if (targetUser?.role === "SUPERADMIN") {
    throw new Error("Cannot change the role of a superadmin")
  }

  // Only allow SUPERADMIN role assignment to the authorized email
  if (role === "SUPERADMIN" && targetUser?.email !== ALLOWED_SUPERADMIN_EMAIL) {
    throw new Error(`SUPERADMIN role can only be assigned to ${ALLOWED_SUPERADMIN_EMAIL}`)
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role }
  })

  revalidatePath("/superadmin/users")
}

export async function deleteUser(userId: string) {
  await requireSuperAdmin()

  // The sign-in account (and its sessions) and the afters row share the id.
  await prisma.authUser.delete({ where: { id: userId } }).catch(() => {
    // Rows such as seeded demo users never had a sign-in account
  })
  await prisma.user.delete({
    where: { id: userId }
  })

  revalidatePath("/superadmin/users")
}

export async function banUser(userId: string) {
  const admin = await requireSuperAdmin()
  if (admin.id === userId) return { error: "You can't ban yourself" }

  try {
    await prisma.authUser.update({ where: { id: userId }, data: { banned: true } })
    // Signed out everywhere now; src/lib/auth refuses new sessions while banned.
    await prisma.authSession.deleteMany({ where: { userId } })
    return { success: true }
  } catch (error) {
    console.error("Failed to ban user:", error)
    return { error: "Failed to ban user" }
  }
}

export async function unbanUser(userId: string) {
  await requireSuperAdmin()

  try {
    await prisma.authUser.update({ where: { id: userId }, data: { banned: false } })
    return { success: true }
  } catch (error) {
    console.error("Failed to unban user:", error)
    return { error: "Failed to unban user" }
  }
}

export async function sendPasswordResetEmail(userId: string) {
  await requireSuperAdmin()

  try {
    const account = await prisma.authUser.findUnique({ where: { id: userId }, select: { email: true } })
    if (!account) {
      return { error: "This user has no sign-in account" }
    }

    // Emails the person a code they can use on "Forgot password?".
    await auth.api.requestPasswordResetEmailOTP({ body: { email: account.email } })

    return {
      success: true,
      email: account.email,
      message: `Reset code sent to ${account.email}`
    }
  } catch (error) {
    console.error("Failed to initiate password reset:", error)
    return { error: "Failed to initiate password reset" }
  }
}

export async function updateUserMetadata(userId: string, data: {
  firstName?: string
  lastName?: string
  username?: string
}) {
  await requireSuperAdmin()
  
  try {
    // Update in our database
    await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
      }
    })
    
    // Keep the sign-in name in step
    const name = [data.firstName, data.lastName].filter(Boolean).join(" ")
    if (name) {
      await prisma.authUser.updateMany({ where: { id: userId }, data: { name } })
    }

    revalidatePath("/superadmin/users")
    return { success: true }
  } catch (error) {
    console.error("Failed to update user:", error)
    return { error: error instanceof Error ? error.message : "Failed to update user" }
  }
}

export async function getUserDetails(userId: string) {
  await requireSuperAdmin()

  try {
    const account = await prisma.authUser.findUnique({
      where: { id: userId },
      include: {
        accounts: { select: { providerId: true } },
        sessions: { select: { createdAt: true }, orderBy: { createdAt: "desc" }, take: 1 },
      },
    })

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organizerProfile: true,
        artistProfile: true,
        personalProfile: true,
        _count: {
          select: {
            orders: true,
            tickets: true,
            savedEvents: true,
          }
        }
      }
    })

    return {
      auth: account
        ? {
            id: account.id,
            banned: account.banned,
            createdAt: account.createdAt.getTime(),
            lastSignInAt: account.sessions[0]?.createdAt.getTime() ?? null,
            imageUrl: account.image,
            emailAddresses: [{ email: account.email, verified: account.emailVerified }],
            // How this person can sign in: credential = password, axxes = Continue with AXXES
            signInMethods: account.accounts.map((a) => a.providerId),
          }
        : null,
      db: dbUser
    }
  } catch (error) {
    console.error("Failed to get user details:", error)
    return null
  }
}

export async function impersonateUser(userId: string) {
  await requireSuperAdmin()
  
  try {
    // Get the user's email to use for sign-in link
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    })
    
    if (!user?.email) {
      return { error: "User email not found" }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://afters.crativo.xyz'
    
    // Ghost mode (src/lib/auth-utils.ts) is the real way to see what a user sees.
    
    return { 
      success: true, 
      url: `${appUrl}/dashboard?viewAs=${userId}`,
      message: `Use Ghost mode to see afters as this user`,
      email: user.email
    }
  } catch (error) {
    console.error("Failed to impersonate user:", error)
    return { error: error instanceof Error ? error.message : "Failed to create impersonation session" }
  }
}
