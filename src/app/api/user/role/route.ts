import { prisma } from "@/lib/prisma"
import { getUserId } from "@/lib/auth/session"
import { NextResponse } from "next/server"

export async function GET() {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ role: "USER" })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  })

  return NextResponse.json({ role: user?.role || "USER" })
}
