#!/usr/bin/env node
/**
 * render-storie-articoli.mjs
 *
 * Generates 52 Instagram Story graphics (1080x1920) — one per article.
 * Style: dark gradient + article title + CTA "Leggi l'articolo" + accent bar + footer.
 * Same 6-color rotating palette as caroselli and post singoli.
 *
 * Input:  src/content/articoli/{slug}/index.mdoc  (reads frontmatter: titolo, data)
 * Output: public/contenuti-social/immagini-storie/storia-{slug}.png
 *
 * Usage:
 *   node render-storie-articoli.mjs            # all 52 articles
 *   node render-storie-articoli.mjs 1 10       # articles 1-10 (by index)
 *   node render-storie-articoli.mjs --slug sito-web-counselor-coach-generico
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const ARTICLES_DIR = path.join(PROJECT_ROOT, 'src', 'content', 'articoli');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'public', 'contenuti-social', 'immagini-storie');
const SITE_URL = 'https://marcomunich.com';

const PALETTE = [
  '#e85d00', // arancione
  '#3b82f6', // azzurro
  '#22c55e', // verde
  '#fbbf24', // giallo
  '#06b6d4', // ciano
  '#a855f7', // viola
];

// The 52 article slugs in publication order
const ARTICLE_SLUGS = [
  'sito-web-counselor-coach-generico',
  'counselor-comunica-come-venditore-corsi',
  'autenticita-calcolata-si-sente',
  'piu-sai-meno-ti-capiscono-counselor',
  'visibilita-riconoscibilita-professionista-olistico',
  'bisogno-riconoscimento-prima-della-soluzione',
  'persona-jung-profilo-instagram',
  'scrivere-per-farsi-trovare-ai-counselor',
  'problema-cliente-non-servizio-counselor',
  'voce-autentica-professionista-olistico',
  'profili-coach-si-assomigliano',
  'cliente-sbagliato-dice-chi-sei',
  'instagram-vetrina-newsletter-salotto',
  'contenuto-che-non-oseresti-pubblicare',
  'pagina-chi-sono-scritta-al-contrario',
  'tempo-scrivere-qualita-contenuti',
  'prezzo-ultima-cosa-da-decidere',
  'prezzo-basso-danni-counselor',
  'prima-chiamata-conoscitiva-counselor',
  'contratto-professionista-olistico',
  'cancellazioni-ultimo-minuto-clinico',
  'clienti-sbagliati-cercavi-senza-saperlo',
  'disponibilita-infinita-paura-counselor',
  'cliente-concluso-torna-nel-tempo',
  'caso-cliente-confidenziale-utile',
  'principio-dopo-la-scena',
  'errore-professionale-costruisce-fiducia',
  'due-settimane-distanza-pubblicare',
  'vulnerabilita-da-e-quella-che-chiede',
  'un-cliente-in-testa-mentre-scrivi',
  'frase-che-solo-tu-potresti-scrivere',
  'critica-utile-crescita-professionale',
  'domande-clienti-sono-gia-contenuto',
  'prima-frase-articolo-counselor',
  'titolo-metaforico-non-funziona',
  'primo-articolo-deve-esistere',
  'paure-bloccano-scrivere-online',
  'un-tema-solo-approfondito-anni',
  'parole-clienti-contenuti-autentici',
  'newsletter-luogo-privato-counselor',
  'un-canale-solo-trappola',
  'pianificare-contenuti-decisione-giornaliera',
  'batch-contenuti-protezione-energia',
  'ripetere-concetti-importanti-servizio',
  'metriche-sbagliate-follower-like',
  'community-coltivare-lentamente',
  'newsletter-vende-troppo-smette-letta',
  'burnout-contenuti-segnale',
  'sistema-contenuti-automatico',
  'dire-no-lavoro-professionista',
  'pensare-anni-contenuti-counselor',
  'cosa-resta-costruisci-senza-vedere',
];

// ─── PARSING ──────────────────────────────────────────────────────────────

function readArticleTitle(slug) {
  const mdocPath = path.join(ARTICLES_DIR, slug, 'index.mdoc');
  if (!fs.existsSync(mdocPath)) return null;
  const content = fs.readFileSync(mdocPath, 'utf8');
  const match = content.match(/^titolo:\s*["']?(.+?)["']?\s*$/m);
  return match ? match[1].trim() : slug;
}

// ─── HTML GENERATION ──────────────────────────────────────────────────────

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

function titleFontSize(text) {
  const len = text.length;
  if (len < 30) return 90;
  if (len < 50) return 76;
  if (len < 70) return 64;
  if (len < 90) return 54;
  if (len < 110) return 46;
  return 40;
}

function generateStoriesHTML(articles) {
  const sections = articles.map(({ slug, title, accent }, i) => {
    const rgb = hexToRgb(accent);
    const size = titleFontSize(title);
    const id = `s-${slug}`;
    const articleUrl = `${SITE_URL}/blog/${slug}/`;

    return `
<section class="story" id="${id}" style="--accent: ${accent}; --rgb: ${rgb};">
  <div class="bg-glow"></div>
  <div class="inner">
    <div class="bar"></div>
    <div class="content">
      <div class="eyebrow">Nuovo articolo</div>
      <h1 style="font-size: ${size}px">${escapeHtml(title)}</h1>
      <div class="cta-block">
        <span class="cta-label">Leggi l'articolo</span>
        <span class="cta-arrow">↗</span>
      </div>
    </div>
    <div class="footer">marcomunich.com · Personal Branding Olistico</div>
  </div>
</section>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<title>Storie Articoli Renderer</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@600;700;800;900&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #111; }
  body {
    font-family: 'Inter', system-ui, sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    padding: 24px;
    -webkit-font-smoothing: antialiased;
  }

  .story {
    width: 1080px;
    height: 1920px;
    background: #060606;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  /* Radial glow — bottom-left like post singoli */
  .bg-glow {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 80% 60% at 15% 85%,
        rgba(var(--rgb), 0.55) 0%,
        rgba(var(--rgb), 0.18) 35%,
        transparent 60%
      );
    pointer-events: none;
  }

  /* Second subtle glow top-right */
  .bg-glow::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 50% 40% at 85% 10%,
      rgba(var(--rgb), 0.12) 0%,
      transparent 55%
    );
  }

  .inner {
    position: relative;
    z-index: 1;
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 120px 100px 400px 120px;
  }

  /* Left accent bar */
  .bar {
    position: absolute;
    left: 80px;
    top: 50%;
    transform: translateY(-50%);
    width: 5px;
    height: 120px;
    background: var(--accent);
    border-radius: 3px;
  }

  /* Content area — vertically centered */
  .content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 48px;
  }

  .eyebrow {
    font-size: 26px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--accent);
  }

  h1 {
    font-weight: 900;
    line-height: 1.06;
    letter-spacing: -0.025em;
    color: #ffffff;
    max-width: 860px;
  }

  .cta-block {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 24px 36px;
    border: 2px solid rgba(255,255,255,0.2);
    border-radius: 60px;
    width: fit-content;
    backdrop-filter: blur(4px);
  }

  .cta-label {
    font-size: 28px;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: #ffffff;
  }

  .cta-arrow {
    font-size: 32px;
    color: var(--accent);
    font-weight: 900;
  }

  .footer {
    text-align: center;
    font-size: 22px;
    font-weight: 500;
    letter-spacing: 0.04em;
    color: rgba(255,255,255,0.4);
    padding-top: 32px;
  }
