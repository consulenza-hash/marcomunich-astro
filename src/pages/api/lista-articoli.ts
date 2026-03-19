import type { APIRoute } from 'astro';
import fs from 'fs';
import path from 'path';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const headers = { 'Content-Type': 'application/json' };

  const cookie    = request.headers.get('cookie') ?? '';
  const rawAuth   = cookie.split(';').find(c => c.trim().startsWith('stats_auth='))?.split('=')[1]?.trim() ?? '';
  const statsAuth = decodeURIComponent(rawAuth);
  const expectedPwd = (import.meta.env.STATS_PASSWORD || 'stats2024').trim();
  if (statsAuth !== expectedPwd) {
    return new Response(JSON.stringify({ error: 'Non autorizzato' }), { status: 401, headers });
  }

  try {
    const articoliDir = path.join(process.cwd(), 'src', 'content', 'articoli');
    const entries = fs.readdirSync(articoliDir, { withFileTypes: true });
    const articoli = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const mdocPath = path.join(articoliDir, entry.name, 'index.mdoc');
      if (!fs.existsSync(mdocPath)) continue;
      const testo = fs.readFileSync(mdocPath, 'utf-8');
      const titoloMatch = testo.match(/^titolo:\s*"?([^"\n]+)"?/m);
      const titolo = titoloMatch?.[1]?.replace(/\\"/g, '"') ?? entry.name;
      const dataMatch = testo.match(/^data:\s*(.+)$/m);
      const data = dataMatch?.[1]?.trim() ?? '';
      const hasImmagine = /^immagine:\s*.+$/m.test(testo);
      articoli.push({ slug: entry.name, titolo, data, hasImmagine });
    }

    articoli.sort((a, b) => (b.data > a.data ? 1 : -1));
    return new Response(JSON.stringify(articoli), { headers });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
  }
};
