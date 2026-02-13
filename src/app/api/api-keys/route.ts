import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateApiKey, API_SCOPES, type ApiScope } from "@/lib/api-keys"

// GET /api/api-keys - List user's API keys
export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const apiKeys = await prisma.apiKey.findMany({
      where: {
        userId,
        revokedAt: null,
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(apiKeys)
  } catch (error) {
    console.error("Error fetching API keys:", error)
    return NextResponse.json(
      { message: "Failed to fetch API keys" },
      { status: 500 }
    )
  }
}

// POST /api/api-keys - Create a new API key
export async function POST(req: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Check if user has an organizer profile (API keys are for organizers)
    const profile = await prisma.organizerProfile.findUnique({
      where: { userId },
    })

    if (!profile) {
      return NextResponse.json(
        { message: "Organizer profile required to create API keys" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { name, scopes, expiresAt } = body

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { message: "API key name is required" },
        { status: 400 }
      )
    }

    // Validate scopes
    const validScopes = Object.keys(API_SCOPES) as ApiScope[]
    const requestedScopes = scopes || ["events:read"]

    if (!Array.isArray(requestedScopes)) {
      return NextResponse.json(
        { message: "Scopes must be an array" },
        { status: 400 }
      )
    }

    const invalidScopes = requestedScopes.filter(
      (s: string) => !validScopes.includes(s as ApiScope)
    )
    if (invalidScopes.length > 0) {
      return NextResponse.json(
        { message: `Invalid scopes: ${invalidScopes.join(", ")}` },
        { status: 400 }
      )
    }

    // Limit number of active API keys per user
    const existingKeysCount = await prisma.apiKey.count({
      where: { userId, revokedAt: null },
    })

    if (existingKeysCount >= 10) {
      return NextResponse.json(
        { message: "Maximum of 10 active API keys allowed" },
        { status: 400 }
      )
    }

    // Generate the API key
    const { key, prefix, hash } = generateApiKey()

    const apiKey = await prisma.apiKey.create({
      data: {
        userId,
        name: name.trim(),
        keyPrefix: prefix,
        keyHash: hash,
        scopes: requestedScopes,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        expiresAt: true,
        createdAt: true,
      },
    })

    // Return the full key only on creation - it won't be visible again
    return NextResponse.json({
      ...apiKey,
      key, // Full key - only shown once
    })
  } catch (error) {
    console.error("Error creating API key:", error)
    return NextResponse.json(
      { message: "Failed to create API key" },
      { status: 500 }
    )
  }
}
