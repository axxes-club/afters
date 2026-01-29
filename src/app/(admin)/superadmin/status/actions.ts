"use server"

import { prisma } from "@/lib/prisma"
import { requireSuperAdmin } from "@/lib/auth-utils"
import { SystemHealth } from "@prisma/client"
import { revalidatePath } from "next/cache"

export async function upsertStatus(data: {
  id?: string
  feature: string
  status: SystemHealth
  message?: string
}) {
  await requireSuperAdmin()

  if (data.id) {
    await prisma.systemStatus.update({
      where: { id: data.id },
      data: {
        feature: data.feature,
        status: data.status,
        message: data.message,
      },
    })
  } else {
    await prisma.systemStatus.create({
      data: {
        feature: data.feature,
        status: data.status,
        message: data.message,
      },
    })
  }

  revalidatePath("/superadmin/status")
  revalidatePath("/status")
}

export async function deleteStatus(id: string) {
  await requireSuperAdmin()
  await prisma.systemStatus.delete({ where: { id } })
  revalidatePath("/superadmin/status")
  revalidatePath("/status")
}
