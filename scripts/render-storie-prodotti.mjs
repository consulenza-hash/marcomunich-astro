#!/usr/bin/env node
/**
 * render-storie-prodotti.mjs
 *
 * Generates 6 Instagram Story graphics (1080x1920) — one per product/service.
 * Style: dark gradient + service name bold + CTA + accent bar + footer.
 * Same 6-color rotating palette as caroselli.
 *
 * Output: public/contenuti-social/immagini-storie/storia-prodotto-0N.png
 *
 * Usage:
 *   node render-storie-prodotti.mjs    # all 6 product stories
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'public', 'contenuti-social', 'immagini-storie');

const PALETTE = [
  '#e85d00', // arancione
  '#3b82f6', // azzurro
  '#22c55e', // verde
  '#fbbf24', // giallo
  '#06b6d4', // ciano
  '#a855f7', // viola
];

const PRODUCTS = [
  {
    id: 0,
    name: 'Personal Branding Olistico',
    cta: 'Costruiamo la tua identità online',
    sub: 'Per coach, counselor e operatori olistici',
  },
  {
    id: 1,
    name: 'Sviluppo Siti Web',
    cta: 'Un sito che suona come la tua voce',
    sub: 'Riconoscibile, specifico, tuo',
  },
  {
    id: 2,
    name: 'Metterci la Faccia Online',
    cta: 'Smetti di nasconderti dietro il formato',
    sub: 'La tua presenza autentica in video',
  },
  {
    id: 3,
    name: 'Creazione del Messaggio Autentico',
    cta: 'Le parole che solo tu potresti scrivere',
    sub: 'Posizionamento che parte da dentro',
  },
  {
    id: 4,
    name: 'Creazione Video Autentici',
    cta: 'Video che mostrano chi sei davvero',
    sub: 'Senza copioni, senza filtri',
  },
  {
    id: 5,
    name: 'Lavorare Senza Sito Web',
    cta: 'Clienti senza aspettare il sito perfetto',
    sub: 'Partire subito con quello che hai già',
  },
];

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

function generateHTML() {
  const sections = PRODUCTS.map((p) => {
    const accent = PALETTE[p.id % PALETTE.length];
    const rgb = hexToRgb(accent);
    return `
<section class="story" id="sp${p.id}" style="--accent: ${accent}; --rgb: ${rgb};">
  <div class="bg-glow"></div>
  <div class="inner">
    <div class="bar"></div>
    <div class="content">
      <div class="eyebrow">Servizio</div>
      <h1>${escapeHtml(p.name)}</h1>
      <p class="sub">${escapeHtml(p.sub)}</p>
      <div class="cta-block">
        <span class="cta-label">${escapeHtml(p.cta)}</span>
        <span class="cta-arrow">↗</span>
      </div>
    </div>
    <div class="footer">@marcomunich · Personal Branding Olistico</div>
  </div>
</section>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<title>Storie Prodotti Renderer</title>
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
    padding: 120px 100px 80px 120px;
  }
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
  .content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 40px;
  }
  .eyebrow {
    font-size: 26px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--accent);
  }
  h1 {
    font-size: 80px;
    font-weight: 900;
    line-height: 1.06;
    letter-spacing: -0.025em;
    color: #ffffff;
    max-width: 860px;
  }
  .sub {
    font-size: 34px;
    font-weight: 600;
    line-height: 1.3;
    color: rgba(255,255,255,0.65);
    max-width: 760px;
  }
  .cta-block {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 24px 36px;
    border: 2px solid rgba(255,255,255,0.2);
    border-radius: 60px;
    width: fit-content;
  }
  .cta-label {
    font-size: 26px;
    font-weight: 700;
    letter-spacing: 0.03em;
    color: #ffffff;
  }
  .cta-arrow {
    font-size: 30px;
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

async function main() {
  console.log('\nRendering 6 product stories...');

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const html = generateHTML();
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

    let ok = 0;
    for (const p of PRODUCTS) {
      const outPath = path.join(OUTPUT_DIR, `storia-prodotto-0${p.id}.png`);
      if (fs.existsSync(outPath) && fs.statSync(outPath).size > 10_000) {
        console.log(`  Prodotto ${p.id} (${p.name}): SKIP (exists)`);
        continue;
      }
      const el = page.locator(`#sp${p.id}`);
      await el.screenshot({ path: outPath });
      const size = Math.round(fs.statSync(outPath).size / 1024);
      console.log(`  Prodotto ${p.id} (${p.name}): OK (${size}KB)`);
      ok++;
    }
    console.log(`\nDone: ${ok} rendered`);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
