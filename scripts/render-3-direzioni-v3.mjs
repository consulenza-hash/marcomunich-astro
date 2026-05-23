#!/usr/bin/env node
/**
 * render-3-direzioni-v3.mjs — Round 3
 * D: Collage/Cutout — layered paper, torn edges, mixed media
 * E: Retro Darkroom — grain heavy, light leaks, analog photo feel
 * F: Neon Wireframe — blueprint grid, neon accents, technical drawing aesthetic
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'public', 'contenuti-social', 'mockup-direzioni-v3');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const html = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Instrument+Serif:ital@0;1&family=Dela+Gothic+One&family=DM+Sans:ital,wght@0,400;0,500;0,700;1,400&family=IBM+Plex+Mono:wght@300;400;500;700&family=Darker+Grotesque:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: #555; }
body { display: flex; flex-direction: column; align-items: center; gap: 32px; padding: 32px; }
.label {
  font-family: 'IBM Plex Mono', monospace; font-size: 24px; font-weight: 700;
  color: #fff; background: #111; padding: 14px 28px; border-radius: 0;
  margin-top: 48px; letter-spacing: 0.05em; text-transform: uppercase;
  border: 2px solid #444;
}
.slide { width: 1080px; height: 1350px; position: relative; overflow: hidden; }

/* ═══════════════════════════════════════════════════════════════
   D — COLLAGE / CUTOUT / MIXED MEDIA
   Layered paper textures, rotated elements, sticker aesthetic,
   handmade feel, anti-digital
   ═══════════════════════════════════════════════════════════════ */

.d-slide {
  background: #E8DDD0;
  font-family: 'DM Sans', sans-serif;
}
.d-slide .d-paper-bg {
  position: absolute; inset: 0;
  background:
    url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='p'><feTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='5' seed='2'/><feColorMatrix values='0 0 0 0 0.85 0 0 0 0 0.82 0 0 0 0 0.76 0 0 0 1 0'/></filter><rect width='200' height='200' filter='url(%23p)'/></svg>");
  opacity: 0.4;
}

/* D cover */
.d-cover .d-tape {
  position: absolute; width: 120px; height: 40px;
  background: rgba(200,180,120,0.5); transform: rotate(-3deg);
  top: 80px; left: 80px; z-index: 3;
}
.d-cover .d-black-card {
  position: absolute; z-index: 2;
  background: #1a1410; color: #F2EDE4;
  width: 700px; padding: 60px 55px;
  top: 160px; left: 60px;
  transform: rotate(-1.5deg);
  box-shadow: 8px 12px 40px rgba(0,0,0,0.25);
}
.d-cover .d-black-card h1 {
  font-family: 'Instrument Serif', serif; font-size: 92px; font-weight: 400;
  line-height: 1.05; font-style: italic;
}
.d-cover .d-orange-card {
  position: absolute; z-index: 1;
  background: #D4652A; color: #fff;
  width: 520px; padding: 50px;
  bottom: 140px; right: 50px;
  transform: rotate(2deg);
  box-shadow: 6px 8px 30px rgba(0,0,0,0.2);
}
.d-cover .d-orange-card p {
  font-size: 36px; font-weight: 700; line-height: 1.3;
  text-transform: uppercase; letter-spacing: 0.05em;
}
.d-cover .d-sticker {
  position: absolute; z-index: 4;
  background: #fff; color: #1a1410;
  width: 160px; height: 160px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  text-align: center; font-size: 18px; font-weight: 700;
  letter-spacing: 0.05em; text-transform: uppercase;
  line-height: 1.2;
  top: 140px; right: 100px;
  transform: rotate(12deg);
  box-shadow: 4px 6px 20px rgba(0,0,0,0.15);
}
.d-cover .d-footer-strip {
  position: absolute; bottom: 0; left: 0; right: 0;
  background: #1a1410; color: rgba(255,255,255,0.5);
  padding: 20px 80px;
  font-size: 16px; font-weight: 500; letter-spacing: 0.15em; text-transform: uppercase;
  display: flex; justify-content: space-between;
  z-index: 5;
}

