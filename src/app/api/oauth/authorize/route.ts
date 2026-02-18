import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAuthorizationCode, validateRedirectUri } from '@/lib/oauth'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    const body = await request.json()
    const { clientId, redirectUri, scopes, state, codeChallenge, codeChallengeMethod, approved } = body
    
    if (!clientId || !redirectUri) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }
    
    // Find the app
    const app = await prisma.oAuthApp.findUnique({
      where: { clientId },
      select: {
        id: true,
        redirectUris: true,
        isActive: true,
      },
    })
    
    if (!app || !app.isActive) {
      return NextResponse.json({ error: 'Invalid client' }, { status: 400 })
    }
    
    // Validate redirect URI
    if (!validateRedirectUri(redirectUri, app.redirectUris)) {
      return NextResponse.json({ error: 'Invalid redirect_uri' }, { status: 400 })
    }
    
    const redirectUrl = new URL(redirectUri)
    
    // Handle denial
    if (!approved) {
      redirectUrl.searchParams.set('error', 'access_denied')
      redirectUrl.searchParams.set('error_description', 'User denied the authorization request')
      if (state) {
        redirectUrl.searchParams.set('state', state)
      }
      return NextResponse.json({ redirectUrl: redirectUrl.toString() })
    }
    
    // Create authorization code
    const code = await createAuthorizationCode({
      appId: app.id,
      userId,
      scopes: scopes || ['read:profile'],
      redirectUri,
      codeChallenge,
      codeChallengeMethod,
      state,
    })
    
    redirectUrl.searchParams.set('code', code)
    if (state) {
      redirectUrl.searchParams.set('state', state)
    }
    
    return NextResponse.json({ redirectUrl: redirectUrl.toString() })
  } catch (error) {
    console.error('OAuth authorize error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
