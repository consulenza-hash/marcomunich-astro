import type { APIRoute } from 'astro';
import Anthropic from '@anthropic-ai/sdk';

export const prerender = false;

// ── Regole di stile assolute ─────────────────────────────────────────────────
const SISTEMA = `Sei un ghostwriter italiano esperto. Scrivi sempre in italiano naturale seguendo queste regole assolute:

Genera testo in italiano naturale, senza strutture "non X ma Y" e senza "non è… è…". Questo vincolo è assoluto e si applica a ogni variante della costruzione, anche quando mascherata: "non si tratta di X, si tratta di Y", "non parliamo di X, parliamo di Y", "non sto dicendo X, sto dicendo Y", "non serve X, serve Y", "il punto non è X, il punto è Y", "non è una questione di X, è una questione di Y". Qualsiasi frase che definisca qualcosa negando prima il suo opposto o un'alternativa va eliminata e riscritta affermando direttamente ciò che si vuole dire, senza passare dalla negazione come trampolino.

Evita triplette (tre aggettivi, tre verbi, tre stati, tre "senza…"). Elimina meta-frasi che commentano il testo ("è importante", "è chiaro", "è la parte più forte", "è giusto partire da…"). Evita astratti non supportati da dettagli concreti ("consapevolezza", "lucidità", "profondo", "responsabilità", "nel rispetto"). Preferisci scene brevi, azioni e conseguenze verificabili. Non anticipare obiezioni, non scrivere in difesa preventiva. Chiudi con un fatto o una decisione pratica, non con frasi da comunicato.

Il ritmo del testo deve essere discorsivo e fluido: ogni pensiero si sviluppa per almeno tre o quattro righe prima di chiudersi con un punto. Evita il ritmo telegrafico dove ogni frase breve finisce con un punto, creando una sequenza frammentata di micro-pensieri staccati. Il testo deve scorrere come un articolo scritto da una persona che ragiona mentre scrive, dove le frasi si collegano tra loro e il respiro è lungo, non spezzettato. Se in due righe ci sono più di due punti, il testo è troppo frammentato e va riscritto legando i pensieri tra loro con costruzioni naturali.

Risultato: testo specifico, asciutto, credibile, con pochi aggettivi, zero enfasi artificiale, ritmo disteso e niente emdash.`;

// ── Prompt per ogni modalità ─────────────────────────────────────────────────
function buildPrompt(testo: string, modo: string): string {
  switch (modo) {

    case 'solo-articolo':
      return `Riscrivi questo articolo partendo dalle stesse tematiche e idee principali, ma con un testo completamente nuovo e originale. Mantieni la struttura logica (introduzione, corpo, conclusione) ma rinnova completamente ogni frase.

Alla fine aggiungi questa sezione:

## PROMPT IMMAGINE DI COPERTINA

Un prompt dettagliato in inglese per generare l'immagine di copertina con Midjourney o Dall-E. Deve riflettere il tema dell'articolo, essere visivamente specifico e descrivere stile, illuminazione, soggetto e atmosfera.

---

ARTICOLO ORIGINALE:
${testo}`;

    case 'articolo-metadati':
      return `Riscrivi questo articolo partendo dalle stesse tematiche e idee principali, ma con un testo completamente nuovo e originale.

Poi genera i metadati SEO/GEO/AEO completi nel formato seguente:

---

## ARTICOLO

[il testo riscritto completo in markdown]

---

## METADATI SEO

- **title**: (max 60 caratteri, naturale, non keyword-stuffing)
- **meta_description**: (max 155 caratteri, invoglia al click senza essere clickbait)
- **focus_keyword**: (1 parola chiave principale)
- **slug**: (URL-friendly, tutto lowercase, trattini)
- **og_description**: (per Facebook/LinkedIn, max 200 caratteri)

## SCHEMA FAQ (JSON-LD)

\`\`\`json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "...", "acceptedAnswer": { "@type": "Answer", "text": "..." } }
  ]
}
\`\`\`

## GEO / AEO

- **Risposta diretta** (max 2 righe per featured snippet Google/AI Overview):
- **Entities principali**: (persone, luoghi, concetti chiave rilevanti per i Knowledge Graph)
- **Schema type consigliato**: Article / HowTo / FAQ / FAQPage
- **Domanda target** (la query esatta a cui risponde l'articolo):

## PROMPT IMMAGINE DI COPERTINA

Un prompt dettagliato in inglese per Midjourney o Dall-E. Specifico su stile, soggetto, illuminazione e atmosfera.

---

ARTICOLO ORIGINALE:
${testo}`;

    case 'solo-metadati':
      return `Analizza questo articolo e genera solo i metadati SEO/GEO/AEO. Non riscrivere il testo.

## METADATI SEO

- **title**: (max 60 caratteri)
- **meta_description**: (max 155 caratteri)
- **focus_keyword**: (1 parola chiave principale)
- **slug**: (URL-friendly)
- **og_description**: (per social, max 200 caratteri)

## SCHEMA FAQ (JSON-LD)

\`\`\`json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "...", "acceptedAnswer": { "@type": "Answer", "text": "..." } }
  ]
}
\`\`\`

## GEO / AEO

- **Risposta diretta** (max 2 righe per featured snippet):
- **Entities principali**:
- **Schema type consigliato**:
- **Domanda target**:

## PROMPT IMMAGINE DI COPERTINA

Prompt in inglese per Midjourney/Dall-E basato sul tema dell'articolo.

---

ARTICOLO:
${testo}`;

    default:
      throw new Error('Modalità non valida');
  }
}

// ── API Route ─────────────────────────────────────────────────────────────────
export const POST: APIRoute = async ({ request }) => {
  // Auth check
  const cookie = request.headers.get('cookie') ?? '';
  const statsAuth = cookie.split(';').find(c => c.trim().startsWith('stats_auth='))?.split('=')[1]?.trim();
  const expectedPwd = import.meta.env.STATS_PASSWORD || 'stats2024';
  if (statsAuth !== expectedPwd) {
    return new Response('Unauthorized', { status: 401 });
  }

  const apiKey = import.meta.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response('ANTHROPIC_API_KEY non configurata', { status: 500 });
  }

  let body: { testo?: string; modo?: string };
  try {
    body = await request.json();
  } catch {
    return new Response('JSON non valido', { status: 400 });
  }

  const { testo, modo } = body;
  if (!testo || !modo) {
    return new Response('Parametri mancanti: testo e modo richiesti', { status: 400 });
  }

  let prompt: string;
  try {
    prompt = buildPrompt(testo, modo);
  } catch (e: any) {
    return new Response(e.message, { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  // Stream la risposta direttamente al client
  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = client.messages.stream({
          model: 'claude-opus-4-6',
          max_tokens: 8000,
          thinking: { type: 'adaptive' },
          system: SISTEMA,
          messages: [{ role: 'user', content: prompt }],
        });

        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(new TextEncoder().encode(event.delta.text));
          }
        }
        controller.close();
      } catch (err: any) {
        controller.enqueue(
          new TextEncoder().encode(`\n\n❌ Errore: ${err?.message ?? 'Errore sconosciuto'}`)
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
