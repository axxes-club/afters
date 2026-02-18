import { NextRequest, NextResponse } from 'next/server'
import { revokeToken } from '@/lib/oauth'

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
    
    const { token } = params
    
    if (!token) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'token is required' },
        { status: 400 }
      )
    }
    
    await revokeToken(token)
    
    // Per RFC 7009, always return 200 OK even if token wasn't found
    return new NextResponse(null, { status: 200 })
  } catch (error) {
    console.error('OAuth revoke error:', error)
    return NextResponse.json(
      { error: 'server_error', error_description: 'Internal server error' },
      { status: 500 }
    )
  }
}
