import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { UTApi } from 'uploadthing/server';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const utapi = new UTApi();

// Known working artist/DJ image URLs - these are from artist promo materials, press kits, etc.
const artistImages: Record<string, string> = {
  'chris lake': 'https://images.squarespace-cdn.com/content/v1/5a4981f5f14aa1c6a27fd97e/8ebcc9f9-46d8-432c-8dfa-6c7e37f0fd2c/Chris+Lake+2023+Press+Photo+1.jpg',
  'fisher': 'https://edm.com/.image/t_share/MTgwNjcyNjA0OTA4ODcwMjAy/fisher-press-photo.jpg',
  'lane 8': 'https://thissongissick.com/wp-content/uploads/2020/01/Lane-8.jpg',
  'john summit': 'https://edmidentity.com/wp-content/uploads/2024/01/John-Summit-Press-Photo.jpg',
  'subtronics': 'https://edm.com/.image/t_share/MTgyNzY2ODQ5NDI3NTg2NjAw/subtronics-press-photo.jpg',
  'zeds dead': 'https://static.stereogum.com/uploads/2023/08/Zeds-Dead-by-Jacob-Greenlee-1691588568.jpg',
  'liquid stranger': 'https://dancingastronaut.com/wp-content/uploads/2022/09/liquid-stranger-2022-press.jpg',
  'dombresky': 'https://edm.com/.image/t_share/MTgyODUyNDYzMzA0NzEwMTYy/dombresky-press-photo.jpg',
  'excision': 'https://www.youredm.com/wp-content/uploads/2021/03/excision-2021-press-photo.jpg',
  'tiesto': 'https://yt3.googleusercontent.com/ytc/AIf8zZRYqRGEVF3p_nFMFJ2YFRvB9m_0jK2XMiY2Mq3n=s900-c-k-c0x00ffffff-no-rj',
  'griz': 'https://www.billboard.com/wp-content/uploads/2022/09/GRiZ-press-photo-2022-billboard-1548.jpg',
  'above & beyond': 'https://www.billboard.com/wp-content/uploads/stylus/515981-above-beyond-617-409.jpg',
  'porter robinson': 'https://media.pitchfork.com/photos/65c3b2a96c2d61b2a0b1e56e/1:1/w_600/Porter-Robinson.jpeg',
  'clozee': 'https://www.youredm.com/wp-content/uploads/2019/09/clozee-press-photo.jpg',
  'odesza': 'https://static.stereogum.com/uploads/2022/01/odesza-credit-Tonya-Visco-1642713687.jpg',
  'jade cicada': 'https://dancingastronaut.com/wp-content/uploads/2020/02/jade-cicada-press-photo.jpg',
  'rezz': 'https://edm.com/.image/t_share/MTgyMjgyOTc2NDM2ODQ2NzE4/rezz-press-photo.jpg',
  'kaytranada': 'https://media.gq.com/photos/5e4fa71e6b0d960008fc4d0b/1:1/w_800/GQ0320_Kaytra_02.jpg',
  'rl grime': 'https://edm.com/.image/t_share/MTgyMzk3NjQyMTM5MTAxODky/rl-grime-press-photo.jpg',
  'sofi tukker': 'https://edm.com/.image/t_share/MTgyMzgyMjExMTI5MDk3MjUw/sofi-tukker-press-photo.jpg',
  'illenium': 'https://edm.com/.image/t_share/MTgyODUyNzc0NTQ1MDE5MTg2/illenium-press-photo.jpg',
  'marshmello': 'https://i.scdn.co/image/ab6761610000e5eb64c62fc43b7526b5ae48a1a2',
  'matroda': 'https://dancingastronaut.com/wp-content/uploads/2022/08/matroda-press-photo.jpg',
  'knock2': 'https://edm.com/.image/t_share/MjAxODM0NTk1Mjk0NDYyNDY2/knock2-press-photo.jpg',
  'acraze': 'https://edm.com/.image/t_share/MTgyODUyNzI1OTYxNTkwMjkw/acraze-press-photo.jpg',
  'james hype': 'https://dancingastronaut.com/wp-content/uploads/2023/01/james-hype-press-photo.jpg',
  'd.o.d': 'https://edm.com/.image/t_share/MTgyMzk4OTQ4MzE0NTQwNTU4/dod-press-photo.jpg',
  'krewella': 'https://i.scdn.co/image/ab6761610000e5eb65b2a3f93c8d2b8e3b0b3d3e',
  'peekaboo': 'https://dancingastronaut.com/wp-content/uploads/2020/10/peekaboo-press-photo.jpg',
  'detox unit': 'https://i1.sndcdn.com/artworks-FvYVU9hJGWoJFxqd-nLBHeg-t500x500.jpg',
  'marie vaunt': 'https://i1.sndcdn.com/avatars-000647651361-8qdqmf-t500x500.jpg',
  'snow strippers': 'https://i.scdn.co/image/ab6761610000e5eb2d48b42e0a94bcbc19fdbdb7',
  'anna luna': 'https://i1.sndcdn.com/avatars-Zz2gJyRYxRY2RDzG-5dxNhQ-t500x500.jpg',
};

