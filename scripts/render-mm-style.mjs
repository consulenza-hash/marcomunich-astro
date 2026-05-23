#!/usr/bin/env node
/**
 * V1 layout + MM design system (nero/arancione/Inter)
 * Cover + Body + Signature
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'public', 'contenuti-social', 'mockup-mm-style');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const html = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700;1,900&display=swap" rel="stylesheet">
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: #555; }
body { display: flex; flex-direction: column; align-items: center; gap: 32px; padding: 32px; }
.slide { width: 1080px; height: 1350px; position: relative; overflow: hidden; }

:root {
  --mm-black: #0d0d0d;
  --mm-orange: #e85d00;
  --mm-white: #ffffff;
  --mm-gray: rgba(255,255,255,0.4);
  --mm-subtle: rgba(255,255,255,0.08);
}

/* ─── Shared elements ─── */
.mm-bg {
  position: absolute; inset: 0;
  background: var(--mm-black);
}
.mm-noise {
  position: absolute; inset: 0; z-index: 1;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0'/></filter><rect width='200' height='200' filter='url(%23n)'/></svg>");
  opacity: 0.5; mix-blend-mode: overlay;
}
.mm-footer-strip {
  position: absolute; bottom: 0; left: 0; right: 0;
  background: var(--mm-orange);
  padding: 20px 90px;
  font-family: 'Inter', sans-serif;
  font-size: 15px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--mm-black);
  display: flex; justify-content: space-between;
  z-index: 10;
}

/* Highlight marker: orange underline thick */
.hl {
  background: linear-gradient(180deg, transparent 60%, var(--mm-orange) 60%, var(--mm-orange) 90%, transparent 90%);
  padding: 0 4px;
}

/* ─── COVER ─── */
.mm-cover .mm-ghost-num {
  position: absolute; z-index: 1;
  font-family: 'Inter', sans-serif; font-size: 600px; font-weight: 900;
  color: rgba(255,255,255,0.025); line-height: 0.7;
  top: -80px; right: -40px;
  letter-spacing: -0.05em;
}
.mm-cover .mm-content {
  position: relative; z-index: 2;
  padding: 120px 90px 120px;
  height: 100%; display: flex; flex-direction: column; justify-content: center;
}
.mm-cover .mm-tag {
  font-family: 'Inter', sans-serif; font-size: 16px; font-weight: 700;
  letter-spacing: 0.25em; text-transform: uppercase;
  color: var(--mm-orange);
  margin-bottom: 44px;
}
.mm-cover .mm-title {
  font-family: 'Inter', sans-serif; font-size: 108px; font-weight: 900;
  line-height: 1.0; color: var(--mm-white);
  letter-spacing: -0.04em;
  max-width: 850px;
}
.mm-cover .mm-title .hl {
  color: var(--mm-white);
}
.mm-cover .mm-arrow {
  margin-top: 50px;
  font-family: 'Inter', sans-serif; font-size: 16px; font-weight: 500;
  color: var(--mm-gray); letter-spacing: 0.12em; text-transform: uppercase;
}
.mm-cover .mm-count {
  position: absolute; top: 90px; right: 90px; z-index: 3;
  font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 600;
  color: var(--mm-gray); letter-spacing: 0.08em;
}

/* ─── BODY ─── */
.mm-body .mm-body-card {
  position: absolute; z-index: 2;
  top: 130px; left: 70px; right: 70px; bottom: 150px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 20px;
  padding: 70px 65px;
  display: flex; flex-direction: column; justify-content: center;
}
.mm-body .mm-body-idx {
  position: absolute; z-index: 1;
  font-family: 'Inter', sans-serif; font-size: 350px; font-weight: 900;
  color: rgba(255,255,255,0.025); line-height: 0.7;
  top: 50px; right: 80px;
  letter-spacing: -0.05em;
}
.mm-body .mm-body-meta {
  position: absolute; top: 70px; left: 70px; right: 70px; z-index: 3;
  display: flex; justify-content: space-between; align-items: center;
}
.mm-body .mm-body-label {
  font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600;
  color: var(--mm-gray); letter-spacing: 0.18em; text-transform: uppercase;
  background: var(--mm-subtle); padding: 10px 20px; border-radius: 8px;
}
.mm-body .mm-body-text {
  font-family: 'Inter', sans-serif; font-size: 50px; font-weight: 500;
  line-height: 1.4; color: rgba(255,255,255,0.85);
  letter-spacing: -0.015em;
  max-width: 820px;
}
.mm-body .mm-body-text strong {
  font-weight: 800; color: var(--mm-white);
}
.mm-body .mm-body-text .hl {
  color: var(--mm-white);
}