/* D body */
.d-body .d-num-stamp {
  position: absolute; z-index: 3;
  top: 60px; right: 70px;
  width: 140px; height: 140px;
  border: 6px solid #D4652A; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Instrument Serif', serif; font-size: 80px; font-weight: 400;
  color: #D4652A; font-style: italic;
  transform: rotate(-8deg);
}
.d-body .d-text-card {
  position: absolute; z-index: 2;
  background: #fff;
  top: 180px; left: 70px; right: 70px; bottom: 200px;
  padding: 70px 60px;
  box-shadow: 4px 8px 30px rgba(0,0,0,0.12);
  transform: rotate(0.5deg);
  display: flex; align-items: center;
}
.d-body .d-text-card p {
  font-family: 'Instrument Serif', serif; font-size: 50px; font-weight: 400;
  line-height: 1.45; color: #2a2218; font-style: italic;
}
.d-body .d-text-card p strong {
  font-style: normal; font-weight: 700;
  background: #FFF0C0; padding: 2px 8px;
}
.d-body .d-label-strip {
  position: absolute; bottom: 60px; left: 70px;
  background: #1a1410; color: #F2EDE4;
  padding: 14px 28px;
  font-size: 15px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase;
  z-index: 3;
}

/* D signature */
.d-sig .d-sig-black {
  position: absolute; z-index: 2;
  background: #1a1410; color: #F2EDE4;
  top: 80px; left: 50px; right: 300px; bottom: 350px;
  padding: 60px;
  transform: rotate(-1deg);
  box-shadow: 8px 12px 40px rgba(0,0,0,0.3);
}
.d-sig .d-sig-name {
  font-family: 'Instrument Serif', serif; font-size: 110px; font-weight: 400;
  line-height: 0.95; font-style: italic;
}
.d-sig .d-sig-tag {
  font-size: 15px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase;
  color: rgba(255,255,255,0.4); margin-bottom: 20px;
}
.d-sig .d-sig-services {
  position: absolute; z-index: 1;
  background: #D4652A; color: #fff;
  bottom: 60px; left: 120px; right: 60px;
  padding: 45px 50px;
  transform: rotate(1.5deg);
  box-shadow: 6px 8px 30px rgba(0,0,0,0.2);
}
.d-sig .d-sig-services p {
  font-size: 22px; font-weight: 500; line-height: 2;
}
.d-sig .d-sig-url {
  position: absolute; z-index: 3;
  bottom: 320px; right: 70px;
  background: #fff; color: #1a1410;
  padding: 16px 28px; transform: rotate(3deg);
  font-size: 18px; font-weight: 700; letter-spacing: 0.05em;
  box-shadow: 3px 4px 15px rgba(0,0,0,0.12);
}

/* ═══════════════════════════════════════════════════════════════
   E — RETRO DARKROOM / ANALOG
   Heavy grain, warm tones, light leaks, film borders,
   analog imperfection, dark and moody
   ═══════════════════════════════════════════════════════════════ */

.e-slide {
  background: #0f0d0a;
  font-family: 'Darker Grotesque', sans-serif;
}
.e-slide .e-grain {
  position: absolute; inset: 0; z-index: 1;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='250' height='250'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='4' seed='5'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 0.95 0 0 0 0 0.85 0 0 0 0.3 0'/></filter><rect width='250' height='250' filter='url(%23g)'/></svg>");
  mix-blend-mode: overlay; opacity: 0.9;
}
.e-slide .e-leak {
  position: absolute; z-index: 1;
  width: 400px; height: 800px; border-radius: 50%;
  filter: blur(100px); opacity: 0.4;
}
.e-slide .e-leak-1 {
  background: #c4621a; top: -200px; left: -100px;
}
.e-slide .e-leak-2 {
  background: #8a3a1a; bottom: -200px; right: -100px;
  width: 500px; height: 600px; opacity: 0.3;
}
.e-slide .e-film-border {
  position: absolute; z-index: 2;
  top: 30px; left: 30px; right: 30px; bottom: 30px;
  border: 1px solid rgba(200,180,140,0.15);
}
.e-slide .e-film-notch {
  position: absolute; z-index: 2;
  width: 20px; height: 35px;
  background: rgba(200,180,140,0.08);
}
.e-slide .e-film-notch.top { top: 30px; }
.e-slide .e-film-notch.bot { bottom: 30px; }
.e-slide .e-content {
  position: relative; z-index: 3;
  padding: 80px 90px; height: 100%;
  display: flex; flex-direction: column; justify-content: space-between;
}

