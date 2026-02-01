import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getEffectiveUserId } from "@/lib/auth-utils"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const userId = await getEffectiveUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { eventId } = await params

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { organizer: true },
    })

    if (!event || event.organizer.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const shifts = await prisma.scannerShift.findMany({
      where: { scanner: { eventId } },
      include: {
        scanner: { select: { id: true, name: true } },
      },
      orderBy: { punchedInAt: "desc" },
    })

    return NextResponse.json({ shifts })
  } catch (error) {
    console.error("Get shifts error:", error)
    return NextResponse.json(
      { error: "Failed to fetch shifts" },
      { status: 500 }
    )
  }
}
