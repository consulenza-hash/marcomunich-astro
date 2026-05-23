#!/usr/bin/env node
/**
 * render-3-direzioni-v2.mjs — 3 direzioni visive con profondità e texture
 * A: Brutalist + Aurora + Kinetic Type
 * B: Glassmorphism + Bento + Dark
 * C: Neomorphism + Split + Magazine
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'public', 'contenuti-social', 'mockup-direzioni-v2');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const html = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;700;900&family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:ital,wght@0,400;0,500;0,700;1,400&family=Syne:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: #555; }
body { display: flex; flex-direction: column; align-items: center; gap: 32px; padding: 32px; }
.label {
  font-family: 'Inter', sans-serif; font-size: 28px; font-weight: 700;
  color: #fff; background: #222; padding: 14px 28px; border-radius: 8px;
  margin-top: 48px; letter-spacing: 0.02em;
}
.slide { width: 1080px; height: 1350px; position: relative; overflow: hidden; }

/* ═══════════════════════════════════════════════════════════════
   A — BRUTALIST + AURORA + KINETIC TYPE
   Raw energy. Mixed scale typography. Aurora gradient mesh.
   ═══════════════════════════════════════════════════════════════ */

.a-slide {
  background: #0a0a0a;
  font-family: 'Syne', sans-serif;
}
.a-slide .aurora {
  position: absolute; inset: 0; z-index: 0;
  background:
    radial-gradient(ellipse 80% 60% at 20% 80%, rgba(120,0,255,0.35) 0%, transparent 60%),
    radial-gradient(ellipse 60% 50% at 80% 20%, rgba(255,60,0,0.3) 0%, transparent 55%),
    radial-gradient(ellipse 70% 40% at 50% 50%, rgba(0,180,255,0.2) 0%, transparent 50%);
  filter: blur(60px);
}
.a-slide .noise {
  position: absolute; inset: 0; z-index: 1;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0'/></filter><rect width='300' height='300' filter='url(%23n)'/></svg>");
  opacity: 0.7; mix-blend-mode: overlay;
}
.a-slide .grid-lines {
  position: absolute; inset: 0; z-index: 1;
  background:
    linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px),
    linear-gradient(0deg, rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 108px 135px;
}
.a-slide .content { position: relative; z-index: 2; padding: 80px 90px; height: 100%; display: flex; flex-direction: column; justify-content: space-between; }

/* A cover */
.a-cover .a-tag {
  font-size: 16px; font-weight: 700; letter-spacing: 0.3em; text-transform: uppercase;
  color: rgba(255,255,255,0.4);
  border: 1px solid rgba(255,255,255,0.15); display: inline-block; padding: 10px 20px;
}
.a-cover .a-mega {
  font-size: 180px; font-weight: 800; line-height: 0.85; color: #fff;
  letter-spacing: -0.06em; text-transform: uppercase;
}
.a-cover .a-mega .a-outline {
  -webkit-text-stroke: 2px rgba(255,255,255,0.6);
  color: transparent;
}
.a-cover .a-mega .a-glow {
  color: #ff6a3d;
  text-shadow: 0 0 80px rgba(255,106,61,0.5), 0 0 160px rgba(255,106,61,0.2);
}
.a-cover .a-sub {
  font-size: 18px; font-weight: 400; color: rgba(255,255,255,0.35);
  letter-spacing: 0.15em; text-transform: uppercase;
  display: flex; justify-content: space-between; align-items: center;
  border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;
}