/* E cover */
.e-cover .e-tag {
  font-size: 18px; font-weight: 400; letter-spacing: 0.35em; text-transform: uppercase;
  color: rgba(200,180,140,0.4);
}
.e-cover .e-title {
  font-size: 130px; font-weight: 900; line-height: 0.9;
  color: rgba(255,245,230,0.95); letter-spacing: -0.04em;
}
.e-cover .e-title em {
  font-style: normal; display: block;
  color: #D4862A;
  text-shadow: 0 0 60px rgba(212,134,42,0.3);
}
.e-cover .e-meta-bottom {
  display: flex; justify-content: space-between; align-items: flex-end;
  font-size: 14px; font-weight: 400; color: rgba(200,180,140,0.3);
  letter-spacing: 0.2em; text-transform: uppercase;
}
.e-cover .e-frame-num {
  font-family: 'IBM Plex Mono', monospace; font-size: 13px; font-weight: 400;
  color: rgba(200,180,140,0.25); letter-spacing: 0.15em;
}

/* E body */
.e-body .e-body-idx {
  font-size: 300px; font-weight: 900; line-height: 0.7;
  color: rgba(212,134,42,0.08);
  position: absolute; top: 30px; right: 60px; z-index: 2;
}
.e-body .e-body-text {
  font-size: 54px; font-weight: 500; line-height: 1.45;
  color: rgba(255,245,230,0.85); max-width: 820px;
  letter-spacing: -0.01em;
}
.e-body .e-body-text strong {
  font-weight: 800; color: rgba(255,245,230,0.95);
  border-bottom: 3px solid rgba(212,134,42,0.5);
  padding-bottom: 2px;
}
.e-body .e-body-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 13px; font-weight: 400; color: rgba(200,180,140,0.3);
  letter-spacing: 0.2em; text-transform: uppercase;
}

/* E signature */
.e-sig .e-sig-name {
  font-size: 150px; font-weight: 900; line-height: 0.85;
  color: rgba(255,245,230,0.95); letter-spacing: -0.05em;
}
.e-sig .e-sig-name em {
  font-style: normal; color: #D4862A;
  text-shadow: 0 0 60px rgba(212,134,42,0.3);
}
.e-sig .e-sig-divider {
  height: 1px; background: rgba(200,180,140,0.15); margin: 30px 0;
}
.e-sig .e-sig-list {
  font-size: 24px; font-weight: 400; color: rgba(200,180,140,0.5);
  line-height: 2.2;
}
.e-sig .e-sig-cta {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 14px; font-weight: 400; color: rgba(200,180,140,0.3);
  letter-spacing: 0.2em; text-transform: uppercase;
}

/* ═══════════════════════════════════════════════════════════════
   F — NEON WIREFRAME / BLUEPRINT / TECHNICAL
   Dark blueprint bg, neon linework, technical annotations,
   cross marks, coordinate labels, engineering aesthetic
   ═══════════════════════════════════════════════════════════════ */

.f-slide {
  background: #0a0e1a;
  font-family: 'IBM Plex Mono', monospace;
}
.f-slide .f-grid {
  position: absolute; inset: 0; z-index: 0;
  background:
    linear-gradient(90deg, rgba(60,130,255,0.04) 1px, transparent 1px),
    linear-gradient(0deg, rgba(60,130,255,0.04) 1px, transparent 1px);
  background-size: 54px 54px;
}
.f-slide .f-grid-major {
  position: absolute; inset: 0; z-index: 0;
  background:
    linear-gradient(90deg, rgba(60,130,255,0.08) 1px, transparent 1px),
    linear-gradient(0deg, rgba(60,130,255,0.08) 1px, transparent 1px);
  background-size: 270px 270px;
}
.f-slide .f-cross {
  position: absolute; z-index: 1;
  width: 30px; height: 30px;
}
.f-slide .f-cross::before, .f-slide .f-cross::after {
  content: ''; position: absolute; background: rgba(60,130,255,0.2);
}
.f-slide .f-cross::before { width: 30px; height: 1px; top: 14px; left: 0; }
.f-slide .f-cross::after { width: 1px; height: 30px; top: 0; left: 14px; }
.f-slide .f-content {
  position: relative; z-index: 2;
  padding: 80px 90px; height: 100%;
  display: flex; flex-direction: column; justify-content: space-between;
}
.f-slide .f-coord {
  font-size: 11px; font-weight: 400; color: rgba(60,130,255,0.25);
  letter-spacing: 0.15em; position: absolute; z-index: 1;
}

