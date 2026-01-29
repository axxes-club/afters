"use server"

import { prisma } from "@/lib/prisma"
import { requireSuperAdmin } from "@/lib/auth-utils"
import { UserRole } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { clerkClient } from "@clerk/nextjs/server"

export async function updateUserRole(userId: string, role: UserRole) {
  await requireSuperAdmin()
  
  await prisma.user.update({
    where: { id: userId },
    data: { role }
  })

  revalidatePath("/superadmin/users")
}

export async function deleteUser(userId: string) {
  await requireSuperAdmin()
  
  // Delete from Clerk first
  try {
    const clerk = await clerkClient()
    await clerk.users.deleteUser(userId)
  } catch (error) {
    console.error("Failed to delete user from Clerk:", error)
    // Continue to delete from database even if Clerk fails
  }
  
  // Delete from our database
  await prisma.user.delete({
    where: { id: userId }
  })

  revalidatePath("/superadmin/users")
}

export async function banUser(userId: string) {
  await requireSuperAdmin()
  
  try {
    const clerk = await clerkClient()
    await clerk.users.banUser(userId)
    return { success: true }
  } catch (error) {
    console.error("Failed to ban user:", error)
    return { error: "Failed to ban user" }
  }
}

export async function unbanUser(userId: string) {
  await requireSuperAdmin()
  
  try {
    const clerk = await clerkClient()
    await clerk.users.unbanUser(userId)
    return { success: true }
  } catch (error) {
    console.error("Failed to unban user:", error)
    return { error: "Failed to unban user" }
  }
}

export async function sendPasswordResetEmail(userId: string) {
  await requireSuperAdmin()
  
  try {
    // Get user email from our database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    })
    
    if (!user?.email) {
      return { error: "User email not found" }
    }

    // Get Clerk user to find primary email ID
    const clerk = await clerkClient()
    const clerkUser = await clerk.users.getUser(userId)
    
    const primaryEmail = clerkUser.emailAddresses.find(
      e => e.id === clerkUser.primaryEmailAddressId
    )
    
    if (!primaryEmail) {
      return { error: "User has no primary email" }
    }

    // Create a password reset token - user will receive email
    // Note: Clerk doesn't have a direct "send reset email" API for admins
    // Instead we can use the sign-in token approach or direct them to forgot password
    
    // For now, return the email so admin can manually send instructions
    return { 
      success: true, 
      email: user.email,
      message: `Password reset link: User should visit the forgot password page with email ${user.email}`
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
    // Update in Clerk
    const clerk = await clerkClient()
    await clerk.users.updateUser(userId, {
      firstName: data.firstName,
      lastName: data.lastName,
      username: data.username,
    })
    
    // Update in our database
    await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
      }
    })
    
    revalidatePath("/superadmin/users")
    return { success: true }
  } catch (error: any) {
    console.error("Failed to update user:", error)
    return { error: error.message || "Failed to update user" }
  }
}

export async function getUserDetails(userId: string) {
  await requireSuperAdmin()
  
  try {
    const clerk = await clerkClient()
    const clerkUser = await clerk.users.getUser(userId)
    
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
            follows: true,
            savedEvents: true,
          }
        }
      }
    })
    
    return {
      clerk: {
        id: clerkUser.id,
        banned: clerkUser.banned,
        createdAt: clerkUser.createdAt,
        lastSignInAt: clerkUser.lastSignInAt,
        imageUrl: clerkUser.imageUrl,
        emailAddresses: clerkUser.emailAddresses.map(e => ({
          email: e.emailAddress,
          verified: e.verification?.status === "verified"
        })),
        externalAccounts: clerkUser.externalAccounts.map(e => ({
          provider: e.provider,
          email: e.emailAddress
        }))
      },
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

    // For impersonation, we'll create a sign-in link using Clerk's magic link feature
    // This requires the admin to manually confirm, which is safer
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://afters.crativo.xyz'
    
    // Note: True impersonation requires Clerk's Actor Token feature which needs 
    // specific Clerk plan features. For now, we'll provide a way to view as user.
    // The admin can use this to understand the user's view.
    
    return { 
      success: true, 
      url: `${appUrl}/dashboard?viewAs=${userId}`,
      message: `To fully impersonate, use Clerk Dashboard: https://dashboard.clerk.com`,
      email: user.email
    }
  } catch (error: any) {
    console.error("Failed to impersonate user:", error)
    return { error: error.message || "Failed to create impersonation session" }
  }
}
