import { NextResponse } from "next/server"
import { getUserId } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"

// Get verification request status
export async function GET() {
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const artistProfile = await prisma.artistProfile.findUnique({
      where: { userId }
    })

    if (!artistProfile) {
      return NextResponse.json({ error: "Artist profile not found" }, { status: 404 })
    }

    // Get the latest verification request
    const request = await prisma.verificationRequest.findFirst({
      where: { artistProfileId: artistProfile.id },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({
      isVerified: artistProfile.isVerified,
      request: request || null
    })
  } catch (error) {
    console.error("Error fetching verification status:", error)
    return NextResponse.json({ error: "Failed to fetch verification status" }, { status: 500 })
  }
}

// Submit verification request
export async function POST(request: Request) {
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const artistProfile = await prisma.artistProfile.findUnique({
      where: { userId }
    })

    if (!artistProfile) {
      return NextResponse.json({ error: "Artist profile not found" }, { status: 404 })
    }

    if (artistProfile.isVerified) {
      return NextResponse.json({ error: "Already verified" }, { status: 400 })
    }

    // Check for existing pending request
    const existingRequest = await prisma.verificationRequest.findFirst({
      where: {
        artistProfileId: artistProfile.id,
        status: "PENDING"
      }
    })

    if (existingRequest) {
      return NextResponse.json({ error: "You already have a pending verification request" }, { status: 400 })
    }

    const body = await request.json()
    const { realName, socialProof, pressLinks, additionalInfo } = body

    const verificationRequest = await prisma.verificationRequest.create({
      data: {
        artistProfileId: artistProfile.id,
        userId,
        realName,
        socialProof,
        pressLinks,
        additionalInfo
      }
    })

    return NextResponse.json(verificationRequest)
  } catch (error) {
    console.error("Error creating verification request:", error)
    return NextResponse.json({ error: "Failed to submit verification request" }, { status: 500 })
  }
}
