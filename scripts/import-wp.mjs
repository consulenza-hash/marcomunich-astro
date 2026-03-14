/**
 * import-wp.mjs
 * Importa tutti gli articoli pubblicati da WordPress → src/content/articoli/
 * Usage: node scripts/import-wp.mjs
 */

import { writeFileSync, mkdirSync, createWriteStream, existsSync } from 'fs';
import { join } from 'path';
import https from 'https';
import http from 'http';

const WP_IP   = '89.40.173.242';   // IP Netsons (bypass DNS)
const WP_HOST = 'marcomunich.com';
const OUT_DIR = 'src/content/articoli';
const IMG_DIR = 'public/images/articoli';

// ─── HTTP helpers ────────────────────────────────────────────────────────────

function fetchWP(path) {
  return new Promise((resolve, reject) => {
    const req = http.get(
      { hostname: WP_IP, port: 80, path, headers: { Host: WP_HOST, Accept: 'application/json' } },
      (res) => {
        let raw = '';
        res.on('data', c => raw += c);
        res.on('end', () => {
          try { resolve(JSON.parse(raw)); }
          catch (e) { reject(new Error(`JSON parse error on ${path}: ${raw.slice(0,120)}`)); }
        });
      }
    );
    req.on('error', reject);
  });
}

function downloadImage(srcUrl, dest) {
  return new Promise((resolve) => {
    if (existsSync(dest)) { resolve(); return; }

    const tryGet = (url) => {
      const isHttps = url.startsWith('https');
      const proto   = isHttps ? https : http;
      let options;

      if (isHttps && url.includes(WP_HOST)) {
        // Usa IP diretto con SNI disabilitato
        const parsed = new URL(url);
        options = {
          hostname: WP_IP, port: 443,
          path: parsed.pathname + parsed.search,
          headers: { Host: WP_HOST },
          rejectUnauthorized: false,
        };
      } else {
        options = url; // stringa URL diretta
      }

      const file = createWriteStream(dest);
      proto.get(options, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          file.close();
          tryGet(res.headers.location);
          return;
        }
        if (res.statusCode !== 200) { file.close(); resolve(); return; }
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
      }).on('error', () => { file.close(); resolve(); });
    };

    tryGet(srcUrl);
  });
}

// ─── HTML → Markdown ─────────────────────────────────────────────────────────

function entities(s) {
  return s
    .replace(/&#8217;|&#x2019;/g, "'").replace(/&#8216;|&#x2018;/g, "'")
    .replace(/&#8220;|&#x201C;/g, '"').replace(/&#8221;|&#x201D;/g, '"')
    .replace(/&#8211;|&#x2013;/g, '–').replace(/&#8212;|&#x2014;/g, '—')
    .replace(/&#8230;|&#x2026;/g, '…').replace(/&#038;/g, '&')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&[a-z]+;/g, '');
}

function inlineHtml(s) {
  return entities(
    s
      .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
      .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**')
      .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*')
      .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*')
      .replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
      .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`')
      .replace(/<br\s*\/?>/gi, '  \n')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

function htmlToMarkdown(html) {
  let md = html
    // Rimuovi commenti Gutenberg
    .replace(/<!--[\s\S]*?-->/g, '')
    // Heading
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_, c) => `\n\n# ${inlineHtml(c)}\n\n`)
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_, c) => `\n\n## ${inlineHtml(c)}\n\n`)
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_, c) => `\n\n### ${inlineHtml(c)}\n\n`)
    .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, (_, c) => `\n\n#### ${inlineHtml(c)}\n\n`)
    .replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, (_, c) => `\n\n##### ${inlineHtml(c)}\n\n`)
    // Liste non ordinate
    .replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_, c) =>
      '\n\n' + c.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (__, i) => `- ${inlineHtml(i)}\n`) + '\n'
    )
    // Liste ordinate
    .replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, c) => {
      let n = 0;
      return '\n\n' + c.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (__, i) => `${++n}. ${inlineHtml(i)}\n`) + '\n';
    })
    // Blockquote
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, c) => {
      const inner = htmlToMarkdown(c).trim().replace(/^/gm, '> ');
      return `\n\n${inner}\n\n`;
    })
    // Paragrafi
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_, c) => {
      const t = inlineHtml(c).trim();
      return t ? `${t}\n\n` : '';
    })
    // Immagini standalone
    .replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi, (_, s, a) => `\n\n![${a}](${s})\n\n`)
    .replace(/<img[^>]*src="([^"]*)"[^>]*>/gi, (_, s) => `\n\n![](${s})\n\n`)
    // Resto dei tag
    .replace(/<[^>]+>/g, '')
    // Entità HTML rimaste
    .replace(/&[^;]+;/g, m => entities(m));

  return md.replace(/\n{3,}/g, '\n\n').trim();
}

