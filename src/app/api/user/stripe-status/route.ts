import { getEffectiveUserId } from "@/lib/auth-utils";
import { organizerWhere } from "@/lib/organizer-context";
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const userId = await getEffectiveUserId()
  if (!userId) {
    return NextResponse.json({ stripeChargesEnabled: false })
  }

  const profile = await prisma.organizerProfile.findUnique({
    where: await organizerWhere("owner"),
    select: { stripeChargesEnabled: true }
  })

  return NextResponse.json({
    stripeChargesEnabled: profile?.stripeChargesEnabled || false
  })
}
