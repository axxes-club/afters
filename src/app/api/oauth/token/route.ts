import { NextRequest, NextResponse } from 'next/server'
import { exchangeAuthorizationCode, refreshAccessToken } from '@/lib/oauth'

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''
    
    let params: Record<string, string> = {}
    
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData()
      formData.forEach((value, key) => {
        params[key] = value.toString()
      })
    } else if (contentType.includes('application/json')) {
      params = await request.json()
    } else {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'Content-Type must be application/x-www-form-urlencoded or application/json' },
        { status: 400 }
      )
    }
    
    const { grant_type, code, client_id, client_secret, redirect_uri, code_verifier, refresh_token } = params
    
    if (!grant_type) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'grant_type is required' },
        { status: 400 }
      )
    }
    
    if (grant_type === 'authorization_code') {
      if (!code || !client_id || !client_secret || !redirect_uri) {
        return NextResponse.json(
          { error: 'invalid_request', error_description: 'code, client_id, client_secret, and redirect_uri are required' },
          { status: 400 }
        )
      }
      
      const result = await exchangeAuthorizationCode({
        code,
        clientId: client_id,
        clientSecret: client_secret,
        redirectUri: redirect_uri,
        codeVerifier: code_verifier,
      })
      
      if ('error' in result) {
        return NextResponse.json(
          { error: result.error, error_description: result.errorDescription },
          { status: 400 }
        )
      }
      
      return NextResponse.json({
        access_token: result.accessToken,
        refresh_token: result.refreshToken,
        token_type: result.tokenType,
        expires_in: result.expiresIn,
        scope: result.scope,
      })
    }
    
    if (grant_type === 'refresh_token') {
      if (!refresh_token || !client_id || !client_secret) {
        return NextResponse.json(
          { error: 'invalid_request', error_description: 'refresh_token, client_id, and client_secret are required' },
          { status: 400 }
        )
      }
      
      const result = await refreshAccessToken({
        refreshToken: refresh_token,
        clientId: client_id,
        clientSecret: client_secret,
      })
      
      if ('error' in result) {
        return NextResponse.json(
          { error: result.error, error_description: result.errorDescription },
          { status: 400 }
        )
      }
      
      return NextResponse.json({
        access_token: result.accessToken,
        refresh_token: result.refreshToken,
        token_type: result.tokenType,
        expires_in: result.expiresIn,
        scope: result.scope,
      })
    }
    
    return NextResponse.json(
      { error: 'unsupported_grant_type', error_description: 'Supported grant types: authorization_code, refresh_token' },
      { status: 400 }
    )
  } catch (error) {
    console.error('OAuth token error:', error)
    return NextResponse.json(
      { error: 'server_error', error_description: 'Internal server error' },
      { status: 500 }
    )
  }
}