// Generate high-quality placeholder with artist name
function generateEventPlaceholder(title: string): string {
  const artistName = title.split(' - ')[0].split(' @ ')[0].split(' + ')[0].trim();
  const encodedName = encodeURIComponent(artistName.substring(0, 20));
  
  const colors = ['8b5cf6', 'ec4899', '06b6d4', '10b981', 'f59e0b', 'ef4444'];
  const hash = artistName.split('').reduce((a, c) => c.charCodeAt(0) + ((a << 5) - a), 0);
  const bg = colors[Math.abs(hash) % colors.length];
  
  return `https://placehold.co/800x800/${bg}/ffffff?text=${encodedName}&font=montserrat`;
}

async function uploadToUploadThing(url: string, name: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      console.log(`    ⚠️ Failed to fetch: ${response.status}`);
      return null;
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();
    
    if (buffer.byteLength < 1000) {
      console.log('    ⚠️ Image too small, skipping');
      return null;
    }
    
    const ext = contentType.includes('png') ? 'png' : 'jpg';
    const filename = `${name}.${ext}`;
    const file = new File([buffer], filename, { type: contentType });

    const result = await utapi.uploadFiles([file]);
    return result[0]?.data?.ufsUrl || result[0]?.data?.url || null;
  } catch (error: any) {
    console.log(`    ⚠️ Upload error: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('🎨 Fetching real artist flyers and uploading to UploadThing...\n');

  const events = await prisma.event.findMany({
    where: { state: 'NC' },
    select: { id: true, title: true, slug: true, flyerUrl: true },
    orderBy: { startsAt: 'asc' }
  });

  console.log(`📊 Processing ${events.length} NC events\n`);

  let uploaded = 0;
  let placeholders = 0;

  for (const event of events) {
    console.log(`🎵 ${event.title}`);
    
    // Skip if already on UploadThing
    if (event.flyerUrl?.includes('utfs.io') || event.flyerUrl?.includes('uploadthing')) {
      console.log('   ✅ Already on UploadThing');
      continue;
    }

    // Find matching artist image
    const titleLower = event.title.toLowerCase();
    let sourceUrl: string | null = null;
    let matchedArtist: string | null = null;

    for (const [artist, url] of Object.entries(artistImages)) {
      if (titleLower.includes(artist)) {
        sourceUrl = url;
        matchedArtist = artist;
        break;
      }
    }

    let newFlyerUrl: string | null = null;

    if (sourceUrl) {
      console.log(`   📸 Found image for: ${matchedArtist}`);
      newFlyerUrl = await uploadToUploadThing(sourceUrl, event.slug);
      
      if (newFlyerUrl) {
        uploaded++;
        console.log(`   ✅ Uploaded to UploadThing`);
      }
    }

    if (!newFlyerUrl) {
      // Use high-quality placeholder
      newFlyerUrl = generateEventPlaceholder(event.title);
      placeholders++;
      console.log(`   📝 Using branded placeholder`);
    }

    await prisma.event.update({
      where: { id: event.id },
      data: { flyerUrl: newFlyerUrl }
    });

    // Rate limit
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\n' + '='.repeat(50));
  console.log('🎊 Flyer Upload Complete!');
  console.log(`📸 Uploaded to UploadThing: ${uploaded}`);
  console.log(`📝 Placeholders: ${placeholders}`);
  console.log('='.repeat(50));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
