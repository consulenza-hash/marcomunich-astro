#!/usr/bin/env node
/**
 * render-reels.mjs
 *
 * Genera video MP4 (1080x1920) per i reels faceless da archivio-reels.md.
 *
 * Formato A (Reels 4-60): shot list + overlay text per clip.
 *   - Ogni clip = PNG 1080x1920 con testo overlay (Playwright)
 *   - FFmpeg assembla le clip nella durata della shot list → MP4
 *
 * Formato B (Reels 1-3): script parlato a camera.
 *   - Genera un singolo PNG "prompt card" con il testo completo dello script
 *
 * Output: public/contenuti-social/video-reels/reel-XX.mp4
 *
 * Prerequisiti:
 *   - node + playwright: npm install playwright
 *   - ffmpeg: disponibile nel PATH
 *
 * Uso:
 *   node render-reels.mjs            # tutti i 60 reels
 *   node render-reels.mjs 4 10       # reels 4-10
 *   node render-reels.mjs --reel 7   # reel specifico
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const REELS_MD = path.join(PROJECT_ROOT, 'public', 'contenuti-social', 'reels', 'archivio-reels.md');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'public', 'contenuti-social', 'video-reels');
const FRAMES_DIR = path.join(PROJECT_ROOT, 'public', 'contenuti-social', 'video-reels', '_frames');

const PALETTE = [
  '#e85d00', // arancione
  '#3b82f6', // azzurro
  '#22c55e', // verde
  '#fbbf24', // giallo
  '#06b6d4', // ciano
  '#a855f7', // viola
];

// ── Parser ────────────────────────────────────────────────────────────────────

function parseReels(md) {
  const reels = [];
  // Split by REEL N headers
  const blocks = md.split(/(?=\*\*REEL \d+\*\*)/g).filter(b => b.includes('**REEL '));

  for (const block of blocks) {
    const numMatch = block.match(/\*\*REEL (\d+)\*\*/);
    if (!numMatch) continue;
    const num = parseInt(numMatch[1]);

    const hookMatch = block.match(/\*\*Hook:\*\*\s*(.+)/);
    const captionMatch = block.match(/\*\*Caption:\*\*\s*(.+)/);
    const hook = hookMatch ? hookMatch[1].trim() : '';
    const caption = captionMatch ? captionMatch[1].trim() : '';

    // Formato B: Script parlato a camera
    const scriptMatch = block.match(/\*\*Script:\*\*\s*([\s\S]+?)(?=\n- \*\*Caption|\n\*\*REEL|\Z)/);
    if (scriptMatch) {
      reels.push({
        num, hook, caption,
        format: 'B',
        script: scriptMatch[1].trim(),
        clips: [],
      });
      continue;
    }

    // Formato A: Shot list + Overlay
    const clips = [];

    // Parse shot list
    const shotSection = block.match(/\*\*Shot list:\*\*([\s\S]+?)(?=\*\*Overlay|\*\*Caption)/);
    const overlaySection = block.match(/\*\*Overlay:\*\*([\s\S]+?)(?=\*\*Caption|\n\*\*REEL|\Z)/);

    if (!shotSection || !overlaySection) continue;

    const shotLines = shotSection[1].match(/- Clip \d+ \((\d+)s\): (.+)/g) || [];
    const overlayLines = overlaySection[1].match(/- \[C\d+\] \*(.+?)\*/g) || [];

    for (let i = 0; i < Math.max(shotLines.length, overlayLines.length); i++) {
      const shotLine = shotLines[i] || '';
      const overlayLine = overlayLines[i] || '';

      const durMatch = shotLine.match(/\((\d+)s\)/);
      const descMatch = shotLine.match(/\d+s\): (.+)/);
      const textMatch = overlayLine.match(/\[C\d+\] \*(.+?)\*/);

      clips.push({
        index: i + 1,
        duration: durMatch ? parseInt(durMatch[1]) : 12,
        sceneDesc: descMatch ? descMatch[1].trim() : '',
        overlayText: textMatch ? textMatch[1].trim() : '',
      });
    }

    reels.push({ num, hook, caption, format: 'A', clips });
  }

  return reels;
}

// ── HTML per Playwright ────────────────────────────────────────────────────────

