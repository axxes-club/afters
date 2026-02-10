import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth, currentUser } from "@clerk/nextjs/server"

// Helper to get or create settings singleton
async function getSettings() {
  let settings = await prisma.siteSettings.findUnique({
    where: { id: "singleton" },
  })

  if (!settings) {
    settings = await prisma.siteSettings.create({
      data: { id: "singleton" },
    })
  }

  return settings
}

// GET /api/admin/settings - Get current site settings
export async function GET() {
  try {
    const settings = await getSettings()
    return NextResponse.json(settings)
  } catch (error) {
    console.error("Failed to fetch settings:", error)
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/settings - Update site settings (superadmin only)
export async function PATCH(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify superadmin role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (user?.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { radioWidgetEnabled } = body

    const settings = await prisma.siteSettings.upsert({
      where: { id: "singleton" },
      update: {
        ...(typeof radioWidgetEnabled === "boolean" && { radioWidgetEnabled }),
      },
      create: {
        id: "singleton",
        ...(typeof radioWidgetEnabled === "boolean" && { radioWidgetEnabled }),
      },
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Failed to update settings:", error)
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    )
  }
}
