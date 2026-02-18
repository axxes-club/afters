import { auth } from "@clerk/nextjs/server"
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// List user's connected apps
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const connections = await prisma.oAuthConnection.findMany({
      where: { userId },
      include: {
        app: {
          select: {
            id: true,
            name: true,
            description: true,
            logoUrl: true,
            websiteUrl: true,
            isVerified: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    
    return NextResponse.json({
      success: true,
      data: connections.map(c => ({
        id: c.id,
        app: c.app,
        scopes: c.scopes,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Error listing connections:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
