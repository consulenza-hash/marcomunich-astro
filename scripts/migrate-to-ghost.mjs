/**
 * migrate-to-ghost.mjs
 * Migra gli articoli .mdoc da src/content/articoli/ a Ghost CMS via Admin API.
 *
 * Uso:
 *   node scripts/migrate-to-ghost.mjs [--dry-run] [--slug some-slug]
 *
 * Requisiti:
 *   GHOST_URL e GHOST_ADMIN_API_KEY nel file .env.local
 */

import fs     from 'fs';
import path   from 'path';
import { fileURLToPath } from 'url';
import jsYaml from 'js-yaml';

// ─── Config ──────────────────────────────────────────────────────────────────

const __dirname   = path.dirname(fileURLToPath(import.meta.url));
const ROOT        = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'src', 'content', 'articoli');

// Leggi env da .env.local
const envPath = path.join(ROOT, '.env.local');
const env = {};
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  });
}

const GHOST_URL           = env.GHOST_URL           ?? 'https://cms.marcomunich.com';
const GHOST_ADMIN_API_KEY = env.GHOST_ADMIN_API_KEY ?? '';

const DRY_RUN    = process.argv.includes('--dry-run');
const ONLY_SLUG  = process.argv.includes('--slug')
  ? process.argv[process.argv.indexOf('--slug') + 1]
  : null;

if (!GHOST_ADMIN_API_KEY) {
  console.error('❌ GHOST_ADMIN_API_KEY mancante in .env.local');
  process.exit(1);
}

// ─── JWT per Admin API ────────────────────────────────────────────────────────

async function makeJWT() {
  const [id, secret] = GHOST_ADMIN_API_KEY.split(':');
  // Ghost Admin API usa HS256 JWT (no librerie esterne necessarie con crypto nativo)
  const { createHmac } = await import('crypto');

  const now = Math.floor(Date.now() / 1000);
  const header  = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT', kid: id })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ iat: now, exp: now + 300, aud: '/admin/' })).toString('base64url');
  const sig     = createHmac('sha256', Buffer.from(secret, 'hex'))
    .update(`${header}.${payload}`)
    .digest('base64url');

  return `${header}.${payload}.${sig}`;
}

// ─── Parser .mdoc ─────────────────────────────────────────────────────────────

function parseMdoc(raw, slug) {
  const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!fmMatch) return { slug, titolo: slug, body: raw, fm: {} };

  // Parse YAML frontmatter con js-yaml
  const fm = (jsYaml.load(fmMatch[1]) ?? {});

  return { slug, titolo: fm.titolo ?? slug, fm, body: fmMatch[2].trim() };
}

// ─── Markdoc → HTML (minimal) ────────────────────────────────────────────────
// Usiamo mobiledoc JSON per passare il contenuto grezzo a Ghost.
// Ghost accetta anche HTML diretto tramite il campo `html`.
// Per semplicità: passiamo il body come mobiledoc "html card".

function bodyToMobiledoc(html) {
  return JSON.stringify({
    version:  '0.3.1',
    markups:  [],
    atoms:    [],
    cards:    [['html', { html }]],
    sections: [[10, 0]],
  });
}

// Conversione minimale Markdoc → HTML (solo paragrafi e heading)
function mdToHtml(md) {
  return md
    .replace(/^#{6}\s+(.*)$/gm, '<h6>$1</h6>')
    .replace(/^#{5}\s+(.*)$/gm, '<h5>$1</h5>')
    .replace(/^#{4}\s+(.*)$/gm, '<h4>$1</h4>')
    .replace(/^#{3}\s+(.*)$/gm, '<h3>$1</h3>')
    .replace(/^#{2}\s+(.*)$/gm, '<h2>$1</h2>')
    .replace(/^#\s+(.*)$/gm,    '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g,  '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g,      '<em>$1</em>')
    .replace(/\n\n+/g, '\n\n')
    .split('\n\n')
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => (p.startsWith('<h') || p.startsWith('<ul') || p.startsWith('<ol') || p.startsWith('<li') ? p : `<p>${p}</p>`))
    .join('\n');
}

// ─── Ghost Admin API ──────────────────────────────────────────────────────────

async function ghostPost(token, payload) {
  const res = await fetch(`${GHOST_URL}/ghost/api/admin/posts/`, {
    method:  'POST',
    headers: {
      'Authorization':  `Ghost ${token}`,
      'Content-Type':   'application/json',
      'Accept-Version': 'v5.0',
    },
    body: JSON.stringify({ posts: [payload] }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.errors?.[0]?.message ?? `HTTP ${res.status}`);
  }
  return json.posts[0];
}

async function slugExists(token, slug) {
  const res = await fetch(
    `${GHOST_URL}/ghost/api/admin/posts/slug/${slug}/`,
    { headers: { 'Authorization': `Ghost ${token}`, 'Accept-Version': 'v5.0' } }
  );
  return res.ok;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const slugDirs = fs.readdirSync(CONTENT_DIR).filter(d =>
    fs.statSync(path.join(CONTENT_DIR, d)).isDirectory()
  );

  const targets = ONLY_SLUG ? slugDirs.filter(d => d === ONLY_SLUG) : slugDirs;
  console.log(`📦 Articoli trovati: ${targets.length}${DRY_RUN ? ' (DRY RUN)' : ''}`);

  const token = await makeJWT();
  let ok = 0, skip = 0, err = 0;

  for (const dir of targets) {
    const mdocPath = path.join(CONTENT_DIR, dir, 'index.mdoc');
    if (!fs.existsSync(mdocPath)) { skip++; continue; }

    const raw  = fs.readFileSync(mdocPath, 'utf8');
    const { slug, titolo, fm, body } = parseMdoc(raw, dir);

    // Salta bozze
    if (fm.bozza === true || fm.bozza === 'true') { console.log(`  ⏭  ${slug} (bozza)`); skip++; continue; }

    if (DRY_RUN) {
      console.log(`  ✓ [dry] ${slug} — "${titolo}"`);
      ok++; continue;
    }

    // Controlla se esiste già
    if (await slugExists(token, slug)) {
      console.log(`  ⏭  ${slug} (già in Ghost)`);
      skip++; continue;
    }

    const html       = mdToHtml(body);
    const mobiledoc  = bodyToMobiledoc(html);
    let pubDate = undefined;
    if (fm.data) {
      const d = new Date(String(fm.data) + 'T12:00:00');
      if (!isNaN(d.getTime())) pubDate = d.toISOString();
    }
    const tags       = [];
    if (fm.categoria) tags.push({ name: fm.categoria });
    if (fm.tags)      fm.tags.split(',').forEach(t => tags.push({ name: t.trim() }));

    const payload = {
      title:            titolo,
      slug,
      mobiledoc,
      status:           'published',
      published_at:     pubDate,
      meta_title:       fm.seo_title       || undefined,
      meta_description: fm.seo_description || undefined,
      custom_excerpt:   fm.descrizione ? String(fm.descrizione).slice(0, 300) : undefined,
      canonical_url:    fm.canonical_url   || undefined,
      tags:             tags.length ? tags : undefined,
    };

    try {
      await ghostPost(token, payload);
      console.log(`  ✅ ${slug}`);
      ok++;
      // Throttle: 1 req ogni 200ms per non sovraccaricare il server
      await new Promise(r => setTimeout(r, 200));
    } catch (e) {
      console.error(`  ❌ ${slug}: ${e.message}`);
      err++;
    }
  }

  console.log(`\n📊 Risultato: ${ok} importati, ${skip} saltati, ${err} errori`);
}

main().catch(e => { console.error(e); process.exit(1); });
