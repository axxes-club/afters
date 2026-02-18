import { createHash, randomBytes, timingSafeEqual } from 'crypto'
import { prisma } from './prisma'

// ==================== Constants ====================

export const OAUTH_SCOPES = {
  'read:profile': {
    name: 'Read Profile',
    description: 'View your basic profile information (name, email)',
  },
  'read:events': {
    name: 'Read Events',
    description: 'View your events and event details',
  },
  'write:events': {
    name: 'Manage Events',
    description: 'Create and modify events',
  },
  'read:orders': {
    name: 'Read Orders',
    description: 'View ticket orders and sales',
  },
  'read:tickets': {
    name: 'Read Tickets',
    description: 'View ticket information',
  },
  'write:tickets': {
    name: 'Check In Tickets',
    description: 'Check in tickets at events',
  },
  'read:guestlist': {
    name: 'Read Guestlist',
    description: 'View guestlist entries',
  },
  'write:guestlist': {
    name: 'Manage Guestlist',
    description: 'Add and remove guestlist entries',
  },
  'read:analytics': {
    name: 'Read Analytics',
    description: 'View event analytics and reports',
  },
  'webhooks': {
    name: 'Webhooks',
    description: 'Create and manage webhook subscriptions',
  },
} as const

export type OAuthScope = keyof typeof OAUTH_SCOPES

// Token expiration times
export const AUTH_CODE_EXPIRY_MS = 10 * 60 * 1000 // 10 minutes
export const ACCESS_TOKEN_EXPIRY_MS = 60 * 60 * 1000 // 1 hour
export const REFRESH_TOKEN_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

// ==================== Hashing ====================

export function hashSecret(secret: string): string {
  return createHash('sha256').update(secret).digest('hex')
}

export function generateSecureToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url')
}

export function generateClientId(): string {
  return `aftr_${randomBytes(16).toString('hex')}`
}

export function generateClientSecret(): string {
  return `afsk_${randomBytes(32).toString('base64url')}`
}

export function verifyHash(plaintext: string, hash: string): boolean {
  const computedHash = hashSecret(plaintext)
  try {
    return timingSafeEqual(Buffer.from(computedHash), Buffer.from(hash))
  } catch {
    return false
  }
}

// ==================== PKCE ====================

export function verifyCodeChallenge(
  codeVerifier: string,
  codeChallenge: string,
  method: string = 'S256'
): boolean {
  if (method === 'plain') {
    return codeVerifier === codeChallenge
  }
  
  // S256: BASE64URL(SHA256(code_verifier))
  const hash = createHash('sha256').update(codeVerifier).digest('base64url')
  return hash === codeChallenge
}

// ==================== Validation ====================

export function validateRedirectUri(uri: string, allowedUris: string[]): boolean {
  try {
    const parsed = new URL(uri)
    
    // Must be HTTPS in production (allow localhost for development)
    const isLocalhost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1'
    if (!isLocalhost && parsed.protocol !== 'https:') {
      return false
    }
    
    // Check against allowed URIs (exact match or pattern)
    return allowedUris.some(allowed => {
      if (allowed === uri) return true
      // Support wildcard subdomains: https://*.example.com/callback
      if (allowed.includes('*')) {
        const pattern = allowed.replace(/\*/g, '[^/]+')
        return new RegExp(`^${pattern}$`).test(uri)
      }
      return false
    })
  } catch {
    return false
  }
}

export function validateScopes(requested: string[], allowed: string[]): string[] {
  const validScopes = Object.keys(OAUTH_SCOPES)
  return requested.filter(scope => 
    validScopes.includes(scope) && allowed.includes(scope)
  )
}

export function parseScopes(scopeString: string): string[] {
  return scopeString.split(/[\s,]+/).filter(Boolean)
}

// ==================== Token Operations ====================

