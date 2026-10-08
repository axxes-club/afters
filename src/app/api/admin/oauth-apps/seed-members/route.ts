import { getUserId } from "@/lib/auth/session"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isSuperAdmin } from "@/lib/auth-utils"
import { generateClientId, generateClientSecret, hashSecret } from "@/lib/oauth"

// POST - Seed the Members Portal OAuth app
export async function POST() {
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isAdmin = await isSuperAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if Members Portal app already exists
    const existingApp = await prisma.oAuthApp.findFirst({
      where: { name: "Members Portal" },
    })

    if (existingApp) {
      return NextResponse.json({
        error: "Members Portal app already exists",
        clientId: existingApp.clientId,
      }, { status: 400 })
    }

    // Find AXXES owner user (or use current superadmin)
    let ownerId = user.id
    const axxesUser = await prisma.user.findFirst({
      where: { email: "viscasillas@me.com" },
    })
    if (axxesUser) {
      ownerId = axxesUser.id
    }

    // Generate credentials
    const clientId = generateClientId()
    const clientSecret = generateClientSecret()
    const hashedSecret = hashSecret(clientSecret)

    // Create the app
    const app = await prisma.oAuthApp.create({
      data: {
        name: "Members Portal",
        description: "AXXES Members Portal - member management and integrations",
        clientId,
        clientSecret: hashedSecret,
        redirectUris: [
          "https://members.axxes.club/api/integrations/afters/callback",
          "http://localhost:3000/api/integrations/afters/callback",
        ],
        scopes: ["read:profile", "read:events", "read:orders", "read:tickets", "read:guestlist"],
        websiteUrl: "https://members.axxes.club",
        isActive: true,
        isVerified: true,
        userId: ownerId,
      },
    })

    console.log("Created Members Portal OAuth app:", {
      id: app.id,
      clientId: app.clientId,
      name: app.name,
    })

    return NextResponse.json({
      message: "Members Portal OAuth app created successfully",
      app: {
        id: app.id,
        name: app.name,
        clientId: app.clientId,
      },
      // Only show secret once!
      clientSecret,
      warning: "Save the client secret now - it will NOT be shown again!",
      envVars: `
AFTERS_CLIENT_ID=${clientId}
AFTERS_CLIENT_SECRET=${clientSecret}
AFTERS_OAUTH_URL=https://afters.am
      `.trim(),
    })
  } catch (error) {
    console.error("Error seeding Members Portal app:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
