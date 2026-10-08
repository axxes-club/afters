import { getUserId } from "@/lib/auth/session"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isSuperAdmin } from "@/lib/auth-utils"

export async function POST(req: Request) {
  try {
    const userId = await getUserId()
    const body = await req.json()

    const {
      type,
      message,
      screenshotUrls,
      activityLog,
      currentPath,
      userAgent,
    } = body

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { message: "Message is required" },
        { status: 400 }
      )
    }

    if (!["bug", "feature", "general"].includes(type)) {
      return NextResponse.json(
        { message: "Invalid feedback type" },
        { status: 400 }
      )
    }

    // Create feedback entry
    const feedback = await prisma.feedback.create({
      data: {
        userId: userId || null,
        type,
        message: message.trim(),
        screenshotUrl: screenshotUrls?.length > 0 ? screenshotUrls.join(",") : null,
        activityLog: activityLog || null,
        currentPath: currentPath || null,
        userAgent: userAgent || null,
        status: "new",
      },
    })

    return NextResponse.json({ success: true, id: feedback.id })
  } catch (error) {
    console.error("Error submitting feedback:", error)
    return NextResponse.json(
      { message: "Failed to submit feedback" },
      { status: 500 }
    )
  }
}

// GET endpoint for superadmin to view feedback
export async function GET(req: Request) {
  try {
    const isAdmin = await isSuperAdmin()

    if (!isAdmin) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const url = new URL(req.url)
    const status = url.searchParams.get("status") || undefined
    const limit = parseInt(url.searchParams.get("limit") || "50")

    // Fetch feedback with user info if available
    const feedback = await prisma.feedback.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      take: limit,
    })

    // Get user info for feedback entries with userId
    const userIds = feedback.filter(f => f.userId).map(f => f.userId) as string[]
    const users = userIds.length > 0 ? await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, firstName: true, lastName: true, imageUrl: true },
    }) : []

    const userMap = new Map(users.map(u => [u.id, u]))

    // Attach user info to feedback
    const feedbackWithUsers = feedback.map(f => ({
      ...f,
      user: f.userId ? userMap.get(f.userId) || null : null,
    }))

    // Get counts for stats
    const counts = await prisma.feedback.groupBy({
      by: ["status"],
      _count: { status: true },
    })

    const countMap: Record<string, number> = {}
    counts.forEach(c => {
      countMap[c.status] = c._count.status
    })

    return NextResponse.json({
      feedback: feedbackWithUsers,
      counts: {
        new: countMap["new"] || 0,
        reviewed: countMap["reviewed"] || 0,
        resolved: countMap["resolved"] || 0,
        wontfix: countMap["wontfix"] || 0,
        total: feedback.length,
      },
    })
  } catch (error) {
    console.error("Error fetching feedback:", error)
    return NextResponse.json(
      { message: "Failed to fetch feedback" },
      { status: 500 }
    )
  }
}

// PATCH endpoint for superadmin to update feedback status and notes
export async function PATCH(req: Request) {
  try {
    const isAdmin = await isSuperAdmin()

    if (!isAdmin) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { id, status, adminNotes } = body

    if (!id) {
      return NextResponse.json({ message: "Feedback ID is required" }, { status: 400 })
    }

    // Validate status if provided
    if (status && !["new", "reviewed", "resolved", "wontfix"].includes(status)) {
      return NextResponse.json({ message: "Invalid status" }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (status) updateData.status = status
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes

    const feedback = await prisma.feedback.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ success: true, feedback })
  } catch (error) {
    console.error("Error updating feedback:", error)
    return NextResponse.json(
      { message: "Failed to update feedback" },
      { status: 500 }
    )
  }
}
