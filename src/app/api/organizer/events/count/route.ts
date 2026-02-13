import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ count: 0 })
    }

    const profile = await prisma.organizerProfile.findUnique({
      where: { userId },
      select: { id: true },
    })

    if (!profile) {
      return NextResponse.json({ count: 0 })
    }

    const count = await prisma.event.count({
      where: { organizerId: profile.id },
    })

    return NextResponse.json({ count })
  } catch (error) {
    console.error("Error counting events:", error)
    return NextResponse.json({ count: 0 })
  }
}
