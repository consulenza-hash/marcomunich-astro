#!/usr/bin/env node
/**
 * render-post-singoli.mjs
 *
 * Generates 52 single-post graphics (1080x1350) for Instagram.
 * Style: radial gradient background + bold white hook text + vertical accent bar + signature footer.
 * Same palette as caroselli (rotating 6 colors).
 *
 * Input:  contenuti-social/post-singoli.md  (reads "**Overlay:**" lines)
 * Output: public/contenuti-social/immagini-post-singoli/post-XX.png
 *
 * Usage:
 *   node render-post-singoli.mjs           # all 52 posts
 *   node render-post-singoli.mjs 9 20      # only P09-P20
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const POST_SINGOLI_MD = path.join(PROJECT_ROOT, 'contenuti-social', 'post-singoli.md');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'public', 'contenuti-social', 'immagini-post-singoli');

// Same rotating palette as caroselli
const PALETTE = [
  '#e85d00', // arancione
  '#3b82f6', // azzurro
  '#22c55e', // verde
  '#fbbf24', // giallo
  '#06b6d4', // ciano
  '#a855f7', // viola
];

// ─── PARSING ──────────────────────────────────────────────────────────────

function parseOverlays() {
  const content = fs.readFileSync(POST_SINGOLI_MD, 'utf8').replace(/\r\n/g, '\n');
  const overlays = {};
  // Match: ### POST N — "..."  followed by - **Overlay:** text
  const regex = /### POST (\d+)[^\n]*\n(?:[^\n]*\n)*?- \*\*Overlay:\*\* (.+)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    overlays[parseInt(match[1], 10)] = match[2].trim();
  }
  return overlays;
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

function fontSize(text) {
  const len = text.length;
  if (len < 35) return 108;
  if (len < 55) return 92;
  if (len < 75) return 78;
  if (len < 95) return 68;
  if (len < 115) return 60;
  return 52;
}

function generatePostHTML(posts) {
  const sections = posts.map(({ num, text, accent }) => {
    const rgb = hexToRgb(accent);
    const size = fontSize(text);
    const id = `p${String(num).padStart(2, '0')}`;
    // Split text on '. ' to allow line breaks at sentence boundaries
    const displayText = escapeHtml(text);
    return `
<section class="post" id="${id}" style="
  --accent: ${accent};
  --rgb: ${rgb};
">
  <div class="bar"></div>
  <div class="content">
    <p style="font-size: ${size}px">${displayText}</p>
    <span class="cta">continua in descrizione</span>
  </div>
  <div class="footer">• @marcomunich · Personal Branding Olistico</div>
</section>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<title>Post Singoli Renderer</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@700;800;900&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #1a1a1a; }
  body {
    font-family: 'Inter', system-ui, sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    padding: 24px;
    -webkit-font-smoothing: antialiased;
  }
  .post {
    width: 1080px;
    height: 1350px;
    background:
      radial-gradient(ellipse 75% 75% at 22% 80%,
        rgba(var(--rgb), 0.52) 0%,
        rgba(var(--rgb), 0.18) 38%,
        transparent 62%
      ),
      #040404;
    color: #ffffff;
    padding: 100px 120px 80px 120px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
    overflow: hidden;
  }

  /* Vertical accent bar — left side, vertically centered */
  .bar {
    position: absolute;
    left: 80px;
    top: 50%;
    transform: translateY(-50%);
    width: 4px;
    height: 90px;
    background: var(--accent);
    border-radius: 2px;
  }

  /* Main text content */
  .content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 36px;
    padding-left: 32px; /* indent from bar */
  }
  .content p {
    font-weight: 900;
    line-height: 1.08;
    letter-spacing: -0.03em;
    color: #ffffff;
    max-width: 820px;
  }
  .cta {
    font-size: 22px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.5);
  }
  .cta::before {
    content: '→ ';
    color: var(--accent);
  }

  /* Footer */
  .footer {
    text-align: center;
    font-size: 19px;
    font-weight: 500;
    letter-spacing: 0.04em;
    color: rgba(255, 255, 255, 0.45);
    padding-top: 24px;
  }
</style>
</head>
<body>
${sections}
</body>
</html>`;
}

// ─── SCREENSHOT ───────────────────────────────────────────────────────────

async function screenshotSlides(page, posts) {
  let ok = 0;
  let skip = 0;

  for (const { num } of posts) {
    const outPath = path.join(OUTPUT_DIR, `post-${String(num).padStart(2, '0')}.png`);
    if (fs.existsSync(outPath) && fs.statSync(outPath).size > 10_000) {
      console.log(`  P${String(num).padStart(2, '0')}.png SKIP (exists ${Math.round(fs.statSync(outPath).size / 1024)}KB)`);
      skip++;
      continue;
    }

    const id = `p${String(num).padStart(2, '0')}`;
    const el = page.locator(`#${id}`);
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    await el.screenshot({ path: outPath });
    const size = Math.round(fs.statSync(outPath).size / 1024);
    console.log(`  P${String(num).padStart(2, '0')}.png OK (${size}KB)`);
    ok++;
  }

  return { ok, skip };
}

// ─── MAIN ─────────────────────────────────────────────────────────────────

async function main() {
  const startId = parseInt(process.argv[2] ?? '1', 10);
  const endId = parseInt(process.argv[3] ?? '52', 10);

  console.log(`\nRendering post singoli P${String(startId).padStart(2, '0')}–P${String(endId).padStart(2, '0')}...`);

  // Parse overlay texts
  const overlays = parseOverlays();
  console.log(`  Overlays found: ${Object.keys(overlays).length}`);

  // Build post list for the range
  const posts = [];
  for (let n = startId; n <= endId; n++) {
    const text = overlays[n];
    if (!text) {
      console.warn(`  WARNING: no overlay text for P${String(n).padStart(2, '0')}, skipping`);
      continue;
    }
    const accent = PALETTE[(n - 1) % PALETTE.length];
    posts.push({ num: n, text, accent });
  }

  if (posts.length === 0) {
    console.error('No posts to render');
    process.exit(1);
  }

  // Serve the HTML via a local HTTP server (needed for Google Fonts)
  const html = generatePostHTML(posts);
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
    // Wait for Inter font to load
    await page.waitForTimeout(1500);

    const { ok, skip } = await screenshotSlides(page, posts);
    console.log(`\nDone: ${ok} rendered, ${skip} skipped (total ${posts.length})`);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
