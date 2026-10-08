import { getUserId } from "@/lib/auth/session"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { OAUTH_SCOPES } from '@/lib/oauth'

// Get single OAuth app
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { id } = await params
    
    const app = await prisma.oAuthApp.findFirst({
      where: { id, userId },
      select: {
        id: true,
        name: true,
        description: true,
        clientId: true,
        redirectUris: true,
        scopes: true,
        logoUrl: true,
        websiteUrl: true,
        privacyUrl: true,
        termsUrl: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { connections: true, accessTokens: true },
        },
      },
    })
    
    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      data: {
        ...app,
        connectionsCount: app._count.connections,
        activeTokensCount: app._count.accessTokens,
      },
    })
  } catch (error) {
    console.error('Error fetching OAuth app:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Update OAuth app
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { id } = await params
    const body = await request.json()
    const { name, description, redirectUris, scopes, logoUrl, websiteUrl, privacyUrl, termsUrl, isActive } = body
    
    // Verify ownership
    const existing = await prisma.oAuthApp.findFirst({
      where: { id, userId },
    })
    
    if (!existing) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 })
    }
    
    // Validate redirect URIs if provided
    if (redirectUris) {
      if (!Array.isArray(redirectUris) || redirectUris.length === 0) {
        return NextResponse.json(
          { error: 'At least one redirectUri is required' },
          { status: 400 }
        )
      }
      
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
    }
    
    // Validate scopes if provided
    if (scopes) {
      const validScopes = Object.keys(OAUTH_SCOPES)
      for (const scope of scopes) {
        if (!validScopes.includes(scope)) {
          return NextResponse.json(
            { error: `Invalid scope: ${scope}` },
            { status: 400 }
          )
        }
      }
    }
    
    const app = await prisma.oAuthApp.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(redirectUris !== undefined && { redirectUris }),
        ...(scopes !== undefined && { scopes }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(websiteUrl !== undefined && { websiteUrl }),
        ...(privacyUrl !== undefined && { privacyUrl }),
        ...(termsUrl !== undefined && { termsUrl }),
        ...(isActive !== undefined && { isActive }),
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
        isActive: true,
        updatedAt: true,
      },
    })
    
    return NextResponse.json({ success: true, data: app })
  } catch (error) {
    console.error('Error updating OAuth app:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Delete OAuth app
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
    
    // Verify ownership
    const existing = await prisma.oAuthApp.findFirst({
      where: { id, userId },
    })
    
    if (!existing) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 })
    }
    
    // Delete will cascade to auth codes, tokens, and connections
    await prisma.oAuthApp.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting OAuth app:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
