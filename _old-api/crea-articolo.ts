import type { APIRoute } from 'astro';
import Anthropic from '@anthropic-ai/sdk';


// ── Stile assoluto (stesso di genera.ts) ─────────────────────────────────────
const SISTEMA = `Sei un ghostwriter italiano esperto. Scrivi sempre in italiano naturale seguendo queste regole assolute:

Genera testo in italiano naturale, senza strutture "non X ma Y" e senza "non è… è…". Questo vincolo è assoluto e si applica a ogni variante della costruzione. Qualsiasi frase che definisca qualcosa negando prima il suo opposto va eliminata e riscritta affermando direttamente ciò che si vuole dire.

Evita triplette (tre aggettivi, tre verbi, tre stati). Elimina meta-frasi che commentano il testo ("è importante", "è chiaro", "è giusto partire da…"). Evita astratti non supportati da dettagli concreti. Preferisci scene brevi, azioni e conseguenze verificabili. Chiudi con un fatto o una decisione pratica.

Il ritmo del testo deve essere discorsivo e fluido: ogni pensiero si sviluppa per almeno tre o quattro righe prima di chiudersi. Evita il ritmo telegrafico dove ogni frase breve finisce con un punto. Il testo deve scorrere come un articolo scritto da una persona che ragiona mentre scrive.

Risultato: testo specifico, asciutto, credibile, con pochi aggettivi, zero enfasi artificiale, ritmo disteso e niente emdash.

IMPORTANTE: Rispondi SEMPRE e SOLO con un oggetto JSON valido. Nessun testo prima o dopo il JSON. Nessun markdown wrapper. Solo il JSON grezzo.`;

// ── Slugify ──────────────────────────────────────────────────────────────────
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

// ── Prompt builder ────────────────────────────────────────────────────────────
function buildPrompt(modo: string, input: string, isNew: boolean): string {
  const faqSchema = `[{"domanda": "Domanda 1?", "risposta": "Risposta 1."}, {"domanda": "Domanda 2?", "risposta": "Risposta 2."}, {"domanda": "Domanda 3?", "risposta": "Risposta 3."}]`;

  if (modo === 'solo-articolo') {
    if (isNew) {
      return `Genera un articolo completo in italiano basato su questo tema.

Rispondi SOLO con questo JSON (nessun testo aggiuntivo):
{"titolo":"Titolo completo dell'articolo","slug":"titolo-slug-url-friendly","descrizione":"Descrizione breve 1-2 frasi max 160 caratteri","corpo":"Corpo articolo completo in markdown con ### per sottotitoli e paragrafi di almeno 4-6 righe","seo_title":null,"seo_description":null,"schema_faq":[]}

TEMA:
${input}`;
    } else {
      return `Riscrivi questo articolo con un testo completamente nuovo ma sullo stesso tema.

Rispondi SOLO con questo JSON:
{"titolo":"Nuovo titolo","slug":"nuovo-titolo-slug","descrizione":"Descrizione breve","corpo":"Articolo riscritto completo in markdown","seo_title":null,"seo_description":null,"schema_faq":[]}

ARTICOLO ORIGINALE:
${input}`;
    }
  }

  if (modo === 'solo-metadati') {
    return `Analizza questo articolo e genera SOLO i metadati SEO/AEO/GEO. Non riscrivere il testo.

Rispondi SOLO con questo JSON:
{"titolo":null,"slug":null,"descrizione":"Descrizione breve ottimizzata per SEO","corpo":null,"seo_title":"SEO Title max 60 caratteri","seo_description":"Meta description max 155 caratteri","schema_faq":${faqSchema}}

ARTICOLO:
${input}`;
  }

  if (modo === 'tutto-completo') {
    if (isNew) {
      return `Genera un articolo completo in italiano con tutti i metadati SEO/AEO/GEO.

Rispondi SOLO con questo JSON:
{"titolo":"Titolo completo","slug":"titolo-slug-url-friendly","descrizione":"Descrizione breve 1-2 frasi","corpo":"Articolo completo in markdown con ### per sottotitoli, paragrafi di 4-6 righe, almeno 600 parole","seo_title":"SEO Title max 60 caratteri","seo_description":"Meta description max 155 caratteri","schema_faq":${faqSchema}}

TEMA/PROMPT:
${input}`;
    } else {
      return `Riscrivi completamente questo articolo e genera tutti i metadati SEO/AEO/GEO.

Rispondi SOLO con questo JSON:
{"titolo":"Nuovo titolo","slug":"nuovo-titolo-slug","descrizione":"Descrizione breve","corpo":"Articolo completo riscritto in markdown","seo_title":"SEO Title max 60 caratteri","seo_description":"Meta description max 155 caratteri","schema_faq":${faqSchema}}

ARTICOLO ORIGINALE:
${input}`;
    }
  }

  throw new Error(`Modalità non valida: ${modo}`);
}