/* ─── SIGNATURE ─── */
.mm-sig .mm-sig-content {
  position: relative; z-index: 2;
  padding: 90px;
  height: 100%; display: flex; flex-direction: column; justify-content: space-between;
}
.mm-sig .mm-sig-top {
  display: flex; justify-content: space-between; align-items: flex-start;
}
.mm-sig .mm-sig-tag {
  font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 700;
  letter-spacing: 0.2em; text-transform: uppercase; color: var(--mm-orange);
}
.mm-sig .mm-sig-count {
  font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 600;
  color: var(--mm-gray); letter-spacing: 0.08em;
}
.mm-sig .mm-sig-center {
  flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 40px;
}
.mm-sig .mm-sig-name {
  font-family: 'Inter', sans-serif; font-size: 140px; font-weight: 900;
  line-height: 0.9; color: var(--mm-white); letter-spacing: -0.05em;
}
.mm-sig .mm-sig-bar {
  height: 4px; width: 120px;
  background: var(--mm-orange);
}
.mm-sig .mm-sig-services {
  display: flex; flex-wrap: wrap; gap: 12px;
}
.mm-sig .mm-sig-pill {
  font-family: 'Inter', sans-serif; font-size: 16px; font-weight: 500;
  color: rgba(255,255,255,0.55);
  border: 1px solid rgba(255,255,255,0.1); padding: 12px 22px; border-radius: 100px;
}
.mm-sig .mm-sig-cta {
  font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 600;
  color: var(--mm-gray); letter-spacing: 0.1em;
  border-top: 1px solid rgba(255,255,255,0.08); padding-top: 20px;
}
</style>
</head>
<body>

<!-- COVER -->
<section class="slide mm-cover" data-id="mm-cover">
  <div class="mm-bg"></div><div class="mm-noise"></div>
  <div class="mm-ghost-num">5</div>
  <div class="mm-count">01 / 08</div>
  <div class="mm-content">
    <div class="mm-tag">5 segnali</div>
    <div class="mm-title">Il tuo sito potrebbe essere <span class="hl">di chiunque.</span></div>
    <div class="mm-arrow">→ Scorri per scoprirli</div>
  </div>
  <div class="mm-footer-strip">
    <span>Marco Munich</span>
    <span>Personal Branding Olistico</span>
  </div>
</section>

<!-- BODY -->
<section class="slide mm-body" data-id="mm-body">
  <div class="mm-bg"></div><div class="mm-noise"></div>
  <div class="mm-body-idx">1</div>
  <div class="mm-body-meta">
    <span class="mm-body-label">Segnale 01</span>
    <span class="mm-body-label">02 / 08</span>
  </div>
  <div class="mm-body-card">
    <div class="mm-body-text">Nella bio c'è scritto <span class="hl"><strong>"ti accompagno in un percorso di crescita personale"</strong></span> e la stessa frase è sul sito di altri duemila professionisti del tuo settore.</div>
  </div>
  <div class="mm-footer-strip">
    <span>Marco Munich</span>
    <span>5 segnali che il tuo sito potrebbe essere di chiunque</span>
  </div>
</section>

<!-- SIGNATURE -->
<section class="slide mm-sig" data-id="mm-sig">
  <div class="mm-bg"></div><div class="mm-noise"></div>
  <div class="mm-sig-content">
    <div class="mm-sig-top">
      <span class="mm-sig-tag">Per coach, counselor & operatori olistici</span>
      <span class="mm-sig-count">08 / 08</span>
    </div>
    <div class="mm-sig-center">
      <div class="mm-sig-name">Marco<br>Munich</div>
      <div class="mm-sig-bar"></div>
      <div class="mm-sig-services">
        <span class="mm-sig-pill">Personal Branding</span>
        <span class="mm-sig-pill">Siti Web</span>
        <span class="mm-sig-pill">Metterci la faccia</span>
        <span class="mm-sig-pill">Messaggio Autentico</span>
        <span class="mm-sig-pill">Video Autentici</span>
        <span class="mm-sig-pill">Lavorare Senza Sito</span>
      </div>
    </div>
    <div class="mm-sig-cta">marcomunich.com · @marcomunich.dev</div>
  </div>
  <div class="mm-footer-strip">
    <span>Segui per altri</span>
    <span>→</span>
  </div>
</section>

</body>
</html>`;

fs.writeFileSync(path.join(OUT, '_mm-style.html'), html);
console.log('> HTML written');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
await page.goto('file:///' + path.join(OUT, '_mm-style.html').replace(/\\/g, '/'));
await page.evaluate(() => document.fonts.ready);
await new Promise(r => setTimeout(r, 1500));

const slides = await page.$$('.slide');
let count = 0;
for (const slide of slides) {
  const id = await slide.getAttribute('data-id');
  await slide.screenshot({ path: path.join(OUT, `${id}.png`) });
  count++;
  console.log(`  ${count}/${slides.length} ${id}.png`);
}
await browser.close();
fs.unlinkSync(path.join(OUT, '_mm-style.html'));
console.log(`> Done: ${count} slides`);
