#!/usr/bin/env node
/**
 * render-3-direzioni.mjs — 3 mockup visivi per confronto stile caroselli
 * Genera 9 slide: 3 slide (cover, body, signature) × 3 direzioni
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'public', 'contenuti-social', 'mockup-direzioni');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const html = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Inter:wght@300;400;500;700;900&family=Bricolage+Grotesque:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: #888; }
body {
  display: flex; flex-direction: column; align-items: center;
  gap: 32px; padding: 32px;
}
.label {
  font-family: 'Inter', sans-serif; font-size: 28px; font-weight: 700;
  color: #fff; background: #333; padding: 12px 24px; border-radius: 8px;
  margin-top: 40px; letter-spacing: 0.02em;
}
.slide {
  width: 1080px; height: 1350px;
  position: relative; overflow: hidden;
}

/* ═══════════════════════════════════════════════════
   DIREZIONE 1 — EDITORIALE CARTA
   ═══════════════════════════════════════════════════ */
.ed { background: #F2EDE4; color: #1a1a1a; }
.ed .ed-top {
  padding: 90px 100px 0;
  display: flex; justify-content: space-between; align-items: baseline;
}
.ed .ed-brand {
  font-family: 'Cormorant', serif; font-size: 22px; font-weight: 600;
  color: #8a7a65; letter-spacing: 0.15em; text-transform: uppercase;
}
.ed .ed-num {
  font-family: 'Cormorant', serif; font-size: 20px; font-weight: 400;
  color: #8a7a65; font-style: italic;
}
.ed .ed-rule {
  margin: 40px 100px; height: 1px; background: #c4b8a4;
}
.ed .ed-content {
  padding: 0 100px;
  flex: 1; display: flex; flex-direction: column; justify-content: center;
  position: absolute; top: 200px; bottom: 200px; left: 0; right: 0;
}
.ed .ed-cover-title {
  font-family: 'Cormorant', serif; font-size: 120px; font-weight: 700;
  line-height: 1.0; color: #1a1a1a; letter-spacing: -0.02em;
}
.ed .ed-cover-title em {
  font-style: italic; color: #8a5a30;
}
.ed .ed-body-text {
  font-family: 'Cormorant', serif; font-size: 52px; font-weight: 400;
  line-height: 1.45; color: #2a2a2a; font-style: italic;
}
.ed .ed-footer {
  position: absolute; bottom: 80px; left: 100px; right: 100px;
  border-top: 1px solid #c4b8a4; padding-top: 20px;
  font-family: 'Cormorant', serif; font-size: 18px; font-weight: 600;
  color: #8a7a65; letter-spacing: 0.1em; text-transform: uppercase;
}
/* Signature editoriale */
.ed-sig { background: #1a1a1a; color: #F2EDE4; }
.ed-sig .ed-top .ed-brand, .ed-sig .ed-top .ed-num { color: #8a7a65; }
.ed-sig .ed-rule { background: #3a3a3a; }
.ed-sig .ed-sig-name {
  font-family: 'Cormorant', serif; font-size: 140px; font-weight: 700;
  line-height: 0.95; color: #F2EDE4; letter-spacing: -0.03em;
  padding: 0 100px;
  position: absolute; top: 250px;
}
.ed-sig .ed-sig-tag {
  font-family: 'Cormorant', serif; font-size: 26px; font-weight: 600;
  color: #8a7a65; letter-spacing: 0.15em; text-transform: uppercase;
  position: absolute; top: 200px; left: 100px;
}
.ed-sig .ed-sig-services {
  position: absolute; bottom: 120px; left: 100px; right: 100px;
  border-top: 1px solid #3a3a3a; padding-top: 30px;
}
.ed-sig .ed-sig-services p {
  font-family: 'Cormorant', serif; font-size: 24px; font-weight: 400;
  color: #8a7a65; line-height: 2; font-style: italic;
}
.ed-sig .ed-footer { border-top-color: #3a3a3a; }

/* ═══════════════════════════════════════════════════
   DIREZIONE 2 — FOTOGRAFIA (simulata con gradiente texture)
   ═══════════════════════════════════════════════════ */
.ph {
  background: linear-gradient(160deg, #2a3a4a 0%, #1a2a3a 40%, #0a1520 100%);
  color: #fff;
}
.ph .ph-grain {
  position: absolute; inset: 0; z-index: 1;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0'/></filter><rect width='400' height='400' filter='url(%23n)'/></svg>");
  opacity: 0.8; mix-blend-mode: overlay;
}
.ph .ph-light {
  position: absolute; z-index: 1;
  width: 600px; height: 600px; border-radius: 50%;
  background: radial-gradient(circle, rgba(200,180,140,0.15) 0%, transparent 70%);
  top: -100px; right: -100px;
}
.ph .ph-content {
  position: absolute; inset: 0; z-index: 2;
  padding: 90px 100px;
  display: flex; flex-direction: column; justify-content: space-between;
}
.ph .ph-meta {
  display: flex; justify-content: space-between; align-items: center;
  font-family: 'Inter', sans-serif; font-size: 16px; font-weight: 300;
  color: rgba(255,255,255,0.4); letter-spacing: 0.15em; text-transform: uppercase;
}
.ph .ph-cover-title {
  font-family: 'Inter', sans-serif; font-size: 88px; font-weight: 300;
  line-height: 1.1; color: #fff; letter-spacing: -0.02em;
  max-width: 800px;
}
.ph .ph-cover-title strong {
  font-weight: 700;
}
.ph .ph-body-text {
  font-family: 'Inter', sans-serif; font-size: 46px; font-weight: 300;
  line-height: 1.5; color: rgba(255,255,255,0.85); letter-spacing: -0.01em;
  max-width: 820px;
}
.ph .ph-body-text strong { font-weight: 700; color: #fff; }
.ph .ph-hint {
  font-family: 'Inter', sans-serif; font-size: 16px; font-weight: 300;
  color: rgba(255,255,255,0.35); letter-spacing: 0.1em;
}
/* Signature foto */
.ph-sig {
  background: linear-gradient(160deg, #3a2a1a 0%, #2a1a0a 50%, #1a0f05 100%);
}
.ph-sig .ph-sig-name {
  font-family: 'Inter', sans-serif; font-size: 120px; font-weight: 300;
  line-height: 1.0; color: #fff; letter-spacing: -0.03em;
}
.ph-sig .ph-sig-name strong { font-weight: 700; }
.ph-sig .ph-sig-tag {
  font-family: 'Inter', sans-serif; font-size: 18px; font-weight: 300;
  color: rgba(255,255,255,0.4); letter-spacing: 0.18em; text-transform: uppercase;
}
.ph-sig .ph-sig-list {
  font-family: 'Inter', sans-serif; font-size: 22px; font-weight: 300;
  color: rgba(255,255,255,0.5); line-height: 2.2;
}

/* ═══════════════════════════════════════════════════
   DIREZIONE 3 — COLORE PIENO
   ═══════════════════════════════════════════════════ */
.cp-1 { background: #C17817; } /* senape dorato */
.cp-2 { background: #2D5F4A; } /* verde bosco */
.cp-sig { background: #B5432A; } /* terracotta */
.cp .cp-content {
  padding: 90px 100px;
  display: flex; flex-direction: column; justify-content: space-between;
  height: 100%;
}
.cp .cp-meta {
  display: flex; justify-content: space-between; align-items: center;
  font-family: 'Bricolage Grotesque', sans-serif; font-size: 18px; font-weight: 600;
  color: rgba(0,0,0,0.35); letter-spacing: 0.08em; text-transform: uppercase;
}
.cp-1 .cp-meta, .cp-sig .cp-meta { color: rgba(255,255,255,0.4); }
.cp .cp-cover-title {
  font-family: 'Bricolage Grotesque', sans-serif; font-size: 108px; font-weight: 800;
  line-height: 1.0; letter-spacing: -0.03em;
  max-width: 850px;
}
.cp-1 .cp-cover-title { color: #fff; }
.cp-2 .cp-cover-title { color: #E8E0D0; }
.cp .cp-body-text {
  font-family: 'Bricolage Grotesque', sans-serif; font-size: 50px; font-weight: 400;
  line-height: 1.4; letter-spacing: -0.01em; max-width: 820px;
}
.cp-2 .cp-body-text { color: #E8E0D0; }
.cp .cp-hint {
  font-family: 'Bricolage Grotesque', sans-serif; font-size: 18px; font-weight: 600;
  letter-spacing: 0.08em; text-transform: uppercase;
}
.cp-1 .cp-hint { color: rgba(255,255,255,0.4); }
.cp-2 .cp-hint { color: rgba(0,0,0,0.35); }
/* Signature colore */
.cp-sig .cp-sig-name {
  font-family: 'Bricolage Grotesque', sans-serif; font-size: 140px; font-weight: 800;
  line-height: 0.95; color: #fff; letter-spacing: -0.04em;
}
.cp-sig .cp-sig-tag {
  font-family: 'Bricolage Grotesque', sans-serif; font-size: 20px; font-weight: 600;
  color: rgba(255,255,255,0.5); letter-spacing: 0.15em; text-transform: uppercase;
}
.cp-sig .cp-sig-list {
  font-family: 'Bricolage Grotesque', sans-serif; font-size: 24px; font-weight: 400;
  color: rgba(255,255,255,0.6); line-height: 2.2;
}
.cp-sig .cp-cta {
  font-family: 'Bricolage Grotesque', sans-serif; font-size: 20px; font-weight: 700;
  color: #fff; letter-spacing: 0.06em; text-transform: uppercase;
  border-top: 2px solid rgba(255,255,255,0.3); padding-top: 20px;
}
</style>
</head>
<body>

<!-- ═══ DIREZIONE 1: EDITORIALE CARTA ═══ -->
<div class="label">DIREZIONE 1 — EDITORIALE CARTA</div>

<!-- Cover -->
<section class="slide ed" data-id="ed-cover">
  <div class="ed-top">
    <span class="ed-brand">Marco Munich</span>
    <span class="ed-num">01 / 08</span>
  </div>
  <div class="ed-rule"></div>
  <div class="ed-content">
    <div class="ed-cover-title">5 segnali che il tuo sito potrebbe essere <em>di chiunque.</em></div>
  </div>
  <div class="ed-footer">Scorri per scoprirli</div>
</section>

<!-- Body -->
<section class="slide ed" data-id="ed-body">
  <div class="ed-top">
    <span class="ed-brand">Segnale 01</span>
    <span class="ed-num">02 / 08</span>
  </div>
  <div class="ed-rule"></div>
  <div class="ed-content">
    <div class="ed-body-text">Nella bio c'è scritto "ti accompagno in un percorso di crescita personale" e la stessa frase è sul sito di altri duemila professionisti del tuo settore.</div>
  </div>
  <div class="ed-footer">Personal Branding Olistico</div>
</section>

<!-- Signature -->
<section class="slide ed-sig ed" data-id="ed-sig">
  <div class="ed-top">
    <span class="ed-brand">Segui per altri</span>
    <span class="ed-num">08 / 08</span>
  </div>
  <div class="ed-rule"></div>
  <div class="ed-sig-tag">Per coach, counselor & operatori olistici</div>
  <div class="ed-sig-name">Marco<br>Munich</div>
  <div class="ed-sig-services">
    <p>Personal Branding Olistico · Sviluppo Siti Web</p>
    <p>Metterci la faccia online · Creazione del Messaggio Autentico</p>
    <p>Creazione Video Autentici · Lavorare Senza Sito Web</p>
  </div>
  <div class="ed-footer" style="color:#8a7a65">marcomunich.com · @marcomunich.dev</div>
</section>

<!-- ═══ DIREZIONE 2: FOTOGRAFIA ═══ -->
<div class="label">DIREZIONE 2 — FOTOGRAFIA + LUCE</div>

<!-- Cover -->
<section class="slide ph" data-id="ph-cover">
  <div class="ph-grain"></div>
  <div class="ph-light"></div>
  <div class="ph-content">
    <div class="ph-meta">
      <span>Marco Munich</span>
      <span>01 / 08</span>
    </div>
    <div class="ph-cover-title">5 segnali che il tuo sito potrebbe essere <strong>di chiunque.</strong></div>
    <div class="ph-hint">→ Scorri per scoprirli</div>
  </div>
</section>

<!-- Body -->
<section class="slide ph" style="background: linear-gradient(160deg, #1a2a2a 0%, #0a1a1a 50%, #050f0f 100%)" data-id="ph-body">
  <div class="ph-grain"></div>
  <div class="ph-light" style="top:auto;bottom:-100px;left:-100px;right:auto;background:radial-gradient(circle,rgba(140,180,160,0.12) 0%,transparent 70%)"></div>
  <div class="ph-content">
    <div class="ph-meta">
      <span>Segnale 01 · Bio generica</span>
      <span>02 / 08</span>
    </div>
    <div style="flex:1;display:flex;align-items:center">
      <div class="ph-body-text">Nella bio c'è scritto <strong>"ti accompagno in un percorso di crescita personale"</strong> e la stessa frase è sul sito di altri duemila professionisti del tuo settore.</div>
    </div>
    <div></div>
  </div>
</section>

<!-- Signature -->
<section class="slide ph ph-sig" data-id="ph-sig">
  <div class="ph-grain"></div>
  <div class="ph-light" style="background:radial-gradient(circle,rgba(200,160,100,0.12) 0%,transparent 70%)"></div>
  <div class="ph-content">
    <div class="ph-meta">
      <span>Segui per altri</span>
      <span>08 / 08</span>
    </div>
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:40px">
      <div class="ph-sig-tag">Per coach, counselor & operatori olistici</div>
      <div class="ph-sig-name">Marco<br><strong>Munich</strong></div>
      <div class="ph-sig-list">
        Personal Branding Olistico<br>
        Sviluppo Siti Web<br>
        Metterci la faccia online<br>
        Creazione del Messaggio Autentico<br>
        Creazione Video Autentici<br>
        Lavorare Senza Sito Web
      </div>
    </div>
    <div class="ph-hint">marcomunich.com · @marcomunich.dev</div>
  </div>
</section>

<!-- ═══ DIREZIONE 3: COLORE PIENO ═══ -->
<div class="label">DIREZIONE 3 — COLORE PIENO</div>

<!-- Cover -->
<section class="slide cp cp-1" data-id="cp-cover">
  <div class="cp-content">
    <div class="cp-meta">
      <span>Marco Munich</span>
      <span>01 / 08</span>
    </div>
    <div style="flex:1;display:flex;align-items:center">
      <div class="cp-cover-title">5 segnali che il tuo sito potrebbe essere di chiunque.</div>
    </div>
    <div class="cp-hint">→ Scorri per scoprirli</div>
  </div>
</section>

<!-- Body -->
<section class="slide cp cp-2" data-id="cp-body">
  <div class="cp-content">
    <div class="cp-meta">
      <span>Segnale 01 · Bio generica</span>
      <span>02 / 08</span>
    </div>
    <div style="flex:1;display:flex;align-items:center">
      <div class="cp-body-text">Nella bio c'è scritto "ti accompagno in un percorso di crescita personale" e la stessa frase è sul sito di altri duemila professionisti del tuo settore.</div>
    </div>
    <div></div>
  </div>
</section>

<!-- Signature -->
<section class="slide cp cp-sig" data-id="cp-sig">
  <div class="cp-content">
    <div class="cp-meta">
      <span>Segui per altri</span>
      <span>08 / 08</span>
    </div>
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:32px">
      <div class="cp-sig-tag">Per coach, counselor & operatori olistici</div>
      <div class="cp-sig-name">Marco<br>Munich</div>
      <div class="cp-sig-list">
        Personal Branding Olistico<br>
        Sviluppo Siti Web<br>
        Metterci la faccia online<br>
        Creazione del Messaggio Autentico<br>
        Creazione Video Autentici<br>
        Lavorare Senza Sito Web
      </div>
    </div>
    <div class="cp-cta">marcomunich.com · @marcomunich.dev</div>
  </div>
</section>

</body>
</html>`;

fs.writeFileSync(path.join(OUT, '_3-direzioni.html'), html);
console.log('> HTML written');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
await page.goto('file:///' + path.join(OUT, '_3-direzioni.html').replace(/\\/g, '/'));
await page.evaluate(() => document.fonts.ready);
await new Promise(r => setTimeout(r, 1000));

const slides = await page.$$('.slide');
let count = 0;
for (const slide of slides) {
  const id = await slide.getAttribute('data-id');
  await slide.screenshot({ path: path.join(OUT, `${id}.png`) });
  count++;
  console.log(`  ${count}/${slides.length} ${id}.png`);
}
await browser.close();
fs.unlinkSync(path.join(OUT, '_3-direzioni.html'));
console.log(`> Done: ${count} mockups`);