/* A body */
.a-body .a-idx {
  font-size: 400px; font-weight: 800; line-height: 0.7;
  -webkit-text-stroke: 2px rgba(255,255,255,0.08); color: transparent;
  position: absolute; top: -40px; right: 40px; z-index: 0;
}
.a-body .a-text {
  font-family: 'DM Sans', sans-serif; font-size: 52px; font-weight: 400;
  line-height: 1.45; color: rgba(255,255,255,0.9);
  max-width: 820px; position: relative; z-index: 1;
}
.a-body .a-text strong {
  font-weight: 700; color: #fff;
  background: linear-gradient(135deg, rgba(255,106,61,0.25), rgba(120,0,255,0.2));
  padding: 2px 12px; margin: 0 -4px;
  border-radius: 4px;
}
.a-body .a-label {
  font-size: 14px; font-weight: 700; letter-spacing: 0.25em; text-transform: uppercase;
  color: rgba(255,255,255,0.3);
  border: 1px solid rgba(255,255,255,0.1); display: inline-block; padding: 8px 16px;
}

/* A signature */
.a-sig .a-sig-name {
  font-size: 160px; font-weight: 800; line-height: 0.85; text-transform: uppercase;
  letter-spacing: -0.05em;
}
.a-sig .a-sig-name .l1 {
  -webkit-text-stroke: 2px rgba(255,255,255,0.5); color: transparent;
}
.a-sig .a-sig-name .l2 { color: #fff; }
.a-sig .a-sig-pills {
  display: flex; flex-wrap: wrap; gap: 12px;
}
.a-sig .a-sig-pills span {
  font-size: 16px; font-weight: 500; color: rgba(255,255,255,0.6);
  border: 1px solid rgba(255,255,255,0.15); padding: 10px 20px; border-radius: 100px;
  font-family: 'DM Sans', sans-serif;
}
.a-sig .a-sig-bar {
  height: 4px; background: linear-gradient(90deg, #ff6a3d, #7800ff, #00b4ff); border-radius: 2px;
}

/* ═══════════════════════════════════════════════════════════════
   B — GLASSMORPHISM + BENTO + DARK DEPTH
   Frosted glass, depth layers, floating panels.
   ═══════════════════════════════════════════════════════════════ */

.b-slide {
  background: #080810;
  font-family: 'Space Grotesk', sans-serif;
}
.b-slide .b-orbs {
  position: absolute; inset: 0; z-index: 0;
}
.b-slide .b-orb {
  position: absolute; border-radius: 50%; filter: blur(80px);
}
.b-slide .b-orb-1 { width: 500px; height: 500px; background: rgba(232,93,0,0.4); top: -150px; left: -100px; }
.b-slide .b-orb-2 { width: 400px; height: 400px; background: rgba(59,130,246,0.35); bottom: -100px; right: -80px; }
.b-slide .b-orb-3 { width: 300px; height: 300px; background: rgba(168,85,247,0.25); top: 40%; left: 50%; transform: translate(-50%,-50%); }
.b-slide .b-glass {
  position: relative; z-index: 2;
  background: rgba(255,255,255,0.06);
  backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 32px;
  padding: 50px;
}
.b-slide .b-glass-sm {
  background: rgba(255,255,255,0.04);
  backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 20px;
  padding: 28px 32px;
}
.b-slide .content { position: relative; z-index: 1; padding: 60px; height: 100%; display: flex; flex-direction: column; }

/* B cover */
.b-cover .b-top {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 50px;
}
.b-cover .b-chip {
  font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.5);
  background: rgba(255,255,255,0.06); border-radius: 100px; padding: 10px 22px;
  backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.08);
}
.b-cover .b-main-glass {
  flex: 1; display: flex; align-items: center;
}
.b-cover .b-title {
  font-size: 86px; font-weight: 700; line-height: 1.05; color: #fff;
  letter-spacing: -0.03em;
}
.b-cover .b-title em {
  font-style: normal;
  background: linear-gradient(135deg, #e85d00, #ff8c42);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}
.b-cover .b-footer-row {
  display: flex; gap: 16px; margin-top: 40px;
}

/* B body */
.b-body .b-bento {
  flex: 1; display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto 1fr;
  gap: 20px;
  margin-top: 30px;
}
.b-body .b-bento-main {
  grid-column: 1 / -1;
}
.b-body .b-bento-main p {
  font-size: 46px; font-weight: 500; line-height: 1.35; color: #fff;
  letter-spacing: -0.02em;
}
.b-body .b-bento-main p em {
  font-style: normal;
  background: linear-gradient(135deg, #e85d00, #ff8c42);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  font-weight: 700;
}
.b-body .b-bento-stat {
  display: flex; flex-direction: column; justify-content: center; align-items: center;
}
.b-body .b-bento-stat .num {
  font-size: 72px; font-weight: 700; color: #fff; line-height: 1;
}
.b-body .b-bento-stat .lbl {
  font-size: 16px; font-weight: 400; color: rgba(255,255,255,0.4);
  text-transform: uppercase; letter-spacing: 0.15em; margin-top: 8px;
}

/* B signature */
.b-sig .b-sig-card {
  flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 40px;
}
.b-sig .b-sig-name {
  font-size: 110px; font-weight: 700; line-height: 0.95; color: #fff;
  letter-spacing: -0.04em;
}
.b-sig .b-sig-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
}
.b-sig .b-sig-item {
  font-size: 18px; font-weight: 400; color: rgba(255,255,255,0.6); line-height: 1.4;
}
.b-sig .b-sig-item .ico {
  font-size: 28px; margin-bottom: 8px; display: block;
  background: linear-gradient(135deg, #e85d00, #a855f7);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}

/* ═══════════════════════════════════════════════════════════════
   C — SPLIT + MAGAZINE + TEXTURE
   Asymmetric composition. Photo+text split. Editorial depth.
   ═══════════════════════════════════════════════════════════════ */

.c-slide {
  font-family: 'Playfair Display', serif;
}
.c-cover {
  display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr;
}
.c-cover .c-left {
  background: #1a1410;
  padding: 80px 60px;
  display: flex; flex-direction: column; justify-content: space-between;
}
.c-cover .c-right {
  background: linear-gradient(180deg, #c4956a 0%, #8a6040 40%, #4a3020 100%);
  position: relative; overflow: hidden;
}
.c-cover .c-right .c-pattern {
  position: absolute; inset: 0;
  background:
    repeating-linear-gradient(45deg, transparent 0px, transparent 30px, rgba(0,0,0,0.08) 30px, rgba(0,0,0,0.08) 31px),
    repeating-linear-gradient(-45deg, transparent 0px, transparent 30px, rgba(0,0,0,0.08) 30px, rgba(0,0,0,0.08) 31px);
}
.c-cover .c-right .c-num-big {
  position: absolute; bottom: -40px; right: 30px;
  font-family: 'Playfair Display', serif; font-size: 380px; font-weight: 900;
  color: rgba(0,0,0,0.15); line-height: 0.8;
}
.c-cover .c-right .c-count-box {
  position: absolute; top: 80px; right: 60px;
  font-family: 'DM Sans', sans-serif; font-size: 16px; font-weight: 500;
  color: rgba(255,255,255,0.7); letter-spacing: 0.1em;
  background: rgba(0,0,0,0.25); backdrop-filter: blur(10px);
  padding: 12px 22px; border-radius: 100px;
}
.c-cover .c-tag {
  font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 700;
  letter-spacing: 0.25em; text-transform: uppercase; color: #c4956a;
}
.c-cover .c-title {
  font-size: 80px; font-weight: 900; line-height: 1.0; color: #fff;
  letter-spacing: -0.02em;
}
.c-cover .c-title em { font-style: italic; color: #c4956a; }
.c-cover .c-hint {
  font-family: 'DM Sans', sans-serif; font-size: 16px; font-weight: 400;
  color: rgba(255,255,255,0.35); letter-spacing: 0.1em;
}

/* C body */
.c-body {
  background: #f5f0e8;
  display: grid; grid-template-columns: 120px 1fr;
}
.c-body .c-sidebar {
  background: #1a1410;
  display: flex; flex-direction: column; justify-content: space-between;
  align-items: center; padding: 60px 0;
}
.c-body .c-sidebar .c-vert {
  writing-mode: vertical-rl; text-orientation: mixed;
  font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 700;
  letter-spacing: 0.3em; text-transform: uppercase; color: rgba(255,255,255,0.3);
  transform: rotate(180deg);
}
.c-body .c-sidebar .c-dot {
  width: 12px; height: 12px; border-radius: 50%; background: #c4956a;
}
.c-body .c-main {
  padding: 100px 80px;
  display: flex; flex-direction: column; justify-content: center;
}
.c-body .c-idx {
  font-family: 'Playfair Display', serif; font-size: 180px; font-weight: 900;
  color: rgba(0,0,0,0.06); line-height: 0.8; margin-bottom: -30px;
}
.c-body .c-body-text {
  font-family: 'DM Sans', sans-serif; font-size: 44px; font-weight: 400;
  line-height: 1.5; color: #2a2218;
}
.c-body .c-body-text strong { font-weight: 700; color: #1a1410; text-decoration: underline; text-decoration-color: #c4956a; text-underline-offset: 6px; text-decoration-thickness: 3px; }

/* C signature */
.c-sig {
  display: grid; grid-template-columns: 1fr 1fr;
}
.c-sig .c-sig-left {
  background: #1a1410; padding: 80px 60px;
  display: flex; flex-direction: column; justify-content: space-between;
}
.c-sig .c-sig-right {
  background: #c4956a; padding: 80px 60px;
  display: flex; flex-direction: column; justify-content: center; gap: 28px;
}
.c-sig .c-sig-tag {
  font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 700;
  letter-spacing: 0.25em; text-transform: uppercase; color: #c4956a;
}
.c-sig .c-sig-name {
  font-size: 120px; font-weight: 900; line-height: 0.9; color: #fff;
  letter-spacing: -0.03em;
}
.c-sig .c-sig-url {
  font-family: 'DM Sans', sans-serif; font-size: 18px; font-weight: 400;
  color: rgba(255,255,255,0.4); letter-spacing: 0.08em;
}
.c-sig .c-sig-service {
  font-family: 'DM Sans', sans-serif; font-size: 22px; font-weight: 500;
  color: #1a1410; line-height: 1.4;
  padding: 18px 0; border-bottom: 1px solid rgba(26,20,16,0.2);
}
.c-sig .c-sig-service:first-child { border-top: 1px solid rgba(26,20,16,0.2); }
</style>
</head>
<body>

<!-- ═══ A: BRUTALIST + AURORA + KINETIC ═══ -->
<div class="label">A — BRUTALIST · AURORA · KINETIC TYPE</div>

<section class="slide a-slide" data-id="a-cover">
  <div class="aurora"></div><div class="noise"></div><div class="grid-lines"></div>
  <div class="content a-cover">
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <span class="a-tag">Marco Munich</span>
      <span class="a-tag">01 / 08</span>
    </div>
    <div class="a-mega">
      <span class="a-outline">Il tuo</span><br>
      <span class="a-outline">sito è</span><br>
      <span class="a-glow">di tutti.</span>
    </div>
    <div class="a-sub">
      <span>→ 5 segnali per riconoscerlo</span>
      <span>Personal Branding Olistico</span>
    </div>
  </div>
</section>

<section class="slide a-slide" data-id="a-body">
  <div class="aurora" style="background:radial-gradient(ellipse 80% 60% at 80% 80%,rgba(0,180,255,0.3) 0%,transparent 60%),radial-gradient(ellipse 60% 50% at 20% 30%,rgba(168,85,247,0.3) 0%,transparent 55%)"></div>
  <div class="noise"></div><div class="grid-lines"></div>
  <div class="content a-body">
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <span class="a-label">Segnale 01</span>
      <span class="a-label">02 / 08</span>
    </div>
    <div class="a-idx">1</div>
    <div style="flex:1;display:flex;align-items:center">
      <div class="a-text">Nella bio c'è scritto <strong>"ti accompagno in un percorso di crescita personale"</strong> e la stessa frase è sul sito di altri duemila professionisti del tuo settore.</div>
    </div>
    <div></div>
  </div>
</section>

<section class="slide a-slide" data-id="a-sig">
  <div class="aurora" style="background:radial-gradient(ellipse 80% 60% at 50% 60%,rgba(255,106,61,0.35) 0%,transparent 55%),radial-gradient(ellipse 60% 40% at 20% 20%,rgba(120,0,255,0.25) 0%,transparent 50%),radial-gradient(ellipse 50% 50% at 80% 80%,rgba(0,180,255,0.2) 0%,transparent 50%)"></div>
  <div class="noise"></div><div class="grid-lines"></div>
  <div class="content a-sig">
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <span class="a-tag">Segui per altri</span>
      <span class="a-tag">08 / 08</span>
    </div>
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:40px">
      <div class="a-sig-name">
        <span class="l1">Marco</span><br><span class="l2">Munich</span>
      </div>
      <div class="a-sig-bar"></div>
      <div class="a-sig-pills">
        <span>Personal Branding</span>
        <span>Siti Web</span>
        <span>Metterci la faccia</span>
        <span>Messaggio Autentico</span>
        <span>Video Autentici</span>
        <span>Lavorare Senza Sito</span>
      </div>
    </div>
    <div style="font-family:'DM Sans',sans-serif;font-size:16px;color:rgba(255,255,255,0.3);letter-spacing:0.1em;border-top:1px solid rgba(255,255,255,0.1);padding-top:18px">
      marcomunich.com · @marcomunich.dev
    </div>
  </div>
</section>

<!-- ═══ B: GLASSMORPHISM + BENTO + DARK ═══ -->
<div class="label">B — GLASSMORPHISM · BENTO · DARK DEPTH</div>

<section class="slide b-slide" data-id="b-cover">
  <div class="b-orbs"><div class="b-orb b-orb-1"></div><div class="b-orb b-orb-2"></div><div class="b-orb b-orb-3"></div></div>
  <div class="content b-cover">
    <div class="b-top">
      <span class="b-chip">Marco Munich</span>
      <span class="b-chip">01 / 08</span>
    </div>
    <div class="b-main-glass">
      <div class="b-glass" style="max-width:900px">
        <div class="b-title">5 segnali che il tuo sito potrebbe essere <em>di chiunque.</em></div>
      </div>
    </div>
    <div class="b-footer-row">
      <div class="b-glass-sm" style="flex:1;text-align:center;font-size:15px;color:rgba(255,255,255,0.4)">→ Scorri per scoprirli</div>
      <div class="b-glass-sm" style="font-size:15px;color:rgba(255,255,255,0.4)">Personal Branding Olistico</div>
    </div>
  </div>
</section>

<section class="slide b-slide" data-id="b-body">
  <div class="b-orbs"><div class="b-orb b-orb-2" style="top:-100px;right:-80px;bottom:auto"></div><div class="b-orb b-orb-3" style="top:auto;bottom:-50px;left:10%"></div></div>
  <div class="content b-body">
    <div class="b-top">
      <span class="b-chip">Segnale 01 · Bio generica</span>
      <span class="b-chip">02 / 08</span>
    </div>
    <div class="b-bento">
      <div class="b-glass b-bento-main">
        <p>Nella bio c'è scritto <em>"ti accompagno in un percorso di crescita personale"</em> e la stessa frase è sul sito di altri duemila professionisti.</p>
      </div>
      <div class="b-glass-sm b-bento-stat">
        <div class="num">2000+</div>
        <div class="lbl">stessa frase</div>
      </div>
      <div class="b-glass-sm b-bento-stat">
        <div class="num">0</div>
        <div class="lbl">differenza</div>
      </div>
    </div>
  </div>
</section>

<section class="slide b-slide" data-id="b-sig">
  <div class="b-orbs"><div class="b-orb b-orb-1"></div><div class="b-orb b-orb-2" style="top:-100px;right:-80px;bottom:auto"></div></div>
  <div class="content b-sig">
    <div class="b-top">
      <span class="b-chip">Segui per altri</span>
      <span class="b-chip">08 / 08</span>
    </div>
    <div class="b-glass b-sig-card">
      <div class="b-sig-name">Marco<br>Munich</div>
      <div class="b-sig-grid">
        <div class="b-glass-sm b-sig-item"><span class="ico">◆</span>Personal Branding Olistico</div>
        <div class="b-glass-sm b-sig-item"><span class="ico">◆</span>Sviluppo Siti Web</div>
        <div class="b-glass-sm b-sig-item"><span class="ico">◆</span>Metterci la faccia online</div>
        <div class="b-glass-sm b-sig-item"><span class="ico">◆</span>Messaggio Autentico</div>
        <div class="b-glass-sm b-sig-item"><span class="ico">◆</span>Video Autentici</div>
        <div class="b-glass-sm b-sig-item"><span class="ico">◆</span>Lavorare Senza Sito</div>
      </div>
    </div>
    <div style="text-align:center;font-size:15px;color:rgba(255,255,255,0.3);margin-top:20px">marcomunich.com · @marcomunich.dev</div>
  </div>
</section>

<!-- ═══ C: SPLIT + MAGAZINE + TEXTURE ═══ -->
<div class="label">C — SPLIT SCREEN · MAGAZINE · TEXTURE</div>

<section class="slide c-slide c-cover" data-id="c-cover">
  <div class="c-left">
    <div class="c-tag">Marco Munich</div>
    <div class="c-title">Il tuo sito potrebbe essere <em>di chiunque.</em></div>
    <div class="c-hint">→ 5 segnali per riconoscerlo</div>
  </div>
  <div class="c-right">
    <div class="c-pattern"></div>
    <div class="c-num-big">5</div>
    <div class="c-count-box">01 / 08</div>
  </div>
</section>

<section class="slide c-slide c-body" data-id="c-body">
  <div class="c-sidebar">
    <div class="c-vert">Segnale 01 · Bio generica</div>
    <div class="c-dot"></div>
    <div class="c-vert" style="font-size:11px;color:rgba(255,255,255,0.2)">02 / 08</div>
  </div>
  <div class="c-main">
    <div class="c-idx">01</div>
    <div class="c-body-text">Nella bio c'è scritto <strong>"ti accompagno in un percorso di crescita personale"</strong> e la stessa frase è sul sito di altri duemila professionisti del tuo settore.</div>
  </div>
</section>

<section class="slide c-slide c-sig" data-id="c-sig">
  <div class="c-sig-left">
    <div class="c-sig-tag">Per coach, counselor & operatori olistici</div>
    <div class="c-sig-name">Marco<br>Munich</div>
    <div class="c-sig-url">marcomunich.com<br>@marcomunich.dev</div>
  </div>
  <div class="c-sig-right">
    <div class="c-sig-service">Personal Branding Olistico</div>
    <div class="c-sig-service">Sviluppo Siti Web</div>
    <div class="c-sig-service">Metterci la faccia online</div>
    <div class="c-sig-service">Creazione del Messaggio Autentico</div>
    <div class="c-sig-service">Creazione Video Autentici</div>
    <div class="c-sig-service">Lavorare Senza Sito Web</div>
  </div>
</section>

</body>
</html>`;

fs.writeFileSync(path.join(OUT, '_3-direzioni-v2.html'), html);
console.log('> HTML written');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
await page.goto('file:///' + path.join(OUT, '_3-direzioni-v2.html').replace(/\\/g, '/'));
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
fs.unlinkSync(path.join(OUT, '_3-direzioni-v2.html'));
console.log(`> Done: ${count} mockups`);