function stripHtml(html) {
  return entities(html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());
}

// ─── YAML frontmatter safe ────────────────────────────────────────────────────

function yamlStr(s) {
  // JSON.stringify gestisce apici, newline, caratteri speciali
  return JSON.stringify(s);
}

function yamlMultiline(s) {
  // Blocco literal YAML per testi lunghi con eventuali newline
  const clean = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trimEnd();
  if (!clean.includes('\n') && !clean.includes('"') && !clean.includes("'") && clean.length < 120) {
    return clean;
  }
  return '|-\n  ' + clean.split('\n').join('\n  ');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  mkdirSync(IMG_DIR, { recursive: true });

  // Raccolta tutti i post (paginazione 100/pagina)
  let page = 1;
  const allPosts = [];
  while (true) {
    process.stdout.write(`\r⬇  Fetching page ${page}...   `);
    const posts = await fetchWP(
      `/wp-json/wp/v2/posts?per_page=100&page=${page}&status=publish&_embed=1`
    );
    if (!Array.isArray(posts) || posts.length === 0) break;
    allPosts.push(...posts);
    if (posts.length < 100) break;
    page++;
  }
  console.log(`\n✅ Trovati ${allPosts.length} articoli\n`);

  let ok = 0, skip = 0, errors = 0;

  for (const post of allPosts) {
    const slug = post.slug;
    try {
      const titolo     = entities(post.title.rendered);
      const data       = post.date.split('T')[0];          // YYYY-MM-DD
      const descrizione = stripHtml(post.excerpt?.rendered || '');
      const contenuto  = htmlToMarkdown(post.content?.rendered || '');

      // Immagine in evidenza
      let imgFilename = '';
      const media = post._embedded?.['wp:featuredmedia']?.[0];
      if (media?.source_url) {
        const rawUrl = media.source_url;
        const ext    = rawUrl.split('?')[0].split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
        imgFilename  = `${slug}.${ext}`;
        await downloadImage(rawUrl, join(IMG_DIR, imgFilename));
        process.stdout.write(`  📷 ${imgFilename}\r`);
      }

      // Costruisci frontmatter
      const lines = [
        '---',
        `titolo: ${yamlStr(titolo)}`,
        `descrizione: ${yamlMultiline(descrizione)}`,
        `data: ${data}`,
      ];
      if (imgFilename) lines.push(`immagine: ${imgFilename}`);
      lines.push('---', '', contenuto);

      const fileContent = lines.join('\n');

      const dir = join(OUT_DIR, slug);
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, 'index.mdoc'), fileContent, 'utf8');

      console.log(`✓ ${slug}`);
      ok++;
    } catch (e) {
      console.error(`✗ ${slug}: ${e.message}`);
      errors++;
    }
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`✅ OK: ${ok}   ⚠️  Errori: ${errors}   ⏭  Saltati: ${skip}`);
  console.log(`📁 Articoli → ${OUT_DIR}`);
  console.log(`🖼  Immagini → ${IMG_DIR}`);
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
