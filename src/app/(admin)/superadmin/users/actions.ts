"use server"

import { prisma } from "@/lib/prisma"
import { requireSuperAdmin } from "@/lib/auth-utils"
import { UserRole } from "@prisma/client"
import { revalidatePath } from "next/cache"

export async function updateUserRole(userId: string, role: UserRole) {
  await requireSuperAdmin()
  
  await prisma.user.update({
    where: { id: userId },
    data: { role }
  })

  revalidatePath("/superadmin/users")
}

export async function deleteUser(userId: string) {
  // This is a dangerous operation, use with caution.
  // We should probably also handle Clerk deletion if we want to be thorough.
  await requireSuperAdmin()
  
  await prisma.user.delete({
    where: { id: userId }
  })

  revalidatePath("/superadmin/users")
}
