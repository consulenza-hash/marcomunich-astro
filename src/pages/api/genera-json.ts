import type { APIRoute } from 'astro';
import Anthropic from '@anthropic-ai/sdk';

export const prerender = false;

// ── Sistema: stesso stile di genera.ts + vincolo JSON ────────────────────────
const SISTEMA = `Sei un ghostwriter italiano esperto. Scrivi sempre in italiano naturale seguendo queste regole assolute:

Genera testo in italiano naturale, senza strutture "non X ma Y" e senza "non è… è…". Qualsiasi frase che definisca qualcosa negando prima il suo opposto va eliminata e riscritta affermando direttamente ciò che si vuole dire.

Evita triplette (tre aggettivi, tre verbi, tre stati). Elimina meta-frasi che commentano il testo ("è importante", "è chiaro", "è giusto partire da…"). Preferisci scene brevi, azioni e conseguenze verificabili. Chiudi con un fatto o una decisione pratica.

Il ritmo del testo deve essere discorsivo e fluido: ogni pensiero si sviluppa per almeno tre o quattro righe prima di chiudersi. Evita il ritmo telegrafico dove ogni frase breve finisce con un punto.

Risultato: testo specifico, asciutto, credibile, con pochi aggettivi, zero enfasi artificiale, ritmo disteso e niente emdash.

FORMATO OUTPUT: Rispondi SOLO con un oggetto JSON valido, senza markdown, senza testo prima o dopo il JSON. Inizia direttamente con { e finisci con }.`;

const FAQ_EXAMPLE = `[{"domanda":"Prima domanda?","risposta":"Prima risposta concreta."},{"domanda":"Seconda domanda?","risposta":"Seconda risposta concreta."},{"domanda":"Terza domanda?","risposta":"Terza risposta concreta."}]`;

function buildPrompt(modo: string, input: string, isNew: boolean): string {
  if (modo === 'solo-articolo') {
    if (isNew) {
      return `Genera un articolo completo in italiano su questo tema. Almeno 600 parole, con ### per i sottotitoli.

JSON da restituire (SOLO questo, nient'altro):
{"titolo":"...","slug":"slug-url-friendly","descrizione":"1-2 frasi max 160 caratteri","corpo":"articolo completo in markdown","seo_title":null,"seo_description":null,"schema_faq":[]}

TEMA: ${input}`;
    }
    return `Riscrivi completamente questo articolo sullo stesso tema ma con testo nuovo. Almeno 600 parole.

JSON da restituire (SOLO questo, nient'altro):
{"titolo":"...","slug":"slug-url-friendly","descrizione":"1-2 frasi max 160 caratteri","corpo":"articolo riscritto in markdown","seo_title":null,"seo_description":null,"schema_faq":[]}

ARTICOLO ORIGINALE:
${input}`;
  }

  if (modo === 'solo-metadati') {
    return `Analizza questo articolo e genera SOLO i metadati SEO/AEO/GEO. Non riscrivere il testo.

JSON da restituire (SOLO questo, nient'altro):
{"titolo":null,"slug":null,"descrizione":"descrizione ottimizzata per SEO","corpo":null,"seo_title":"max 60 caratteri","seo_description":"max 155 caratteri","schema_faq":${FAQ_EXAMPLE}}

ARTICOLO:
${input}`;
  }

  if (modo === 'tutto-completo') {
    if (isNew) {
      return `Genera un articolo completo con tutti i metadati SEO/AEO/GEO. Almeno 800 parole, con ### per i sottotitoli.

JSON da restituire (SOLO questo, nient'altro):
{"titolo":"...","slug":"slug-url-friendly","descrizione":"1-2 frasi","corpo":"articolo completo in markdown con ### sottotitoli e almeno 800 parole","seo_title":"max 60 caratteri","seo_description":"max 155 caratteri","schema_faq":${FAQ_EXAMPLE}}

TEMA/PROMPT: ${input}`;
    }
    return `Riscrivi completamente questo articolo e genera tutti i metadati SEO/AEO/GEO.

JSON da restituire (SOLO questo, nient'altro):
{"titolo":"...","slug":"slug-url-friendly","descrizione":"1-2 frasi","corpo":"articolo completo riscritto in markdown","seo_title":"max 60 caratteri","seo_description":"max 155 caratteri","schema_faq":${FAQ_EXAMPLE}}

ARTICOLO ORIGINALE:
${input}`;
  }

  throw new Error(`Modalità non valida: ${modo}`);
}

// ── API Route (streaming) ─────────────────────────────────────────────────────
export const POST: APIRoute = async ({ request }) => {
  // Auth
  const cookie      = request.headers.get('cookie') ?? '';
  const statsAuth   = cookie.split(';').find(c => c.trim().startsWith('stats_auth='))?.split('=')[1]?.trim();
  const expectedPwd = import.meta.env.STATS_PASSWORD || 'stats2024';
  if (statsAuth !== expectedPwd) return new Response('Unauthorized', { status: 401 });

  const apiKey = import.meta.env.ANTHROPIC_API_KEY;
  if (!apiKey)  return new Response('ANTHROPIC_API_KEY mancante', { status: 500 });

  let body: { testo: string; modo: string; isNew: boolean };
  try { body = await request.json(); }
  catch { return new Response('JSON non valido', { status: 400 }); }

  const { testo, modo, isNew } = body;
  if (!testo || !modo) return new Response('Parametri mancanti', { status: 400 });

  let prompt: string;
  try { prompt = buildPrompt(modo, testo, isNew ?? true); }
  catch (e: any) { return new Response(e.message, { status: 400 }); }

  const client = new Anthropic({ apiKey });

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = client.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 8000,
          system: SISTEMA,
          messages: [{ role: 'user', content: prompt }],
        });

        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(new TextEncoder().encode(event.delta.text));
          }
        }
        controller.close();
      } catch (err: any) {
        controller.enqueue(new TextEncoder().encode(`\n\n{"__error":"${err?.message ?? 'Errore'}"}`));
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-store',
      'X-Accel-Buffering': 'no',
    },
  });
};
