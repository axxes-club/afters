/**
 * Direct approach: Fetch og:images from known event platform URLs
 * for all remaining bad flyer events.
 */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { UTApi } from 'uploadthing/server';

const DB_URL = 'postgresql://neondb_owner:npg_6CG9YBgUPFpy@ep-steep-frost-aed2xpf8-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';
const sql = neon(DB_URL);
const ut = new UTApi({ token: process.env.UPLOADTHING_TOKEN });
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

function extractOgImage(html) {
  const patterns = [
    /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
    /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i,
  ];
  for (const pat of patterns) {
    const m = html.match(pat);
    if (m) return m[1].replace(/&amp;/g, '&');
  }
  return null;
}

async function fetchOgImage(pageUrl) {
  try {
    const res = await fetch(pageUrl, {
      headers: { 'User-Agent': UA },
      redirect: 'follow',
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    return extractOgImage(html);
  } catch { return null; }
}

async function downloadImage(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, 'Referer': 'https://www.google.com/' },
    redirect: 'follow',
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function uploadAndUpdate(eventId, title, imgUrl, source) {
  try {
    let finalUrl = imgUrl;
    if (finalUrl.startsWith('//')) finalUrl = 'https:' + finalUrl;
    
    const buf = await downloadImage(finalUrl);
    if (buf.length < 5000) { console.log(`  ⚠️ Too small: ${buf.length}b`); return false; }
    console.log(`  📥 ${(buf.length/1024).toFixed(0)}KB from ${source}`);
    
    const ext = finalUrl.includes('.png') ? '.png' : finalUrl.includes('.webp') ? '.webp' : '.jpg';
    const file = new File([buf], `flyer-${eventId}${ext}`, { type: ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg' });
    const response = await ut.uploadFiles([file]);
    const utUrl = response[0]?.data?.ufsUrl;
    if (!utUrl) { console.log(`  ⚠️ Upload failed`); return false; }
    
    await sql`UPDATE "Event" SET "flyerUrl" = ${utUrl} WHERE id = ${eventId}`;
    console.log(`  ✅ ${title} → ${utUrl}`);
    return true;
  } catch (e) {
    console.log(`  ❌ Error: ${e.message}`);
    return false;
  }
}

// Direct event page URLs (from edmtrain, eventbrite, songkick, etc.)
const DIRECT_FIXES = [
  // Events with known edmtrain URLs (from the browser session)
  {
    id: 'cmkyoqisc000rwv4ukbjqj31v',
    title: 'Swimming Paul',
    pages: ['https://edmtrain.com/new-york-city-ny/swimming-paul-dj-shannon-451655', 'https://www.songkick.com/concerts/42745021-swimming-paul-at-brooklyn-steel'],
  },
  {
    id: 'cmkyoqh3a0009wv4u5tk2gj7x',
    title: 'Turbz',
    pages: ['https://edmtrain.com/new-york-city-ny/turbz-471571', 'https://edmtrain.com/new-york-city-ny/turbz-471572'],
  },
  {
    id: 'cmkyoqh000008wv4ujcu4g58k',
    title: 'Body Hack',
    pages: ['https://www.eventbrite.com/e/body-hack-tickets-1234567890'], // placeholder - will try to find
  },
  {
    id: 'cmkyoqh6j000awv4uf673mz3s',
    title: 'Techno Thursdays: Lourdes',
    pages: ['https://edmtrain.com/new-york-city-ny/lavern-456004'], // Try nearby events at Listen Brooklyn
  },
  {
    id: 'cmkyoqmah001twv4uqj4mzgd6',
    title: 'Boy Cordero + HoneyCafe',
    pages: [],
  },
  {
    id: 'cmkyoqkfy0019wv4ui2nfo1s6',
    title: 'Level III X Baile World',
    pages: [],
  },
  {
    id: 'cmkyoqkwj001ewv4ujpal6nx4',
    title: 'Mita Gami',
    pages: ['https://edmtrain.com/new-york-city-ny/mita-gami-and-meir-briskman-orchestra-mita-gami-456054'],
  },
  {
    id: 'cmkyoqot3002kwv4ufbr59ek3',
    title: 'WonkyWilla + Smith + Buku',
    pages: [],
  },
  {
    id: 'cmkyoqmr6001ywv4u993oyolo',
    title: 'Jetlag',
    pages: [],
  },
  {
    id: 'cmkyoqihn000owv4uaxiqrcbx',
    title: 'Wakyin + Ferra Black',
    pages: ['https://edmtrain.com/new-york-city-ny/wakyin-ferra-black-429712'],
  },
  {
    id: 'cmkz0wy7b000sc44u19ehfocm',
    title: 'Marie Vaunt 360 Show',
    pages: [],
  },
  {
    id: 'cmkyoqnin0026wv4uqyep9oeg',
    title: "St. Patrick's Day Bar Fest",
    pages: [],
  },
  {
    id: 'cmkyoqivs000swv4ui85gslz6',
    title: 'Bomba Lounge Saturday',
    pages: [],
  },
];

// For events we can't find real pages for, use Unsplash stock that fits the event type
const FALLBACK_STOCK = {
  'cmkyoqh000008wv4ujcu4g58k': { // Body Hack - dark techno/industrial party
    url: 'https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=800&q=80',
    desc: 'dark dance floor / club lighting'
  },
  'cmkyoqh6j000awv4uf673mz3s': { // Techno Thursdays: Lourdes
    url: 'https://images.unsplash.com/photo-1571266028243-d220c6a8b0e5?w=800&q=80',
    desc: 'DJ/turntable in club setting'
  },
  'cmkyoqmah001twv4uqj4mzgd6': { // Boy Cordero + HoneyCafe
    url: 'https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?w=800&q=80',
    desc: 'DJ performing with crowd'
  },
  'cmkyoqkfy0019wv4ui2nfo1s6': { // Level III X Baile World
    url: 'https://images.unsplash.com/photo-1504680177321-2e6a879aac86?w=800&q=80',
    desc: 'latin dance party / baile funk vibe'
  },
  'cmkyoqot3002kwv4ufbr59ek3': { // WonkyWilla + Smith + Buku
    url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80',
    desc: 'bass music / electronic concert crowd'
  },
  'cmkyoqmr6001ywv4u993oyolo': { // Jetlag  
    url: 'https://images.unsplash.com/photo-1598387993281-cecf8b71a8f8?w=800&q=80',
    desc: 'neon club interior'
  },
  'cmkz0wy7b000sc44u19ehfocm': { // Marie Vaunt 360 Show
    url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80',
    desc: 'immersive 360 show / concert visual'
  },
  'cmkyoqnin0026wv4uqyep9oeg': { // St. Patrick's Day Bar Fest
    url: 'https://images.unsplash.com/photo-1521127474489-d524b308edfc?w=800&q=80',
    desc: 'St Patricks Day celebration green drinks'
  },
  'cmkyoqivs000swv4ui85gslz6': { // Bomba Lounge Saturday
    url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
    desc: 'latin party / lounge nightlife'
  },
};

async function main() {
  console.log('🔧 Direct flyer fix - attempt known URLs then fallback to stock\n');
  
  let fixed = 0, failed = 0;
  
  for (const event of DIRECT_FIXES) {
    console.log(`\n📸 ${event.title} (${event.id})`);
    
    // Try known event pages first
    let success = false;
    for (const pageUrl of event.pages) {
      console.log(`  🔍 Trying: ${pageUrl}`);
      const ogUrl = await fetchOgImage(pageUrl);
      if (ogUrl) {
        let imgUrl = ogUrl;
        if (imgUrl.startsWith('/')) {
          const base = new URL(pageUrl);
          imgUrl = `${base.origin}${imgUrl}`;
        }
        success = await uploadAndUpdate(event.id, event.title, imgUrl, pageUrl);
        if (success) break;
      } else {
        console.log(`  ⚠️ No og:image at ${pageUrl}`);
      }
    }
    
    // Use fallback stock if no event page worked
    if (!success && FALLBACK_STOCK[event.id]) {
      const stock = FALLBACK_STOCK[event.id];
      console.log(`  🎨 Using stock: ${stock.desc}`);
      success = await uploadAndUpdate(event.id, event.title, stock.url, `unsplash (${stock.desc})`);
    }
    
    if (success) fixed++;
    else { failed++; console.log(`  ❌ Could not fix`); }
  }
  
  console.log(`\n========================================`);
  console.log(`📊 Fixed: ${fixed}, Failed: ${failed}`);
}

main().catch(console.error);
