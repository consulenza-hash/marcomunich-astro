import type { APIRoute } from 'astro';

export const prerender = false;

// Risolto da Vite a build time, bundlato nella funzione serverless
const rawFiles = import.meta.glob('/src/content/articoli/*/index.mdoc', {
  eager: true,
  as: 'raw',
}) as Record<string, string>;

export const GET: APIRoute = async ({ request }) => {
  const headers = { 'Content-Type': 'application/json' };

  const cookie    = request.headers.get('cookie') ?? '';
  const rawAuth   = cookie.split(';').find(c => c.trim().startsWith('stats_auth='))?.split('=')[1]?.trim() ?? '';
  const statsAuth = decodeURIComponent(rawAuth);
  const expectedPwd = (import.meta.env.STATS_PASSWORD || 'stats2024').trim();
  if (statsAuth !== expectedPwd) {
    return new Response(JSON.stringify({ error: 'Non autorizzato' }), { status: 401, headers });
  }

  const articoli = Object.entries(rawFiles).map(([filePath, testo]) => {
    const slug = filePath.match(/\/([^/]+)\/index\.mdoc$/)?.[1] ?? '';
    const titoloMatch = testo.match(/^titolo:\s*"?([^"\n]+)"?/m);
    const titolo = titoloMatch?.[1]?.replace(/\\"/g, '"') ?? slug;
    const dataMatch = testo.match(/^data:\s*(.+)$/m);
    const data = dataMatch?.[1]?.trim() ?? '';
    const hasImmagine = /^immagine:\s*.+$/m.test(testo);
    return { slug, titolo, data, hasImmagine };
  }).sort((a, b) => (b.data > a.data ? 1 : -1));

  return new Response(JSON.stringify(articoli), { headers });
};