// ── Costruisce il file .mdoc ──────────────────────────────────────────────────
function buildMdoc(art: Record<string, any>, existingTitolo: string, existingCorpo: string): string {
  const titolo   = (art.titolo   && art.titolo   !== 'null') ? art.titolo   : existingTitolo;
  const corpo    = (art.corpo    && art.corpo    !== 'null') ? art.corpo    : existingCorpo;
  const descr    = (art.descrizione && art.descrizione !== 'null') ? art.descrizione : '';
  const seoTitle = (art.seo_title && art.seo_title !== 'null') ? art.seo_title : null;
  const seoDescr = (art.seo_description && art.seo_description !== 'null') ? art.seo_description : null;
  const faqs     = Array.isArray(art.schema_faq) ? art.schema_faq : [];
  const today    = new Date().toISOString().split('T')[0];

  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

  let yaml = `---\n`;
  yaml += `titolo: "${esc(titolo)}"\n`;
  yaml += `descrizione: "${esc(descr)}"\n`;
  yaml += `data: ${today}\n`;
  if (seoTitle)  yaml += `seo_title: "${esc(seoTitle)}"\n`;
  if (seoDescr)  yaml += `seo_description: "${esc(seoDescr)}"\n`;
  yaml += `seo_noindex: false\n`;
  yaml += `bozza: true\n`;

  if (faqs.length > 0) {
    yaml += `schema_faq:\n`;
    for (const faq of faqs) {
      if (faq.domanda && faq.risposta) {
        yaml += `  - domanda: "${esc(String(faq.domanda))}"\n`;
        yaml += `    risposta: "${esc(String(faq.risposta))}"\n`;
      }
    }
  }

  yaml += `---\n\n`;
  return yaml + (corpo ?? '');
}