export async function createAuthorizationCode(params: {
  appId: string
  userId: string
  scopes: string[]
  redirectUri: string
  codeChallenge?: string
  codeChallengeMethod?: string
  state?: string
}): Promise<string> {
  const code = generateSecureToken(32)
  
  await prisma.oAuthAuthorizationCode.create({
    data: {
      code,
      appId: params.appId,
      userId: params.userId,
      scopes: params.scopes,
      redirectUri: params.redirectUri,
      codeChallenge: params.codeChallenge,
      codeChallengeMethod: params.codeChallengeMethod,
      state: params.state,
      expiresAt: new Date(Date.now() + AUTH_CODE_EXPIRY_MS),
    },
  })
  
  return code
}

export async function exchangeAuthorizationCode(params: {
  code: string
  clientId: string
  clientSecret: string
  redirectUri: string
  codeVerifier?: string
}): Promise<{
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: string
  scope: string
} | { error: string; errorDescription: string }> {
  // Find the authorization code
  const authCode = await prisma.oAuthAuthorizationCode.findUnique({
    where: { code: params.code },
    include: { app: true },
  })
  
  if (!authCode) {
    return { error: 'invalid_grant', errorDescription: 'Authorization code not found' }
  }
  
  // Check if expired
  if (authCode.expiresAt < new Date()) {
    return { error: 'invalid_grant', errorDescription: 'Authorization code expired' }
  }
  
  // Check if already used
  if (authCode.usedAt) {
    // Revoke all tokens for this app/user combo (security measure)
    await prisma.oAuthAccessToken.updateMany({
      where: { appId: authCode.appId, userId: authCode.userId },
      data: { revokedAt: new Date() },
    })
    return { error: 'invalid_grant', errorDescription: 'Authorization code already used' }
  }
  
  // Verify client
  if (authCode.app.clientId !== params.clientId) {
    return { error: 'invalid_client', errorDescription: 'Client ID mismatch' }
  }
  
  if (!verifyHash(params.clientSecret, authCode.app.clientSecret)) {
    return { error: 'invalid_client', errorDescription: 'Invalid client secret' }
  }
  
  // Verify redirect URI
  if (authCode.redirectUri !== params.redirectUri) {
    return { error: 'invalid_grant', errorDescription: 'Redirect URI mismatch' }
  }
  
  // Verify PKCE if code challenge was provided
  if (authCode.codeChallenge) {
    if (!params.codeVerifier) {
      return { error: 'invalid_grant', errorDescription: 'Code verifier required' }
    }
    if (!verifyCodeChallenge(params.codeVerifier, authCode.codeChallenge, authCode.codeChallengeMethod || 'S256')) {
      return { error: 'invalid_grant', errorDescription: 'Invalid code verifier' }
    }
  }
  
  // Mark code as used
  await prisma.oAuthAuthorizationCode.update({
    where: { id: authCode.id },
    data: { usedAt: new Date() },
  })
  
  // Generate tokens
  const accessToken = generateSecureToken(32)
  const refreshToken = generateSecureToken(32)
  const scopes = authCode.scopes
  
  // Create access token record
  await prisma.oAuthAccessToken.create({
    data: {
      tokenHash: hashSecret(accessToken),
      tokenPrefix: accessToken.slice(0, 8),
      refreshTokenHash: hashSecret(refreshToken),
      refreshExpiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
      appId: authCode.appId,
      userId: authCode.userId,
      scopes,
      expiresAt: new Date(Date.now() + ACCESS_TOKEN_EXPIRY_MS),
    },
  })
  
  // Create or update connection record
  await prisma.oAuthConnection.upsert({
    where: {
      appId_userId: {
        appId: authCode.appId,
        userId: authCode.userId,
      },
    },
    update: {
      scopes,
      updatedAt: new Date(),
    },
    create: {
      appId: authCode.appId,
      userId: authCode.userId,
      scopes,
    },
  })
  
  return {
    accessToken,
    refreshToken,
    expiresIn: Math.floor(ACCESS_TOKEN_EXPIRY_MS / 1000),
    tokenType: 'Bearer',
    scope: scopes.join(' '),
  }
}

