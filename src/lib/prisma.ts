import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL
  
  // During build time, DATABASE_URL may not be available
  // Return a proxy that will throw helpful errors at runtime
  if (!connectionString) {
    // Check if we're in a build environment
    const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build'
    
    if (isBuildTime) {
      // Return a proxy that throws at runtime if actually used
      return new Proxy({} as PrismaClient, {
        get(_target, prop) {
          // Allow checking for existence
          if (prop === 'then' || prop === '$connect' || prop === '$disconnect') {
            return undefined
          }
          throw new Error(
            `DATABASE_URL is not set. This error occurred because Prisma was accessed during build time. ` +
            `Make sure your code doesn't call Prisma during static generation.`
          )
        },
      })
    }
    
    throw new Error('DATABASE_URL is not set')
  }
  
  const usesNeon = new URL(connectionString).hostname.endsWith('.neon.tech')
  const adapter = usesNeon
    ? new PrismaNeon({ connectionString, max: 2 })
    : new PrismaPg({
        connectionString,
        max: 2,
        connectionTimeoutMillis: 10_000,
        idleTimeoutMillis: 30_000,
      })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

globalForPrisma.prisma = prisma
// Build trigger Wed Feb 18 02:54:31 EST 2026
