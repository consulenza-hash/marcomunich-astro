import type { APIRoute } from 'astro';
import Anthropic from '@anthropic-ai/sdk';


// ── Tool definition — garantisce JSON valido via function calling ─────────────
const TOOL_DEF: Anthropic.Tool = {
  name: 'salva_articolo',
  description: 'Salva il contenuto generato dell\'articolo con tutti i campi richiesti.',
  input_schema: {
    type: 'object' as const,
    properties: {
      titolo:          { anyOf: [{ type: 'string' }, { type: 'null' }], description: 'Titolo dell\'articolo. Null se si generano solo metadati.' },
      slug:            { anyOf: [{ type: 'string' }, { type: 'null' }], description: 'Slug URL-friendly (lettere minuscole, trattini, no spazi). Null se solo metadati.' },
      descrizione:     { anyOf: [{ type: 'string' }, { type: 'null' }], description: 'Descrizione breve, max 160 caratteri.' },
      corpo:           { anyOf: [{ type: 'string' }, { type: 'null' }], description: 'Corpo articolo in markdown con ### sottotitoli. Null se si generano solo metadati.' },
      seo_title:       { anyOf: [{ type: 'string' }, { type: 'null' }], description: 'Titolo SEO ottimizzato, max 60 caratteri. Null se solo articolo.' },
      seo_description: { anyOf: [{ type: 'string' }, { type: 'null' }], description: 'Meta description SEO, max 155 caratteri. Null se solo articolo.' },
      schema_faq: {
        type: 'array',
        description: 'Domande e risposte per lo schema FAQ (AEO/GEO)',
        items: {
          type: 'object',
          properties: {
            domanda:  { type: 'string' },
            risposta: { type: 'string' },
          },
          required: ['domanda', 'risposta'],
        },
      },
    },
    required: ['titolo', 'slug', 'descrizione', 'corpo', 'seo_title', 'seo_description', 'schema_faq'],
  },
};

// ── Prompt di sistema ─────────────────────────────────────────────────────────
const SISTEMA = `Sei un ghostwriter italiano esperto. Scrivi sempre in italiano naturale seguendo queste regole assolute:

Genera testo in italiano naturale, senza strutture "non X ma Y" e senza "non è… è…". Qualsiasi frase che definisca qualcosa negando prima il suo opposto va eliminata e riscritta affermando direttamente ciò che si vuole dire.

Evita triplette (tre aggettivi, tre verbi, tre stati). Elimina meta-frasi che commentano il testo ("è importante", "è chiaro", "è giusto partire da…"). Preferisci scene brevi, azioni e conseguenze verificabili. Chiudi con un fatto o una decisione pratica.

Il ritmo del testo deve essere discorsivo e fluido: ogni pensiero si sviluppa per almeno tre o quattro righe prima di chiudersi. Evita il ritmo telegrafico dove ogni frase breve finisce con un punto.

Risultato: testo specifico, asciutto, credibile, con pochi aggettivi, zero enfasi artificiale, ritmo disteso e niente emdash.`;

function buildPrompt(modo: string, input: string, isNew: boolean): string {
  if (modo === 'solo-articolo') {
    if (isNew) {
      return `Genera un articolo completo in italiano su questo tema. Almeno 600 parole, usa ### per i sottotitoli. Compila tutti i campi del tool.

TEMA: ${input}`;
    }
    return `Riscrivi completamente questo articolo sullo stesso tema ma con testo nuovo. Almeno 600 parole, usa ### per i sottotitoli. Compila tutti i campi del tool.

ARTICOLO ORIGINALE:
${input}`;
  }

  if (modo === 'solo-metadati') {
    return `Analizza questo articolo e genera SOLO i metadati SEO/AEO/GEO. Non riscrivere il testo: nel campo "corpo" metti null. Genera almeno 3 domande/risposte per schema_faq.

ARTICOLO:
${input}`;
  }

  if (modo === 'tutto-completo') {
    if (isNew) {
      return `Genera un articolo completo con tutti i metadati SEO/AEO/GEO. Almeno 800 parole, usa ### per i sottotitoli. Genera almeno 3 domande/risposte per schema_faq. Compila tutti i campi del tool.

TEMA/PROMPT: ${input}`;
    }
    return `Riscrivi completamente questo articolo e genera tutti i metadati SEO/AEO/GEO. Almeno 800 parole, usa ### per i sottotitoli. Genera almeno 3 domande/risposte per schema_faq. Compila tutti i campi del tool.

ARTICOLO ORIGINALE:
${input}`;
  }

  throw new Error(`Modalità non valida: ${modo}`);
}

// ── API Route (streaming con tool use) ───────────────────────────────────────
export const POST: APIRoute = async ({ request }) => {
  // Auth
  const cookie      = request.headers.get('cookie') ?? '';
  const rawAuth = cookie.split(';').find(c => c.trim().startsWith('stats_auth='))?.split('=')[1]?.trim() ?? '';
  const statsAuth   = decodeURIComponent(rawAuth);
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
          model: 'claude-opus-4-5',
          max_tokens: 8000,
          system: SISTEMA,
          messages: [{ role: 'user', content: prompt }],
          tools: [TOOL_DEF],
          // Forza sempre la chiamata al tool — garantisce JSON valido
          tool_choice: { type: 'tool', name: 'salva_articolo' },
        });

        for await (const event of stream) {
          // input_json_delta = frammento del JSON del tool input (sempre valido quando concatenato)
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'input_json_delta'
          ) {
            controller.enqueue(new TextEncoder().encode(event.delta.partial_json));
          }
        }
        controller.close();
      } catch (err: any) {
        // In caso di errore, invia un JSON valido con __error
        controller.enqueue(
          new TextEncoder().encode(JSON.stringify({ __error: err?.message ?? 'Errore sconosciuto' }))
        );
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
