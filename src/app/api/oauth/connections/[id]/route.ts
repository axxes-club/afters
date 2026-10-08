import { getUserId } from "@/lib/auth/session"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { revokeAllAppTokens } from '@/lib/oauth'

// Revoke connection (disconnect app)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { id } = await params
    
    // Find the connection
    const connection = await prisma.oAuthConnection.findFirst({
      where: { id, userId },
    })
    
    if (!connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
    }
    
    // Revoke all tokens for this app/user combo
    await revokeAllAppTokens(connection.appId, userId)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error revoking connection:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
