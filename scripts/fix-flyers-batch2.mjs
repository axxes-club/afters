/**
 * Batch 2: Fix LIKELY BAD flyer images identified by spot-checking.
 * 
 * CONFIRMED BAD from spot-check:
 * - Snow Strippers + anna luna: stock Icelandic road photo
 * - Marie Vaunt 360 Show: nature/forest photo
 * - Body Hack: Gryffin "Gravity" album cover (wrong artist!)
 * - Techno Thursdays: Lourdes: Pet Shop Boys "PopArt" album cover (wrong!)
 * - Turbz: random Brooklyn bench photo
 * - Swimming Paul: stock photo of child's smile
 * - Boy Cordero + HoneyCafe: "Classical Chillout" album cover (wrong!)
 * - Level III X Baile World: Halloween Michael Myers poster (wrong!)
 * - Mita Gami: "All By Myself" release art (wrong!)
 * - WonkyWilla + Smith + Buku: "Is U Rollin" single art (not the event)
 * - Jetlag: Mike Williams x Brooks "Jetlag" single art (wrong artist!)
 * - Wakyin + Ferra Black: random pop-art painting
 * - St. Patrick's Day Bar Fest: Clancy Brothers Live album cover
 * - Bomba Lounge Saturday: portrait photo (not ideal)
 * 
 * ACCEPTABLE (artist-related, just not event-specific):
 * - DR. GABBA: real flyer ✅
 * - Steen: "Red Lights" single art (at least it's the right artist)
 * - Chippy Nonstop: Panteros666 ft. Chippy Nonstop art (related)
 * - LAERZ: LAERZ "Live From Dubai" promo (related)
 * - Detroit Love: Carl Craig: Carl Craig Detroit Love art ✅
 * - Underground Resistance: UR album art (related)
 * - Lavern: "Hold Me" single art (related)
 * 
 * Strategy: Search for real event pages on ra.co, dice.fm, shotgun.live, eventbrite
 */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { UTApi } from 'uploadthing/server';

