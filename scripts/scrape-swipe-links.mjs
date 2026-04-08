/**
 * Scrape Instagram links → swipe-file.md
 * Usage: node scripts/scrape-swipe-links.mjs
 */

import { writeFileSync } from 'fs';

const links = [
  'https://www.instagram.com/reel/DUlK3BJDFKQ/',
  'https://www.instagram.com/p/DVGAlYSiJCg/',
  'https://www.instagram.com/reel/DU_4ohODqeB/',
  'https://www.instagram.com/p/DU8I7iNjmPT/',
  'https://www.instagram.com/p/DU3pef3EV1W/',
  'https://www.instagram.com/p/DVIT-CACFyt/',
  'https://www.instagram.com/reel/DVNAIKZCZhi/',
  'https://www.instagram.com/reel/DTneoInkdmG/',
  'https://www.instagram.com/p/DVBw8d-jk1B/',
  'https://www.instagram.com/reel/DVMGTpFjUu0/',
  'https://www.instagram.com/p/DVGkPPmDHAd/',
  'https://www.instagram.com/reel/DVUVhWcDfVA/',
  'https://www.instagram.com/reel/DVZpiP8jEyE/',
  'https://www.instagram.com/reel/DVjyLlLjeIM/',
  'https://www.instagram.com/p/DVrdjpDkefw/',
  'https://www.instagram.com/reel/DVhRMHzEh-h/',
  'https://www.instagram.com/p/DVHbacfkSgb/',
  'https://www.instagram.com/reel/DVNSccIjWnQ/',
  'https://www.instagram.com/reel/DVSkKKCjmHo/',
  'https://www.instagram.com/reel/DVSKF1WEk85/',
  'https://www.instagram.com/reel/DVrTT5FjdCk/',
  'https://www.instagram.com/p/DPi5XVPCOUi/',
  'https://www.instagram.com/reel/DWHhMboCQIp/',
  'https://www.instagram.com/reel/DWHe0jUD8M7/',
  'https://www.instagram.com/reel/DWMNRQTjiNN/',
  'https://www.instagram.com/reel/DWHkP32kX9w/',
  'https://www.instagram.com/reel/DWRnz7_EYLS/',
  'https://www.instagram.com/reel/DWTtRizjj9V/',
  'https://www.instagram.com/reel/DWRXImHDiXf/',
  'https://www.instagram.com/p/DWYzNbkmakB/',
  'https://www.instagram.com/p/DVuaB0NgFA8/',
  'https://www.instagram.com/reel/DWXW2DSEsEl/',
  'https://www.instagram.com/reel/DWHubPOk7Zp/',
  'https://www.instagram.com/reel/DWjobc6DMwB/',
  'https://www.instagram.com/reel/DWooSQkkQe2/',
  'https://www.instagram.com/reel/DSkgqLHjX7A/',
  'https://www.instagram.com/reel/DWpvEFADcFo/',
  'https://www.instagram.com/p/DWqtWU9Ga-e/',
  'https://www.instagram.com/reel/DWjEeGKDD_m/',
  'https://www.instagram.com/p/DWrn4rMAHSH/',
  'https://www.instagram.com/p/DWqU1--FNxf/',
  'https://www.instagram.com/p/DWrc9fXF4Vz/',
  'https://www.instagram.com/reel/DV826O8iabh/',
  'https://www.instagram.com/p/DWlZ6EIjw7P/',
  'https://www.instagram.com/p/DWVsKbrGYWl/',
];