/* F cover */
.f-cover .f-tag {
  font-size: 13px; font-weight: 500; color: rgba(60,130,255,0.5);
  letter-spacing: 0.25em; text-transform: uppercase;
  border: 1px solid rgba(60,130,255,0.2); display: inline-block; padding: 8px 18px;
}
.f-cover .f-title {
  font-family: 'Space Mono', monospace;
  font-size: 80px; font-weight: 700; line-height: 1.05;
  color: #fff; letter-spacing: -0.02em;
}
.f-cover .f-title em {
  font-style: normal; color: #3c82ff;
  text-shadow: 0 0 30px rgba(60,130,255,0.4), 0 0 80px rgba(60,130,255,0.15);
}
.f-cover .f-annotation {
  font-size: 12px; font-weight: 400; color: rgba(60,130,255,0.35);
  letter-spacing: 0.15em; text-transform: uppercase;
  border-top: 1px solid rgba(60,130,255,0.15); padding-top: 16px;
  display: flex; justify-content: space-between;
}
.f-cover .f-neon-line {
  position: absolute; z-index: 1;
  height: 2px; background: linear-gradient(90deg, transparent, #3c82ff, transparent);
  box-shadow: 0 0 15px rgba(60,130,255,0.4);
  left: 90px; right: 90px; top: 50%;
  opacity: 0.15;
}

/* F body */
.f-body .f-body-idx {
  font-family: 'Space Mono', monospace;
  font-size: 240px; font-weight: 700; line-height: 0.7;
  color: transparent;
  -webkit-text-stroke: 1px rgba(60,130,255,0.12);
  position: absolute; top: 40px; right: 50px; z-index: 1;
}
.f-body .f-body-text {
  font-family: 'DM Sans', sans-serif;
  font-size: 48px; font-weight: 400; line-height: 1.5;
  color: rgba(255,255,255,0.8);
}
.f-body .f-body-text strong {
  font-weight: 700; color: #fff;
  border-bottom: 2px solid #3c82ff;
  padding-bottom: 2px;
  box-shadow: 0 2px 0 0 rgba(60,130,255,0.3);
}
.f-body .f-body-label {
  font-size: 12px; font-weight: 500; color: rgba(60,130,255,0.3);
  letter-spacing: 0.2em; text-transform: uppercase;
  border: 1px solid rgba(60,130,255,0.15); display: inline-block; padding: 6px 14px;
}

/* F signature */
.f-sig .f-sig-name {
  font-family: 'Space Mono', monospace;
  font-size: 100px; font-weight: 700; line-height: 0.95;
  color: #fff; letter-spacing: -0.03em;
}
.f-sig .f-sig-name em {
  font-style: normal; color: #3c82ff;
  text-shadow: 0 0 30px rgba(60,130,255,0.4);
}
.f-sig .f-sig-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
}
.f-sig .f-sig-item {
  font-size: 15px; font-weight: 400; color: rgba(255,255,255,0.5);
  padding: 16px 20px;
  border: 1px solid rgba(60,130,255,0.12);
  line-height: 1.4;
}
.f-sig .f-sig-item .f-dot {
  display: inline-block; width: 6px; height: 6px; border-radius: 50%;
  background: #3c82ff; box-shadow: 0 0 8px rgba(60,130,255,0.5);
  margin-right: 10px; vertical-align: middle;
}
.f-sig .f-sig-cta {
  font-size: 13px; font-weight: 500; color: rgba(60,130,255,0.4);
  letter-spacing: 0.15em; text-transform: uppercase;
  border-top: 1px solid rgba(60,130,255,0.15); padding-top: 16px;
  text-align: center;
}
</style>
</head>
<body>

<!-- ═══ D: COLLAGE / CUTOUT ═══ -->
<div class="label">D — COLLAGE · CUTOUT · MIXED MEDIA</div>

