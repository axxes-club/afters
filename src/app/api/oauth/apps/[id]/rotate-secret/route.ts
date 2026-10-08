import { getUserId } from "@/lib/auth/session"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateClientSecret, hashSecret } from '@/lib/oauth'

// Rotate client secret
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { id } = await params
    
    // Verify ownership
    const existing = await prisma.oAuthApp.findFirst({
      where: { id, userId },
    })
    
    if (!existing) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 })
    }
    
    const clientSecret = generateClientSecret()
    
    await prisma.oAuthApp.update({
      where: { id },
      data: {
        clientSecret: hashSecret(clientSecret),
      },
    })
    
    // Revoke all existing tokens (security best practice)
    await prisma.oAuthAccessToken.updateMany({
      where: { appId: id },
      data: { revokedAt: new Date() },
    })
    
    return NextResponse.json({
      success: true,
      data: {
        clientSecret, // Only returned once!
      },
      message: 'Client secret rotated. All existing tokens have been revoked. Save your new secret now - it will not be shown again.',
    })
  } catch (error) {
    console.error('Error rotating client secret:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
