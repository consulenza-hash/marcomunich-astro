/**
 * articoli.ts
 * Lettura articoli .mdoc da GitHub raw (SSR runtime).
 * Usato da [slug].astro (prerender = false).
 *
 * Perché GitHub raw?  →  Il file è disponibile entro secondi dal commit
 * Keystatic, senza attendere alcun rebuild Vercel.
 */

import jsYaml from 'js-yaml';
import Markdoc from '@markdoc/markdoc';

const REPO   = 'consulenza-hash/marcomunich-astro';
const BRANCH = 'main';

export interface Articolo {
  slug:          string;
  titolo:        string;
  descrizione?:  string;
  data?:         string;   // YYYY-MM-DD
  immagine?:     string;   // solo filename, es. "slug.jpg"
  seo_title?:    string;
  seo_description?: string;
  seo_noindex?:  boolean;
  canonical_url?: string;
  schema_faq?:   Array<{ domanda: string; risposta: string }>;
  htmlContent:   string;   // contenuto già convertito in HTML
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function authHeaders(token?: string): Record<string, string> {
  const h: Record<string, string> = { 'User-Agent': 'marcomunich-astro' };
  if (token) h['Authorization'] = `token ${token}`;
  return h;
}

function rawUrl(slug: string): string {
  return `https://raw.githubusercontent.com/${REPO}/${BRANCH}/src/content/articoli/${encodeURIComponent(slug)}/index.mdoc`;
}

function markdownToHtml(md: string): string {
  try {
    const ast  = Markdoc.parse(md);
    const tree = Markdoc.transform(ast, {});
    return Markdoc.renderers.html(tree) as string;
  } catch {
    // fallback: restituisci testo preformattato se markdoc fallisce
    return `<pre>${md.replace(/</g, '&lt;')}</pre>`;
  }
}

function parseMdocRaw(raw: string, slug: string): Articolo {
  // Estrae il blocco frontmatter YAML e il corpo del documento
  const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);

  if (!fmMatch) {
    return { slug, titolo: slug, htmlContent: markdownToHtml(raw) };
  }

  const fm   = (jsYaml.load(fmMatch[1]) as Record<string, any>) ?? {};
  const body = fmMatch[2].trim();

  return {
    slug,
    titolo:          fm.titolo          ?? slug,
    descrizione:     fm.descrizione     ?? undefined,
    data:            fm.data            ? String(fm.data) : undefined,
    immagine:        fm.immagine        ?? undefined,
    seo_title:       fm.seo_title       ?? undefined,
    seo_description: fm.seo_description ?? undefined,
    seo_noindex:     fm.seo_noindex     ?? false,
    canonical_url:   fm.canonical_url   ?? undefined,
    schema_faq:      fm.schema_faq      ?? undefined,
    htmlContent:     markdownToHtml(body),
  };
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Scarica e parsifica un articolo dal repository GitHub.
 * Ritorna null se l'articolo non esiste.
 */
export async function fetchArticolo(
  slug: string,
  token?: string
): Promise<Articolo | null> {
  const url = rawUrl(slug);

  try {
    const res = await fetch(url, {
      headers: authHeaders(token),
      // cache 'no-store' = sempre fresco; Vercel Edge Cache gestisce il TTL
      cache: 'no-store',
    });

    if (!res.ok) return null;

    const raw = await res.text();
    return parseMdocRaw(raw, slug);
  } catch {
    return null;
  }
}

/**
 * Formatta una data YYYY-MM-DD in italiano (es. "3 marzo 2026").
 */
export function formatDataIt(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('it-IT', {
      year:  'numeric',
      month: 'long',
      day:   'numeric',
    });
  } catch {
    return dateStr;
  }
}
