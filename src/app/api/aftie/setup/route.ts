import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateApiKey, API_SCOPES, type ApiScope } from "@/lib/api-keys"

const AFTIE_KEY_NAME = "Aftie AI Assistant"

// All scopes - Aftie gets full access to act on user's behalf
const AFTIE_SCOPES = Object.keys(API_SCOPES) as ApiScope[]

// GET /api/aftie/setup - Check if user has approved Aftie API access
export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Check if user has an organizer profile
    const profile = await prisma.organizerProfile.findUnique({
      where: { userId },
    })

    if (!profile) {
      return NextResponse.json({
        hasProfile: false,
        isSetup: false,
        message: "Organizer profile required",
      })
    }

    // Check if Aftie API key exists
    const aftieKey = await prisma.apiKey.findFirst({
      where: {
        userId,
        name: AFTIE_KEY_NAME,
        revokedAt: null,
      },
      select: {
        id: true,
        createdAt: true,
        lastUsedAt: true,
      },
    })

    return NextResponse.json({
      hasProfile: true,
      isSetup: !!aftieKey,
      keyId: aftieKey?.id,
      createdAt: aftieKey?.createdAt,
      lastUsedAt: aftieKey?.lastUsedAt,
    })
  } catch (error) {
    console.error("Error checking Aftie setup:", error)
    return NextResponse.json(
      { message: "Failed to check Aftie setup" },
      { status: 500 }
    )
  }
}

// POST /api/aftie/setup - Create Aftie API key (user consent)
export async function POST() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Check if user has an organizer profile
    const profile = await prisma.organizerProfile.findUnique({
      where: { userId },
    })

    if (!profile) {
      return NextResponse.json(
        { message: "Organizer profile required" },
        { status: 403 }
      )
    }

    // Check if Aftie key already exists
    const existingKey = await prisma.apiKey.findFirst({
      where: {
        userId,
        name: AFTIE_KEY_NAME,
        revokedAt: null,
      },
    })

    if (existingKey) {
      return NextResponse.json({
        success: true,
        message: "Aftie is already set up",
        keyId: existingKey.id,
      })
    }

    // Generate the API key (key itself is not returned - internal use only)
    const { prefix, hash } = generateApiKey()

    const apiKey = await prisma.apiKey.create({
      data: {
        userId,
        name: AFTIE_KEY_NAME,
        keyPrefix: prefix,
        keyHash: hash,
        scopes: AFTIE_SCOPES,
        // Aftie key never expires
        expiresAt: null,
      },
      select: {
        id: true,
        createdAt: true,
      },
    })

    // Note: We don't return the actual key - Aftie uses it internally
    // through the authenticated session, not via API key header

    return NextResponse.json({
      success: true,
      message: "Aftie has been granted access to manage your events",
      keyId: apiKey.id,
      createdAt: apiKey.createdAt,
    })
  } catch (error) {
    console.error("Error setting up Aftie:", error)
    return NextResponse.json(
      { message: "Failed to set up Aftie" },
      { status: 500 }
    )
  }
}

// DELETE /api/aftie/setup - Revoke Aftie API access
export async function DELETE() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Find and revoke the Aftie key
    const aftieKey = await prisma.apiKey.findFirst({
      where: {
        userId,
        name: AFTIE_KEY_NAME,
        revokedAt: null,
      },
    })

    if (!aftieKey) {
      return NextResponse.json({
        success: true,
        message: "Aftie was not set up",
      })
    }

    await prisma.apiKey.update({
      where: { id: aftieKey.id },
      data: { revokedAt: new Date() },
    })

    return NextResponse.json({
      success: true,
      message: "Aftie's access has been revoked",
    })
  } catch (error) {
    console.error("Error revoking Aftie access:", error)
    return NextResponse.json(
      { message: "Failed to revoke Aftie access" },
      { status: 500 }
    )
  }
}