export async function refreshAccessToken(params: {
  refreshToken: string
  clientId: string
  clientSecret: string
}): Promise<{
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: string
  scope: string
} | { error: string; errorDescription: string }> {
  const refreshHash = hashSecret(params.refreshToken)
  
  const tokenRecord = await prisma.oAuthAccessToken.findUnique({
    where: { refreshTokenHash: refreshHash },
    include: { app: true },
  })
  
  if (!tokenRecord) {
    return { error: 'invalid_grant', errorDescription: 'Invalid refresh token' }
  }
  
  if (tokenRecord.revokedAt) {
    return { error: 'invalid_grant', errorDescription: 'Token has been revoked' }
  }
  
  if (tokenRecord.refreshExpiresAt && tokenRecord.refreshExpiresAt < new Date()) {
    return { error: 'invalid_grant', errorDescription: 'Refresh token expired' }
  }
  
  // Verify client
  if (tokenRecord.app.clientId !== params.clientId) {
    return { error: 'invalid_client', errorDescription: 'Client ID mismatch' }
  }
  
  if (!verifyHash(params.clientSecret, tokenRecord.app.clientSecret)) {
    return { error: 'invalid_client', errorDescription: 'Invalid client secret' }
  }
  
  // Revoke old token
  await prisma.oAuthAccessToken.update({
    where: { id: tokenRecord.id },
    data: { revokedAt: new Date() },
  })
  
  // Generate new tokens
  const accessToken = generateSecureToken(32)
  const refreshToken = generateSecureToken(32)
  const scopes = tokenRecord.scopes
  
  await prisma.oAuthAccessToken.create({
    data: {
      tokenHash: hashSecret(accessToken),
      tokenPrefix: accessToken.slice(0, 8),
      refreshTokenHash: hashSecret(refreshToken),
      refreshExpiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
      appId: tokenRecord.appId,
      userId: tokenRecord.userId,
      scopes,
      expiresAt: new Date(Date.now() + ACCESS_TOKEN_EXPIRY_MS),
    },
  })
  
  return {
    accessToken,
    refreshToken,
    expiresIn: Math.floor(ACCESS_TOKEN_EXPIRY_MS / 1000),
    tokenType: 'Bearer',
    scope: scopes.join(' '),
  }
}

export async function validateAccessToken(token: string): Promise<{
  valid: true
  userId: string
  appId: string
  scopes: string[]
} | { valid: false; error: string }> {
  const tokenHash = hashSecret(token)
  
  const tokenRecord = await prisma.oAuthAccessToken.findUnique({
    where: { tokenHash },
  })
  
  if (!tokenRecord) {
    return { valid: false, error: 'Token not found' }
  }
  
  if (tokenRecord.revokedAt) {
    return { valid: false, error: 'Token revoked' }
  }
  
  if (tokenRecord.expiresAt < new Date()) {
    return { valid: false, error: 'Token expired' }
  }
  
  // Update last used
  await prisma.oAuthAccessToken.update({
    where: { id: tokenRecord.id },
    data: { lastUsedAt: new Date() },
  })
  
  return {
    valid: true,
    userId: tokenRecord.userId,
    appId: tokenRecord.appId,
    scopes: tokenRecord.scopes,
  }
}

export async function revokeToken(token: string): Promise<boolean> {
  const tokenHash = hashSecret(token)
  
  const result = await prisma.oAuthAccessToken.updateMany({
    where: {
      OR: [
        { tokenHash },
        { refreshTokenHash: tokenHash },
      ],
    },
    data: { revokedAt: new Date() },
  })
  
  return result.count > 0
}

export async function revokeAllAppTokens(appId: string, userId: string): Promise<void> {
  await prisma.oAuthAccessToken.updateMany({
    where: { appId, userId },
    data: { revokedAt: new Date() },
  })
  
  await prisma.oAuthConnection.delete({
    where: {
      appId_userId: { appId, userId },
    },
  }).catch(() => {}) // Ignore if doesn't exist
}
