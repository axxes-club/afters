import { NextRequest, NextResponse } from 'next/server'
import { validateAccessToken } from '@/lib/oauth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'invalid_token', error_description: 'Bearer token required' },
        { status: 401 }
      )
    }
    
    const token = authHeader.slice(7)
    const validation = await validateAccessToken(token)
    
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'invalid_token', error_description: validation.error },
        { status: 401 }
      )
    }
    
    // Check if read:profile scope is granted
    if (!validation.scopes.includes('read:profile')) {
      return NextResponse.json(
        { error: 'insufficient_scope', error_description: 'read:profile scope required' },
        { status: 403 }
      )
    }
    
    const user = await prisma.user.findUnique({
      where: { id: validation.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        username: true,
        imageUrl: true,
      },
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'invalid_token', error_description: 'User not found' },
        { status: 401 }
      )
    }
    
    return NextResponse.json({
      sub: user.id,
      email: user.email,
      name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username,
      given_name: user.firstName,
      family_name: user.lastName,
      preferred_username: user.username,
      picture: user.imageUrl,
    })
  } catch (error) {
    console.error('OAuth userinfo error:', error)
    return NextResponse.json(
      { error: 'server_error', error_description: 'Internal server error' },
      { status: 500 }
    )
  }
}
