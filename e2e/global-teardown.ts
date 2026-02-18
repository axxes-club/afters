import { FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { createBranchManager } from './utils/neon-branch';

/**
 * Global teardown for E2E tests.
 *
 * This runs once after all tests and:
 * 1. Deletes the Neon test branch (unless in CI for debugging)
 * 2. Cleans up any temporary files
 */
async function globalTeardown(_config: FullConfig) {
  console.log('\n🧹 E2E Global Teardown Starting...\n');

  const branchInfoPath = path.join(__dirname, '.test-branch-info.json');

  // Check if we have branch info to clean up
  if (!fs.existsSync(branchInfoPath)) {
    console.log('ℹ️  No test branch to clean up');
    console.log('✨ E2E Global Teardown Complete\n');
    return;
  }

  try {
    const branchInfo = JSON.parse(fs.readFileSync(branchInfoPath, 'utf-8'));
    const { branchId, branchName } = branchInfo;

    // In CI, preserve branches for debugging (they'll be cleaned up by scheduled job)
    if (process.env.CI) {
      console.log(`ℹ️  Preserving test branch for CI debugging: ${branchName}`);
      console.log(`   Branch ID: ${branchId}`);
      console.log('   Branch will be auto-deleted after 24 hours');
    } else {
      // In local dev, clean up the branch
      const branchManager = createBranchManager();

      if (branchManager) {
        console.log(`🗑️  Deleting test branch: ${branchName}`);
        await branchManager.deleteBranch(branchId);
        console.log('✅ Test branch deleted');
      }
    }

    // Clean up the temp file
    fs.unlinkSync(branchInfoPath);
  } catch (error) {
    console.error('⚠️  Error during teardown:', error);
    // Don't fail teardown - it's not critical
  }

  console.log('✨ E2E Global Teardown Complete\n');
}

export default globalTeardown;
