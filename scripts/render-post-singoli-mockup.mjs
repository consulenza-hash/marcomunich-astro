#!/usr/bin/env node
/**
 * render-post-singoli-mockup.mjs
 *
 * Genera un mockup visivo dei post singoli: sfondo scuro gradiente placeholder
 * (al posto della foto Imagen 4 da generare dopo) + overlay testo forte grande.
 * Output: public/contenuti-social/immagini-post-singoli/post-NN-mockup.png
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const INPUT_FILE = path.join(PROJECT_ROOT, 'contenuti-social', 'post-singoli.md');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'public', 'contenuti-social', 'immagini-post-singoli');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Parse post-singoli.md
const text = fs.readFileSync(INPUT_FILE, 'utf8').replace(/\r\n/g, '\n');
const postRegex = /### POST (\d+)[^\n]*\n- \*\*Overlay:\*\* ([^\n]+)\n/g;
const posts = [];
let m;
while ((m = postRegex.exec(text)) !== null) {
  posts.push({ id: parseInt(m[1]), overlay: m[2].trim() });
}
console.log(`> Parsed ${posts.length} posts from ${path.basename(INPUT_FILE)}`);

// Palette alternata caldo/freddo, scura ma satura, con accento brand
// Alternanza positivo/negativo: caldo → freddo → caldo → freddo
const PALETTE = [
  { grad: 'radial-gradient(ellipse at 30% 30%, #ff6a1a 0%, #8a2a05 35%, #1a0802 100%)', accent: '#ffb380', tone: 'warm' },   // P1 arancione brand
  { grad: 'radial-gradient(ellipse at 70% 30%, #1a4aff 0%, #0a1a6a 35%, #02041a 100%)', accent: '#80a8ff', tone: 'cold' },   // P2 blu elettrico
  { grad: 'radial-gradient(ellipse at 30% 70%, #ff2a4a 0%, #6a0a1a 35%, #1a0208 100%)', accent: '#ff8098', tone: 'warm' },   // P3 rosso bordeaux
  { grad: 'radial-gradient(ellipse at 70% 70%, #00d4aa 0%, #0a4a38 35%, #021a12 100%)', accent: '#80e8c8', tone: 'cold' },   // P4 verde smeraldo
  { grad: 'radial-gradient(ellipse at 30% 30%, #ffaa00 0%, #8a5a00 35%, #1a0f00 100%)', accent: '#ffd480', tone: 'warm' },   // P5 oro ambra
  { grad: 'radial-gradient(ellipse at 70% 30%, #9a2aff 0%, #3a0a8a 35%, #0a021a 100%)', accent: '#c080ff', tone: 'cold' },   // P6 viola elettrico
  { grad: 'radial-gradient(ellipse at 30% 70%, #ff4a1a 0%, #8a1a02 35%, #1a0502 100%)', accent: '#ff9a70', tone: 'warm' },   // P7 arancio rosso
  { grad: 'radial-gradient(ellipse at 70% 70%, #00aaff 0%, #004a8a 35%, #02121a 100%)', accent: '#80d4ff', tone: 'cold' },   // P8 ciano elettrico
];

// Crea HTML con le 8 slide impilate
function buildHtml() {
  const slides = posts.map((p, i) => {
    const pal = PALETTE[i % PALETTE.length];
    return `
    <div class="slide" data-id="${p.id}">
      <div class="bg" style="background:${pal.grad}"></div>
      <div class="noise"></div>
      <div class="vignette"></div>
      <div class="accent-bar" style="background:${pal.accent}"></div>
      <div class="content">
        <div class="overlay-text">${p.overlay}</div>
      </div>
      <div class="signature">
        <span class="dot" style="background:${pal.accent}"></span>
        @marcomunich · Personal Branding Olistico
      </div>
    </div>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;700;900&display=swap" rel="stylesheet">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#222; font-family:'Inter',sans-serif; }
  .slide {
    width: 1080px;
    height: 1350px;
    position: relative;
    overflow: hidden;
    margin-bottom: 40px;
  }
  .bg {
    position: absolute;
    inset: 0;
    z-index: 1;
  }
  .noise {
    position: absolute;
    inset: 0;
    z-index: 2;
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.18 0'/></filter><rect width='300' height='300' filter='url(%23n)'/></svg>");
    opacity: 0.6;
    mix-blend-mode: overlay;
  }
  .vignette {
    position: absolute;
    inset: 0;
    z-index: 3;
    background:
      radial-gradient(ellipse at center, transparent 25%, rgba(0,0,0,0.55) 100%),
      linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.6) 100%);
  }
  .accent-bar {
    position: absolute;
    left: 90px;
    top: 50%;
    transform: translateY(-50%);
    width: 8px;
    height: 180px;
    z-index: 4;
    border-radius: 4px;
    box-shadow: 0 0 40px currentColor;
  }
  .content {
    position: absolute;
    inset: 0;
    z-index: 5;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 100px 120px;
    text-align: center;
  }
  .overlay-text {
    font-weight: 900;
    font-size: 102px;
    line-height: 1.05;
    color: #fff;
    letter-spacing: -0.025em;
    text-shadow: 0 4px 60px rgba(0,0,0,0.9), 0 2px 20px rgba(0,0,0,0.7);
    max-width: 880px;
  }
  .signature {
    position: absolute;
    bottom: 70px;
    left: 0;
    right: 0;
    z-index: 5;
    text-align: center;
    font-size: 28px;
    font-weight: 400;
    color: rgba(255,255,255,0.85);
    letter-spacing: 0.02em;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 14px;
  }
  .dot {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    box-shadow: 0 0 20px currentColor;
  }
</style>
</head>
<body>
${slides}
</body>
</html>`;
}

const html = buildHtml();
const tmpHtml = path.join(OUTPUT_DIR, '_mockup.html');
fs.writeFileSync(tmpHtml, html, 'utf8');
console.log(`> Wrote HTML: ${tmpHtml}`);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
await page.goto('file://' + tmpHtml.replace(/\\/g, '/'));
await page.waitForLoadState('networkidle');
// Aspetta font
await page.evaluate(() => document.fonts.ready);
await new Promise(r => setTimeout(r, 500));

const slides = await page.$$('.slide');
let count = 0;
for (const slide of slides) {
  const id = await slide.getAttribute('data-id');
  const pad = String(id).padStart(2, '0');
  const outPath = path.join(OUTPUT_DIR, `post-${pad}-mockup.png`);
  await slide.screenshot({ path: outPath });
  count++;
  console.log(`  ${count}/${slides.length} post-${pad}-mockup.png`);
}

await browser.close();
fs.unlinkSync(tmpHtml);
console.log(`> Done: ${count} mockup rendered in ${OUTPUT_DIR}`);
