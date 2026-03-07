import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withApiAuth, type ApiContext } from "@/lib/api-middleware"

// GET with API key or session auth
export const GET = withApiAuth(
  async (req: NextRequest, context: ApiContext) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: context.userId },
        include: {
          organizerProfile: {
            include: {
              _count: {
                select: { events: true },
              },
            },
          },
        },
      })

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      return NextResponse.json(user)
    } catch (error) {
      console.error("Error fetching user profile:", error)
      return NextResponse.json(
        { error: "Failed to fetch profile" },
        { status: 500 }
      )
    }
  },
  { allowSession: true }
)