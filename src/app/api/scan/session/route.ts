import { NextResponse } from "next/server"
import { getScannerSession, clearScannerSession } from "@/lib/scanner-auth"

export async function GET() {
  try {
    const session = await getScannerSession()
    if (!session) {
      return NextResponse.json({ authenticated: false })
    }

    return NextResponse.json({
      authenticated: true,
      scanner: {
        scannerId: session.scannerId,
        eventId: session.eventId,
        name: session.name,
      },
    })
  } catch {
    return NextResponse.json({ authenticated: false })
  }
}

export async function DELETE() {
  try {
    await clearScannerSession()
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: "Failed to clear session" },
      { status: 500 }
    )
  }
}
