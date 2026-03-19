import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const headers = { 'Content-Type': 'application/json' };

  // Auth
  const cookie    = request.headers.get('cookie') ?? '';
  const rawAuth   = cookie.split(';').find(c => c.trim().startsWith('stats_auth='))?.split('=')[1]?.trim() ?? '';
  const statsAuth = decodeURIComponent(rawAuth);
  const expectedPwd = (import.meta.env.STATS_PASSWORD || 'stats2024').trim();
  if (statsAuth !== expectedPwd) {
    return new Response(JSON.stringify({ error: 'Non autorizzato' }), { status: 401, headers });
  }

  const ghToken = import.meta.env.GITHUB_TOKEN;
  if (!ghToken) {
    return new Response(JSON.stringify({ error: 'GITHUB_TOKEN mancante' }), { status: 500, headers });
  }

  let body: { slug: string; content: string };
  try { body = await request.json(); }
  catch { return new Response(JSON.stringify({ error: 'JSON non valido' }), { status: 400, headers }); }

  const { slug, content } = body;
  if (!slug || !content) {
    return new Response(JSON.stringify({ error: 'slug e content obbligatori' }), { status: 400, headers });
  }

  const filePath       = `src/content/articoli/${slug}/index.mdoc`;
  const fileContentB64 = Buffer.from(content, 'utf-8').toString('base64');

  const ghHeaders = {
    Authorization: `token ${ghToken}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  // Recupera SHA corrente
  let existingSha: string | undefined;
  try {
    const checkRes = await fetch(
      `https://api.github.com/repos/consulenza-hash/marcomunich-astro/contents/${filePath}?ref=main`,
      { headers: ghHeaders }
    );
    if (checkRes.ok) {
      const existing = await checkRes.json() as { sha: string };
      existingSha = existing.sha;
    }
  } catch { /* file non esiste */ }

  const commitPayload: Record<string, any> = {
    message: `revert: ripristino versione originale "${slug}"`,
    content: fileContentB64,
    branch: 'main',
  };
  if (existingSha) commitPayload.sha = existingSha;

  const putRes = await fetch(
    `https://api.github.com/repos/consulenza-hash/marcomunich-astro/contents/${filePath}`,
    { method: 'PUT', headers: ghHeaders, body: JSON.stringify(commitPayload) }
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
