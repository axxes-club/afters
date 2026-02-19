import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateRedirectUri, validateScopes, parseScopes } from '@/lib/oauth'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required', loginUrl: `/sign-in?redirect_url=${encodeURIComponent('/oauth/authorize' + request.nextUrl.search)}` },
        { status: 401 }
      )
    }
    
    const searchParams = request.nextUrl.searchParams
    const clientId = searchParams.get('client_id')
    const redirectUri = searchParams.get('redirect_uri')
    const scope = searchParams.get('scope') || ''
    
    if (!clientId) {
      return NextResponse.json({ error: 'client_id is required' }, { status: 400 })
    }
    
    if (!redirectUri) {
      return NextResponse.json({ error: 'redirect_uri is required' }, { status: 400 })
    }
    
    // Find the app
    const app = await prisma.oAuthApp.findUnique({
      where: { clientId },
      select: {
        id: true,
        name: true,
        description: true,
        logoUrl: true,
        websiteUrl: true,
        redirectUris: true,
        scopes: true,
        isActive: true,
        isVerified: true,
      },
    })
    
    if (!app) {
      console.error(`OAuth validate: Invalid client_id "${clientId}" - app not found`)
      return NextResponse.json({ error: 'Invalid client_id. The application may not be registered.' }, { status: 400 })
    }
    
    if (!app.isActive) {
      console.error(`OAuth validate: App "${app.name}" (${clientId}) is disabled`)
      return NextResponse.json({ error: 'This application has been disabled' }, { status: 400 })
    }
    
    // Validate redirect URI
    if (!validateRedirectUri(redirectUri, app.redirectUris)) {
      console.error(`OAuth validate: Invalid redirect_uri for app "${app.name}". Got: "${redirectUri}", Allowed: ${JSON.stringify(app.redirectUris)}`)
      return NextResponse.json({ 
        error: 'Invalid redirect_uri. The redirect URL does not match the registered callback URLs.' 
      }, { status: 400 })
    }
    
    // Validate and filter scopes
    const requestedScopes = parseScopes(scope)
    const validScopes = validateScopes(
      requestedScopes.length > 0 ? requestedScopes : ['read:profile'],
      app.scopes
    )
    
    if (validScopes.length === 0) {
      return NextResponse.json({ error: 'No valid scopes requested' }, { status: 400 })
    }
    
    return NextResponse.json({
      app: {
        id: app.id,
        name: app.name,
        description: app.description,
        logoUrl: app.logoUrl,
        websiteUrl: app.websiteUrl,
        isVerified: app.isVerified,
      },
      scopes: validScopes,
    })
  } catch (error) {
    console.error('OAuth validate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
