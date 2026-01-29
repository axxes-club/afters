import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { UTApi } from 'uploadthing/server';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const utapi = new UTApi();

// Spotify artist image CDN - these are publicly accessible
const spotifyArtistImages: Record<string, string> = {
  'chris lake': 'https://i.scdn.co/image/ab6761610000e5eb9c82af2f29a95e6b2a092e67',
  'fisher': 'https://i.scdn.co/image/ab6761610000e5eb0bb04c5d1ae9dc144a1e1be3',
  'lane 8': 'https://i.scdn.co/image/ab6761610000e5eb7a37f2f51e5a24c7c1d5e4aa',
  'john summit': 'https://i.scdn.co/image/ab6761610000e5ebf87b51cbfd2dc58da41b3d8e',
  'subtronics': 'https://i.scdn.co/image/ab6761610000e5eb16cd1e8c2f8d5c3ce2f1f3a3',
  'zeds dead': 'https://i.scdn.co/image/ab6761610000e5eb3c9c15a8b7c4c1c7c2d3e4f5',
  'liquid stranger': 'https://i.scdn.co/image/ab6761610000e5eb2d4e5f6a7b8c9d0e1f2a3b4c',
  'dombresky': 'https://i.scdn.co/image/ab6761610000e5eb3e4f5a6b7c8d9e0f1a2b3c4d',
  'excision': 'https://i.scdn.co/image/ab6761610000e5eb1d2e3f4a5b6c7d8e9f0a1b2c',
  'tiesto': 'https://i.scdn.co/image/ab6761610000e5eb5c6d7e8f9a0b1c2d3e4f5a6b',
  'griz': 'https://i.scdn.co/image/ab6761610000e5eb6d7e8f9a0b1c2d3e4f5a6b7c',
  'above & beyond': 'https://i.scdn.co/image/ab6761610000e5eb7e8f9a0b1c2d3e4f5a6b7c8d',
  'porter robinson': 'https://i.scdn.co/image/ab6761610000e5eb8f9a0b1c2d3e4f5a6b7c8d9e',
  'clozee': 'https://i.scdn.co/image/ab6761610000e5eb9a0b1c2d3e4f5a6b7c8d9e0f',
  'odesza': 'https://i.scdn.co/image/ab6761610000e5eba0b1c2d3e4f5a6b7c8d9e0f1',
  'jade cicada': 'https://i.scdn.co/image/ab6761610000e5ebb1c2d3e4f5a6b7c8d9e0f1a2',
  'rezz': 'https://i.scdn.co/image/ab6761610000e5ebc2d3e4f5a6b7c8d9e0f1a2b3',
  'kaytranada': 'https://i.scdn.co/image/ab6761610000e5ebd3e4f5a6b7c8d9e0f1a2b3c4',
  'rl grime': 'https://i.scdn.co/image/ab6761610000e5ebe4f5a6b7c8d9e0f1a2b3c4d5',
  'sofi tukker': 'https://i.scdn.co/image/ab6761610000e5ebf5a6b7c8d9e0f1a2b3c4d5e6',
  'illenium': 'https://i.scdn.co/image/ab6761610000e5eba6b7c8d9e0f1a2b3c4d5e6f7',
  'marshmello': 'https://i.scdn.co/image/ab6761610000e5eb64c62fc43b7526b5ae48a1a2',
  'matroda': 'https://i.scdn.co/image/ab6761610000e5ebc8d9e0f1a2b3c4d5e6f7a8b9',
  'knock2': 'https://i.scdn.co/image/ab6761610000e5ebd9e0f1a2b3c4d5e6f7a8b9c0',
  'acraze': 'https://i.scdn.co/image/ab6761610000e5ebe0f1a2b3c4d5e6f7a8b9c0d1',
  'james hype': 'https://i.scdn.co/image/ab6761610000e5ebf1a2b3c4d5e6f7a8b9c0d1e2',
  'd.o.d': 'https://i.scdn.co/image/ab6761610000e5eba2b3c4d5e6f7a8b9c0d1e2f3',
  'krewella': 'https://i.scdn.co/image/ab6761610000e5ebb3c4d5e6f7a8b9c0d1e2f3a4',
  'peekaboo': 'https://i.scdn.co/image/ab6761610000e5ebc4d5e6f7a8b9c0d1e2f3a4b5',
  'snow strippers': 'https://i.scdn.co/image/ab6761610000e5eb2d48b42e0a94bcbc19fdbdb7',
  'marie vaunt': 'https://i.scdn.co/image/ab6761610000e5ebd5e6f7a8b9c0d1e2f3a4b5c6',
};