// ── API Route ─────────────────────────────────────────────────────────────────
export const POST: APIRoute = async ({ request }) => {
  const headers = { 'Content-Type': 'application/json' };

  // Auth
  const cookie     = request.headers.get('cookie') ?? '';
  const rawAuth = cookie.split(';').find(c => c.trim().startsWith('stats_auth='))?.split('=')[1]?.trim() ?? '';
  const statsAuth   = decodeURIComponent(rawAuth);
  const expectedPwd = import.meta.env.STATS_PASSWORD || 'stats2024';
  if (statsAuth !== expectedPwd) {
    return new Response(JSON.stringify({ error: 'Non autorizzato' }), { status: 401, headers });
  }

  const apiKey  = import.meta.env.ANTHROPIC_API_KEY;
  const ghToken = import.meta.env.GITHUB_TOKEN;
  if (!apiKey)  return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY mancante' }), { status: 500, headers });
  if (!ghToken) return new Response(JSON.stringify({ error: 'GITHUB_TOKEN mancante' }), { status: 500, headers });

  // Parse body
  let body: { modo: string; prompt?: string; slug_esistente?: string };
  try { body = await request.json(); }
  catch { return new Response(JSON.stringify({ error: 'JSON non valido' }), { status: 400, headers }); }

  const { modo, prompt, slug_esistente } = body;
  if (!modo) return new Response(JSON.stringify({ error: 'Parametro modo mancante' }), { status: 400, headers });

  const isNew = !slug_esistente;
  let inputText      = prompt ?? '';
  let existingTitolo = '';
  let existingCorpo  = '';
  let existingMdoc   = '';

  // ── Carica articolo esistente da GitHub ──────────────────────────────────
  if (slug_esistente) {
    const ghRes = await fetch(
      `https://api.github.com/repos/consulenza-hash/marcomunich-astro/contents/src/content/articoli/${encodeURIComponent(slug_esistente)}/index.mdoc?ref=main`,
      { headers: { Authorization: `token ${ghToken}`, Accept: 'application/vnd.github.v3+json' } }
    );
    if (!ghRes.ok) return new Response(JSON.stringify({ error: `GitHub ${ghRes.status} — articolo non trovato` }), { status: 500, headers });

    const { content } = await ghRes.json() as { content: string };
    existingMdoc = Buffer.from(content, 'base64').toString('utf-8');
    inputText = existingMdoc;

    const titleMatch = existingMdoc.match(/^titolo:\s*"?([^"\n]+)"?/m);
    existingTitolo = titleMatch?.[1]?.replace(/\\"/g, '"') ?? slug_esistente;

    const parts = existingMdoc.split(/^---$/m);
    existingCorpo = parts.length >= 3 ? parts.slice(2).join('---').trim() : '';
  } else if (!prompt?.trim()) {
    return new Response(JSON.stringify({ error: 'Inserisci un prompt o seleziona un articolo esistente' }), { status: 400, headers });
  }

  // ── Chiama Claude ─────────────────────────────────────────────────────────
  const client = new Anthropic({ apiKey });
  let rawResponse = '';

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      system: SISTEMA,
      messages: [{ role: 'user', content: buildPrompt(modo, inputText, isNew) }],
    });
    rawResponse = message.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('');
  } catch (e: any) {
    return new Response(JSON.stringify({ error: `Errore Claude: ${e.message}` }), { status: 500, headers });
  }

  // ── Parsa JSON dalla risposta ─────────────────────────────────────────────
  let art: Record<string, any>;
  try {
    // Remove potential markdown code blocks
    const cleaned = rawResponse
      .replace(/^```(?:json)?\s*/m, '')
      .replace(/\s*```\s*$/m, '')
      .trim();
    // Find first { ... } block
    const start = cleaned.indexOf('{');
    const end   = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('Nessun JSON trovato');
    art = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return new Response(JSON.stringify({
      error: 'Impossibile parsare il JSON da Claude',
      raw: rawResponse.substring(0, 300),
    }), { status: 500, headers });
  }

  // ── Determina slug finale ─────────────────────────────────────────────────
  let slug: string;
  if (modo === 'solo-metadati' && slug_esistente) {
    slug = slug_esistente;
  } else {
    const rawSlug = (art.slug && art.slug !== 'null') ? art.slug
                  : (art.titolo && art.titolo !== 'null') ? art.titolo
                  : `articolo-${Date.now()}`;
    slug = slugify(rawSlug);
    if (!slug) slug = `articolo-${Date.now()}`;
  }

  // ── Costruisce il contenuto .mdoc ─────────────────────────────────────────
  let mdocContent: string;
  if (modo === 'solo-metadati' && slug_esistente) {
    // Merge: preserve corpo originale, update metadata in frontmatter
    mdocContent = buildMdoc(art, existingTitolo, existingCorpo);
  } else {
    mdocContent = buildMdoc(art, existingTitolo, existingCorpo);
  }

  const filePath     = `src/content/articoli/${slug}/index.mdoc`;
  const fileContentB64 = Buffer.from(mdocContent, 'utf-8').toString('base64');
  const ghHeaders = {
    Authorization: `token ${ghToken}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  // ── Controlla se il file esiste già (SHA richiesto per update) ────────────
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
  } catch { /* file non esiste, va bene */ }

  // ── Crea o aggiorna file su GitHub ────────────────────────────────────────
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
    return new Response(JSON.stringify({ error: `GitHub PUT ${putRes.status}: ${errText}` }), { status: 500, headers });
  }

  const keystatic_url = `/keystatic/branch/main/collections/articoli/item/${slug}`;
  return new Response(JSON.stringify({ success: true, slug, keystatic_url }), { headers });
};
