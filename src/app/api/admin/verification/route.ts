import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireSuperAdmin } from "@/lib/auth-utils"
import type { VerificationStatus } from "@prisma/client"

// Get all verification requests
export async function GET(request: Request) {
  try {
    await requireSuperAdmin()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || undefined

    const requests = await prisma.verificationRequest.findMany({
      where: status ? { status: status as VerificationStatus } : undefined,
      orderBy: { createdAt: "desc" },
      take: 100
    })

    // Get artist profiles for each request
    const artistIds = requests.map(r => r.artistProfileId).filter(Boolean) as string[]
    const artistProfiles = await prisma.artistProfile.findMany({
      where: { id: { in: artistIds } },
      include: {
        user: {
          select: { email: true, firstName: true, lastName: true, imageUrl: true }
        }
      }
    })

    const profileMap = new Map(artistProfiles.map(p => [p.id, p]))

    const enrichedRequests = requests.map(req => ({
      ...req,
      artistProfile: req.artistProfileId ? profileMap.get(req.artistProfileId) : null
    }))

    // Get counts by status
    const counts = await prisma.verificationRequest.groupBy({
      by: ["status"],
      _count: true
    })

    return NextResponse.json({
      requests: enrichedRequests,
      counts: {
        pending: counts.find(c => c.status === "PENDING")?._count || 0,
        approved: counts.find(c => c.status === "APPROVED")?._count || 0,
        rejected: counts.find(c => c.status === "REJECTED")?._count || 0,
        total: counts.reduce((sum, c) => sum + c._count, 0)
      }
    })
  } catch (error) {
    console.error("Error fetching verification requests:", error)
    return NextResponse.json({ error: "Failed to fetch verification requests" }, { status: 500 })
  }
}

// Review verification request
export async function PATCH(request: Request) {
  try {
    const admin = await requireSuperAdmin()

    const body = await request.json()
    const { requestId, action, rejectionReason } = body

    if (!requestId || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    const verificationRequest = await prisma.verificationRequest.findUnique({
      where: { id: requestId }
    })

    if (!verificationRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    if (verificationRequest.status !== "PENDING") {
      return NextResponse.json({ error: "Request already reviewed" }, { status: 400 })
    }

    // Update the request
    const updatedRequest = await prisma.verificationRequest.update({
      where: { id: requestId },
      data: {
        status: action === "approve" ? "APPROVED" : "REJECTED",
        reviewedBy: admin.id,
        reviewedAt: new Date(),
        rejectionReason: action === "reject" ? rejectionReason : null
      }
    })

    // If approved, update the artist profile
    if (action === "approve" && verificationRequest.artistProfileId) {
      await prisma.artistProfile.update({
        where: { id: verificationRequest.artistProfileId },
        data: { isVerified: true }
      })
    }

    return NextResponse.json(updatedRequest)
  } catch (error) {
    console.error("Error reviewing verification request:", error)
    return NextResponse.json({ error: "Failed to review request" }, { status: 500 })
  }
}