const DB_URL = (() => { const value = process.env.DATABASE_URL; if (!value || !/^postgres(?:ql)?:\/\//.test(value)) throw new Error("Set DATABASE_URL to a PostgreSQL connection URL"); return value; })();
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

async function uploadToUT(buffer, filename) {
  const ext = filename.split('.').pop() || 'jpg';
  const type = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  const file = new File([buffer], filename, { type });
  const response = await ut.uploadFiles([file]);
  return response[0]?.data?.ufsUrl || null;
}

async function updateDB(eventId, newUrl) {
  await sql`UPDATE "Event" SET "flyerUrl" = ${newUrl} WHERE id = ${eventId}`;
}

// Try multiple URLs, download first working image > 10KB
async function tryImageUrls(urls) {
  for (const url of urls) {
    try {
      const buf = await downloadImage(url);
      if (buf.length > 10000) return { url, buffer: buf };
    } catch {}
  }
  return null;
}

// Try event page URLs, extract og:image, download
async function tryEventPages(pageUrls) {
  for (const pageUrl of pageUrls) {
    try {
      const ogUrl = await fetchOgImage(pageUrl);
      if (!ogUrl) continue;
      let imgUrl = ogUrl;
      if (imgUrl.startsWith('/')) {
        const base = new URL(pageUrl);
        imgUrl = `${base.origin}${imgUrl}`;
      }
      // Decode Eventbrite CDN URLs
      if (imgUrl.includes('evbuc.com') || imgUrl.includes('_next/image')) {
        const cdnMatch = imgUrl.match(/https?%3A%2F%2Fcdn\.evbuc\.com[^&"']+/);
        if (cdnMatch) imgUrl = decodeURIComponent(decodeURIComponent(cdnMatch[0]));
      }
      const buf = await downloadImage(imgUrl);
      if (buf.length > 10000) return { url: imgUrl, buffer: buf, source: pageUrl };
    } catch {}
  }
  return null;
}

// Search DuckDuckGo HTML for event page URLs
async function searchDDG(query) {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const html = await res.text();
    const links = [];
    const re = /uddg=(https?%3A%2F%2F[^&"]+)/g;
    let m;
    while ((m = re.exec(html)) !== null) {
      links.push(decodeURIComponent(m[1]));
    }
    return links;
  } catch { return []; }
}

// ============================================================
const EVENTS_TO_FIX = [
  // CONFIRMED BAD FROM SPOT CHECK
  {
    id: 'cmkz0wym4000tc44u42jtevq1',
    title: 'Snow Strippers + anna luna',
    venue: 'The Underground', city: 'Charlotte',
    searchQueries: [
      '"Snow Strippers" "anna luna" Charlotte Underground 2026',
      '"Snow Strippers" Charlotte concert 2026',
      'Snow Strippers tour 2026',
    ],
    platformPages: [],
  },
  {
    id: 'cmkz0wy7b000sc44u19ehfocm',
    title: 'Marie Vaunt 360 Show',
    venue: 'Blackbox Theater', city: 'Charlotte',
    searchQueries: [
      '"Marie Vaunt" "360 Show" Charlotte 2026',
      '"Marie Vaunt" concert tour 2026',
    ],
    platformPages: [],
  },
  {
    id: 'cmkyoqh000008wv4ujcu4g58k',
    title: 'Body Hack',
    venue: 'Nowadays', city: 'Queens',
    searchQueries: [
      '"Body Hack" Nowadays Queens Brooklyn 2026',
      '"Body Hack" party NYC 2026',
    ],
    platformPages: [],
  },
  {
    id: 'cmkyoqh6j000awv4uf673mz3s',
    title: 'Techno Thursdays: Lourdes',
    venue: 'Listen Brooklyn', city: 'Brooklyn',
    searchQueries: [
      '"Techno Thursdays" "Lourdes" "Listen Brooklyn" 2026',
      '"Techno Thursdays" "Listen Brooklyn"',
    ],
    platformPages: [],
  },
  {
    id: 'cmkyoqh3a0009wv4u5tk2gj7x',
    title: 'Turbz',
    venue: "Loosie's Nightclub", city: 'Brooklyn',
    searchQueries: [
      '"Turbz" DJ Brooklyn 2026',
      'Turbz DJ event flyer',
    ],
    platformPages: [],
  },
  {
    id: 'cmkyoqisc000rwv4ukbjqj31v',
    title: 'Swimming Paul',
    venue: 'Brooklyn Steel', city: 'Brooklyn',
    searchQueries: [
      '"Swimming Paul" "Brooklyn Steel" 2026',
      '"Swimming Paul" DJ concert 2026',
    ],
    platformPages: [],
  },
  {
    id: 'cmkyoqmah001twv4uqj4mzgd6',
    title: 'Boy Cordero + HoneyCafe',
    venue: 'Elsewhere', city: 'Brooklyn',
    searchQueries: [
      '"Boy Cordero" "HoneyCafe" Elsewhere Brooklyn 2026',
      '"Boy Cordero" DJ Brooklyn',
    ],
    platformPages: [],
  },
  {
    id: 'cmkyoqkfy0019wv4ui2nfo1s6',
    title: 'Level III X Baile World',
    venue: 'H0L0', city: 'Queens',
    searchQueries: [
      '"Level III" "Baile World" H0L0 Queens 2026',
      '"Level III" "Baile World" NYC',
    ],
    platformPages: [],
  },
  {
    id: 'cmkyoqkwj001ewv4ujpal6nx4',
    title: 'Mita Gami',
    venue: 'Brooklyn Paramount', city: 'Brooklyn',
    searchQueries: [
      '"Mita Gami" "Brooklyn Paramount" 2026',
      '"Mita Gami" concert tour 2026',
    ],
    platformPages: [],
  },
  {
    id: 'cmkyoqot3002kwv4ufbr59ek3',
    title: 'WonkyWilla + Smith + Buku',
    venue: 'Webster Hall', city: 'New York',
    searchQueries: [
      '"WonkyWilla" "Smith" "Buku" "Webster Hall" 2026',
      'WonkyWilla Smith Buku NYC event',
    ],
    platformPages: [],
  },
  {
    id: 'cmkyoqmr6001ywv4u993oyolo',
    title: 'Jetlag',
    venue: 'SILO Brooklyn', city: 'Brooklyn',
    searchQueries: [
      '"Jetlag" "SILO Brooklyn" 2026',
      'Jetlag party SILO Brooklyn',
    ],
    platformPages: [],
  },
  {
    id: 'cmkyoqihn000owv4uaxiqrcbx',
    title: 'Wakyin + Ferra Black',
    venue: 'Knockdown Center', city: 'Queens',
    searchQueries: [
      '"Wakyin" "Ferra Black" "Knockdown Center" 2026',
      'Wakyin "Ferra Black" NYC event',
    ],
    platformPages: [],
  },
  {
    id: 'cmkyoqnin0026wv4uqyep9oeg',
    title: "St. Patrick's Day Bar Fest",
    venue: 'Good Room', city: 'Brooklyn',
    searchQueries: [
      '"St. Patrick\'s Day" "Good Room" Brooklyn 2026',
      '"St Patrick" bar fest Brooklyn party 2026',
    ],
    platformPages: [],
  },
  {
    id: 'cmkyoqivs000swv4ui85gslz6',
    title: 'Bomba Lounge Saturday',
    venue: 'Good Room', city: 'Brooklyn',
    searchQueries: [
      '"Bomba Lounge" "Good Room" Brooklyn Saturday',
      '"Bomba Lounge" Brooklyn event',
    ],
    platformPages: [],
  },
];

async function processEvent(event) {
  console.log(`\n📸 ${event.title} | ${event.venue}`);
  
  // 1. Search DDG for event pages
  for (const query of event.searchQueries) {
    console.log(`  🔍 Searching: ${query}`);
    const links = await searchDDG(query);
    
    // Filter for known event platforms
    const eventPlatforms = ['ra.co', 'dice.fm', 'eventbrite.com', 'shotgun.live', 
      'edmtrain.com', 'pfrm.co', 'tixr.com', 'axs.com', 'seetickets.us',
      'ticketmaster.com', 'funqtion.co', 'link.dice.fm', 'seetickets.us'];
    
    const platformLinks = links.filter(l => eventPlatforms.some(p => l.includes(p)));
    const otherLinks = links.filter(l => !eventPlatforms.some(p => l.includes(p)));
    
    if (platformLinks.length > 0) {
      console.log(`  🎯 Found ${platformLinks.length} platform links`);
      const result = await tryEventPages(platformLinks);
      if (result) {
        console.log(`  📥 Got image from ${result.source} (${(result.buffer.length/1024).toFixed(0)}KB)`);
        const utUrl = await uploadToUT(result.buffer, `flyer-${event.id}.jpg`);
        if (utUrl) {
          await updateDB(event.id, utUrl);
          console.log(`  ✅ Updated: ${utUrl}`);
          return { success: true, source: result.source };
        }
      }
    }
    
    // Try og:image from any result links
    const topLinks = [...platformLinks, ...otherLinks].slice(0, 5);
    if (topLinks.length > 0) {
      const result = await tryEventPages(topLinks);
      if (result) {
        console.log(`  📥 Got image from ${result.source} (${(result.buffer.length/1024).toFixed(0)}KB)`);
        const utUrl = await uploadToUT(result.buffer, `flyer-${event.id}.jpg`);
        if (utUrl) {
          await updateDB(event.id, utUrl);
          console.log(`  ✅ Updated: ${utUrl}`);
          return { success: true, source: result.source };
        }
      }
    }
    
    // Rate limit between searches
    await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log(`  ❌ No image found`);
  return { success: false };
}

async function main() {
  console.log(`🔧 Fixing ${EVENTS_TO_FIX.length} likely-bad flyer images...\n`);
  
  const results = [];
  for (const event of EVENTS_TO_FIX) {
    const result = await processEvent(event);
    results.push({ title: event.title, ...result });
  }
  
  console.log('\n========================================');
  console.log('📊 RESULTS');
  console.log('========================================');
  const ok = results.filter(r => r.success);
  const fail = results.filter(r => !r.success);
  console.log(`✅ Fixed: ${ok.length}`);
  ok.forEach(r => console.log(`  - ${r.title} (${r.source})`));
  console.log(`❌ Failed: ${fail.length}`);
  fail.forEach(r => console.log(`  - ${r.title}`));
}

main().catch(console.error);
