#!/usr/bin/env node
/**
 * render-reels.mjs
 *
 * Genera video MP4 teaser (1080x1920, ~15s) per i 60 reels.
 * Formato: loop animato con hook in grande + "Leggi in descrizione".
 * Il contenuto vero sta nella caption (archivio-reels.md).
 *
 * Uso:
 *   node render-reels.mjs            # tutti i 60
 *   node render-reels.mjs 1 10       # reels 1-10
 *   node render-reels.mjs --reel 4   # singolo
 *
 * Output: public/contenuti-social/video-reels/reel-NN.mp4
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const ROOT       = path.resolve(__dirname, '..');
const REELS_MD   = path.join(ROOT, 'public', 'contenuti-social', 'reels', 'archivio-reels.md');
const OUT_DIR    = path.join(ROOT, 'public', 'contenuti-social', 'video-reels');
const TMP_DIR    = path.join(OUT_DIR, '_tmp');

const PALETTE = ['#e85d00','#3b82f6','#22c55e','#fbbf24','#06b6d4','#a855f7'];
const DURATION_S = 15;   // durata video

// ── Parser ────────────────────────────────────────────────────────────────────

function parseReels(md) {
  return [...md.matchAll(/\*\*REEL (\d+)\*\*[\s\S]*?\*\*Hook:\*\*\s*(.+)/g)]
    .map(m => ({ num: parseInt(m[1]), hook: m[2].trim() }));
}

// ── HTML animato ──────────────────────────────────────────────────────────────

function buildHtml(hook, accent) {
  const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  // Colore glow più scuro per la seconda fase dell'animazione
  const accentDark = accent + '22';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');

  *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }

  body {
    width: 1080px; height: 1920px; overflow: hidden;
    background: #080810;
    font-family: 'Inter', -apple-system, sans-serif;
  }

  /* glow di fondo pulsante */
  .glow {
    position: absolute;
    width: 900px; height: 900px;
    border-radius: 50%;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    background: radial-gradient(circle, ${accent}33 0%, transparent 70%);
    animation: pulse 3s ease-in-out infinite;
  }
  @keyframes pulse {
    0%   { transform: translate(-50%,-50%) scale(0.85); opacity: 0.6; }
    50%  { transform: translate(-50%,-50%) scale(1.15); opacity: 1;   }
    100% { transform: translate(-50%,-50%) scale(0.85); opacity: 0.6; }
  }

  /* barra accent sinistra che sale e scende */
  .bar {
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 8px;
    background: ${accent};
    transform-origin: top center;
    animation: bar 3s ease-in-out infinite;
  }
  @keyframes bar {
    0%   { transform: scaleY(0.3); opacity: 0.5; }
    50%  { transform: scaleY(1);   opacity: 1;   }
    100% { transform: scaleY(0.3); opacity: 0.5; }
  }

  .content {
    position: absolute; inset: 0;
    display: flex; flex-direction: column;
    justify-content: center; align-items: flex-start;
    padding: 0 96px 0 120px;
    gap: 72px;
  }

  .eyebrow {
    font-size: 26px; font-weight: 700; letter-spacing: 0.2em;
    text-transform: uppercase; color: ${accent};
    animation: fadein 1s ease forwards;
  }

  .hook {
    font-size: 88px; font-weight: 900; line-height: 1.1;
    color: #ffffff; letter-spacing: -0.02em;
    animation: fadein 1s 0.3s ease both;
  }

  @keyframes fadein {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0);    }
  }

  /* "Leggi in descrizione" — lampeggia lentamente */
  .cta {
    font-size: 36px; font-weight: 700; color: #ffffffbb;
    letter-spacing: 0.04em;
    display: flex; align-items: center; gap: 16px;
    animation: blink 2.5s ease-in-out infinite;
  }
  .cta-arrow {
    font-size: 42px; color: ${accent};
    animation: bounce 2.5s ease-in-out infinite;
  }
  @keyframes blink {
    0%,100% { opacity: 0.5; } 50% { opacity: 1; }
  }
  @keyframes bounce {
    0%,100% { transform: translateY(0); }
    50%     { transform: translateY(8px); }
  }

  .tag {
    position: absolute; bottom: 72px; right: 88px;
    font-size: 28px; font-weight: 700;
    color: #ffffff33; letter-spacing: 0.1em;
  }
</style>
</head>
<body>
  <div class="glow"></div>
  <div class="bar"></div>
  <div class="content">
    <div class="eyebrow">marcomunich.com</div>
    <div class="hook">${esc(hook)}</div>
    <div class="cta">
      <span class="cta-arrow">&#8595;</span>
      Leggi in descrizione
    </div>
  </div>
  <div class="tag">@marcomunich</div>
</body>
</html>`;
}

// ── Render singolo reel ───────────────────────────────────────────────────────

async function renderReel(browser, reel) {
  const accent  = PALETTE[(reel.num - 1) % PALETTE.length];
  const html    = buildHtml(reel.hook, accent);
  const outFile = path.join(OUT_DIR, `reel-${String(reel.num).padStart(2,'0')}.mp4`);
  const tmpDir  = path.join(TMP_DIR, `reel-${String(reel.num).padStart(2,'0')}`);

  fs.mkdirSync(tmpDir, { recursive: true });

  // Playwright registra video durante la navigazione
  const ctx  = await browser.newContext({
    viewport: { width: 1080, height: 1920 },
    recordVideo: {
      dir: tmpDir,
      size: { width: 1080, height: 1920 },
    },
  });
  const page = await ctx.newPage();
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.waitForTimeout(DURATION_S * 1000);
  await ctx.close(); // flush video

  // Trova il webm generato da Playwright
  const webms = fs.readdirSync(tmpDir).filter(f => f.endsWith('.webm'));
  if (!webms.length) throw new Error('Nessun webm trovato');
  const webmPath = path.join(tmpDir, webms[0]);

  // Converti webm → mp4
  execSync(
    `ffmpeg -y -i "${webmPath}" -c:v libx264 -pix_fmt yuv420p -preset fast "${outFile}"`,
    { stdio: 'pipe' }
  );

  // Cleanup tmp
  fs.rmSync(tmpDir, { recursive: true, force: true });

  console.log(`  ✓ Reel ${reel.num} (${DURATION_S}s loop) → ${path.basename(outFile)}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  let fromNum = 1, toNum = 60, singleNum = null;

  if (args.includes('--reel')) {
    singleNum = parseInt(args[args.indexOf('--reel') + 1]);
  } else if (args.length >= 1 && !isNaN(+args[0])) {
    fromNum = parseInt(args[0]);
    toNum   = args[1] ? parseInt(args[1]) : fromNum;
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(TMP_DIR, { recursive: true });

  const md    = fs.readFileSync(REELS_MD, 'utf-8');
  let   reels = parseReels(md);

  if (singleNum !== null) {
    reels = reels.filter(r => r.num === singleNum);
  } else {
    reels = reels.filter(r => r.num >= fromNum && r.num <= toNum);
  }

  if (!reels.length) { console.log('Nessun reel trovato.'); return; }
  console.log(`\nRendering ${reels.length} reel(s)...\n`);

  const browser = await chromium.launch();
  for (const reel of reels) {
    try {
      await renderReel(browser, reel);
    } catch (e) {
      console.error(`  ✗ Reel ${reel.num}: ${e.message}`);
    }
  }
  await browser.close();
  console.log(`\nDone. → public/contenuti-social/video-reels/\n`);
}

main().catch(e => { console.error(e); process.exit(1); });
