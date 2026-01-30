/**
 * Fix confirmed bad flyer images.
 * Strategy:
 * 1. For real events: fetch og:image from event platform pages
 * 2. For fake seed events: use Unsplash for relevant stock images
 * 3. Upload to UploadThing, update DB
 */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { UTApi } from 'uploadthing/server';

const DB_URL = 'postgresql://neondb_owner:npg_6CG9YBgUPFpy@ep-steep-frost-aed2xpf8-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';
const sql = neon(DB_URL);
const ut = new UTApi({ token: process.env.UPLOADTHING_TOKEN });

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Extract og:image from raw HTML
function extractOgImage(html) {
  // Try og:image
  const patterns = [
    /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
    /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i,
    /<meta[^>]*property=["']og:image:secure_url["'][^>]*content=["']([^"']+)["']/i,
  ];
  for (const pat of patterns) {
    const m = html.match(pat);
    if (m) {
      let url = m[1].replace(/&amp;/g, '&');
      return url;
    }
  }
  return null;
}

// Fetch page and extract og:image
async function fetchOgImage(pageUrl) {
  try {
    const res = await fetch(pageUrl, {
      headers: { 'User-Agent': UA },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    return extractOgImage(html);
  } catch (e) {
    console.log(`    ⚠️ Failed to fetch ${pageUrl}: ${e.message}`);
    return null;
  }
}

// Download image buffer
async function downloadImage(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA },
    redirect: 'follow',
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 5000) throw new Error(`Image too small: ${buf.length} bytes`);
  return buf;
}

// Upload to UploadThing
async function uploadToUT(buffer, filename) {
  const contentType = filename.endsWith('.png') ? 'image/png' : 'image/jpeg';
  const file = new File([buffer], filename, { type: contentType });
  const response = await ut.uploadFiles([file]);
  const data = response[0]?.data;
  return data?.ufsUrl || data?.url || null;
}

// Update DB
async function updateDB(eventId, newUrl) {
  await sql`UPDATE "Event" SET "flyerUrl" = ${newUrl} WHERE id = ${eventId}`;
}

// ============================================================
// EVENT DEFINITIONS
// ============================================================

const EVENTS_TO_FIX = [
  // === REAL EVENTS (Brooklyn nightlife) ===
  {
    id: 'cmkyoqldf001jwv4ugo1sfnok',
    title: 'Stepmom Got Hardgrooved',
    type: 'real',
    // Try multiple event page URLs to extract og:image
    eventPages: [
      'https://www.eventbrite.com/e/stepmom-got-hardgrooved-tickets-1234567890',
      'https://funqtion.co/events/zrk0dd5k5M',
    ],
    // Direct image URLs to try (from event platforms)
    directImages: [
      // RA event page image (extracted from CDN pattern)
      'https://ra.co/images/events/flyer/2351596/large.jpg',
      // Edmtrain often has images
    ],
    // Fallback search for Instagram flyer
    fallbackSearch: 'stepmom got hardgrooved rash brooklyn flyer',
  },
  {
    id: 'cmkyoqmds001uwv4u6kc2heza',
    title: 'Battle Hymn x Battle HURRR',
    type: 'real',
    eventPages: [
      'https://www.eventbrite.com/e/battle-hymn-x-battle-hurrr-brooklyn-tickets-1981349079433',
      'https://shotgun.live/en/events/battle-hymn-x-battle-hurrr-brooklyn-1',
    ],
    directImages: [],
    fallbackSearch: 'battle hymn battle hurrr refuge brooklyn flyer',
  },
  {
    id: 'cmkyoqivs000swv4ui85gslz6',
    title: 'Bomba Lounge Saturday',
    type: 'real',
    eventPages: [],
    directImages: [],
    fallbackSearch: 'bomba lounge saturday good room brooklyn',
  },
  {
    id: 'cmkyoqi0h000jwv4u0k6hcg0r',
    title: 'HEATED RIVALRY - The Party',
    type: 'real',
    eventPages: [
      'https://lpr.com/lpr_events/heatedjan26nyc/',
    ],
    directImages: [
      // RA event
      'https://ra.co/images/events/flyer/2340119/large.jpg',
    ],
    fallbackSearch: 'heated rivalry party good room brooklyn flyer 2026',
  },

  // === FAKE SEED EVENTS (use Unsplash/stock images) ===
  {
    id: 'cmkytafaa0006yy4u3yakz26s',
    title: 'Jazz Evening at the Rooftop',
    type: 'stock',
    unsplashQuery: 'jazz-rooftop-night-city',
    stockUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&q=80', // Jazz performance
  },
  {
    id: 'cmkytaecr0002yy4u3mbbyc5f',
    title: 'Tech Conference 2026',
    type: 'stock',
    unsplashQuery: 'tech-conference-stage',
    stockUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80', // Tech conference
  },
  {
    id: 'cmkytaf1k0005yy4un9eu1ktk',
    title: 'Startup Pitch Night',
    type: 'stock',
    unsplashQuery: 'startup-pitch-presentation',
    stockUrl: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&q=80', // Startup/pitch
  },
  {
    id: 'cmkytae4e0001yy4uj86gg8pq',
    title: 'Summer Music Festival',
    type: 'stock',
    unsplashQuery: 'summer-music-festival-crowd',
    stockUrl: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80', // Music festival crowd
  },
  {
    id: 'cmkytaekr0003yy4uqx2gmp5l',
    title: 'Art Gallery Opening',
    type: 'stock',
    unsplashQuery: 'art-gallery-opening',
    stockUrl: 'https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=800&q=80', // Art gallery
  },
  {
    id: 'cmkytaet70004yy4urijd0aj6',
    title: 'Food & Wine Tasting',
    type: 'stock',
    unsplashQuery: 'wine-tasting-event',
    stockUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80', // Wine tasting
  },
  {
    id: 'cmkzg5d5m000204jpsno3hpdu',
    title: 'test',
    type: 'stock',
    unsplashQuery: 'nightlife-club-party',
    stockUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80', // Nightlife/party
  },
];

// ============================================================
// MAIN
// ============================================================

async function processEvent(event) {
  console.log(`\n📸 ${event.title} (${event.id})`);

  if (event.type === 'stock') {
    // Use stock image from Unsplash
    console.log(`  🎨 Using stock image for seed event`);
    try {
      const buf = await downloadImage(event.stockUrl);
      console.log(`  📥 Downloaded ${(buf.length / 1024).toFixed(0)}KB`);
      const utUrl = await uploadToUT(buf, `flyer-${event.id}.jpg`);
      if (!utUrl) throw new Error('Upload returned no URL');
      console.log(`  ☁️  Uploaded: ${utUrl}`);
      await updateDB(event.id, utUrl);
      console.log(`  ✅ DB updated!`);
      return { success: true, source: 'unsplash-stock' };
    } catch (e) {
      console.log(`  ❌ Error: ${e.message}`);
      return { success: false, error: e.message };
    }
  }

  // Real event: try event pages first
  for (const pageUrl of event.eventPages || []) {
    console.log(`  🔍 Trying: ${pageUrl}`);
    const ogImage = await fetchOgImage(pageUrl);
    if (ogImage) {
      let imageUrl = ogImage;
      // Fix relative URLs
      if (imageUrl.startsWith('/')) {
        const base = new URL(pageUrl);
        imageUrl = `${base.origin}${imageUrl}`;
      }
      // For Eventbrite, extract the actual CDN URL
      if (imageUrl.includes('evbuc.com') || imageUrl.includes('eventbrite')) {
        const cdnMatch = imageUrl.match(/https?%3A%2F%2Fcdn\.evbuc\.com[^&"']+/);
        if (cdnMatch) {
          imageUrl = decodeURIComponent(decodeURIComponent(cdnMatch[0]));
        }
      }
      console.log(`  🖼️  og:image: ${imageUrl.substring(0, 100)}...`);
      try {
        const buf = await downloadImage(imageUrl);
        console.log(`  📥 Downloaded ${(buf.length / 1024).toFixed(0)}KB`);
        const utUrl = await uploadToUT(buf, `flyer-${event.id}.jpg`);
        if (!utUrl) throw new Error('Upload returned no URL');
        console.log(`  ☁️  Uploaded: ${utUrl}`);
        await updateDB(event.id, utUrl);
        console.log(`  ✅ DB updated!`);
        return { success: true, source: pageUrl };
      } catch (e) {
        console.log(`  ⚠️ Image download/upload failed: ${e.message}`);
      }
    }
  }

  // Try direct image URLs
  for (const imgUrl of event.directImages || []) {
    console.log(`  🔗 Trying direct: ${imgUrl}`);
    try {
      const buf = await downloadImage(imgUrl);
      console.log(`  📥 Downloaded ${(buf.length / 1024).toFixed(0)}KB`);
      const utUrl = await uploadToUT(buf, `flyer-${event.id}.jpg`);
      if (!utUrl) throw new Error('Upload returned no URL');
      console.log(`  ☁️  Uploaded: ${utUrl}`);
      await updateDB(event.id, utUrl);
      console.log(`  ✅ DB updated!`);
      return { success: true, source: imgUrl };
    } catch (e) {
      console.log(`  ⚠️ Failed: ${e.message}`);
    }
  }

  console.log(`  ❌ No image found from any source`);
  return { success: false, error: 'No source worked' };
}

async function main() {
  console.log(`🔧 Fixing ${EVENTS_TO_FIX.length} confirmed bad flyer images...\n`);

  const results = [];
  for (const event of EVENTS_TO_FIX) {
    const result = await processEvent(event);
    results.push({ ...event, ...result });
  }

  console.log('\n========================================');
  console.log('📊 RESULTS SUMMARY');
  console.log('========================================');
  const success = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  console.log(`✅ Fixed: ${success.length}`);
  for (const r of success) {
    console.log(`  - ${r.title} (source: ${r.source})`);
  }
  console.log(`❌ Failed: ${failed.length}`);
  for (const r of failed) {
    console.log(`  - ${r.title}: ${r.error}`);
  }
}

main().catch(console.error);
