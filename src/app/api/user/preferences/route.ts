import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organizerProfile: {
          select: {
            sidebarLogoMode: true,
            sidebarCustomLogoUrl: true,
            sidebarCompact: true,
            uiAccentColor: true,
            uiFontSize: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching preferences:", error)
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    )
  }
}

export async function PUT(req: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      sidebarLogoMode,
      sidebarCustomLogoUrl,
      sidebarCompact,
      uiAccentColor,
      uiFontSize,
    } = body

    // Validate sidebarLogoMode
    if (sidebarLogoMode && !["afters", "afters3x", "custom", "hidden"].includes(sidebarLogoMode)) {
      return NextResponse.json(
        { error: "Invalid sidebar logo mode" },
        { status: 400 }
      )
    }

    // Validate uiFontSize
    if (uiFontSize && !["small", "normal", "large"].includes(uiFontSize)) {
      return NextResponse.json(
        { error: "Invalid font size" },
        { status: 400 }
      )
    }

    // Check if user has organizer profile
    const profile = await prisma.organizerProfile.findUnique({
      where: { userId },
    })

    if (!profile) {
      return NextResponse.json(
        { error: "Organizer profile required" },
        { status: 400 }
      )
    }

    // Update preferences
    const updated = await prisma.organizerProfile.update({
      where: { userId },
      data: {
        sidebarLogoMode: sidebarLogoMode || "afters3x",
        sidebarCustomLogoUrl: sidebarCustomLogoUrl || null,
        sidebarCompact: sidebarCompact || false,
        uiAccentColor: uiAccentColor || null,
        uiFontSize: uiFontSize || "normal",
      },
      select: {
        sidebarLogoMode: true,
        sidebarCustomLogoUrl: true,
        sidebarCompact: true,
        uiAccentColor: true,
        uiFontSize: true,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating preferences:", error)
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    )
  }
}
