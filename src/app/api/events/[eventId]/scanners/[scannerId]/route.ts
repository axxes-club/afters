import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getEffectiveUserId } from "@/lib/auth-utils"

async function verifyScanner(
  eventId: string,
  scannerId: string,
  userId: string
) {
  const scanner = await prisma.eventScanner.findUnique({
    where: { id: scannerId },
    include: { event: { include: { organizer: true } } },
  })
  if (
    !scanner ||
    scanner.eventId !== eventId ||
    scanner.event.organizer.userId !== userId
  ) {
    return null
  }
  return scanner
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string; scannerId: string }> }
) {
  try {
    const userId = await getEffectiveUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { eventId, scannerId } = await params
    const scanner = await verifyScanner(eventId, scannerId, userId)
    if (!scanner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { isActive, name } = await req.json()

    const updated = await prisma.eventScanner.update({
      where: { id: scannerId },
      data: {
        ...(typeof isActive === "boolean" && { isActive }),
        ...(name && { name: name.trim() }),
      },
    })

    return NextResponse.json({ scanner: updated })
  } catch (error) {
    console.error("Update scanner error:", error)
    return NextResponse.json(
      { error: "Failed to update scanner" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string; scannerId: string }> }
) {
  try {
    const userId = await getEffectiveUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { eventId, scannerId } = await params
    const scanner = await verifyScanner(eventId, scannerId, userId)
    if (!scanner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await prisma.eventScanner.delete({ where: { id: scannerId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete scanner error:", error)
    return NextResponse.json(
      { error: "Failed to delete scanner" },
      { status: 500 }
    )
  }
}
