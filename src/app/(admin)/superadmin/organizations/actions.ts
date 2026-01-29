"use server"

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createOrganization(formData: FormData): Promise<void> {
  const { userId } = await auth()
  if (!userId) {
    return
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (user?.role !== "SUPERADMIN") {
    return
  }

  const name = formData.get("name") as string
  const slug = formData.get("slug") as string
  const description = formData.get("description") as string
  const email = formData.get("email") as string
  const websiteUrl = formData.get("websiteUrl") as string
  const city = formData.get("city") as string
  const state = formData.get("state") as string

  if (!name || !slug) {
    return
  }

  // Check slug uniqueness
  const existing = await prisma.organization.findUnique({ where: { slug } })
  if (existing) {
    return
  }

  try {
    await prisma.organization.create({
      data: {
        name,
        slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        description: description || null,
        email: email || null,
        websiteUrl: websiteUrl || null,
        city: city || null,
        state: state || null,
      }
    })

    revalidatePath("/superadmin/organizations")
  } catch (error) {
    console.error("Error creating organization:", error)
  }
}

export async function deleteOrganization(id: string): Promise<void> {
  const { userId } = await auth()
  if (!userId) return

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (user?.role !== "SUPERADMIN") return

  try {
    await prisma.organization.delete({ where: { id } })
    revalidatePath("/superadmin/organizations")
  } catch (error) {
    console.error("Failed to delete organization:", error)
  }
}

export async function verifyOrganization(id: string, verified: boolean): Promise<void> {
  const { userId } = await auth()
  if (!userId) return

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (user?.role !== "SUPERADMIN") return

  try {
    await prisma.organization.update({
      where: { id },
      data: { isVerified: verified }
    })
    revalidatePath("/superadmin/organizations")
  } catch (error) {
    console.error("Failed to update organization:", error)
  }
}
