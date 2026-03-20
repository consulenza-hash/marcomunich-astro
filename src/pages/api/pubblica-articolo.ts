import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const headers = { 'Content-Type': 'application/json' };

  // Auth
  const cookie = request.headers.get('cookie') ?? '';
  const rawAuth = cookie.split(';').find(c => c.trim().startsWith('stats_auth='))?.split('=')[1]?.trim() ?? '';
  const statsAuth = decodeURIComponent(rawAuth);
  const expectedPwd = (import.meta.env.STATS_PASSWORD || 'stats2024').trim();
  if (statsAuth !== expectedPwd) {
    return new Response(JSON.stringify({ error: 'Non autorizzato' }), { status: 401, headers });
  }

  const ghToken = import.meta.env.GITHUB_TOKEN;
  if (!ghToken) {
    return new Response(JSON.stringify({ error: 'GITHUB_TOKEN mancante' }), { status: 500, headers });
  }

  let body: { slug: string };
  try { body = await request.json(); }
  catch { return new Response(JSON.stringify({ error: 'JSON non valido' }), { status: 400, headers }); }

  const { slug } = body;
  if (!slug) {
    return new Response(JSON.stringify({ error: 'slug obbligatorio' }), { status: 400, headers });
  }

  const ghHeaders: Record<string, string> = {
    Authorization: `token ${ghToken}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  const repo = 'consulenza-hash/marcomunich-astro';
  const filePath = `src/content/articoli/${slug}/index.mdoc`;

  // Get current file
  const checkRes = await fetch(
    `https://api.github.com/repos/${repo}/contents/${filePath}?ref=main`,
    { headers: ghHeaders }
  );

  if (!checkRes.ok) {
    return new Response(JSON.stringify({ error: `Articolo non trovato: ${slug}` }), { status: 404, headers });
  }

  const existing = await checkRes.json() as { sha: string; content: string };
  const content = Buffer.from(existing.content, 'base64').toString('utf-8');

  // Remove bozza: true line
  const newContent = content.replace(/^bozza:\s*true\n?/m, '');

  if (newContent === content) {
    // Already published
    return new Response(JSON.stringify({ success: true, slug, message: 'Già pubblicato' }), { headers });
  }

  const newB64 = Buffer.from(newContent, 'utf-8').toString('base64');

  const putRes = await fetch(
    `https://api.github.com/repos/${repo}/contents/${filePath}`,
    {
      method: 'PUT',
      headers: ghHeaders,
      body: JSON.stringify({
        message: `publish: pubblica articolo "${slug}"`,
        content: newB64,
        sha: existing.sha,
        branch: 'main',
      }),
    }
  );

  if (!putRes.ok) {
    const errText = await putRes.text();
    return new Response(
      JSON.stringify({ error: `GitHub ${putRes.status}: ${errText.substring(0, 200)}` }),
      { status: 500, headers }
    );
  }

  return new Response(JSON.stringify({ success: true, slug }), { headers });
};
