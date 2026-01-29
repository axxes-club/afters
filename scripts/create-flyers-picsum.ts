import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { UTApi } from 'uploadthing/server';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const utapi = new UTApi();

// Generate unique seed based on artist name for consistent images
function artistToSeed(title: string): number {
  const base = title.toLowerCase().split(' - ')[0].split(' + ')[0].trim();
  return Math.abs(base.split('').reduce((a, c) => c.charCodeAt(0) + ((a << 5) - a), 0));
}

async function uploadFromPicsum(seed: number, slug: string): Promise<string | null> {
  try {
    // Use picsum.photos which provides free, reliable high-quality images
    // Using grayscale for EDM event vibe
    const picsumUrl = `https://picsum.photos/seed/${seed}/800/800`;
    
    console.log(`    📤 Fetching from Picsum (seed: ${seed})...`);
    
    const response = await fetch(picsumUrl, {
      redirect: 'follow'
    });
    
    if (!response.ok) {
      console.log(`    ⚠️ Failed: ${response.status}`);
      return null;
    }

    const buffer = await response.arrayBuffer();
    
    if (buffer.byteLength < 10000) {
      console.log('    ⚠️ Image too small');
      return null;
    }
    
    const file = new File([buffer], `event-${slug}.jpg`, { type: 'image/jpeg' });
    
    console.log(`    📤 Uploading to UploadThing...`);
    const result = await utapi.uploadFiles([file]);
    const url = result[0]?.data?.ufsUrl || result[0]?.data?.url;
    
    if (url) {
      console.log(`    ✅ Success: ${url.substring(0, 50)}...`);
      return url;
    }
    
    return null;
  } catch (error: any) {
    console.log(`    ⚠️ Error: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('🎨 Creating event flyers using Picsum and uploading to UploadThing...\n');

  const events = await prisma.event.findMany({
    where: { state: 'NC' },
    select: { id: true, title: true, slug: true, city: true, flyerUrl: true },
    orderBy: { startsAt: 'asc' }
  });

  console.log(`📊 Processing ${events.length} NC events\n`);

  let uploaded = 0;
  let failed = 0;

  for (const event of events) {
    console.log(`\n🎵 ${event.title}`);
    
    // Skip if already on UploadThing  
    if (event.flyerUrl?.includes('utfs.io') || event.flyerUrl?.includes('uploadthing')) {
      console.log('   ✅ Already on UploadThing');
      continue;
    }

    const seed = artistToSeed(event.title);
    const newUrl = await uploadFromPicsum(seed, event.slug);

    if (newUrl) {
      await prisma.event.update({
        where: { id: event.id },
        data: { flyerUrl: newUrl }
      });
      uploaded++;
    } else {
      // Keep existing placeholder
      failed++;
    }

    // Rate limit - UploadThing has limits
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log('\n' + '='.repeat(50));
  console.log('🎊 Flyer Creation Complete!');
  console.log(`📸 Successfully uploaded: ${uploaded}`);
  console.log(`⚠️ Failed: ${failed}`);
  console.log('='.repeat(50));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
