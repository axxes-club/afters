import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getScannerSession } from "@/lib/scanner-auth"

export async function POST(req: Request) {
  try {
    const session = await getScannerSession()
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please re-enter your code." },
        { status: 401 }
      )
    }

    const { action } = await req.json()

    if (action === "in") {
      // Check if already punched in
      const existing = await prisma.scannerShift.findFirst({
        where: { scannerId: session.scannerId, punchedOutAt: null },
      })

      if (existing) {
        return NextResponse.json({
          message: "Already punched in",
          shift: {
            id: existing.id,
            punchedInAt: existing.punchedInAt,
          },
        })
      }

      const shift = await prisma.scannerShift.create({
        data: { scannerId: session.scannerId },
      })

      return NextResponse.json({
        message: "Punched in successfully",
        shift: { id: shift.id, punchedInAt: shift.punchedInAt },
      })
    } else if (action === "out") {
      const openShift = await prisma.scannerShift.findFirst({
        where: { scannerId: session.scannerId, punchedOutAt: null },
        orderBy: { punchedInAt: "desc" },
      })

      if (!openShift) {
        return NextResponse.json(
          { error: "No active shift to punch out" },
          { status: 400 }
        )
      }

      const updated = await prisma.scannerShift.update({
        where: { id: openShift.id },
        data: { punchedOutAt: new Date() },
      })

      const durationMinutes = Math.floor(
        (updated.punchedOutAt!.getTime() - updated.punchedInAt.getTime()) /
          1000 /
          60
      )

      return NextResponse.json({
        message: "Punched out successfully",
        shift: {
          id: updated.id,
          punchedInAt: updated.punchedInAt,
          punchedOutAt: updated.punchedOutAt,
          durationMinutes,
        },
      })
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "in" or "out"' },
      { status: 400 }
    )
  } catch (error) {
    console.error("Punch error:", error)
    return NextResponse.json(
      { error: "Punch action failed" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await getScannerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const activeShift = await prisma.scannerShift.findFirst({
      where: { scannerId: session.scannerId, punchedOutAt: null },
      orderBy: { punchedInAt: "desc" },
    })

    return NextResponse.json({
      isPunchedIn: !!activeShift,
      shift: activeShift || null,
    })
  } catch (error) {
    console.error("Get shift error:", error)
    return NextResponse.json(
      { error: "Failed to get shift status" },
      { status: 500 }
    )
  }
}
