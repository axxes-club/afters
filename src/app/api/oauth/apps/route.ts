import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateClientId, generateClientSecret, hashSecret, OAUTH_SCOPES } from '@/lib/oauth'

// List user's OAuth apps
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const apps = await prisma.oAuthApp.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        description: true,
        clientId: true,
        redirectUris: true,
        scopes: true,
        logoUrl: true,
        websiteUrl: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        _count: {
          select: { connections: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    
    return NextResponse.json({
      success: true,
      data: apps.map(app => ({
        ...app,
        connectionsCount: app._count.connections,
      })),
    })
  } catch (error) {
    console.error('Error listing OAuth apps:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Create new OAuth app
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { name, description, redirectUris, scopes, logoUrl, websiteUrl, privacyUrl, termsUrl } = body
    
    if (!name || !redirectUris || !Array.isArray(redirectUris) || redirectUris.length === 0) {
      return NextResponse.json(
        { error: 'name and at least one redirectUri are required' },
        { status: 400 }
      )
    }
    
    // Validate redirect URIs
    for (const uri of redirectUris) {
      try {
        const parsed = new URL(uri)
        const isLocalhost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1'
        if (!isLocalhost && parsed.protocol !== 'https:') {
          return NextResponse.json(
            { error: `Redirect URI must use HTTPS: ${uri}` },
            { status: 400 }
          )
        }
      } catch {
        return NextResponse.json(
          { error: `Invalid redirect URI: ${uri}` },
          { status: 400 }
        )
      }
    }
    
    // Validate scopes
    const validScopes = Object.keys(OAUTH_SCOPES)
    const requestedScopes = scopes || ['read:profile']
    for (const scope of requestedScopes) {
      if (!validScopes.includes(scope)) {
        return NextResponse.json(
          { error: `Invalid scope: ${scope}` },
          { status: 400 }
        )
      }
    }
    
    const clientId = generateClientId()
    const clientSecret = generateClientSecret()
    
    const app = await prisma.oAuthApp.create({
      data: {
        name,
        description,
        clientId,
        clientSecret: hashSecret(clientSecret),
        redirectUris,
        scopes: requestedScopes,
        logoUrl,
        websiteUrl,
        privacyUrl,
        termsUrl,
        userId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        clientId: true,
        redirectUris: true,
        scopes: true,
        logoUrl: true,
        websiteUrl: true,
        createdAt: true,
      },
    })
    
    // Return client secret only on creation (never stored in plain text)
    return NextResponse.json({
      success: true,
      data: {
        ...app,
        clientSecret, // Only returned once!
      },
      message: 'Save your client secret now - it will not be shown again.',
    })
  } catch (error) {
    console.error('Error creating OAuth app:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
