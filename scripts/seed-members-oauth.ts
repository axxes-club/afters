// Run this with: npx tsx scripts/seed-members-oauth.ts
// Make sure .env.local is loaded (it reads DATABASE_URL from environment)
import { prisma } from '../src/lib/prisma'
import { createHash, randomBytes } from 'crypto'

function hashSecret(secret: string): string {
  return createHash('sha256').update(secret).digest('hex')
}

function generateClientId(): string {
  return `aftr_${randomBytes(16).toString('hex')}`
}

function generateClientSecret(): string {
  return `afsk_${randomBytes(32).toString('base64url')}`
}

async function main() {
  console.log('Connecting to database...')
  
  // Check if app already exists
  const existing = await prisma.oAuthApp.findFirst({
    where: { name: 'Members Portal' }
  })

  if (existing) {
    console.log('\n⚠️  Members Portal app already exists!')
    console.log('Client ID:', existing.clientId)
    console.log('Redirect URIs:', existing.redirectUris)
    console.log('Active:', existing.isActive)
    console.log('\nIf you need new credentials, delete the existing app first.')
    return
  }

  // Find owner user
  let ownerId: string
  const axxesUser = await prisma.user.findFirst({
    where: { email: 'hello@axxes.com' }
  })
  
  if (axxesUser) {
    ownerId = axxesUser.id
    console.log('Found AXXES user:', axxesUser.email)
  } else {
    // Find any superadmin
    const admin = await prisma.user.findFirst({
      where: { role: 'SUPERADMIN' }
    })
    if (!admin) {
      console.error('No superadmin user found!')
      process.exit(1)
    }
    ownerId = admin.id
    console.log('Using admin user:', admin.email)
  }

  const clientId = generateClientId()
  const clientSecret = generateClientSecret()

  const app = await prisma.oAuthApp.create({
    data: {
      name: 'Members Portal',
      description: 'AXXES Members Portal - member management and integrations',
      clientId,
      clientSecret: hashSecret(clientSecret),
      redirectUris: [
        'https://members.axxes.club/api/integrations/afters/callback',
        'http://localhost:3000/api/integrations/afters/callback',
      ],
      scopes: ['read:profile', 'read:events', 'read:orders', 'read:tickets', 'read:guestlist'],
      websiteUrl: 'https://members.axxes.club',
      isActive: true,
      isVerified: true,
      userId: ownerId,
    },
  })

  console.log('\n✅ Members Portal OAuth App Created!\n')
  console.log('='.repeat(50))
  console.log('SAVE THESE CREDENTIALS - SECRET SHOWN ONLY ONCE!')
  console.log('='.repeat(50))
  console.log()
  console.log('AFTERS_CLIENT_ID=' + clientId)
  console.log('AFTERS_CLIENT_SECRET=' + clientSecret)
  console.log('AFTERS_OAUTH_URL=https://afters.am')
  console.log()
  console.log('='.repeat(50))
  console.log('App ID:', app.id)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
