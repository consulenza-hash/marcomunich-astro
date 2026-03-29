/**
 * add-inline-images.mjs
 * Scarica un'immagine rilevante da loremflickr e la inserisce nel body
 * degli articoli .mdoc dopo il primo H2.
 *
 * Usage:
 *   node scripts/add-inline-images.mjs --slug=nome-articolo   (singolo)
 *   node scripts/add-inline-images.mjs --all                  (tutti)
 *   node scripts/add-inline-images.mjs --all --dry-run        (preview senza modifiche)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, createWriteStream } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';
import { readdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ARTICOLI_DIR = join(ROOT, 'src', 'content', 'articoli');
const IMAGES_DIR = join(ROOT, 'public', 'images', 'articoli', 'inline');
const IMAGE_W = 1200;
const IMAGE_H = 630;

// Mappa parole italiane (slug) → keyword inglesi per loremflickr
const KEYWORD_MAP = {
  'ia': 'technology', 'intelligenza': 'technology', 'artificiale': 'artificial-intelligence',
  'ai': 'artificial-intelligence', 'gpt': 'technology', 'chatgpt': 'technology',
  'coach': 'coaching', 'coaching': 'coaching', 'counselor': 'counseling',
  'counseling': 'counseling', 'olistico': 'wellness', 'olistici': 'wellness',
  'olistica': 'wellness', 'operatore': 'wellness',
  'social': 'social-media', 'instagram': 'instagram', 'facebook': 'social-media',
  'linkedin': 'professional', 'tiktok': 'social-media',
  'marketing': 'marketing', 'brand': 'branding', 'personal': 'personal-development',
  'nicchia': 'business', 'niche': 'business',
  'clienti': 'business', 'cliente': 'business', 'agenda': 'calendar',
  'contenuti': 'content-creation', 'contenuto': 'content-creation',
  'scrivere': 'writing', 'scrittura': 'writing', 'articolo': 'writing',
  'blog': 'blogging', 'testo': 'writing',
  'online': 'internet', 'sito': 'website', 'web': 'website',
  'video': 'video', 'youtube': 'video',
  'formazione': 'education', 'certificazione': 'certificate', 'corso': 'education',
  'follower': 'social-media', 'pubblico': 'audience',
  'autocensura': 'censorship', 'paura': 'fear', 'autenticita': 'authenticity',
  'fretta': 'success', 'successo': 'success',
  'promuoversi': 'promotion', 'promuovere': 'promotion',
  'opinione': 'opinion', 'originalita': 'creativity',
  'nicchia': 'niche', 'trovare': 'search',
  'deludere': 'disappointment', 'aspettare': 'waiting',
  'fidati': 'trust', 'fare': 'action', 'perdere': 'loss',
  'riempire': 'calendar', 'costruire': 'building',
  'gratuito': 'free', 'valore': 'value',
  'meditazione': 'meditation', 'mindfulness': 'mindfulness',
};

const DEFAULT_KEYWORDS = ['coaching', 'wellness', 'professional'];

// Estrae keyword dall'articolo (slug + titolo)
function extractKeywords(slug, titolo) {
  const words = slug.split('-').concat(
    titolo.toLowerCase().split(/\s+/).map(w => w.replace(/[^a-z]/g, ''))
  );
  const mapped = words
    .map(w => KEYWORD_MAP[w])
    .filter(Boolean);
  return mapped.length ? [...new Set(mapped)].slice(0, 3) : DEFAULT_KEYWORDS;
}

// Scarica file da URL → path locale
function download(url, destPath, baseUrl = null) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const file = createWriteStream(destPath);
    proto.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        let location = res.headers.location;
        // Gestisci redirect relativi
        if (location && !location.startsWith('http')) {
          const base = baseUrl || new URL(url).origin;
          location = base + location;
        }
        download(location, destPath, baseUrl || new URL(url).origin).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} per ${url}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(destPath); });
    }).on('error', reject);
  });
}

// Inserisce immagine nel body dopo il primo heading (H2 o H3)
function insertImageInBody(body, imgPath, altText) {
  // Normalizza a LF per semplificare
  const normalized = body.replace(/\r\n/g, '\n');

  // Già ha un'immagine inline? Skip
  if (normalized.includes('/images/articoli/inline/')) return null;

  // Cerca H2 o H3 (in ordine di preferenza)
  const headingMatch = normalized.match(/\n#{2,3} .+/);
  if (!headingMatch) return null;

  const insertAfterHeading = normalized.indexOf(headingMatch[0]) + headingMatch[0].length;
  const nextParaEnd = normalized.indexOf('\n\n', insertAfterHeading);
  if (nextParaEnd === -1) return null;

  const imageMarkdown = `\n\n![${altText}](${imgPath})\n`;
  return normalized.slice(0, nextParaEnd) + imageMarkdown + normalized.slice(nextParaEnd);
}

// Processa un singolo articolo
async function processArticle(slug, dryRun = false) {
  const mdocPath = join(ARTICOLI_DIR, slug, 'index.mdoc');
  if (!existsSync(mdocPath)) {
    console.log(`[SKIP] ${slug} — file non trovato`);
    return;
  }

  const content = readFileSync(mdocPath, 'utf-8');
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!fmMatch) { console.log(`[SKIP] ${slug} — frontmatter non trovato`); return; }

  const fm = fmMatch[1];
  const body = fmMatch[2];

  // Estrai titolo dal frontmatter
  const titoloMatch = fm.match(/titolo:\s*["']?(.+?)["']?\s*$/m);
  const titolo = titoloMatch ? titoloMatch[1] : slug;

  // Immagine già presente?
  if (body.includes('/images/articoli/inline/')) {
    console.log(`[SKIP] ${slug} — immagine inline già presente`);
    return;
  }

  const keywords = extractKeywords(slug, titolo);
  const kwString = keywords.join(',');
  const lockSeed = Math.abs(slug.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 10000;
  const imgFilename = `${slug}.jpg`;
  const imgLocalPath = join(IMAGES_DIR, imgFilename);
  const imgPublicPath = `/images/articoli/inline/${imgFilename}`;
  const loremUrl = `https://loremflickr.com/${IMAGE_W}/${IMAGE_H}/${kwString}?lock=${lockSeed}`;

  console.log(`[PROCESS] ${slug}`);
  console.log(`  keywords: ${kwString} | lock: ${lockSeed}`);
  console.log(`  url: ${loremUrl}`);

  if (!dryRun) {
    mkdirSync(IMAGES_DIR, { recursive: true });
    try {
      await download(loremUrl, imgLocalPath);
      console.log(`  ✓ immagine scaricata → ${imgLocalPath}`);
    } catch (e) {
      // Fallback: prova con solo il primo keyword
      const fallbackUrl = `https://loremflickr.com/${IMAGE_W}/${IMAGE_H}/${keywords[0]}?lock=${lockSeed}`;
      console.log(`  ↺ retry con keyword singolo: ${fallbackUrl}`);
      try {
        await download(fallbackUrl, imgLocalPath);
        console.log(`  ✓ immagine scaricata (fallback) → ${imgLocalPath}`);
      } catch (e2) {
        console.log(`  ✗ download fallito: ${e2.message}`);
        return;
      }
    }

    const newBody = insertImageInBody(body, imgPublicPath, titolo);
    if (!newBody) {
      console.log(`  ✗ inserimento fallito (nessun H2 o già presente)`);
      return;
    }

    const newContent = `---\n${fm}\n---\n${newBody}`;
    writeFileSync(mdocPath, newContent, 'utf-8');
    console.log(`  ✓ body aggiornato`);
  } else {
    console.log(`  [DRY RUN] scaricherebbe da ${loremUrl}`);
  }
}

// Main
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const all = args.includes('--all');
const slugArg = args.find(a => a.startsWith('--slug='))?.split('=')[1];

if (!all && !slugArg) {
  console.log('Usage: node scripts/add-inline-images.mjs --slug=nome-articolo');
  console.log('       node scripts/add-inline-images.mjs --all [--dry-run]');
  process.exit(1);
}

if (slugArg) {
  await processArticle(slugArg, dryRun);
} else {
  const slugs = readdirSync(ARTICOLI_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);
  console.log(`Trovati ${slugs.length} articoli`);
  for (const slug of slugs) {
    await processArticle(slug, dryRun);
    // Piccola pausa per non stressare loremflickr
    await new Promise(r => setTimeout(r, 300));
  }
}

console.log('\nDone.');
