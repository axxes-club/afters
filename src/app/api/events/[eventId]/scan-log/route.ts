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

    const logs = await prisma.scanLog.findMany({
      where: { eventId },
      include: {
        scanner: { select: { id: true, name: true } },
        ticket: {
          select: {
            ticketNumber: true,
            ticketTier: { select: { name: true } },
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
      },
      orderBy: { scannedAt: "desc" },
      take: 200,
    })

    // Summary stats
    const stats = await prisma.scanLog.groupBy({
      by: ["result"],
      where: { eventId },
      _count: { id: true },
    })

    const scannerStats = await prisma.scanLog.groupBy({
      by: ["scannerId"],
      where: { eventId },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    })

    const scannerIds = scannerStats.map((s) => s.scannerId)
    const scanners = await prisma.eventScanner.findMany({
      where: { id: { in: scannerIds } },
      select: { id: true, name: true },
    })
    const nameMap = Object.fromEntries(scanners.map((s) => [s.id, s.name]))

    return NextResponse.json({
      logs,
      stats: {
        byResult: stats.reduce(
          (acc, s) => {
            acc[s.result] = s._count.id
            return acc
          },
          {} as Record<string, number>
        ),
        byScanner: scannerStats.map((s) => ({
          scannerId: s.scannerId,
          scannerName: nameMap[s.scannerId] || "Unknown",
          count: s._count.id,
        })),
      },
    })
  } catch (error) {
    console.error("Get scan log error:", error)
    return NextResponse.json(
      { error: "Failed to fetch scan log" },
      { status: 500 }
    )
  }
}