function extractMeta(html) {
  const get = (prop) => {
    const m = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']*?)["']`, 'i'))
      || html.match(new RegExp(`<meta[^>]+content=["']([^"']*?)["'][^>]+(?:property|name)=["']${prop}["']`, 'i'));
    return m ? m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#039;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>') : null;
  };

  const title = get('og:title') || get('twitter:title');
  const desc = get('og:description') || get('twitter:description');
  const url = get('og:url');
  const type = get('og:type');

  // Extract account from og:url or title
  const accountMatch = (url || '').match(/instagram\.com\/([^/]+)\//);
  const account = accountMatch ? accountMatch[1] : null;

  // Extract likes/engagement from description
  const likesMatch = (desc || '').match(/([\d,\.KkMm]+)\s+likes?/i);
  const likes = likesMatch ? likesMatch[1] : null;

  // Caption = everything after the account part in og:title
  const captionMatch = (title || '').match(/on Instagram:\s*[""](.+)/s);
  const caption = captionMatch ? captionMatch[1].substring(0, 300).trim() : (desc || '').substring(0, 300).trim();

  const isReel = (url || '').includes('/reel/') || type === 'video';

  return { account, likes, caption, url: url || null, isReel };
}

async function scrapeOne(link) {
  try {
    const cleanUrl = link.split('?')[0];
    const res = await fetch(cleanUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept': 'text/html',
      },
      signal: AbortSignal.timeout(8000),
    });
    const html = await res.text();
    return { link: cleanUrl, ...extractMeta(html) };
  } catch (e) {
    return { link, error: e.message };
  }
}

async function main() {
  console.log(`Scraping ${links.length} links...`);
  const results = [];

  // Batch of 5 at a time to avoid rate limiting
  for (let i = 0; i < links.length; i += 5) {
    const batch = links.slice(i, i + 5);
    const batchResults = await Promise.all(batch.map(scrapeOne));
    results.push(...batchResults);
    console.log(`  ${Math.min(i + 5, links.length)}/${links.length} done`);
    if (i + 5 < links.length) await new Promise(r => setTimeout(r, 1000));
  }

  // Build markdown
  const reels = results.filter(r => r.isReel);
  const posts = results.filter(r => !r.isReel);
  const errors = results.filter(r => r.error);

  let md = `# Swipe File — Ispirazione Instagram\n\n`;
  md += `*Aggiornato: ${new Date().toLocaleDateString('it-IT')} — ${results.length - errors.length}/${results.length} scraped*\n\n`;
  md += `> Usato dall'Art Director come riferimento per angoli, format, hook. Prima di generare contenuti, leggi questa raccolta per allinearti ai trend che Marco sta osservando.\n\n`;

  md += `---\n\n## Reel (${reels.length})\n\n`;
  reels.forEach((r, i) => {
    if (r.error) { md += `### R${i+1} — ERRORE\n${r.link}\n\n`; return; }
    md += `### R${i+1} — @${r.account || '?'}${r.likes ? ` · ${r.likes} likes` : ''}\n`;
    md += `**URL:** ${r.url || r.link}\n`;
    if (r.caption) md += `**Caption:** ${r.caption}${r.caption.length >= 300 ? '…' : ''}\n`;
    md += `\n`;
  });

  md += `---\n\n## Post / Carousel (${posts.length})\n\n`;
  posts.forEach((r, i) => {
    if (r.error) { md += `### P${i+1} — ERRORE\n${r.link}\n\n`; return; }
    md += `### P${i+1} — @${r.account || '?'}${r.likes ? ` · ${r.likes} likes` : ''}\n`;
    md += `**URL:** ${r.url || r.link}\n`;
    if (r.caption) md += `**Caption:** ${r.caption}${r.caption.length >= 300 ? '…' : ''}\n`;
    md += `\n`;
  });

  if (errors.length > 0) {
    md += `---\n\n## Non scraped (${errors.length})\n\n`;
    errors.forEach(r => { md += `- ${r.link}: ${r.error}\n`; });
  }

  const outPath = 'public/contenuti-social/swipe-file.md';
  writeFileSync(outPath, md, 'utf8');
  console.log(`\n✅ Salvato in ${outPath}`);
  console.log(`   ${reels.length} reel, ${posts.length} post, ${errors.length} errori`);
}

main().catch(console.error);
