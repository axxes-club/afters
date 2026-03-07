import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'
import { hashSecret } from '../src/lib/oauth.js'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// After-CLI OAuth App Configuration
// These credentials are embedded in the after-cli TUI app
const AFTER_CLI_OAUTH = {
  name: 'After CLI',
  description: 'Official command-line interface for afters.am',
  clientId: 'aftr_aftercli_prod',
  clientSecret: 'afsk_cli_secret_key_prod_2024',
  redirectUris: [
    'http://localhost:3456/callback',
  ],
  scopes: [
    'read:profile',
    'read:events',
    'write:events',
    'read:orders',
    'read:tickets',
    'write:tickets',
    'read:guestlist',
    'write:guestlist',
    'read:analytics',
  ],
}

async function main() {
  console.log('🔑 Seeding After CLI OAuth App...\n')

  // Find or create a system user for the OAuth app
  // We'll use the first superadmin or create a system user
  let systemUser = await prisma.user.findFirst({
    where: { role: 'SUPERADMIN' }
  })

  if (!systemUser) {
    // Find any user
    systemUser = await prisma.user.findFirst()
  }

  if (!systemUser) {
    console.log('❌ No user found. Please create a user first.')
    return
  }

  console.log(`📋 Using user: ${systemUser.email}\n`)

  // Check if the OAuth app already exists
  const existing = await prisma.oAuthApp.findUnique({
    where: { clientId: AFTER_CLI_OAUTH.clientId }
  })

  if (existing) {
    console.log('✅ After CLI OAuth App already exists:')
    console.log(`   Client ID: ${existing.clientId}`)
    console.log(`   Redirect URIs: ${existing.redirectUris.join(', ')}`)
    console.log(`   Scopes: ${existing.scopes.join(', ')}`)
    return
  }

  // Create the OAuth app
  const hashedSecret = hashSecret(AFTER_CLI_OAUTH.clientSecret)

  const app = await prisma.oAuthApp.create({
    data: {
      name: AFTER_CLI_OAUTH.name,
      description: AFTER_CLI_OAUTH.description,
      clientId: AFTER_CLI_OAUTH.clientId,
      clientSecret: hashedSecret,
      redirectUris: AFTER_CLI_OAUTH.redirectUris,
      scopes: AFTER_CLI_OAUTH.scopes,
      isActive: true,
      isVerified: true, // Mark as verified since it's official
      userId: systemUser.id,
    }
  })

  console.log('✅ Created After CLI OAuth App:')
  console.log(`   ID: ${app.id}`)
  console.log(`   Name: ${app.name}`)
  console.log(`   Client ID: ${app.clientId}`)
  console.log(`   Redirect URIs: ${app.redirectUris.join(', ')}`)
  console.log(`   Scopes: ${app.scopes.join(', ')}`)
  console.log(`   Is Verified: ${app.isVerified}`)
  console.log('\n🎉 Done! The after-cli TUI can now authenticate via OAuth.')
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })