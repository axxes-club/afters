import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isSuperAdmin } from "@/lib/auth-utils"

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
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

    const feedback = await prisma.feedback.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      take: limit,
    })

    return NextResponse.json(feedback)
  } catch (error) {
    console.error("Error fetching feedback:", error)
    return NextResponse.json(
      { message: "Failed to fetch feedback" },
      { status: 500 }
    )
  }
}
