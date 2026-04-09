// scripts/compress-images.mjs
// Comprime tutte le immagini in public/images/
// Usage: node scripts/compress-images.mjs
import sharp from 'sharp';
import { readdir, stat, readFile, writeFile } from 'fs/promises';
import { join, extname, basename, relative } from 'path';

const ROOT = new URL('../public/images/', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const MAX_WIDTH = 1400;
const SKIP_THRESHOLD = 50 * 1024; // 50KB

let totalBefore = 0;
let totalAfter = 0;
let compressed = 0;
let skipped = 0;
let deduped = 0;

// Map: basename → { path, buffer } per dedup
const seen = new Map();

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      files.push(...await walk(full));
    } else if (e.isFile()) {
      const ext = extname(e.name).toLowerCase();
      if (ext === '.jpg' || ext === '.jpeg' || ext === '.png') {
        files.push(full);
      }
    }
  }
  return files;
}

async function compress(filePath) {
  const rel = relative(ROOT, filePath);
  const ext = extname(filePath).toLowerCase();
  const base = basename(filePath);
  const stats = await stat(filePath);
  const sizeBefore = stats.size;
  totalBefore += sizeBefore;

  // Dedup: stesso basename già processato?
  if (seen.has(base)) {
    const { size: prevSize, buffer: prevBuffer } = seen.get(base);
    if (Math.abs(sizeBefore - prevSize) < 1024) {
      // Stesso file, usa buffer già calcolato
      const saving = sizeBefore - prevBuffer.length;
      if (saving > SKIP_THRESHOLD) {
        await writeFile(filePath, prevBuffer);
        totalAfter += prevBuffer.length;
        const pct = Math.round(saving / sizeBefore * 100);
        console.log(`[dedup] ${rel} ${(sizeBefore/1024/1024).toFixed(2)}MB → ${(prevBuffer.length/1024/1024).toFixed(2)}MB (-${pct}%)`);
        deduped++;
        return;
      } else {
        totalAfter += sizeBefore;
        skipped++;
        return;
      }
    }
  }

  try {
    const input = sharp(filePath).resize({ width: MAX_WIDTH, withoutEnlargement: true });
    let buf;
    if (ext === '.png') {
      buf = await input.png({ quality: 80, compressionLevel: 9 }).toBuffer();
    } else {
      buf = await input.jpeg({ quality: 82, mozjpeg: true }).toBuffer();
    }

    const saving = sizeBefore - buf.length;
    seen.set(base, { size: sizeBefore, buffer: buf });

    if (saving < SKIP_THRESHOLD) {
      totalAfter += sizeBefore;
      skipped++;
      return;
    }

    await writeFile(filePath, buf);
    totalAfter += buf.length;
    compressed++;
    const pct = Math.round(saving / sizeBefore * 100);
    console.log(`[ok]    ${rel} ${(sizeBefore/1024/1024).toFixed(2)}MB → ${(buf.length/1024/1024).toFixed(2)}MB (-${pct}%)`);
  } catch (err) {
    console.error(`[err]   ${rel}: ${err.message}`);
    totalAfter += sizeBefore;
  }
}

console.log(`Scanning ${ROOT} ...`);
const files = await walk(ROOT);
console.log(`Found ${files.length} images\n`);

for (const f of files) {
  await compress(f);
}

const savedMB = (totalBefore - totalAfter) / 1024 / 1024;
console.log(`\n--- Risultato ---`);
console.log(`Compressi: ${compressed} | Deduplicati: ${deduped} | Saltati: ${skipped}`);
console.log(`Totale: ${(totalBefore/1024/1024).toFixed(1)}MB → ${(totalAfter/1024/1024).toFixed(1)}MB (-${savedMB.toFixed(1)}MB)`);
