import type { APIRoute } from 'astro';


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

  const ghHeaders = {
    Authorization: `token ${ghToken}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  const repo = 'consulenza-hash/marcomunich-astro';
  const filePath = `src/content/articoli/${slug}/index.mdoc`;

  // Get current file SHA
  const checkRes = await fetch(
    `https://api.github.com/repos/${repo}/contents/${filePath}?ref=main`,
    { headers: ghHeaders }
  );

  if (!checkRes.ok) {
    return new Response(JSON.stringify({ error: `Articolo non trovato: ${slug}` }), { status: 404, headers });
  }

  const existing = await checkRes.json() as { sha: string };

  // Delete the file
  const deleteRes = await fetch(
    `https://api.github.com/repos/${repo}/contents/${filePath}`,
    {
      method: 'DELETE',
      headers: ghHeaders,
      body: JSON.stringify({
        message: `delete: rimozione articolo "${slug}"`,
        sha: existing.sha,
        branch: 'main',
      }),
    }
  );

  if (!deleteRes.ok) {
    const errText = await deleteRes.text();
    return new Response(
      JSON.stringify({ error: `GitHub ${deleteRes.status}: ${errText.substring(0, 200)}` }),
      { status: 500, headers }
    );
  }

  return new Response(JSON.stringify({ success: true, slug }), { headers });
};
