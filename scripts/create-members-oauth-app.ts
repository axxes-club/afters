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
  // Find AXXES user (the owner)
  const user = await prisma.user.findFirst({
    where: { email: 'hello@axxes.com' }
  })
  
  if (!user) {
    console.error('User not found!')
    process.exit(1)
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
      isVerified: true, // Our own app, so verified
      userId: user.id,
    },
  })

  console.log('\n=== OAuth App Created ===')
  console.log(`App ID: ${app.id}`)
  console.log(`Name: ${app.name}`)
  console.log(`\n🔑 CREDENTIALS (save these!):\n`)
  console.log(`AFTERS_CLIENT_ID=${clientId}`)
  console.log(`AFTERS_CLIENT_SECRET=${clientSecret}`)
  console.log(`AFTERS_OAUTH_URL=https://afters.am`)
  console.log('\n⚠️  The client secret will NOT be shown again!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
