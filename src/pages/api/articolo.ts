import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ url, request }) => {
  // Auth check
  const cookie      = request.headers.get('cookie') ?? '';
  const rawAuth     = cookie.split(';').find(c => c.trim().startsWith('stats_auth='))?.split('=')[1]?.trim() ?? '';
  const statsAuth   = decodeURIComponent(rawAuth);
  const expectedPwd = (import.meta.env.STATS_PASSWORD || 'stats2024').trim();
  if (statsAuth !== expectedPwd) {
    return new Response('Unauthorized', { status: 401 });
  }

  const slug = url.searchParams.get('slug');
  if (!slug) return new Response('Missing slug', { status: 400 });

  const token   = import.meta.env.GITHUB_TOKEN ?? '';
  const headers: Record<string, string> = { Accept: 'application/vnd.github.v3+json' };
  if (token) headers['Authorization'] = `token ${token}`;

  const apiUrl = `https://api.github.com/repos/consulenza-hash/marcomunich-astro/contents/src/content/articoli/${encodeURIComponent(slug)}/index.mdoc?ref=main`;

  try {
    const res = await fetch(apiUrl, { headers });
    if (!res.ok) return new Response(`GitHub error: ${res.status}`, { status: res.status });

    const json = await res.json() as { content: string };
    // Il contenuto è base64
    const testo = Buffer.from(json.content.replace(/\n/g, ''), 'base64').toString('utf-8');
    return new Response(JSON.stringify({ testo }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(e.message, { status: 500 });
  }
};
