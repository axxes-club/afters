import 'dotenv/config';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Script to set up local database with events from Neon branches
 * This script will:
 * 1. Run database migrations
 * 2. Generate Prisma client
 * 3. Import events from branches if available
 */

async function setupLocalDatabase() {
  console.log('🚀 Setting up local database with branch events...\n');

  try {
    // Step 1: Run migrations
    console.log('📦 Running database migrations...');
    execSync('npx prisma db push', { stdio: 'inherit' });
    console.log('✅ Migrations completed\n');

    // Step 2: Generate Prisma client
    console.log('⚙️  Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Client generated\n');

    // Step 3: Check if events data exists and import if available
    const eventsDataPath = path.join(__dirname, '..', 'data', 'simplified-events-from-branches.json');
    
    if (fs.existsSync(eventsDataPath)) {
      console.log('📥 Events data file found, importing events...');
      execSync('npx tsx scripts/import-events-for-dev.ts', { stdio: 'inherit' });
      console.log('✅ Events imported\n');
    } else {
      console.log('🔍 No events data file found. Skipping import.');
      console.log('💡 To import events, first run: npx tsx scripts/pull-events-from-branches.ts');
      console.log('   Then run this script again.\n');
    }

    console.log('🎉 Local database setup complete!');
    console.log('💡 You can now run the app with: npm run dev');
  } catch (error) {
    console.error('❌ Error during setup:', error);
    process.exit(1);
  }
}

setupLocalDatabase();