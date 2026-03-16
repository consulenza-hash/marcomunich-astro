/**
 * redownload-images.mjs
 * Re-scarica tutte le immagini in evidenza da WordPress via IP diretto.
 * Usa node:http per bypassare il fatto che DNS punta a Vercel.
 */

import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMG_DIR = path.join(__dirname, '..', 'public', 'images', 'articoli');
const WP_IP   = '89.40.173.242';
const WP_HOST = 'marcomunich.com';

// ── helpers ──────────────────────────────────────────────────────────────────
function httpGetJSON(path, fallback = []) {
  return new Promise((resolve) => {
    const req = http.get(
      { hostname: WP_IP, port: 80, path, headers: { Host: WP_HOST }, timeout: 30000 },
      (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          try { resolve(JSON.parse(data)); } catch { resolve(fallback); }
        });
      }
    );
    req.on('error', () => resolve(fallback));
    req.on('timeout', () => { req.destroy(); resolve(fallback); });
  });
}

function downloadFromIP(urlPath, destPath) {
  // Scarica sempre direttamente dall'IP WP via HTTPS, ignorando il cert (IP ≠ dominio)
  return new Promise((resolve) => {
    const options = {
      hostname: WP_IP,
      port: 443,
      path: urlPath,
      headers: { Host: WP_HOST },
      rejectUnauthorized: false, // IP diretto: il cert è per il dominio, non l'IP
      timeout: 30000,
    };
    const req = https.get(options, (res) => {
      // Segui redirect restando sempre sull'IP
      if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
        const loc = res.headers.location;
        const newPath = loc.startsWith('http') ? new URL(loc).pathname : loc;
        return downloadFromIP(newPath, destPath).then(resolve);
      }
      if (res.statusCode !== 200) { resolve(false); return; }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        // Rifiuta risposte HTML (pagine di errore)
        if (buf.length > 0 && !buf.slice(0,15).toString().includes('<!DOCTYPE')) {
          fs.writeFileSync(destPath, buf);
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

function downloadFile(url, destPath) {
  const parsed = new URL(url);
  return downloadFromIP(parsed.pathname + (parsed.search || ''), destPath);
}

// ── main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('📥 Recupero tutti i post WP con featured media...');

  // Raccoglie tutti i post con _embed (include wp:featuredmedia)
  let allPosts = [];
  let page = 1;
  while (true) {
    const posts = await httpGetJSON(`/wp-json/wp/v2/posts?per_page=100&page=${page}&_embed=wp:featuredmedia`);
    if (!Array.isArray(posts) || posts.length === 0) break;
    allPosts = allPosts.concat(posts);
    console.log(`  Pagina ${page}: ${posts.length} post (totale: ${allPosts.length})`);
    if (posts.length < 100) break;
    page++;
  }

  console.log(`\n✅ Totale post trovati: ${allPosts.length}`);

  let ok = 0, skip = 0, fail = 0;

  for (const post of allPosts) {
    const slug = post.slug;
    const media = post._embedded?.['wp:featuredmedia']?.[0];
    if (!media?.source_url) { skip++; continue; }

    // Optimole CDN wrappa la URL originale → estraiamo la WP upload URL
    let sourceUrl = media.source_url;
    const optimoleMatch = sourceUrl.match(/https?:\/\/[^/]+\.optimole\.com\/.+?(https?:\/\/marcomunich\.com\/.+)$/);
    if (optimoleMatch) sourceUrl = optimoleMatch[1];
    // Altrimenti usa guid che è sempre l'URL originale WP
    if (!sourceUrl || sourceUrl.includes('optimole')) {
      sourceUrl = media.guid?.rendered || media.source_url;
    }
    const ext = path.extname(new URL(sourceUrl).pathname) || '.jpg';
    const filename = `${slug}${ext}`;
    const destPath = path.join(IMG_DIR, filename);

    // Salta solo se il file è un'immagine valida (non HTML, >1KB)
    if (fs.existsSync(destPath)) {
      const buf = fs.readFileSync(destPath);
      const isHtml = buf.slice(0,15).toString().includes('<!DOCTYPE') || buf.slice(0,15).toString().includes('<html');
      if (buf.length > 1000 && !isHtml) { skip++; process.stdout.write('·'); continue; }
    }

    const success = await downloadFile(sourceUrl, destPath);
    if (success) {
      ok++;
      process.stdout.write('✓');
    } else {
      fail++;
      process.stdout.write('✗');
      console.log(`\n  FAIL: ${slug} → ${sourceUrl}`);
    }
  }

  console.log(`\n\n📊 Risultati: ${ok} scaricate, ${skip} saltate, ${fail} fallite`);

  // Conta file ancora vuoti
  const empty = fs.readdirSync(IMG_DIR).filter(f => fs.statSync(path.join(IMG_DIR, f)).size === 0);
  if (empty.length > 0) {
    console.log(`⚠️  File ancora vuoti (${empty.length}):`);
    empty.forEach(f => console.log('  -', f));
  } else {
    console.log('✅ Nessun file vuoto rimasto!');
  }
}

main().catch(console.error);
