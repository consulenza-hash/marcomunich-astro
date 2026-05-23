#!/usr/bin/env node
/**
 * render-caroselli.mjs
 *
 * Parses all carousel markdown files, generates one giant HTML with 52 carousels
 * (416+ slides) each with rotating accent color, then uses Playwright to
 * screenshot each slide as a 1080x1350 PNG ready for Instagram upload.
 *
 * Output: public/contenuti-social/immagini-caroselli/carosello-XX/slide-NN.png
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(PROJECT_ROOT, 'public', 'contenuti-social', 'caroselli');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'public', 'contenuti-social', 'immagini-caroselli');

// Palette rotante senza rosa (6 colori)
const PALETTE = [
  '#e85d00', // arancione
  '#3b82f6', // azzurro
  '#22c55e', // verde
  '#fbbf24', // giallo
  '#06b6d4', // ciano
  '#a855f7', // viola
];

const MD_FILES = [
  'archivio-caroselli.md',
  'mese-2-caroselli.md',
  'mese-3.md',
  'mese-4.md',
  'mese-5.md',
  'mese-6.md',
];

// ─── PARSING ──────────────────────────────────────────────────────────────

function parseMarkdownFile(filepath) {
  const content = fs.readFileSync(filepath, 'utf8');
  const carousels = [];
  const regex = /### CAROSELLO (\d+)\s*—\s*"([^"]+)"\n([\s\S]*?)(?=\n### CAROSELLO |\n## |\n---\n|$)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const num = parseInt(match[1], 10);
    const title = match[2];
    const body = match[3];

    const slides = [];
    const slideRegex = /- \*\*Slide (\d+):\*\* (.+)/g;
    let sm;
    while ((sm = slideRegex.exec(body)) !== null) {
      slides.push({ num: parseInt(sm[1], 10), text: sm[2].trim() });
    }

    const captionMatch = body.match(/- \*\*Caption:\*\* (.+)/);
    const caption = captionMatch ? captionMatch[1].trim() : '';

    carousels.push({ num, title, slides, caption });
  }
  return carousels;
}

function loadAllCarousels() {
  const all = [];
  for (const file of MD_FILES) {
    const filepath = path.join(CONTENT_DIR, file);
    if (!fs.existsSync(filepath)) {
      console.warn(`Missing file: ${file}`);
      continue;
    }
    const carousels = parseMarkdownFile(filepath);
    console.log(`  ${file}: ${carousels.length} carousels`);
    all.push(...carousels);
  }
  const map = new Map();
  for (const c of all) map.set(c.num, c);
  return Array.from(map.values()).sort((a, b) => a.num - b.num);
}

// ─── HTML GENERATION ──────────────────────────────────────────────────────

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function coverFontSize(text) {
  const len = text.length;
  if (len < 25) return 132;
  if (len < 40) return 112;
  if (len < 60) return 92;
  if (len < 80) return 76;
  return 64;
}

/**
 * Splitta il titolo cover in due parti: testo bianco + ultime parole in arancione.
 * Euristica: prende gli ultimi 2-4 token come accento, cercando un break naturale.
 */
