#!/usr/bin/env node
/**
 * render-and-send-draft.mjs
 *
 * Prende un draft carousel dall'Art Director, lo renderizza con il renderer v2,
 * e manda le immagini PNG su Telegram.
 *
 * Uso: node scripts/render-and-send-draft.mjs <draft-file>
 * Es:  node scripts/render-and-send-draft.mjs .claude/business-dna/drafts/post-001.md
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Leggi credenziali Telegram
const envFile = fs.readFileSync(path.join(PROJECT_ROOT, '.env.telegram'), 'utf8');
const BOT_TOKEN = envFile.match(/BOT_TOKEN=(.+)/)?.[1]?.trim();
const CHAT_ID = envFile.match(/CHAT_ID=(.+)/)?.[1]?.trim();

if (!BOT_TOKEN || !CHAT_ID) {
  console.error('Missing BOT_TOKEN or CHAT_ID in .env.telegram');
  process.exit(1);
}

// ─── Parsing del draft ───────────────────────────────────────────
function parseDraft(filepath) {
  const content = fs.readFileSync(filepath, 'utf8');

  const slides = [];
  const slideRegex = /### SLIDE (\d+)(?:\s*\([^)]*\))?\s*\n([\s\S]*?)(?=\n### SLIDE |\n### CAPTION|\n---\s*$|$)/gi;
  let match;
  while ((match = slideRegex.exec(content)) !== null) {
    slides.push({
      num: parseInt(match[1], 10),
      text: match[2].trim(),
    });
  }

  const captionMatch = content.match(/### CAPTION[^\n]*\n([\s\S]*?)$/i);
  const caption = captionMatch ? captionMatch[1].trim() : '';

  const titleMatch = content.match(/^# (.+)/m);
  const title = titleMatch ? titleMatch[1].replace(/^POST-\d+\s*[—–-]\s*/, '').trim() : 'Draft';

  return { title, slides, caption };
}

// ─── Converti draft nel formato markdown del renderer ───────────
function draftToRendererMarkdown(draft, carouselNum) {
  let md = `### CAROSELLO ${carouselNum} — "${draft.title}"\n`;
  for (const slide of draft.slides) {
    md += `- **Slide ${slide.num}:** ${slide.text}\n`;
  }
  if (draft.caption) {
    md += `- **Caption:** ${draft.caption}\n`;
  }
  return md;
}

// ─── Manda foto su Telegram ──────────────────────────────────────
async function sendPhoto(photoPath, caption = '') {
  const FormData = (await import('node:buffer')).Buffer ? null : null;

  // Usa curl per mandare la foto (più semplice che gestire multipart in Node)
  const cmd = caption
    ? `curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto" -F "chat_id=${CHAT_ID}" -F "photo=@${photoPath}" -F "caption=${caption.replace(/"/g, '\\"').substring(0, 1024)}"`
    : `curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto" -F "chat_id=${CHAT_ID}" -F "photo=@${photoPath}"`;

  try {
    const result = execSync(cmd, { encoding: 'utf8', timeout: 30000 });
    const json = JSON.parse(result);
    if (!json.ok) {
      console.error(`Telegram error: ${json.description}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`Failed to send photo: ${err.message}`);
    return false;
  }
}

async function sendText(text) {
  const cmd = `curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" -H "Content-Type: application/json" -d ${JSON.stringify(JSON.stringify({ chat_id: CHAT_ID, text }))}`;
  try {
    execSync(cmd, { encoding: 'utf8', timeout: 10000 });
  } catch (err) {
    console.error(`Failed to send text: ${err.message}`);
  }
}

// ─── Main ────────────────────────────────────────────────────────
async function main() {
  const draftPath = process.argv[2];
  if (!draftPath) {
    console.error('Uso: node scripts/render-and-send-draft.mjs <draft-file>');
    process.exit(1);
  }

  const fullPath = path.resolve(PROJECT_ROOT, draftPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`File non trovato: ${fullPath}`);
    process.exit(1);
  }

  console.log(`> Parsing draft: ${draftPath}`);
  const draft = parseDraft(fullPath);
  console.log(`  Titolo: ${draft.title}`);
  console.log(`  Slide: ${draft.slides.length}`);

  if (draft.slides.length === 0) {
    console.error('Nessuna slide trovata nel draft');
    process.exit(1);
  }

  // Usa numero carousel 99 per i draft (non sovrascrive quelli reali)
  const DRAFT_NUM = 99;
  const outDir = path.join(PROJECT_ROOT, 'public', 'contenuti-social', 'immagini-caroselli', `carosello-${String(DRAFT_NUM).padStart(2, '0')}`);
  fs.mkdirSync(outDir, { recursive: true });

  // Scrivi il markdown temporaneo per il renderer
  const tempMd = path.join(PROJECT_ROOT, 'public', 'contenuti-social', '_archivio', '_draft-render.md');
  const rendererMd = draftToRendererMarkdown(draft, DRAFT_NUM);
  fs.writeFileSync(tempMd, rendererMd);
  console.log(`> Markdown temporaneo scritto: ${tempMd}`);

  // Lancia il renderer v2
  console.log('> Lancio renderer...');
  try {
    execSync(`node scripts/render-caroselli-v2.mjs`, {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
      timeout: 120000,
      stdio: 'inherit',
    });
  } catch (err) {
    console.error('Renderer fallito, mando solo testo su Telegram');
    // Fallback: manda testo
    await sendText(`CONTENT MACHINE - Draft carousel\n\n${draft.slides.map(s => `SLIDE ${s.num}\n${s.text}`).join('\n\n')}`);
    fs.unlinkSync(tempMd);
    process.exit(0);
  }

  // Manda le immagini su Telegram
  console.log('> Invio immagini su Telegram...');
  await sendText(`CONTENT MACHINE - Carousel per domani\n"${draft.title}"\n${draft.slides.length} slide`);

  for (let i = 1; i <= draft.slides.length; i++) {
    const pngPath = path.join(outDir, `slide-${String(i).padStart(2, '0')}.png`);
    if (fs.existsSync(pngPath)) {
      const caption = i === 1 ? `Slide ${i} (Cover)` : `Slide ${i}`;
      await sendPhoto(pngPath, caption);
      console.log(`  Slide ${i} inviata`);
    } else {
      console.warn(`  Slide ${i} non trovata: ${pngPath}`);
    }
  }

  // Manda la caption
  if (draft.caption) {
    const captionChunks = draft.caption.match(/[\s\S]{1,4000}/g) || [draft.caption];
    await sendText(`CAPTION:\n\n${captionChunks[0]}`);
    for (let i = 1; i < captionChunks.length; i++) {
      await sendText(captionChunks[i]);
    }
  }

  await sendText('Approvi per domani? Rispondi qui se vuoi modifiche.');

  // Cleanup
  fs.unlinkSync(tempMd);
  console.log('> Fatto! Draft mandato su Telegram con immagini.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
