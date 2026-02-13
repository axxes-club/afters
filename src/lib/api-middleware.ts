import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import {
  validateApiKey,
  checkApiRateLimit,
  hasScope,
  type ApiScope,
} from "./api-keys"

export interface ApiContext {
  userId: string
  scopes?: string[]
  keyId?: string
  authType: "session" | "api_key"
}

interface WithApiAuthOptions {
  requiredScopes?: ApiScope[]
  allowSession?: boolean // Allow Clerk session auth in addition to API key
}

// Helper to extract API key from request
function extractApiKey(req: NextRequest): string | null {
  // Check Authorization header: "Bearer aftr_xxx"
  const authHeader = req.headers.get("authorization")
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7)
  }

  // Check X-API-Key header
  const apiKeyHeader = req.headers.get("x-api-key")
  if (apiKeyHeader) {
    return apiKeyHeader
  }

  return null
}

// Middleware wrapper for API routes that require API key authentication
export function withApiAuth(
  handler: (req: NextRequest, context: ApiContext) => Promise<NextResponse>,
  options: WithApiAuthOptions = {}
) {
  const { requiredScopes = [], allowSession = false } = options

  return async (req: NextRequest): Promise<NextResponse> => {
    // Try API key auth first
    const apiKey = extractApiKey(req)

    if (apiKey) {
      const result = await validateApiKey(apiKey)

      if (!result.valid) {
        return NextResponse.json(
          { error: result.error || "Invalid API key" },
          { status: 401 }
        )
      }

      // Check rate limit
      const rateLimit = checkApiRateLimit(result.keyId!)
      if (!rateLimit.allowed) {
        return NextResponse.json(
          {
            error: "Rate limit exceeded",
            retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
          },
          {
            status: 429,
            headers: {
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": String(rateLimit.resetAt),
              "Retry-After": String(
                Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
              ),
            },
          }
        )
      }

      // Check required scopes
      for (const scope of requiredScopes) {
        if (!hasScope(result.scopes!, scope)) {
          return NextResponse.json(
            { error: `Missing required scope: ${scope}` },
            { status: 403 }
          )
        }
      }

      // Add rate limit headers to response
      const response = await handler(req, {
        userId: result.userId!,
        scopes: result.scopes,
        keyId: result.keyId,
        authType: "api_key",
      })

      response.headers.set("X-RateLimit-Remaining", String(rateLimit.remaining))
      response.headers.set("X-RateLimit-Reset", String(rateLimit.resetAt))

      return response
    }

    // Try session auth if allowed
    if (allowSession) {
      const { userId } = await auth()

      if (userId) {
        return handler(req, {
          userId,
          authType: "session",
        })
      }
    }

    // No valid authentication
    return NextResponse.json(
      {
        error: "Authentication required",
        hint: "Provide an API key in the Authorization header (Bearer token) or X-API-Key header",
      },
      { status: 401 }
    )
  }
}

// Helper to create API error responses
export function apiError(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status })
}

// Helper to create API success responses
export function apiSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status })
}
