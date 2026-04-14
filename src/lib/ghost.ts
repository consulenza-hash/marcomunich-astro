/**
 * ghost.ts
 * Client Ghost Content API per Astro (build-time fetch).
 *
 * Docs: https://ghost.org/docs/content-api/
 * Admin: https://cms.marcomunich.com/ghost
 */

const GHOST_URL             = import.meta.env.GHOST_URL             ?? 'https://cms.marcomunich.com';
const GHOST_CONTENT_API_KEY = import.meta.env.GHOST_CONTENT_API_KEY ?? '';

// ─── Tipi ────────────────────────────────────────────────────────────────────

export interface GhostPost {
  id:                  string;
  slug:                string;
  title:               string;
  html:                string;
  excerpt?:            string;
  custom_excerpt?:     string;
  feature_image?:      string;
  published_at?:       string;
  meta_title?:         string;
  meta_description?:   string;
  og_image?:           string;
  canonical_url?:      string;
  tags?:               GhostTag[];
  primary_tag?:        GhostTag;
  reading_time?:       number;
  visibility:          string;
  status:              string;
}

export interface GhostTag {
  id:                  string;
  slug:                string;
  name:                string;
  description?:        string;
  feature_image?:      string;
  meta_title?:         string;
  meta_description?:   string;
  visibility:          string;
  url:                 string;
}

// ─── Helper ──────────────────────────────────────────────────────────────────

async function ghostFetch<T>(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<T> {
  if (!GHOST_CONTENT_API_KEY) {
    throw new Error('[ghost.ts] GHOST_CONTENT_API_KEY mancante nel .env');
  }
  const url = new URL(`${GHOST_URL}/ghost/api/content/${endpoint}/`);
  url.searchParams.set('key', GHOST_CONTENT_API_KEY);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), {
    headers: { 'Accept-Version': 'v5.0' },
  });
  if (!res.ok) throw new Error(`[ghost.ts] ${endpoint} → ${res.status}`);
  return res.json() as Promise<T>;
}

// ─── API pubblica ─────────────────────────────────────────────────────────────

/** Tutti gli articoli pubblicati, ordinati per data decrescente. */
export async function getAllPosts(
  extra: Record<string, string> = {}
): Promise<GhostPost[]> {
  const data = await ghostFetch<{ posts: GhostPost[] }>('posts', {
    limit:   'all',
    include: 'tags',
    fields:  'id,slug,title,excerpt,custom_excerpt,feature_image,published_at,meta_title,meta_description,og_image,canonical_url,primary_tag,reading_time,status,visibility',
    filter:  'status:published+visibility:public',
    order:   'published_at desc',
    ...extra,
  });
  return data.posts ?? [];
}

/** Singolo articolo per slug (HTML completo). */
export async function getPostBySlug(slug: string): Promise<GhostPost | null> {
  try {
    const data = await ghostFetch<{ posts: GhostPost[] }>('posts', {
      filter:  `slug:${slug}+status:published`,
      include: 'tags',
      limit:   '1',
    });
    return data.posts?.[0] ?? null;
  } catch {
    return null;
  }
}

/** Tutti i tag pubblici. */
export async function getAllTags(): Promise<GhostTag[]> {
  const data = await ghostFetch<{ tags: GhostTag[] }>('tags', {
    limit:  'all',
    filter: 'visibility:public',
  });
  return data.tags ?? [];
}

/** Articoli per tag. */
export async function getPostsByTag(tagSlug: string): Promise<GhostPost[]> {
  return getAllPosts({
    filter: `tag:${tagSlug}+status:published+visibility:public`,
  });
}

/**
 * Mappa GhostPost → formato Articolo usato dalle pagine esistenti.
 * Compatibilità con articoli.ts e blog/index.astro.
 */
export function ghostPostToArticolo(post: GhostPost) {
  return {
    slug:            post.slug,
    titolo:          post.title,
    descrizione:     post.custom_excerpt ?? post.excerpt ?? undefined,
    data:            post.published_at?.slice(0, 10),
    immagine:        post.feature_image ?? undefined,
    seo_title:       post.meta_title ?? undefined,
    seo_description: post.meta_description ?? undefined,
    seo_image:       post.og_image ?? undefined,
    canonical_url:   post.canonical_url ?? undefined,
    htmlContent:     post.html ?? '',
    categoria:       post.primary_tag?.name ?? '',
    tag:             post.tags?.map(t => t.name) ?? [],
  };
}