function splitCoverAccent(text) {
  const words = text.split(/\s+/);
  if (words.length <= 3) return { main: '', accent: text };
  // Cerca un break naturale negli ultimi 5 token (preposizione, congiunzione, articolo)
  const breaks = ['di', 'del', 'della', 'delle', 'dei', 'degli', 'per', 'con', 'in', 'al', 'alla',
    'come', 'che', 'e', 'o', 'da', 'nel', 'nella', 'a', 'senza', 'tra', 'è', 'sono'];
  // Cerca dall'ultima parola a ritroso, massimo 5 posizioni dal fondo
  const minMain = Math.max(1, words.length - 5);
  for (let i = words.length - 2; i >= minMain; i--) {
    if (breaks.includes(words[i].toLowerCase().replace(/[.,!?'"]/g, ''))) {
      return { main: words.slice(0, i).join(' '), accent: words.slice(i).join(' ') };
    }
  }
  // Fallback: ultime 3 parole
  const split = Math.max(1, words.length - 3);
  return { main: words.slice(0, split).join(' '), accent: words.slice(split).join(' ') };
}

function bodyFontSize(text) {
  const len = text.length;
  if (len < 80) return 64;
  if (len < 140) return 56;
  if (len < 200) return 48;
  if (len < 280) return 42;
  return 36;
}

function generateSlideHTML(carouselNum, slide, idx, total, carouselTitle) {
  const accent = PALETTE[(carouselNum - 1) % PALETTE.length];
  const slideId = `c${String(carouselNum).padStart(2, '0')}s${String(slide.num).padStart(2, '0')}`;
  const isFirst = idx === 0;
  const isLast = idx === total - 1;
  const isSignature = isLast && /@marcomunich/i.test(slide.text);

  const counter = `<span class="num">${String(slide.num).padStart(2, '0')}</span> / ${String(total).padStart(2, '0')}`;

  if (isFirst) {
    const size = coverFontSize(slide.text);
    const { main, accent: accentText } = splitCoverAccent(slide.text);
    const titleHTML = main
      ? `${escapeHtml(main)}<br><em>${escapeHtml(accentText)}</em>`
      : `<em>${escapeHtml(accentText)}</em>`;
    return `
<section class="slide slide-cover" id="${slideId}" style="--accent: ${accent}">
  <div class="meta">
    <span>Marco Munich · Personal Branding</span>
    <span>${counter}</span>
  </div>
  <div class="content">
    <h1 style="font-size: ${size}px">${titleHTML}</h1>
  </div>
  <div class="footer-hint">Scorri per scoprirli</div>
</section>`;
  }

  if (isSignature) {
    return `
<section class="slide slide-signature" id="${slideId}" style="--accent: ${accent}">
  <div class="meta">
    <span>Segui per altri</span>
    <span>${counter}</span>
  </div>
  <div class="content">
    <div class="tag">Per coach, counselor &amp; operatori olistici</div>
    <div class="handle">Marco<br>Munich</div>
    <div class="services">
      <div class="group">
        <div class="group-label">Consulenza 1-a-1</div>
        <div class="service"><span class="num">01</span><span>Personal Branding Olistico</span></div>
        <div class="service"><span class="num">02</span><span>Sviluppo Siti Web</span></div>
      </div>
      <div class="group">
        <div class="group-label">Percorsi Online</div>
        <div class="service"><span class="num">03</span><span>Metterci la faccia online</span></div>
        <div class="service"><span class="num">04</span><span>Creazione del Messaggio Autentico</span></div>
        <div class="service"><span class="num">05</span><span>Creazione Video Autentici</span></div>
        <div class="service"><span class="num">06</span><span>Lavorare Senza Sito Web</span></div>
      </div>
    </div>
    <div class="cta">→ marcomunich.com · @marcomunich.dev</div>
  </div>
  <div></div>
</section>`;
  }

  const size = bodyFontSize(slide.text);
  const bodyIndex = idx; // posizione progressiva nella sequenza body
  return `
<section class="slide slide-body" id="${slideId}" style="--accent: ${accent}">
  <div class="meta">
    <span>${escapeHtml(carouselTitle)}</span>
    <span>${counter}</span>
  </div>
  <div class="bg-index">${bodyIndex}</div>
  <div class="content">
    <p style="font-size: ${size}px">${escapeHtml(slide.text)}</p>
  </div>
  <div></div>
</section>`;
}

function generateHTML(carousels) {
  let slidesHTML = '';
  for (const c of carousels) {
    const total = c.slides.length;
    for (let i = 0; i < c.slides.length; i++) {
      slidesHTML += generateSlideHTML(c.num, c.slides[i], i, total, c.title);
    }
  }

  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<title>All Caroselli Renderer</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #2a2a2a; }
  body {
    font-family: 'Inter', system-ui, sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    padding: 24px;
    -webkit-font-smoothing: antialiased;
  }
  .slide {
    width: 1080px;
    height: 1350px;
    background: #0d0d0d;
    color: #ffffff;
    padding: 110px 100px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
    overflow: hidden;
  }
  .slide::before {
    content: '';
    position: absolute;
    top: 110px;
    left: 100px;
    width: 72px;
    height: 5px;
    background: var(--accent);
  }
  .meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 18px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.5);
    margin-top: 32px;
    gap: 24px;
  }
  .meta > span:first-child {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 600px;
  }
  .meta .num { color: var(--accent); font-weight: 800; }
  .content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  /* Cover */
  .slide-cover h1 {
    font-weight: 900;
    line-height: 0.92;
    letter-spacing: -0.045em;
    color: #ffffff;
  }
  .slide-cover h1 em {
    font-style: normal;
    color: var(--accent);
  }
  .slide-cover .footer-hint {
    font-size: 20px;
    font-weight: 600;
    color: rgba(255,255,255,0.55);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .slide-cover .footer-hint::before {
    content: '→ ';
    color: var(--accent);
  }

  /* Body */
  .slide-body .bg-index {
    font-size: 340px;
    font-weight: 900;
    line-height: 0.8;
    color: var(--accent);
    opacity: 0.13;
    position: absolute;
    top: 60px;
    right: 80px;
    pointer-events: none;
    letter-spacing: -0.06em;
    z-index: 0;
  }
  .slide-body p {
    font-weight: 700;
    line-height: 1.2;
    color: #ffffff;
    letter-spacing: -0.02em;
    position: relative;
    z-index: 1;
  }

  /* Signature */
  .slide-signature {
    background: var(--accent);
    color: #0d0d0d;
  }
  .slide-signature::before { background: #0d0d0d; }
  .slide-signature .meta { color: rgba(13,13,13,0.55); }
  .slide-signature .meta .num { color: #0d0d0d; }
  .slide-signature .meta > span:first-child { max-width: none; }
  .slide-signature .tag {
    font-size: 22px;
    font-weight: 800;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #0d0d0d;
    margin-bottom: 36px;
  }
  .slide-signature .handle {
    font-size: 148px;
    font-weight: 900;
    line-height: 0.9;
    letter-spacing: -0.03em;
    color: #0d0d0d;
  }
  .slide-signature .services {
    margin-top: 40px;
    display: flex;
    flex-direction: column;
    gap: 26px;
    max-width: 860px;
  }
  .slide-signature .group-label {
    font-size: 17px;
    font-weight: 800;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #0d0d0d;
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 2px solid rgba(13,13,13,0.25);
  }
  .slide-signature .group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .slide-signature .service {
    display: flex;
    align-items: baseline;
    gap: 18px;
    font-size: 26px;
    font-weight: 700;
    color: #0d0d0d;
    line-height: 1.35;
    letter-spacing: -0.01em;
  }
  .slide-signature .service .num {
    font-weight: 400;
    font-size: 20px;
    color: rgba(13,13,13,0.55);
    min-width: 38px;
  }
  .slide-signature .cta {
    font-size: 22px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #0d0d0d;
    margin-top: 36px;
    padding-top: 24px;
    border-top: 3px solid #0d0d0d;
    max-width: 860px;
  }
</style>
</head>
<body>
${slidesHTML}
</body>
</html>`;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────

async function main() {
  console.log('> Parsing markdown files…');
  const carousels = loadAllCarousels();
  const totalSlides = carousels.reduce((s, c) => s + c.slides.length, 0);
  console.log(`> Loaded ${carousels.length} carousels, ${totalSlides} total slides\n`);

  if (carousels.length === 0) {
    console.error('No carousels parsed, aborting');
    process.exit(1);
  }

  console.log('> Generating HTML…');
  const html = generateHTML(carousels);
  const htmlPath = path.join(CONTENT_DIR, 'all-carousels-renderer.html');
  fs.writeFileSync(htmlPath, html);
  console.log(`  written to ${htmlPath} (${(html.length / 1024).toFixed(1)} KB)\n`);

  console.log('> Preparing output directories…');
  for (const c of carousels) {
    const dir = path.join(OUTPUT_DIR, `carosello-${String(c.num).padStart(2, '0')}`);
    fs.mkdirSync(dir, { recursive: true });
  }

  console.log('> Starting local HTTP server on :8766…');
  const server = http.createServer((req, res) => {
    if (req.url === '/renderer.html' || req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } else {
      res.writeHead(404);
      res.end();
    }
  });
  await new Promise(resolve => server.listen(8766, resolve));

  console.log('> Launching Chromium…');
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 1400 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto('http://localhost:8766/renderer.html');

  console.log('> Waiting for fonts to load…');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2000);

  console.log('> Rendering slides…\n');
  let count = 0;
  const start = Date.now();
  for (const c of carousels) {
    const dir = path.join(OUTPUT_DIR, `carosello-${String(c.num).padStart(2, '0')}`);
    for (let i = 0; i < c.slides.length; i++) {
      const slide = c.slides[i];
      const slideId = `c${String(c.num).padStart(2, '0')}s${String(slide.num).padStart(2, '0')}`;
      const outPath = path.join(dir, `slide-${String(slide.num).padStart(2, '0')}.png`);
      const el = await page.$(`#${slideId}`);
      if (!el) {
        console.warn(`  !! missing #${slideId}`);
        continue;
      }
      await el.screenshot({ path: outPath });
      count++;
      if (count % 25 === 0) {
        const elapsed = ((Date.now() - start) / 1000).toFixed(0);
        console.log(`  ${count}/${totalSlides} (${elapsed}s)`);
      }
    }
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(0);
  console.log(`\n> Done: ${count}/${totalSlides} PNG rendered in ${elapsed}s`);

  await browser.close();
  server.close();
  console.log('> Cleanup complete');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