</style>
</head>
<body>
${sections}
</body>
</html>`;
}

// ─── SCREENSHOT ───────────────────────────────────────────────────────────

async function screenshotStories(page, articles) {
  let ok = 0;
  let skip = 0;

  for (const { slug } of articles) {
    const outPath = path.join(OUTPUT_DIR, `storia-${slug}.png`);
    if (fs.existsSync(outPath) && fs.statSync(outPath).size > 10_000) {
      console.log(`  ${slug}: SKIP (exists ${Math.round(fs.statSync(outPath).size / 1024)}KB)`);
      skip++;
      continue;
    }

    const id = `s-${slug}`;
    const el = page.locator(`#${id}`);
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    await el.screenshot({ path: outPath });
    const size = Math.round(fs.statSync(outPath).size / 1024);
    console.log(`  ${slug}: OK (${size}KB)`);
    ok++;
  }

  return { ok, skip };
}

// ─── MAIN ─────────────────────────────────────────────────────────────────

async function main() {
  let slugsToProcess;

  // --slug single mode
  const slugIdx = process.argv.indexOf('--slug');
  if (slugIdx !== -1 && process.argv[slugIdx + 1]) {
    slugsToProcess = [process.argv[slugIdx + 1]];
  } else {
    const startIdx = parseInt(process.argv[2] ?? '1', 10) - 1;
    const endIdx = parseInt(process.argv[3] ?? String(ARTICLE_SLUGS.length), 10);
    slugsToProcess = ARTICLE_SLUGS.slice(startIdx, endIdx);
  }

  console.log(`\nRendering ${slugsToProcess.length} article stories...`);

  // Build articles list
  const articles = [];
  slugsToProcess.forEach((slug, i) => {
    const title = readArticleTitle(slug);
    if (!title) {
      console.warn(`  WARNING: no mdoc found for ${slug}, skipping`);
      return;
    }
    const globalIdx = ARTICLE_SLUGS.indexOf(slug);
    const accent = PALETTE[(globalIdx >= 0 ? globalIdx : i) % PALETTE.length];
    articles.push({ slug, title, accent });
  });

  if (articles.length === 0) {
    console.error('No articles to render');
    process.exit(1);
  }

  // Serve HTML via local HTTP server for font loading
  const html = generateStoriesHTML(articles);
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1200, height: 900 });

  try {
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);

    const { ok, skip } = await screenshotStories(page, articles);
    console.log(`\nDone: ${ok} rendered, ${skip} skipped`);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
