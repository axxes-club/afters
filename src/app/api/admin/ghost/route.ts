import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"

const GHOST_COOKIE = 'afters-ghost-user'
const GHOST_ADMIN_COOKIE = 'afters-ghost-admin'

// Start ghosting a user
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
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

    // Set ghost cookies
    const cookieStore = await cookies()
    
    // Store admin's real user ID so we can exit ghost mode
    cookieStore.set(GHOST_ADMIN_COOKIE, userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 4, // 4 hours max
      path: '/'
    })
    
    // Store the ghost user ID
    cookieStore.set(GHOST_COOKIE, targetUserId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 4, // 4 hours max
      path: '/'
    })

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
    const cookieStore = await cookies()
    const ghostUserId = cookieStore.get(GHOST_COOKIE)?.value
    const adminUserId = cookieStore.get(GHOST_ADMIN_COOKIE)?.value

    if (!ghostUserId || !adminUserId) {
      return NextResponse.json({ ghosting: null })
    }

    const ghostUser = await prisma.user.findUnique({
      where: { id: ghostUserId },
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
        adminId: adminUserId
      }
    })
  } catch (error) {
    return NextResponse.json({ ghosting: null })
  }
}

// Stop ghosting
export async function DELETE() {
  try {
    const cookieStore = await cookies()
    
    cookieStore.delete(GHOST_COOKIE)
    cookieStore.delete(GHOST_ADMIN_COOKIE)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error ending ghost session:", error)
    return NextResponse.json({ error: "Failed to end ghost session" }, { status: 500 })
  }
}
