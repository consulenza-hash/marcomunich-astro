#!/usr/bin/env node
/**
 * render-caroselli-v2.mjs — Renderer nuovo stile mixed
 *
 * Layout per 8 slide:
 * 1 (cover):     foto Imagen + Inter 900 bold + barra arancione
 * 2 (testo):     sfondo crema + Instrument Serif italic + sidebar colore + highlight
 * 3 (immagine):  foto Imagen + testo Inter sovrapposto
 * 4 (testo):     crema
 * 5 (testo):     crema
 * 6 (immagine):  foto Imagen + testo Inter sovrapposto
 * 7 (testo):     crema
 * 8 (signature): sfondo colore pieno (rotante) + testo nero + servizi legacy
 *
 * Output: public/contenuti-social/immagini-caroselli/carosello-XX/slide-NN.png
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(PROJECT_ROOT, 'contenuti-social');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'public', 'contenuti-social', 'immagini-caroselli');

const PALETTE = [
  '#e85d00', '#3b82f6', '#22c55e', '#fbbf24', '#06b6d4', '#a855f7',
];

const MD_FILES = [
  'archivio-caroselli.md', 'mese-2-caroselli.md', 'mese-3.md',
  'mese-4.md', 'mese-5.md', 'mese-6.md',
];

// ─── PARSING ──────────────────────────────────────────────────────
function parseMarkdownFile(filepath) {
  const content = fs.readFileSync(filepath, 'utf8').replace(/\r\n/g, '\n');
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
    carousels.push({ num, title, slides });
  }
  return carousels;
}

function loadAllCarousels() {
  const all = [];
  for (const file of MD_FILES) {
    const filepath = path.join(CONTENT_DIR, file);
    if (!fs.existsSync(filepath)) continue;
    const carousels = parseMarkdownFile(filepath);
    console.log(`  ${file}: ${carousels.length} carousels`);
    all.push(...carousels);
  }
  const map = new Map();
  for (const c of all) map.set(c.num, c);
  return Array.from(map.values()).sort((a, b) => a.num - b.num);
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── IMAGE HELPERS ────────────────────────────────────────────────
function imgToBase64(cNum, name) {
  const p = path.join(OUTPUT_DIR, `carosello-${String(cNum).padStart(2, '0')}`, name);
  if (!fs.existsSync(p)) return '';
  return 'data:image/png;base64,' + fs.readFileSync(p).toString('base64');
}

// ─── FONT SIZE HELPERS ────────────────────────────────────────────
function coverFontSize(text) {
  const len = text.length;
  if (len < 25) return 120;
  if (len < 40) return 108;
  if (len < 60) return 88;
  if (len < 80) return 74;
  return 62;
}

function bodyFontSize(text) {
  const len = text.length;
  if (len < 80) return 54;
  if (len < 140) return 48;
  if (len < 200) return 42;
  if (len < 280) return 38;
  if (len < 380) return 34;
  return 30;
}

function imgBodyFontSize(text) {
  const len = text.length;
  if (len < 80) return 44;
  if (len < 140) return 38;
  if (len < 200) return 34;
  if (len < 280) return 30;
  return 26;
}

// ─── SLIDE GENERATORS ─────────────────────────────────────────────

function genCover(c, slide, total, accent) {
  const id = `c${String(c.num).padStart(2,'0')}s01`;
  const imgSrc = imgToBase64(c.num, 'img-cover.png');
  const size = coverFontSize(slide.text);
  const bgStyle = imgSrc
    ? `background-image:url('${imgSrc}');background-size:cover;background-position:center`
    : `background:#0d0d0d`;

  return `
<section class="slide" id="${id}">
  <div style="position:absolute;inset:0;${bgStyle}"></div>
  <div style="position:absolute;inset:0;z-index:1;background:linear-gradient(180deg,rgba(0,0,0,0.35) 0%,rgba(0,0,0,0.1) 30%,rgba(0,0,0,0.15) 55%,rgba(0,0,0,0.75) 100%)"></div>
  <div style="position:absolute;top:70px;left:80px;right:80px;z-index:3;display:flex;justify-content:space-between">
    <span class="chip">Marco Munich</span>
    <span class="chip">01 / ${String(total).padStart(2,'0')}</span>
  </div>
  <div style="position:relative;z-index:2;padding:80px;height:100%;display:flex;flex-direction:column;justify-content:flex-end">
    <div style="font-family:'Inter',sans-serif;font-size:${size}px;font-weight:900;line-height:1.0;color:#fff;letter-spacing:-0.04em;text-shadow:0 4px 60px rgba(0,0,0,0.6);margin-bottom:30px;max-width:900px">${escapeHtml(slide.text)}</div>
    <div style="font-family:'Inter',sans-serif;font-size:15px;font-weight:400;color:rgba(255,255,255,0.45);letter-spacing:0.1em;text-transform:uppercase;margin-top:10px">→ Scorri per scoprire</div>
  </div>
  <div style="position:absolute;bottom:0;left:0;right:0;height:6px;background:${accent};z-index:3"></div>
</section>`;
}

function genTextSlide(c, slide, idx, total, accent) {
  const id = `c${String(c.num).padStart(2,'0')}s${String(slide.num).padStart(2,'0')}`;
  const size = bodyFontSize(slide.text);
  const bodyIdx = idx; // 1-based slide index for display

  return `
<section class="slide" id="${id}" style="background:#F5F0E8">
  <div style="position:absolute;top:0;left:0;bottom:0;width:8px;background:${accent}"></div>
  <div style="position:absolute;top:70px;left:80px;right:80px;display:flex;justify-content:space-between;align-items:center">
    <span style="font-family:'Inter',sans-serif;font-size:14px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:${accent}">${escapeHtml(c.title)}</span>
    <span style="font-family:'Inter',sans-serif;font-size:14px;font-weight:500;color:rgba(26,20,16,0.3);letter-spacing:0.1em">${String(slide.num).padStart(2,'0')} / ${String(total).padStart(2,'0')}</span>
  </div>
  <div style="position:absolute;top:30px;right:60px;font-family:'Instrument Serif',serif;font-size:280px;font-weight:400;color:rgba(0,0,0,0.04);line-height:0.7;font-style:italic">${bodyIdx}</div>
  <div style="position:absolute;top:160px;left:80px;right:80px;bottom:80px;display:flex;align-items:center">
    <div style="font-family:'Instrument Serif',serif;font-size:${size}px;font-weight:400;line-height:1.45;color:#2a2218;font-style:italic;max-width:820px">${escapeHtml(slide.text)}</div>
  </div>
</section>`;
}

function genImgSlide(c, slide, idx, total, accent, imgName) {
  const id = `c${String(c.num).padStart(2,'0')}s${String(slide.num).padStart(2,'0')}`;
  const imgSrc = imgToBase64(c.num, imgName);
  const size = imgBodyFontSize(slide.text);
  const bgStyle = imgSrc
    ? `background-image:url('${imgSrc}');background-size:cover;background-position:center`
    : `background:#1a1a1a`;

  return `
<section class="slide" id="${id}">
  <div style="position:absolute;inset:0;${bgStyle}"></div>
  <div style="position:absolute;inset:0;z-index:1;background:linear-gradient(180deg,rgba(0,0,0,0.2) 0%,rgba(0,0,0,0.05) 30%,rgba(0,0,0,0.1) 50%,rgba(0,0,0,0.7) 100%)"></div>
  <div style="position:absolute;top:70px;left:80px;right:80px;z-index:3;display:flex;justify-content:space-between">
    <span class="chip">${escapeHtml(c.title)}</span>
    <span class="chip">${String(slide.num).padStart(2,'0')} / ${String(total).padStart(2,'0')}</span>
  </div>
  <div style="position:relative;z-index:2;padding:80px;height:100%;display:flex;flex-direction:column;justify-content:flex-end">
    <div style="font-family:'Inter',sans-serif;font-size:${size}px;font-weight:500;line-height:1.45;color:rgba(255,255,255,0.9);text-shadow:0 2px 30px rgba(0,0,0,0.5);max-width:820px">${escapeHtml(slide.text)}</div>
  </div>
  <div style="position:absolute;bottom:0;left:0;right:0;height:6px;background:${accent};z-index:3"></div>
</section>`;
}

function genSignature(c, total, accent) {
  const id = `c${String(c.num).padStart(2,'0')}s${String(total).padStart(2,'0')}`;

  return `
<section class="slide" id="${id}" style="background:${accent}">
  <div style="padding:110px 100px;height:100%;display:flex;flex-direction:column;justify-content:space-between">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:32px">
      <span style="font-family:'Inter',sans-serif;font-size:20px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:rgba(13,13,13,0.55)">Segui per altri</span>
      <span style="font-family:'Inter',sans-serif;font-size:20px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:rgba(13,13,13,0.55)"><span style="color:#0d0d0d;font-weight:800">${String(total).padStart(2,'0')}</span> / ${String(total).padStart(2,'0')}</span>
    </div>
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center">
      <div style="font-family:'Inter',sans-serif;font-size:22px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#0d0d0d;margin-bottom:36px">Per coach, counselor &amp; operatori olistici</div>
      <div style="font-family:'Inter',sans-serif;font-size:148px;font-weight:900;line-height:0.88;letter-spacing:-0.045em;color:#0d0d0d">Marco<br>Munich</div>
      <div style="margin-top:44px;display:flex;flex-direction:column;gap:26px;max-width:860px">
        <div>
          <div style="font-family:'Inter',sans-serif;font-size:17px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:#0d0d0d;margin-bottom:10px;padding-bottom:8px;border-bottom:2px solid rgba(13,13,13,0.25)">Consulenza 1-a-1</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <div class="svc"><span class="svc-n">01</span><span>Personal Branding Olistico</span></div>
            <div class="svc"><span class="svc-n">02</span><span>Sviluppo Siti Web</span></div>
          </div>
        </div>
        <div>
          <div style="font-family:'Inter',sans-serif;font-size:17px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:#0d0d0d;margin-bottom:10px;padding-bottom:8px;border-bottom:2px solid rgba(13,13,13,0.25)">Percorsi Online</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <div class="svc"><span class="svc-n">03</span><span>Metterci la faccia online</span></div>
            <div class="svc"><span class="svc-n">04</span><span>Creazione del Messaggio Autentico</span></div>
            <div class="svc"><span class="svc-n">05</span><span>Creazione Video Autentici</span></div>
            <div class="svc"><span class="svc-n">06</span><span>Lavorare Senza Sito Web</span></div>
          </div>
        </div>
      </div>
      <div style="font-family:'Inter',sans-serif;font-size:22px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#0d0d0d;margin-top:36px;padding-top:24px;border-top:3px solid #0d0d0d;max-width:860px">→ marcomunich.com · @marcomunich1983</div>
    </div>
    <div></div>
  </div>
</section>`;
}

// ─── HTML BUILDER ─────────────────────────────────────────────────

function buildHTML(carousels) {
  let slidesHTML = '';

  for (const c of carousels) {
    const total = c.slides.length;
    const accent = PALETTE[(c.num - 1) % PALETTE.length];

    for (let i = 0; i < c.slides.length; i++) {
      const slide = c.slides[i];
      const isFirst = i === 0;
      const isLast = i === total - 1;
      const isSignature = isLast && /@marcomunich/i.test(slide.text);

      if (isFirst) {
        slidesHTML += genCover(c, slide, total, accent);
      } else if (isSignature) {
        slidesHTML += genSignature(c, total, accent);
      } else if (i === 2) { // slide 3 = image
        slidesHTML += genImgSlide(c, slide, i, total, accent, 'img-s3.png');
      } else if (i === 5) { // slide 6 = image
        slidesHTML += genImgSlide(c, slide, i, total, accent, 'img-s6.png');
      } else {
        slidesHTML += genTextSlide(c, slide, i, total, accent);
      }
    }
  }

  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #2a2a2a; }
  body {
    font-family: 'Inter', system-ui, sans-serif;
    display: flex; flex-direction: column; align-items: center;
    gap: 24px; padding: 24px;
    -webkit-font-smoothing: antialiased;
  }
  .slide {
    width: 1080px; height: 1350px;
    position: relative; overflow: hidden;
  }
  .chip {
    font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 500;
    color: rgba(255,255,255,0.7); letter-spacing: 0.12em; text-transform: uppercase;
    background: rgba(0,0,0,0.3); backdrop-filter: blur(10px);
    padding: 10px 20px; border-radius: 6px;
    border: 1px solid rgba(255,255,255,0.1);
    max-width: 500px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .svc {
    display: flex; align-items: baseline; gap: 18px;
    font-family: 'Inter', sans-serif; font-size: 26px; font-weight: 700;
    color: #0d0d0d; line-height: 1.3; letter-spacing: -0.01em;
  }
  .svc-n {
    font-weight: 400; font-size: 20px; color: rgba(13,13,13,0.55); min-width: 38px;
  }
</style>
</head>
<body>
${slidesHTML}
</body>
</html>`;
}

// ─── MAIN ─────────────────────────────────────────────────────────

async function main() {
  // --only 2,3,5  →  render solo quei numeri
  const onlyArg = process.argv.find(a => a.startsWith('--only=')) || process.argv[process.argv.indexOf('--only') + 1];
  const onlyIds = onlyArg && !onlyArg.startsWith('--')
    ? new Set(onlyArg.split(',').map(Number))
    : null;

  console.log('> Parsing markdown files…');
  let carousels = loadAllCarousels();
  if (onlyIds) {
    carousels = carousels.filter(c => onlyIds.has(c.num));
    console.log(`> Filtered to carousel(s): ${[...onlyIds].join(', ')}`);
  }
  const totalSlides = carousels.reduce((s, c) => s + c.slides.length, 0);
  console.log(`> Loaded ${carousels.length} carousels, ${totalSlides} total slides\n`);

  console.log('> Generating HTML…');
  const html = buildHTML(carousels);
  const htmlPath = path.join(CONTENT_DIR, 'all-carousels-renderer-v2.html');
  fs.writeFileSync(htmlPath, html);
  console.log(`  written to ${htmlPath} (${(html.length / 1024 / 1024).toFixed(1)} MB)\n`);

  console.log('> Preparing output directories…');
  for (const c of carousels) {
    const dir = path.join(OUTPUT_DIR, `carosello-${String(c.num).padStart(2, '0')}`);
    fs.mkdirSync(dir, { recursive: true });
  }

  console.log('> Launching Chromium…');
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 1400 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();

  // Load via file protocol (HTML may be large with embedded images)
  await page.goto('file:///' + htmlPath.replace(/\\/g, '/'), { timeout: 120000 });

  console.log('> Waiting for fonts…');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(3000);

  console.log('> Rendering slides…');
  const slides = await page.$$('.slide');
  const startTime = Date.now();
  let count = 0;

  for (const slide of slides) {
    const slideId = await slide.getAttribute('id');
    // Parse carousel and slide number from id like c01s02
    const match = slideId.match(/c(\d+)s(\d+)/);
    if (!match) continue;
    const cNum = parseInt(match[1], 10);
    const sNum = parseInt(match[2], 10);
    const outPath = path.join(
      OUTPUT_DIR,
      `carosello-${String(cNum).padStart(2, '0')}`,
      `slide-${String(sNum).padStart(2, '0')}.png`
    );
    await slide.screenshot({ path: outPath });
    count++;
    if (count % 25 === 0 || count === slides.length) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      console.log(`  ${count}/${slides.length} (${elapsed}s)`);
    }
  }

  await browser.close();
  console.log(`\n> Done: ${count}/${slides.length} slides rendered`);

  // Cleanup HTML
  fs.unlinkSync(htmlPath);
  console.log('> Cleanup complete');
}

main().catch(e => { console.error(e); process.exit(1); });
