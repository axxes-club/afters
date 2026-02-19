import { prisma } from '../src/lib/prisma'
import { createHash } from 'crypto'

async function main() {
  const app = await prisma.oAuthApp.findFirst({
    where: { name: 'Members Portal' }
  })
  
  if (!app) {
    console.log('App not found!')
    return
  }
  
  console.log('App:', app.name)
  console.log('Client ID:', app.clientId)
  console.log('Stored secret hash:', app.clientSecret)
  
  // Test the secret from members.axxes.club env
  const testSecret = 'afsk_SjipOCFpitHsOVBkl5jbhFK6ZO10RsLjxlrjcP_qRgI'
  const testHash = createHash('sha256').update(testSecret).digest('hex')
  console.log('\nTest secret hash:', testHash)
  console.log('Hashes match:', testHash === app.clientSecret)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
