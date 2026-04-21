/**
 * set_ghost_feature_images.mjs
 * Collega le immagini locali (public/images/articoli/) a ogni post Ghost
 * che ha feature_image = null, usando il Ghost Admin API.
 *
 * Usage: node scripts/set_ghost_feature_images.mjs [--dry-run]
 */

import { readFileSync, readdirSync } from 'fs';
import { resolve, dirname, extname, basename } from 'path';
import { fileURLToPath } from 'url';
import { createHmac } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const IMG_DIR = resolve(ROOT, 'public', 'images', 'articoli');
const SITE_URL = 'https://marcomunich.com';

// Load env
const envLines = readFileSync(resolve(ROOT, '.env.local'), 'utf8').split('\n');
const env = {};
for (const line of envLines) {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim();
}

const GHOST_URL   = env.GHOST_URL;
const CONTENT_KEY = env.GHOST_CONTENT_API_KEY;
const ADMIN_KEY   = env.GHOST_ADMIN_API_KEY;
const DRY_RUN     = process.argv.includes('--dry-run');

if (!GHOST_URL || !CONTENT_KEY || !ADMIN_KEY) {
  console.error('Missing env vars in .env.local'); process.exit(1);
}

// Minimal JWT without jsonwebtoken dependency
function makeJwt() {
  const [id, secret] = ADMIN_KEY.split(':');
  const now = Math.floor(Date.now() / 1000);
  const header  = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT', kid: id })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ iat: now, exp: now + 300, aud: '/admin/' })).toString('base64url');
  const sig = createHmac('sha256', Buffer.from(secret, 'hex'))
    .update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${sig}`;
}

// Build slug→imageURL map from local files
function buildImageMap() {
  const map = {};
  for (const file of readdirSync(IMG_DIR)) {
    const ext = extname(file);
    if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) continue;
    map[basename(file, ext)] = `${SITE_URL}/images/articoli/${file}`;
  }
  return map;
}

async function getAllPosts() {
  const posts = [];
  let page = 1;
  while (true) {
    const res = await fetch(`${GHOST_URL}/ghost/api/content/posts/?key=${CONTENT_KEY}&limit=100&page=${page}&fields=id,slug,title,feature_image&filter=status:published`);
    const data = await res.json();
    if (!data.posts?.length) break;
    posts.push(...data.posts);
    if (data.posts.length < 100) break;
    page++;
  }
  return posts;
}

async function getUpdatedAt(postId) {
  const res = await fetch(`${GHOST_URL}/ghost/api/admin/posts/${postId}/`, {
    headers: { Authorization: `Ghost ${makeJwt()}` },
  });
  const d = await res.json();
  return d.posts?.[0]?.updated_at;
}

async function setFeatureImage(postId, updatedAt, imgUrl) {
  const res = await fetch(`${GHOST_URL}/ghost/api/admin/posts/${postId}/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Ghost ${makeJwt()}` },
    body: JSON.stringify({ posts: [{ feature_image: imgUrl, updated_at: updatedAt }] }),
  });
  return res.json();
}

async function main() {
  console.log(`Ghost: ${GHOST_URL} | DRY_RUN: ${DRY_RUN}\n`);

  const imageMap = buildImageMap();
  console.log(`Immagini locali: ${Object.keys(imageMap).length}`);

  const posts = await getAllPosts();
  const missing = posts.filter(p => !p.feature_image);
  console.log(`Post totali: ${posts.length} | Senza immagine: ${missing.length}\n`);

  let matched = 0, notFound = 0, errors = 0;

  for (const post of missing) {
    const imgUrl = imageMap[post.slug];
    if (!imgUrl) {
      notFound++;
      continue;
    }
    if (DRY_RUN) {
      console.log(`  ~ ${post.slug} → ${imgUrl.split('/').pop()}`);
      matched++;
      continue;
    }
    const updatedAt = await getUpdatedAt(post.id);
    if (!updatedAt) { errors++; continue; }
    const result = await setFeatureImage(post.id, updatedAt, imgUrl);
    if (result.posts?.[0]) {
      console.log(`  ✓ ${post.slug}`);
      matched++;
    } else {
      console.log(`  ✗ ${post.slug}:`, JSON.stringify(result).substring(0, 120));
      errors++;
    }
    await new Promise(r => setTimeout(r, 400)); // ~2.5 req/s
  }

  console.log(`\nImpostati: ${matched} | No match: ${notFound} | Errori: ${errors}`);
}

main().catch(console.error);
