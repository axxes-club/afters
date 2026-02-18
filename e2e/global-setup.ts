import { FullConfig } from '@playwright/test';
import { execSync } from 'child_process';
import { createBranchManager } from './utils/neon-branch';
import * as fs from 'fs';
import * as path from 'path';
import { clerkSetup } from '@clerk/testing/playwright';

/**
 * Global setup for E2E tests.
 *
 * This runs once before all tests and:
 * 1. Sets up Clerk testing environment
 * 2. Creates a Neon test branch (if configured)
 * 3. Runs Prisma migrations on the test branch
 * 4. Seeds base test data
 * 5. Stores branch info for global teardown
 */
async function globalSetup(_config: FullConfig) {
  console.log('\n🚀 E2E Global Setup Starting...\n');

  // Set up Clerk testing - MUST be called before any tests use setupClerkTestingToken
  console.log('🔐 Setting up Clerk testing environment...');
  await clerkSetup();
  console.log('✅ Clerk testing environment ready\n');

  const branchManager = createBranchManager();

  if (branchManager) {
    try {
      // Create a test branch for this test run
      const suiteName = process.env.CI ? 'ci' : 'local';
      const { branchId, branchName, connectionString } =
        await branchManager.createTestBranch(suiteName);

      // Store branch info for teardown and tests
      process.env.TEST_NEON_BRANCH_ID = branchId;
      process.env.TEST_DATABASE_URL = connectionString;

      // Write to a temp file for teardown (since process.env doesn't persist)
      const branchInfoPath = path.join(__dirname, '.test-branch-info.json');
      fs.writeFileSync(
        branchInfoPath,
        JSON.stringify({ branchId, branchName, connectionString })
      );

      console.log(`✅ Created test branch: ${branchName}`);
      console.log(`   Branch ID: ${branchId}`);

      // Run Prisma migrations on the test branch
      console.log('\n📦 Running Prisma db push on test branch...');
      execSync('npx prisma db push --skip-generate --accept-data-loss', {
        env: {
          ...process.env,
          DATABASE_URL: connectionString,
        },
        stdio: 'inherit',
        cwd: path.resolve(__dirname, '..'),
      });
      console.log('✅ Database schema applied');

      // Seed base test data
      console.log('\n🌱 Seeding test data...');
      await seedTestData(connectionString);
      console.log('✅ Test data seeded');
    } catch (error) {
      console.error('❌ Failed to set up test branch:', error);
      // Don't fail - tests can run against default DB
      console.warn('⚠️  Tests will run against the default database');
    }
  } else {
    console.log('ℹ️  Neon branch management not configured');
    console.log('   Tests will run against DATABASE_URL from environment');
  }

  // Clean up old e2e branches in the background (don't block tests)
  if (branchManager && !process.env.CI) {
    branchManager.cleanupOldBranches(24).catch((error) => {
      console.warn('⚠️  Failed to cleanup old branches:', error);
    });
  }

  console.log('\n✨ E2E Global Setup Complete\n');
}

/**
 * Seed base test data that tests depend on
 */
async function seedTestData(connectionString: string) {
  // Import prisma with the test connection string using Neon adapter
  const { PrismaClient } = await import('@prisma/client');
  const { PrismaNeon } = await import('@prisma/adapter-neon');
  const adapter = new PrismaNeon({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    // Create a pre-onboarded test user that tests can use
    const testUser = await prisma.user.upsert({
      where: { id: 'user_e2e_onboarded' },
      update: {},
      create: {
        id: 'user_e2e_onboarded',
        email: 'e2e-onboarded@test.afters.app',
        firstName: 'E2E',
        lastName: 'Tester',
        role: 'ORGANIZER',
      },
    });

    // Create organizer profile for the test user
    await prisma.organizerProfile.upsert({
      where: { userId: testUser.id },
      update: {},
      create: {
        userId: testUser.id,
        displayName: 'E2E Test Organizer',
        slug: 'e2e-test-organizer',
        bio: 'Automated test organizer profile',
      },
    });

    console.log('   Created test user: e2e-onboarded@test.afters.app');
  } finally {
    await prisma.$disconnect();
  }
}

export default globalSetup;
