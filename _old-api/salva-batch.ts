import type { APIRoute } from 'astro';


function buildMdoc(art: Record<string, any>, existingTitolo: string, existingCorpo: string, existingImmagine = '', existingData = ''): string {
  const titolo    = (art.titolo   && art.titolo   !== 'null') ? art.titolo   : existingTitolo;
  const corpo     = (art.corpo    && art.corpo    !== 'null') ? art.corpo    : existingCorpo;
  const descr     = (art.descrizione && art.descrizione !== 'null') ? art.descrizione : '';
  const seoTitle  = (art.seo_title && art.seo_title !== 'null') ? art.seo_title : null;
  const seoDescr  = (art.seo_description && art.seo_description !== 'null') ? art.seo_description : null;
  const immagine  = existingImmagine || null;
  const faqs      = Array.isArray(art.schema_faq) ? art.schema_faq : [];
  const today     = new Date().toISOString().split('T')[0];
  const data      = existingData || today;

  const esc = (s: string) => String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');

  let yaml = `---\n`;
  yaml += `titolo: "${esc(titolo)}"\n`;
  yaml += `descrizione: "${esc(descr)}"\n`;
  yaml += `data: ${data}\n`;
  if (immagine) yaml += `immagine: ${immagine}\n`;
  if (seoTitle) yaml += `seo_title: "${esc(seoTitle)}"\n`;
  if (seoDescr) yaml += `seo_description: "${esc(seoDescr)}"\n`;
  yaml += `seo_noindex: false\n`;

  if (faqs.length > 0) {
    yaml += `schema_faq:\n`;
    for (const faq of faqs) {
      if (faq?.domanda && faq?.risposta) {
        yaml += `  - domanda: "${esc(String(faq.domanda))}"\n`;
        yaml += `    risposta: "${esc(String(faq.risposta))}"\n`;
      }
    }
  }

  yaml += `---\n\n`;
  return yaml + (corpo ?? '');
}

/**
 * Accepts an array of articles and commits them ALL in a single Git commit.
 * Uses the GitHub Git Trees API to avoid 1-commit-per-article.
 *
 * Body: { articles: Array<{ slug, art, modo, existing_titolo, existing_corpo, existing_immagine, existing_data }> }
 */
export const POST: APIRoute = async ({ request }) => {
  const headers = { 'Content-Type': 'application/json' };

  // Auth
  const cookie  = request.headers.get('cookie') ?? '';
  const rawAuth = cookie.split(';').find(c => c.trim().startsWith('stats_auth='))?.split('=')[1]?.trim() ?? '';
  const statsAuth   = decodeURIComponent(rawAuth);
  const expectedPwd = (import.meta.env.STATS_PASSWORD || 'stats2024').trim();
  if (statsAuth !== expectedPwd) {
    return new Response(JSON.stringify({ error: 'Non autorizzato' }), { status: 401, headers });
  }

  const ghToken = import.meta.env.GITHUB_TOKEN;
  if (!ghToken) {
    return new Response(JSON.stringify({ error: 'GITHUB_TOKEN mancante' }), { status: 500, headers });
  }

  let body: {
    articles: Array<{
      slug: string;
      art: Record<string, any>;
      modo: string;
      existing_titolo?: string;
      existing_corpo?: string;
      existing_immagine?: string;
      existing_data?: string;
    }>;
  };
  try { body = await request.json(); }
  catch { return new Response(JSON.stringify({ error: 'JSON non valido' }), { status: 400, headers }); }

  const { articles } = body;
  if (!articles || !articles.length) {
    return new Response(JSON.stringify({ error: 'Nessun articolo da salvare' }), { status: 400, headers });
  }

  const ghHeaders = {
    Authorization: `token ${ghToken}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  const repo = 'consulenza-hash/marcomunich-astro';

  try {
    // 1. Get the SHA of the latest commit on main
    const refRes = await fetch(`https://api.github.com/repos/${repo}/git/ref/heads/main`, { headers: ghHeaders });
    if (!refRes.ok) throw new Error(`Ref lookup failed: ${refRes.status}`);
    const refData = await refRes.json() as { object: { sha: string } };
    const latestCommitSha = refData.object.sha;

    // 2. Get the tree SHA of that commit
    const commitRes = await fetch(`https://api.github.com/repos/${repo}/git/commits/${latestCommitSha}`, { headers: ghHeaders });
    if (!commitRes.ok) throw new Error(`Commit lookup failed: ${commitRes.status}`);
    const commitData = await commitRes.json() as { tree: { sha: string } };
    const baseTreeSha = commitData.tree.sha;

    // 3. Create blobs for each article
    const treeItems: Array<{ path: string; mode: string; type: string; sha: string }> = [];

    for (const item of articles) {
      const { slug, art, existing_titolo = '', existing_corpo = '', existing_immagine = '', existing_data = '' } = item;
      const mdocContent = buildMdoc(art, existing_titolo, existing_corpo, existing_immagine, existing_data);
      const filePath = `src/content/articoli/${slug}/index.mdoc`;

      // Create blob
      const blobRes = await fetch(`https://api.github.com/repos/${repo}/git/blobs`, {
        method: 'POST',
        headers: ghHeaders,
        body: JSON.stringify({ content: mdocContent, encoding: 'utf-8' }),
      });
      if (!blobRes.ok) throw new Error(`Blob creation failed for ${slug}: ${blobRes.status}`);
      const blobData = await blobRes.json() as { sha: string };

      treeItems.push({
        path: filePath,
        mode: '100644',
        type: 'blob',
        sha: blobData.sha,
      });
    }

    // 4. Create a new tree with all the blobs
    const treeRes = await fetch(`https://api.github.com/repos/${repo}/git/trees`, {
      method: 'POST',
      headers: ghHeaders,
      body: JSON.stringify({ base_tree: baseTreeSha, tree: treeItems }),
    });
    if (!treeRes.ok) throw new Error(`Tree creation failed: ${treeRes.status}`);
    const treeData = await treeRes.json() as { sha: string };

    // 5. Create a single commit
    const newCommitRes = await fetch(`https://api.github.com/repos/${repo}/git/commits`, {
      method: 'POST',
      headers: ghHeaders,
      body: JSON.stringify({
        message: `feat: batch rewrite ${articles.length} articoli`,
        tree: treeData.sha,
        parents: [latestCommitSha],
      }),
    });
    if (!newCommitRes.ok) throw new Error(`Commit creation failed: ${newCommitRes.status}`);
    const newCommitData = await newCommitRes.json() as { sha: string };

    // 6. Update main ref to point to the new commit
    const updateRefRes = await fetch(`https://api.github.com/repos/${repo}/git/refs/heads/main`, {
      method: 'PATCH',
      headers: ghHeaders,
      body: JSON.stringify({ sha: newCommitData.sha }),
    });
    if (!updateRefRes.ok) throw new Error(`Ref update failed: ${updateRefRes.status}`);

    return new Response(JSON.stringify({
      success: true,
      count: articles.length,
      commit: newCommitData.sha,
    }), { headers });

  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Errore batch commit' }),
      { status: 500, headers }
    );
  }
};
