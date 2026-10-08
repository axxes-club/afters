import { NextRequest, NextResponse } from "next/server"
import { getUserId } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"

// Get all translations
export async function GET() {
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (user?.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const translations = await prisma.translation.findMany({
      orderBy: [{ namespace: 'asc' }, { key: 'asc' }]
    })

    return NextResponse.json({ translations })
  } catch (error) {
    console.error("Error fetching translations:", error)
    return NextResponse.json({ error: "Failed to fetch translations" }, { status: 500 })
  }
}

// Update a translation
export async function PATCH(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (user?.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id, value } = await request.json()

    if (!id || value === undefined) {
      return NextResponse.json({ error: "ID and value are required" }, { status: 400 })
    }

    const translation = await prisma.translation.update({
      where: { id },
      data: { value, updatedBy: userId }
    })

    return NextResponse.json({ success: true, translation })
  } catch (error) {
    console.error("Error updating translation:", error)
    return NextResponse.json({ error: "Failed to update translation" }, { status: 500 })
  }
}

// Add new translation(s)
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (user?.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { namespace, key, values } = await request.json()

    if (!namespace || !key) {
      return NextResponse.json({ error: "Namespace and key are required" }, { status: 400 })
    }

    // Create translation for each locale
    const locales = ['en', 'es-ES', 'es-LA', 'pt-BR']
    const created = []

    for (const locale of locales) {
      const value = values?.[locale] || key // Default to key if no value provided
      
      const translation = await prisma.translation.upsert({
        where: {
          locale_namespace_key: { locale, namespace, key }
        },
        update: { value, updatedBy: userId },
        create: {
          locale,
          namespace,
          key,
          value,
          updatedBy: userId
        }
      })
      created.push(translation)
    }

    return NextResponse.json({ success: true, translations: created })
  } catch (error) {
    console.error("Error adding translation:", error)
    return NextResponse.json({ error: "Failed to add translation" }, { status: 500 })
  }
}
