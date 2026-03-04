/**
 * wordpress.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Libreria centralizzata per tutte le chiamate alla WordPress REST API.
 * Tutte le fetch avvengono a BUILD TIME: Astro genera pagine statiche,
 * quindi WordPress non viene interrogato dagli utenti finali.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import imageMapping from '../data/imageMapping.json' assert { type: 'json' };

const WP_API = 'https://marcomunich.com/wp-json/wp/v2';

// ── Utility: fetch con gestione errori ────────────────────────────────────────
async function wpFetch(endpoint, fallback = []) {
  const url = `${WP_API}${endpoint}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!res.ok) {
      console.warn(`[WP API] ${res.status} — ${url}`);
      return fallback;
    }
    return res.json();
  } catch (err) {
    console.warn(`[WP API] fetch failed — ${url}:`, err.message);
    return fallback;
  }
}

// ── ARTICOLI ──────────────────────────────────────────────────────────────────

/**
 * Recupera TUTTI gli articoli pubblicati (pagina per pagina finché finiscono).
 * WordPress limita a 100 per chiamata, quindi iteriamo.
 */
export async function getAllPosts() {
  let page = 1;
  let allPosts = [];

  while (true) {
    const posts = await wpFetch(
      `/posts?per_page=100&page=${page}&status=publish&_embed=true`
    );
    if (!posts.length) break;
    allPosts = allPosts.concat(posts);
    if (posts.length < 100) break;
    page++;
  }

  return allPosts;
}

/**
 * Recupera un singolo articolo tramite slug.
 */
export async function getPostBySlug(slug) {
  const posts = await wpFetch(`/posts?slug=${slug}&_embed=true`);
  return posts[0] ?? null;
}

/**
 * Recupera gli ultimi N articoli (per homepage, widget sidebar, ecc.).
 */
export async function getLatestPosts(count = 3) {
  return wpFetch(
    `/posts?per_page=${count}&status=publish&orderby=date&order=desc&_embed=true`
  );
}

/**
 * Recupera articoli per categoria (tramite category ID o slug).
 */
export async function getPostsByCategory(categoryId, count = 100) {
  return wpFetch(
    `/posts?categories=${categoryId}&per_page=${count}&status=publish&_embed=true`
  );
}

/**
 * Recupera articoli correlati (stessa categoria, escludendo l'articolo corrente).
 */
export async function getRelatedPosts(currentPostId, categoryIds = [], count = 3) {
  if (!categoryIds.length) return [];
  const catParam = categoryIds.join(',');
  const posts = await wpFetch(
    `/posts?categories=${catParam}&per_page=${count + 1}&status=publish&_embed=true&exclude=${currentPostId}`
  );
  return posts.slice(0, count);
}

// ── CATEGORIE ─────────────────────────────────────────────────────────────────

/**
 * Recupera tutte le categorie con almeno 1 articolo.
 */
export async function getAllCategories() {
  return wpFetch('/categories?per_page=100&hide_empty=true');
}

/**
 * Recupera una singola categoria tramite slug.
 */
export async function getCategoryBySlug(slug) {
  const cats = await wpFetch(`/categories?slug=${slug}`);
  return cats[0] ?? null;
}
// ── TAG ───────────────────────────────────────────────────────────────────────

/**
 * Recupera tutti i tag con almeno 1 articolo.
 */
export async function getAllTags() {
  return wpFetch('/tags?per_page=100&hide_empty=true');
}

/**
 * Recupera un singolo tag tramite slug.
 */
export async function getTagBySlug(slug) {
  const tags = await wpFetch(`/tags?slug=${slug}`);
  return tags[0] ?? null;
}

// ── PAGINE ────────────────────────────────────────────────────────────────────

/**
 * Recupera una pagina tramite slug.
 */
export async function getPageBySlug(slug) {
  const pages = await wpFetch(`/pages?slug=${slug}&_embed=true`, []);
  return pages[0] ?? null;
}

// ── MEDIA ─────────────────────────────────────────────────────────────────────

/**
 * Estrae l'URL dell'immagine in evidenza da un post (già embedded con _embed=true).
 * Restituisce l'URL della dimensione richiesta, o quella full se non disponibile.
 */
export function getFeaturedImageUrl(post, size = 'medium_large') {
  try {
    const media = post?._embedded?.['wp:featuredmedia']?.[0];
    if (!media) return null;
    // Usa immagine locale se disponibile (indipendente da WP)
    const localPath = imageMapping[media.id];
    if (localPath) return localPath;
    // Fallback: URL WP (durante sviluppo o se media non ancora scaricato)
    return (
      media?.media_details?.sizes?.[size]?.source_url ??
      media?.media_details?.sizes?.full?.source_url ??
      media?.source_url ??
      null
    );
  } catch {
    return null;
  }
}

/**
 * Estrae il nome della categoria principale di un post (già embedded).
 */
export function getPrimaryCategory(post) {
  try {
    const terms = post?._embedded?.['wp:term']?.[0];
    return terms?.[0] ?? null;
  } catch {
    return null;
  }
}

/**
 * Formatta una data ISO in italiano: "3 Marzo 2026"
 */
export function formatDate(isoDate) {
  return new Date(isoDate).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
