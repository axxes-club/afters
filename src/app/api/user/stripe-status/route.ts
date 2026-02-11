import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ stripeChargesEnabled: false })
  }

  const profile = await prisma.organizerProfile.findUnique({
    where: { userId },
    select: { stripeChargesEnabled: true }
  })

  return NextResponse.json({
    stripeChargesEnabled: profile?.stripeChargesEnabled || false
  })
}