<section class="slide d-slide d-cover" data-id="d-cover">
  <div class="d-paper-bg"></div>
  <div class="d-tape"></div>
  <div class="d-sticker">01 / 08</div>
  <div class="d-black-card">
    <h1>Il tuo sito potrebbe essere di chiunque.</h1>
  </div>
  <div class="d-orange-card">
    <p>5 segnali per riconoscerlo</p>
  </div>
  <div class="d-footer-strip">
    <span>Marco Munich</span>
    <span>Personal Branding Olistico</span>
  </div>
</section>

<section class="slide d-slide d-body" data-id="d-body">
  <div class="d-paper-bg"></div>
  <div class="d-num-stamp">1</div>
  <div class="d-text-card">
    <p>Nella bio c'è scritto <strong>"ti accompagno in un percorso di crescita personale"</strong> e la stessa frase è sul sito di altri duemila professionisti del tuo settore.</p>
  </div>
  <div class="d-label-strip">Segnale 01 · Bio generica</div>
</section>

<section class="slide d-slide d-sig" data-id="d-sig">
  <div class="d-paper-bg"></div>
  <div class="d-sig-black">
    <div class="d-sig-tag">Per coach, counselor & operatori olistici</div>
    <div class="d-sig-name">Marco<br>Munich</div>
  </div>
  <div class="d-sig-services">
    <p>Personal Branding Olistico<br>Sviluppo Siti Web<br>Metterci la faccia online<br>Creazione del Messaggio Autentico<br>Creazione Video Autentici<br>Lavorare Senza Sito Web</p>
  </div>
  <div class="d-sig-url">marcomunich.com</div>
</section>

<!-- ═══ E: RETRO DARKROOM ═══ -->
<div class="label">E — RETRO DARKROOM · ANALOG · FILM</div>

<section class="slide e-slide" data-id="e-cover">
  <div class="e-grain"></div>
  <div class="e-leak e-leak-1"></div><div class="e-leak e-leak-2"></div>
  <div class="e-film-border"></div>
  <div class="e-film-notch top" style="left:80px"></div>
  <div class="e-film-notch top" style="left:140px"></div>
  <div class="e-film-notch bot" style="right:80px"></div>
  <div class="e-film-notch bot" style="right:140px"></div>
  <div class="e-content e-cover">
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <span class="e-tag">Marco Munich</span>
      <span class="e-frame-num">△ 01 / 08</span>
    </div>
    <div class="e-title">
      Il tuo sito è<br><em>di tutti.</em>
    </div>
    <div class="e-meta-bottom">
      <span>5 segnali per riconoscerlo</span>
      <span class="e-frame-num">Personal Branding Olistico</span>
    </div>
  </div>
</section>

<section class="slide e-slide" data-id="e-body">
  <div class="e-grain"></div>
  <div class="e-leak e-leak-2" style="top:-100px;bottom:auto;left:-100px;right:auto"></div>
  <div class="e-film-border"></div>
  <div class="e-film-notch top" style="left:80px"></div>
  <div class="e-film-notch bot" style="right:80px"></div>
  <div class="e-content e-body">
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <span class="e-body-label">Segnale 01</span>
      <span class="e-frame-num" style="color:rgba(200,180,140,0.25)">△ 02 / 08</span>
    </div>
    <div class="e-body-idx">1</div>
    <div style="flex:1;display:flex;align-items:center">
      <div class="e-body-text">Nella bio c'è scritto <strong>"ti accompagno in un percorso di crescita personale"</strong> e la stessa frase è sul sito di altri duemila professionisti del tuo settore.</div>
    </div>
    <div></div>
  </div>
</section>

<section class="slide e-slide" data-id="e-sig">
  <div class="e-grain"></div>
  <div class="e-leak e-leak-1" style="opacity:0.3"></div>
  <div class="e-leak e-leak-2" style="opacity:0.25"></div>
  <div class="e-film-border"></div>
  <div class="e-film-notch top" style="left:80px"></div>
  <div class="e-film-notch bot" style="right:80px"></div>
  <div class="e-content e-sig">
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <span class="e-tag" style="font-size:15px">Segui per altri</span>
      <span class="e-frame-num">△ 08 / 08</span>
    </div>
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:20px">
      <div class="e-sig-name">Marco<br><em>Munich</em></div>
      <div class="e-sig-divider"></div>
      <div class="e-sig-list">
        Personal Branding Olistico<br>
        Sviluppo Siti Web<br>
        Metterci la faccia online<br>
        Creazione del Messaggio Autentico<br>
        Creazione Video Autentici<br>
        Lavorare Senza Sito Web
      </div>
    </div>
    <div class="e-sig-cta">marcomunich.com · @marcomunich.dev</div>
  </div>