function clipHtml(hook, clipIndex, totalClips, text, sceneDesc, accent, reelNum) {
  const escapedText = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  const escapedScene = sceneDesc
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const escapedHook = hook
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1080px; height: 1920px; overflow: hidden;
    background: #0a0a0f;
    font-family: 'Inter', -apple-system, sans-serif;
    position: relative;
  }
  .bg-glow {
    position: absolute; inset: 0;
    background: radial-gradient(ellipse 800px 900px at 50% 60%, ${accent}18 0%, transparent 70%);
  }
  .accent-bar {
    position: absolute; left: 0; top: 0; bottom: 0;
    width: 8px; background: ${accent};
  }
  .content {
    position: absolute; inset: 0;
    display: flex; flex-direction: column;
    padding: 80px 80px 80px 110px;
  }
  .reel-badge {
    font-size: 26px; font-weight: 700; letter-spacing: 0.15em;
    color: ${accent}; text-transform: uppercase; margin-bottom: 40px;
  }
  .hook-box {
    background: ${accent}22;
    border: 1.5px solid ${accent}55;
    border-radius: 16px;
    padding: 32px 40px;
    margin-bottom: 60px;
  }
  .hook-label {
    font-size: 20px; font-weight: 700; letter-spacing: 0.12em;
    color: ${accent}; text-transform: uppercase; margin-bottom: 12px;
  }
  .hook-text {
    font-size: 46px; font-weight: 900; line-height: 1.2;
    color: #ffffff;
  }
  .overlay-text {
    flex: 1;
    display: flex; align-items: center;
    font-size: 54px; font-weight: 700; line-height: 1.45;
    color: #f5f5f5;
    letter-spacing: -0.01em;
  }
  .footer {
    display: flex; align-items: flex-end; justify-content: space-between;
    margin-top: 40px;
  }
  .scene-desc {
    font-size: 24px; font-weight: 400; color: #ffffff66;
    max-width: 700px; line-height: 1.4;
    font-style: italic;
  }
  .clip-counter {
    font-size: 30px; font-weight: 700;
    color: ${accent}99;
    letter-spacing: 0.05em;
    white-space: nowrap;
    margin-left: 40px;
  }
  .marcomunich-tag {
    position: absolute; bottom: 60px; right: 80px;
    font-size: 26px; font-weight: 700; color: #ffffff33;
    letter-spacing: 0.08em;
  }
</style>
</head>
<body>
  <div class="bg-glow"></div>
  <div class="accent-bar"></div>
  <div class="content">
    <div class="reel-badge">Reel ${reelNum}</div>
    <div class="hook-box">
      <div class="hook-label">Hook</div>
      <div class="hook-text">${escapedHook}</div>
    </div>
    <div class="overlay-text">${escapedText}</div>
    <div class="footer">
      <div class="scene-desc">[B-roll: ${escapedScene}]</div>
      <div class="clip-counter">${clipIndex}/${totalClips}</div>
    </div>
  </div>
  <div class="marcomunich-tag">marcomunich.com</div>
</body>
</html>`;
}

function scriptCardHtml(hook, script, caption, accent, reelNum) {
  const escaped = (s) => s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1080px; height: 1920px; overflow: hidden;
    background: #0a0a0f;
    font-family: 'Inter', -apple-system, sans-serif;
    position: relative;
  }
  .bg-glow {
    position: absolute; inset: 0;
    background: radial-gradient(ellipse 800px 900px at 50% 55%, ${accent}18 0%, transparent 70%);
  }
  .accent-bar {
    position: absolute; left: 0; top: 0; bottom: 0;
    width: 8px; background: ${accent};
  }
  .content {
    position: absolute; inset: 0;
    display: flex; flex-direction: column;
    padding: 80px 80px 80px 110px;
  }
  .reel-badge {
    font-size: 26px; font-weight: 700; letter-spacing: 0.15em;
    color: ${accent}; text-transform: uppercase; margin-bottom: 40px;
  }
  .format-label {
    font-size: 22px; font-weight: 700; letter-spacing: 0.12em;
    color: #ffffff55; text-transform: uppercase; margin-bottom: 24px;
  }
  .hook-text {
    font-size: 64px; font-weight: 900; line-height: 1.15;
    color: #ffffff; margin-bottom: 56px;
  }
  .script-text {
    flex: 1;
    font-size: 36px; font-weight: 400; line-height: 1.65;
    color: #e0e0e0;
    overflow: hidden;
  }
  .caption-row {
    margin-top: 48px;
    padding-top: 36px;
    border-top: 1.5px solid ${accent}44;
  }
  .caption-label {
    font-size: 20px; font-weight: 700; letter-spacing: 0.12em;
    color: ${accent}; text-transform: uppercase; margin-bottom: 10px;
  }
  .caption-text {
    font-size: 36px; font-weight: 700; color: #ffffff99;
  }
  .marcomunich-tag {
    position: absolute; bottom: 60px; right: 80px;
    font-size: 26px; font-weight: 700; color: #ffffff33;
    letter-spacing: 0.08em;
  }
</style>
</head>
<body>
  <div class="bg-glow"></div>
  <div class="accent-bar"></div>
  <div class="content">
    <div class="reel-badge">Reel ${reelNum}</div>
    <div class="format-label">Parlato a camera</div>
    <div class="hook-text">${escaped(hook)}</div>
    <div class="script-text">${escaped(script)}</div>
    <div class="caption-row">
      <div class="caption-label">Caption</div>
      <div class="caption-text">${escaped(caption)}</div>
    </div>
  </div>
  <div class="marcomunich-tag">marcomunich.com</div>
</body>
</html>`;
}

