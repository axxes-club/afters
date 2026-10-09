/**
 * Scrape event flyer images via Bing Image Search, upload to UploadThing, update DB.
 */
import { chromium } from 'playwright';
import { writeFile, readFile, unlink } from 'fs/promises';
import { neon } from '@neondatabase/serverless';
import { UTApi } from 'uploadthing/server';

const DB_URL = (() => { const value = process.env.DATABASE_URL; if (!value || !/^postgres(?:ql)?:\/\//.test(value)) throw new Error("Set DATABASE_URL to a PostgreSQL connection URL"); return value; })();
const sql = neon(DB_URL);
const ut = new UTApi({ token: process.env.UPLOADTHING_TOKEN });

const MISSING_EVENTS = [
  { id: 'cmkyoqgwp0007wv4uqdynj3ov', title: 'Platonic Romance Tour: DRAMA', search: 'DRAMA band Platonic Romance Tour poster' },
  { id: 'cmkyoqhql000gwv4u8rr06enr', title: 'Amenthia Showcase: Nastia', search: 'Nastia DJ techno event poster artwork' },
  { id: 'cmkyoqi0h000jwv4u0k6hcg0r', title: 'HEATED RIVALRY - The Party', search: 'heated rivalry brooklyn DJ party poster' },
  { id: 'cmkyoqjm30010wv4u89jf6np0', title: 'Ekali', search: 'Ekali DJ concert poster artwork' },
  { id: 'cmkyoqk2q0015wv4u6egt6kf8', title: 'Wilkinson', search: 'Wilkinson drum and bass DJ tour poster' },
  { id: 'cmkyoqkml001bwv4u2mir5rks', title: 'Ray Volpe + Virtual Riot', search: 'Ray Volpe Virtual Riot tour poster' },
  { id: 'cmkyoqkta001dwv4u3v5yofhp', title: 'Habstrakt', search: 'Habstrakt DJ concert poster artwork' },
  { id: 'cmkyoqldf001jwv4ugo1sfnok', title: 'Stepmom Got Hardgrooved', search: 'hardgroove techno party rave poster neon' },
  { id: 'cmkyoqlqn001nwv4ucdxibd0b', title: 'Adam Beyer', search: 'Adam Beyer Drumcode event poster' },
  { id: 'cmkyoqmds001uwv4u6kc2heza', title: 'Battle Hymn x Battle HURRR', search: 'underground rave battle party poster brooklyn' },
  { id: 'cmkyoqmul001zwv4ulkjy43wf', title: 'Toni Varga', search: 'Toni Varga DJ poster event artwork' },
  { id: 'cmkyoqn1q0021wv4uo0yhzfkm', title: 'TWILO Reunion: Danny Tenaglia', search: 'Danny Tenaglia TWILO poster' },
  { id: 'cmkyoqnsx0029wv4umzbaf00j', title: 'Purple Disco Machine', search: 'Purple Disco Machine concert poster tour' },
  { id: 'cmkyoqnzj002bwv4utgf5y63n', title: 'Four Tet', search: 'Four Tet electronic concert poster artwork' },
  { id: 'cmkyoqivs000swv4ui85gslz6', title: 'Bomba Lounge Saturday', search: 'latin lounge party poster neon nightlife' },
  { id: 'cmkytafaa0006yy4u3yakz26s', title: 'Jazz Evening at the Rooftop', search: 'jazz rooftop evening poster artwork night' },
];

async function downloadImage(url) {
  const res = await fetch(url, { 
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
    redirect: 'follow',
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function searchBingImages(page, query) {
  const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&qft=+filterui:aspect-tall&first=1`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(3000);
  
  // Extract image URLs from Bing results
  const imageUrls = await page.evaluate(() => {
    const results = [];
    // Bing stores full image URLs in data attributes or m attribute (JSON)
    const items = document.querySelectorAll('a.iusc');
    for (const item of items) {
      try {
        const m = item.getAttribute('m');
        if (m) {
          const data = JSON.parse(m);
          if (data.murl) results.push(data.murl);
        }
      } catch {}
    }
    // Fallback: look for img tags with src
    if (results.length === 0) {
      const imgs = document.querySelectorAll('.imgpt img, .img_cont img');
      for (const img of imgs) {
        const src = img.getAttribute('src') || img.getAttribute('data-src');
        if (src && src.startsWith('http') && !src.includes('bing.com') && !src.includes('bing.net')) {
          results.push(src);
        }
      }
    }
    return results.slice(0, 10);
  });
  
  return imageUrls;
}

async function findBestImage(page, query) {
  const urls = await searchBingImages(page, query);
  if (urls.length === 0) return null;
  
  // Try each URL, pick first one that downloads successfully and is > 10KB
  for (const url of urls.slice(0, 5)) {
    try {
      const buf = await downloadImage(url);
      if (buf.length > 10000) { // At least 10KB
        return { url, buffer: buf };
      }
    } catch (e) {
      continue;
    }
  }
  return null;
}

async function uploadToUT(buffer, filename) {
  const file = new File([buffer], filename, { type: 'image/jpeg' });
  const response = await ut.uploadFiles([file]);
  const data = response[0]?.data;
  return data?.ufsUrl || data?.url || null;
}

async function main() {
  console.log(`\n🔍 Scraping flyers for ${MISSING_EVENTS.length} events...\n`);
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();
  
  let success = 0, fail = 0;
  
  for (const event of MISSING_EVENTS) {
    console.log(`📸 ${event.title}`);
    try {
      const result = await findBestImage(page, event.search);
      if (!result) {
        console.log(`  ❌ No image found`);
        fail++;
        continue;
      }
      console.log(`  🔗 Source: ${result.url.substring(0, 80)}... (${(result.buffer.length / 1024).toFixed(0)}KB)`);
      
      const utUrl = await uploadToUT(result.buffer, `flyer-${event.id}.jpg`);
      if (!utUrl) throw new Error('Upload returned no URL');
      console.log(`  ☁️  Uploaded: ${utUrl}`);
      
      await sql`UPDATE "Event" SET "flyerUrl" = ${utUrl} WHERE id = ${event.id}`;
      console.log(`  ✅ DB updated!`);
      success++;
    } catch (err) {
      console.log(`  ❌ Error: ${err.message}`);
      fail++;
    }
  }
  
  await browser.close();
  console.log(`\n✨ Done! ${success} updated, ${fail} failed.`);
}

main().catch(console.error);
