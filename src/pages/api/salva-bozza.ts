import type { APIRoute } from 'astro';

export const prerender = false;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

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

export const POST: APIRoute = async ({ request }) => {
  const headers = { 'Content-Type': 'application/json' };

  // Auth
  const cookie      = request.headers.get('cookie') ?? '';
  const rawAuth = cookie.split(';').find(c => c.trim().startsWith('stats_auth='))?.split('=')[1]?.trim() ?? '';
  const statsAuth   = decodeURIComponent(rawAuth);
  const expectedPwd = import.meta.env.STATS_PASSWORD || 'stats2024';
  if (statsAuth !== expectedPwd) {
    return new Response(JSON.stringify({ error: 'Non autorizzato' }), { status: 401, headers });
  }

  const ghToken = import.meta.env.GITHUB_TOKEN;
  if (!ghToken) {
    return new Response(JSON.stringify({ error: 'GITHUB_TOKEN mancante' }), { status: 500, headers });
  }

  let body: {
    art: Record<string, any>;
    modo: string;
    slug_esistente?: string;
    existing_titolo?: string;
    existing_corpo?: string;
    existing_immagine?: string;
    existing_data?: string;
  };
  try { body = await request.json(); }
  catch { return new Response(JSON.stringify({ error: 'JSON non valido' }), { status: 400, headers }); }

  const { art, modo, slug_esistente, existing_titolo = '', existing_corpo = '', existing_immagine = '', existing_data = '' } = body;

  // Determina slug finale:
  // - Se c'è un articolo esistente E il modo è "solo-metadati" oppure si vuole
  //   sovrascrivere → usa sempre lo slug esistente
  // - Altrimenti usa il slug generato dall'AI
  let slug: string;
  if (slug_esistente) {
    slug = slug_esistente; // Sovrascrive sempre l'articolo originale
  } else {
    const rawSlug = (art.slug && art.slug !== 'null') ? art.slug
                  : (art.titolo && art.titolo !== 'null') ? art.titolo
                  : `articolo-${Date.now()}`;
    slug = slugify(rawSlug);
    if (!slug) slug = `articolo-${Date.now()}`;
  }

  const mdocContent    = buildMdoc(art, existing_titolo, existing_corpo, existing_immagine, existing_data);
  const filePath       = `src/content/articoli/${slug}/index.mdoc`;
  const fileContentB64 = Buffer.from(mdocContent, 'utf-8').toString('base64');

  const ghHeaders = {
    Authorization: `token ${ghToken}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  // Controlla SHA esistente
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
    message: `feat: articolo AI "${art.titolo || slug}" [${modo}]`,
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

  const keystatic_url = `/keystatic/branch/main/collections/articoli`;
  return new Response(JSON.stringify({ success: true, slug, keystatic_url }), { headers });
};