// ── Render + assemble ──────────────────────────────────────────────────────────

async function renderReel(browser, reel) {
  const accent = PALETTE[(reel.num - 1) % PALETTE.length];
  const reelDir = path.join(FRAMES_DIR, `reel-${String(reel.num).padStart(2, '0')}`);
  fs.mkdirSync(reelDir, { recursive: true });

  const outputFile = path.join(OUTPUT_DIR, `reel-${String(reel.num).padStart(2, '0')}.mp4`);

  const page = await browser.newPage();
  await page.setViewportSize({ width: 1080, height: 1920 });

  if (reel.format === 'B') {
    // Formato B: Script card statico → video 45s
    const html = scriptCardHtml(reel.hook, reel.script, reel.caption, accent, reel.num);
    await page.setContent(html, { waitUntil: 'networkidle' });
    const imgPath = path.join(reelDir, 'frame-01.png');
    await page.screenshot({ path: imgPath });
    await page.close();

    // FFmpeg: immagine unica → video 45s
    execSync(
      `ffmpeg -y -loop 1 -i "${imgPath}" -c:v libx264 -t 45 -pix_fmt yuv420p -vf "scale=1080:1920" "${outputFile}"`,
      { stdio: 'pipe' }
    );
    console.log(`  ✓ Reel ${reel.num} (Formato B script card) → ${path.basename(outputFile)}`);
    return;
  }

  // Formato A: un PNG per clip, poi FFmpeg li assembla
  const framePaths = [];
  const durations = [];

  for (const clip of reel.clips) {
    const html = clipHtml(
      reel.hook, clip.index, reel.clips.length,
      clip.overlayText, clip.sceneDesc, accent, reel.num
    );
    await page.setContent(html, { waitUntil: 'networkidle' });
    const imgPath = path.join(reelDir, `frame-${String(clip.index).padStart(2, '0')}.png`);
    await page.screenshot({ path: imgPath });
    framePaths.push(imgPath);
    durations.push(clip.duration);
  }

  await page.close();

  // Crea concat list per FFmpeg
  const concatFile = path.join(reelDir, 'concat.txt');
  const lines = framePaths.map((p, i) =>
    `file '${p.replace(/\\/g, '/')}'\nduration ${durations[i]}`
  );
  // FFmpeg concat demuxer richiede l'ultimo file ripetuto senza duration
  lines.push(`file '${framePaths[framePaths.length - 1].replace(/\\/g, '/')}'`);
  fs.writeFileSync(concatFile, lines.join('\n'));

  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${concatFile}" -c:v libx264 -pix_fmt yuv420p -vf "scale=1080:1920" "${outputFile}"`,
    { stdio: 'pipe' }
  );

  const totalSec = durations.reduce((a, b) => a + b, 0);
  console.log(`  ✓ Reel ${reel.num} (${reel.clips.length} clip, ${totalSec}s) → ${path.basename(outputFile)}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  let fromNum = 1, toNum = 60, singleNum = null;

  if (args.includes('--reel')) {
    singleNum = parseInt(args[args.indexOf('--reel') + 1]);
  } else if (args.length >= 1 && !isNaN(parseInt(args[0]))) {
    fromNum = parseInt(args[0]);
    toNum = args[1] ? parseInt(args[1]) : fromNum;
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(FRAMES_DIR, { recursive: true });

  const md = fs.readFileSync(REELS_MD, 'utf-8');
  let reels = parseReels(md);

  if (singleNum !== null) {
    reels = reels.filter(r => r.num === singleNum);
  } else {
    reels = reels.filter(r => r.num >= fromNum && r.num <= toNum);
  }

  console.log(`\nRendering ${reels.length} reels (${reels[0]?.num}–${reels[reels.length - 1]?.num})...\n`);

  const browser = await chromium.launch();

  for (const reel of reels) {
    try {
      await renderReel(browser, reel);
    } catch (err) {
      console.error(`  ✗ Reel ${reel.num}: ${err.message}`);
    }
  }

  await browser.close();
  console.log(`\nDone. Output: public/contenuti-social/video-reels/\n`);
}

main().catch(err => { console.error(err); process.exit(1); });
