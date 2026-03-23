import type { APIRoute } from 'astro';
import Anthropic from '@anthropic-ai/sdk';
import { EDITORIAL_PLAN_SYSTEM_PROMPT, EDITORIAL_PLAN_TOOL_SCHEMA, buildEditorialPlanUserPrompt } from '../../../lib/social-prompts';


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

  const apiKey = import.meta.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY mancante' }), { status: 500, headers });
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

  // Leggi articolo da GitHub
  const filePath = `src/content/articoli/${slug}/index.mdoc`;
  const ghHeaders = {
    Authorization: `token ${ghToken}`,
    Accept: 'application/vnd.github.v3+json',
  };

  let articolo: { titolo: string; corpo: string };
  try {
    const res = await fetch(
      `https://api.github.com/repos/consulenza-hash/marcomunich-astro/contents/${filePath}?ref=main`,
      { headers: ghHeaders }
    );
    if (!res.ok) throw new Error(`GitHub ${res.status}`);
    const data = await res.json() as { content: string };
    const content = Buffer.from(data.content, 'base64').toString('utf-8');

    const titMatch = content.match(/^titolo:\s*"?([^"\n]+)"?/m);
    const titolo = titMatch?.[1]?.replace(/\\"/g, '"') ?? slug;
    const parts = content.split(/^---$/m);
    const corpo = parts.length >= 3 ? parts.slice(2).join('---').trim() : '';

    articolo = { titolo, corpo };
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: `Errore lettura articolo: ${err.message}` }),
      { status: 500, headers }
    );
  }

  const siteUrl = import.meta.env.SITE_URL || 'https://marcomunich.com';
  const articleUrl = `${siteUrl}/${slug}`;

  // Genera piano editoriale con Claude
  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: EDITORIAL_PLAN_SYSTEM_PROMPT,
      tools: [EDITORIAL_PLAN_TOOL_SCHEMA],
      tool_choice: { type: 'tool', name: 'genera_piano_editoriale' },
      messages: [{
        role: 'user',
        content: buildEditorialPlanUserPrompt(articolo.titolo, articolo.corpo, articleUrl),
      }],
    });

    const toolBlock = response.content.find(b => b.type === 'tool_use');
    if (!toolBlock || toolBlock.type !== 'tool_use') {
      return new Response(
        JSON.stringify({ error: 'Claude non ha generato il piano (nessun tool_use)' }),
        { status: 500, headers }
      );
    }

    const result = toolBlock.input as { piano: Array<{
      giorno: number;
      tipo: string;
      testo_grafica: string;
      x_post: string;
      linkedin_post: string;
      facebook_post: string;
      instagram_caption: string;
    }> };

    return new Response(JSON.stringify({
      piano: result.piano,
      titolo: articolo.titolo,
      slug,
      articleUrl,
    }), { headers });

  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: `Errore Claude: ${err.message}` }),
      { status: 500, headers }
    );
  }
};