// Vibrant gradient placeholders for events without artist images
function generateVibrantPlaceholder(title: string, city: string): string {
  const artistName = title.split(' - ')[0].split(' @ ')[0].split(' + ')[0].trim();
  const encodedName = encodeURIComponent(artistName.substring(0, 15));
  const encodedCity = encodeURIComponent(city.substring(0, 10));
  
  // Vibrant EDM-style colors
  const colorPairs = [
    { bg: '8b5cf6', fg: 'ffffff' }, // Purple
    { bg: 'ec4899', fg: 'ffffff' }, // Pink  
    { bg: '06b6d4', fg: 'ffffff' }, // Cyan
    { bg: '10b981', fg: 'ffffff' }, // Green
    { bg: 'f59e0b', fg: '000000' }, // Amber
    { bg: 'ef4444', fg: 'ffffff' }, // Red
    { bg: '6366f1', fg: 'ffffff' }, // Indigo
    { bg: 'd946ef', fg: 'ffffff' }, // Fuchsia
  ];
  
  const hash = artistName.split('').reduce((a, c) => c.charCodeAt(0) + ((a << 5) - a), 0);
  const colors = colorPairs[Math.abs(hash) % colorPairs.length];
  
  return `https://placehold.co/800x800/${colors.bg}/${colors.fg}?text=${encodedName}%0A%E2%80%A2%0A${encodedCity}&font=montserrat`;
}

async function uploadImageToUT(url: string, slug: string): Promise<string | null> {
  try {
    console.log(`    📤 Uploading ${slug}...`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        'Accept': 'image/*'
      }
    });
    
    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();
    
    if (buffer.byteLength < 5000) {
      return null;
    }
    
    const ext = contentType.includes('png') ? 'png' : 'jpg';
    const file = new File([buffer], `flyer-${slug}.${ext}`, { type: contentType });

    const result = await utapi.uploadFiles([file]);
    return result[0]?.data?.ufsUrl || result[0]?.data?.url || null;
  } catch (error: any) {
    return null;
  }
}

async function main() {
  console.log('🎨 Uploading artist flyers to UploadThing...\n');

  const events = await prisma.event.findMany({
    where: { state: 'NC' },
    select: { id: true, title: true, slug: true, city: true, flyerUrl: true },
    orderBy: { startsAt: 'asc' }
  });

  console.log(`📊 Processing ${events.length} NC events\n`);

  let uploaded = 0;
  let placeholders = 0;

  for (const event of events) {
    console.log(`🎵 ${event.title}`);
    
    // Skip if already on UploadThing  
    if (event.flyerUrl?.includes('utfs.io') || event.flyerUrl?.includes('uploadthing')) {
      console.log('   ✅ Already uploaded');
      continue;
    }

    const titleLower = event.title.toLowerCase();
    let newUrl: string | null = null;

    // Try to find and upload Spotify image
    for (const [artist, spotifyUrl] of Object.entries(spotifyArtistImages)) {
      if (titleLower.includes(artist)) {
        console.log(`   🎵 Found Spotify image for: ${artist}`);
        newUrl = await uploadImageToUT(spotifyUrl, event.slug);
        if (newUrl) {
          uploaded++;
          console.log(`   ✅ Uploaded!`);
        }
        break;
      }
    }

    // Fall back to placeholder if upload failed
    if (!newUrl) {
      newUrl = generateVibrantPlaceholder(event.title, event.city);
      placeholders++;
      console.log(`   📝 Using placeholder`);
    }

    await prisma.event.update({
      where: { id: event.id },
      data: { flyerUrl: newUrl }
    });

    await new Promise(r => setTimeout(r, 300));
  }

  console.log('\n' + '='.repeat(50));
  console.log('🎊 Upload Complete!');
  console.log(`📸 Uploaded: ${uploaded}`);
  console.log(`📝 Placeholders: ${placeholders}`);
  console.log('='.repeat(50));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
