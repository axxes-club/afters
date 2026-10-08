import { getUserId } from "@/lib/auth/session"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isSuperAdmin } from "@/lib/auth-utils"

// GET - List all OAuth apps (superadmin only)
export async function GET(_request: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isAdmin = await isSuperAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const apps = await prisma.oAuthApp.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        clientId: true,
        redirectUris: true,
        scopes: true,
        websiteUrl: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            connections: true,
            accessTokens: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ apps })
  } catch (error) {
    console.error("Error fetching OAuth apps:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
