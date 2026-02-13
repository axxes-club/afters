import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type RouteContext = { params: Promise<{ keyId: string }> }

// DELETE /api/api-keys/[keyId] - Revoke an API key
export async function DELETE(req: Request, context: RouteContext) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { keyId } = await context.params

    // Find the key and verify ownership
    const apiKey = await prisma.apiKey.findUnique({
      where: { id: keyId },
      select: { userId: true, revokedAt: true },
    })

    if (!apiKey) {
      return NextResponse.json(
        { message: "API key not found" },
        { status: 404 }
      )
    }

    if (apiKey.userId !== userId) {
      return NextResponse.json(
        { message: "Not authorized to revoke this key" },
        { status: 403 }
      )
    }

    if (apiKey.revokedAt) {
      return NextResponse.json(
        { message: "API key is already revoked" },
        { status: 400 }
      )
    }

    // Revoke the key (soft delete)
    await prisma.apiKey.update({
      where: { id: keyId },
      data: { revokedAt: new Date() },
    })

    return NextResponse.json({ message: "API key revoked successfully" })
  } catch (error) {
    console.error("Error revoking API key:", error)
    return NextResponse.json(
      { message: "Failed to revoke API key" },
      { status: 500 }
    )
  }
}

// PATCH /api/api-keys/[keyId] - Update API key (name only)
export async function PATCH(req: Request, context: RouteContext) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { keyId } = await context.params
    const body = await req.json()
    const { name } = body

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { message: "Name is required" },
        { status: 400 }
      )
    }

    // Find the key and verify ownership
    const apiKey = await prisma.apiKey.findUnique({
      where: { id: keyId },
      select: { userId: true, revokedAt: true },
    })

    if (!apiKey) {
      return NextResponse.json(
        { message: "API key not found" },
        { status: 404 }
      )
    }

    if (apiKey.userId !== userId) {
      return NextResponse.json(
        { message: "Not authorized to update this key" },
        { status: 403 }
      )
    }

    if (apiKey.revokedAt) {
      return NextResponse.json(
        { message: "Cannot update a revoked key" },
        { status: 400 }
      )
    }

    // Update the key name
    const updated = await prisma.apiKey.update({
      where: { id: keyId },
      data: { name: name.trim() },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating API key:", error)
    return NextResponse.json(
      { message: "Failed to update API key" },
      { status: 500 }
    )
  }
}