</section>

<!-- ═══ F: NEON WIREFRAME ═══ -->
<div class="label">F — NEON WIREFRAME · BLUEPRINT · TECHNICAL</div>

<section class="slide f-slide" data-id="f-cover">
  <div class="f-grid"></div><div class="f-grid-major"></div>
  <div class="f-cross" style="top:50px;left:50px"></div>
  <div class="f-cross" style="top:50px;right:50px"></div>
  <div class="f-cross" style="bottom:50px;left:50px"></div>
  <div class="f-cross" style="bottom:50px;right:50px"></div>
  <div class="f-coord" style="top:55px;left:90px">x:0 y:0</div>
  <div class="f-coord" style="bottom:55px;right:90px">x:1080 y:1350</div>
  <div class="f-neon-line"></div>
  <div class="f-content f-cover">
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <span class="f-tag">Marco Munich</span>
      <span class="f-tag">01 / 08</span>
    </div>
    <div style="flex:1;display:flex;align-items:center">
      <div class="f-title">5 segnali che il tuo sito potrebbe essere <em>di chiunque.</em></div>
    </div>
    <div class="f-annotation">
      <span>→ Scorri per scoprirli</span>
      <span>Personal Branding Olistico</span>
    </div>
  </div>
</section>

<section class="slide f-slide" data-id="f-body">
  <div class="f-grid"></div><div class="f-grid-major"></div>
  <div class="f-cross" style="top:50px;left:50px"></div>
  <div class="f-cross" style="bottom:50px;right:50px"></div>
  <div class="f-coord" style="top:55px;left:90px">segnale:01</div>
  <div class="f-content f-body">
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <span class="f-body-label">Segnale 01</span>
      <span class="f-body-label">02 / 08</span>
    </div>
    <div class="f-body-idx">01</div>
    <div style="flex:1;display:flex;align-items:center">
      <div class="f-body-text">Nella bio c'è scritto <strong>"ti accompagno in un percorso di crescita personale"</strong> e la stessa frase è sul sito di altri duemila professionisti del tuo settore.</div>
    </div>
    <div></div>
  </div>
</section>

<section class="slide f-slide" data-id="f-sig">
  <div class="f-grid"></div><div class="f-grid-major"></div>
  <div class="f-cross" style="top:50px;left:50px"></div>
  <div class="f-cross" style="top:50px;right:50px"></div>
  <div class="f-cross" style="bottom:50px;left:50px"></div>
  <div class="f-cross" style="bottom:50px;right:50px"></div>
  <div class="f-content f-sig">
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <span class="f-tag" style="font-size:12px">Segui per altri</span>
      <span class="f-tag" style="font-size:12px">08 / 08</span>
    </div>
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:32px">
      <div class="f-sig-name">Marco<br><em>Munich</em></div>
      <div class="f-sig-grid">
        <div class="f-sig-item"><span class="f-dot"></span>Personal Branding</div>
        <div class="f-sig-item"><span class="f-dot"></span>Siti Web</div>
        <div class="f-sig-item"><span class="f-dot"></span>Metterci la faccia</div>
        <div class="f-sig-item"><span class="f-dot"></span>Messaggio Autentico</div>
        <div class="f-sig-item"><span class="f-dot"></span>Video Autentici</div>
        <div class="f-sig-item"><span class="f-dot"></span>Lavorare Senza Sito</div>
      </div>
    </div>
    <div class="f-sig-cta">marcomunich.com · @marcomunich.dev</div>
  </div>
</section>

</body>
</html>`;

fs.writeFileSync(path.join(OUT, '_3-direzioni-v3.html'), html);
console.log('> HTML written');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
await page.goto('file:///' + path.join(OUT, '_3-direzioni-v3.html').replace(/\\/g, '/'));
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
fs.unlinkSync(path.join(OUT, '_3-direzioni-v3.html'));
console.log(`> Done: ${count} mockups`);
