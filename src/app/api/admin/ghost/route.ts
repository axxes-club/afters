import { NextRequest, NextResponse } from "next/server"
import { getUserId } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"
import { setGhostUser, clearGhostUser, getGhostUserPayload } from "@/lib/auth-utils"

// Start ghosting a user
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify requester is superadmin
    const admin = await prisma.user.findUnique({ where: { id: userId } })
    if (admin?.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { targetUserId } = await request.json()

    if (!targetUserId) {
      return NextResponse.json({ error: "Target user ID required" }, { status: 400 })
    }

    // Verify target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, email: true, firstName: true, lastName: true }
    })

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Set signed JWT ghost cookies
    await setGhostUser(targetUserId, userId)

    return NextResponse.json({
      success: true,
      ghosting: {
        userId: targetUser.id,
        email: targetUser.email,
        name: `${targetUser.firstName || ''} ${targetUser.lastName || ''}`.trim()
      }
    })
  } catch (error) {
    console.error("Error starting ghost session:", error)
    return NextResponse.json({ error: "Failed to start ghost session" }, { status: 500 })
  }
}

// Get current ghost status
export async function GET() {
  try {
    const payload = await getGhostUserPayload()

    if (!payload) {
      return NextResponse.json({ ghosting: null })
    }

    const ghostUser = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, firstName: true, lastName: true }
    })

    if (!ghostUser) {
      return NextResponse.json({ ghosting: null })
    }

    return NextResponse.json({
      ghosting: {
        userId: ghostUser.id,
        email: ghostUser.email,
        name: `${ghostUser.firstName || ''} ${ghostUser.lastName || ''}`.trim(),
        adminId: payload.adminId,
        expiresAt: payload.expiresAt * 1000 // Convert to milliseconds for client
      }
    })
  } catch {
    return NextResponse.json({ ghosting: null })
  }
}

// Stop ghosting
export async function DELETE() {
  try {
    await clearGhostUser()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error ending ghost session:", error)
    return NextResponse.json({ error: "Failed to end ghost session" }, { status: 500 })
  }
}
