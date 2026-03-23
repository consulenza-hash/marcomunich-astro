import type { APIRoute } from 'astro';
import Anthropic from '@anthropic-ai/sdk';


const SISTEMA = `Sei un ghostwriter italiano esperto di personal branding. Scrivi sempre in italiano naturale pulito.

Regole assolute:
- Nessuna struttura "non X ma Y" o "non è… è…"
- Nessuna tripletta (tre aggettivi, tre verbi, tre stati)
- Nessuna meta-frase ("è importante", "è chiaro", "è giusto partire da…")
- Nessun emdash (—)
- Ritmo discorsivo: ogni pensiero si sviluppa per 3-4 righe prima di chiudersi
- Testo specifico, asciutto, credibile. Zero enfasi artificiale.
- Rispondi SEMPRE con JSON valido. Nessun testo prima o dopo.`;

type Azione =
  | 'migliora'
  | 'seo'
  | 'riscrivi-intro'
  | 'aggiungi-cta'
  | 'meta-description'
  | 'link-interni'
  | 'personalizzata';

function buildPrompt(azione: Azione, corpo: string, istruzione?: string): string {
  const base = `ARTICOLO:\n${corpo}\n\n`;

  switch (azione) {
    case 'migliora':
      return base + `Migliora il testo dell'articolo: rendi il linguaggio più diretto, elimina ridondanze, mantieni lo stesso messaggio e la stessa struttura. Mantieni titolo e frontmatter invariati.

Rispondi SOLO con: {"corpo": "testo migliorato in markdown"}`;

    case 'seo':
      return base + `Ottimizza l'articolo per la SEO: aggiungi parole chiave naturalmente nel testo, migliora i sottotitoli H3, assicurati che il testo sia almeno 600 parole, aggiungi varianti semantiche del topic principale.

Rispondi SOLO con: {"corpo": "testo ottimizzato in markdown", "seo_title": "SEO title max 60 caratteri", "seo_description": "meta description max 155 caratteri"}`;

    case 'riscrivi-intro':
      return base + `Riscrivi SOLO il primo paragrafo dell'articolo. Deve catturare subito l'attenzione, essere specifico e concreto. Il resto dell'articolo resta invariato.

Rispondi SOLO con: {"corpo": "articolo completo con intro riscritta in markdown"}`;

    case 'aggiungi-cta':
      return base + `Aggiungi una call to action efficace alla fine dell'articolo. Deve essere naturale, non aggressiva, coerente con il tono del testo. Non usare "clicca qui" o frasi da copywriting generico.

Rispondi SOLO con: {"corpo": "articolo completo con CTA aggiunta in markdown"}`;

    case 'meta-description':
      return base + `Genera solo i metadati SEO per questo articolo. Non modificare il testo.

Rispondi SOLO con: {"seo_title": "SEO title max 60 caratteri", "seo_description": "meta description max 155 caratteri", "descrizione": "descrizione breve 1-2 frasi max 160 caratteri"}`;

    case 'link-interni':
      return base + `Suggerisci 3-5 punti del testo dove inserire link interni a marcomunich.com/[topic]. Per ogni punto indica: il testo da linkare e la pagina di destinazione suggerita (/corsi, /chi-sono, /contatti, /risorse, o un articolo correlato).

Rispondi SOLO con: {"suggerimenti": [{"testo": "testo da linkare", "destinazione": "/pagina-suggerita", "contesto": "frase dove si trova"}]}`;

    case 'personalizzata':
      return base + `Istruzione: ${istruzione}

Rispondi SOLO con JSON. Se hai modificato il testo: {"corpo": "testo modificato in markdown"}. Se hai solo suggerimenti: {"suggerimenti": "..."}. Se hai generato metadati: {"seo_title": "...", "seo_description": "..."}`;

    default:
      throw new Error(`Azione non valida: ${azione}`);
  }
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

  const apiKey = import.meta.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY mancante' }), { status: 500, headers });
  }

  let body: { azione: Azione; corpo: string; istruzione?: string };
  try { body = await request.json(); }
  catch { return new Response(JSON.stringify({ error: 'JSON non valido' }), { status: 400, headers }); }

  const { azione, corpo, istruzione } = body;
  if (!azione || !corpo?.trim()) {
    return new Response(JSON.stringify({ error: 'Parametri mancanti: azione e corpo richiesti' }), { status: 400, headers });
  }

  const client = new Anthropic({ apiKey });

  let raw = '';
  try {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 6000,
      system: SISTEMA,
      messages: [{ role: 'user', content: buildPrompt(azione, corpo, istruzione) }],
    });
    raw = msg.content.filter(b => b.type === 'text').map(b => (b as { type: 'text'; text: string }).text).join('');
  } catch (e: any) {
    return new Response(JSON.stringify({ error: `Errore Claude: ${e.message}` }), { status: 500, headers });
  }

  // Parsa JSON
  try {
    const cleaned = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim();
    const start = cleaned.indexOf('{');
    const end   = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('Nessun JSON');
    const result = JSON.parse(cleaned.slice(start, end + 1));
    return new Response(JSON.stringify({ success: true, ...result }), { headers });
  } catch {
    return new Response(JSON.stringify({ error: 'Impossibile parsare risposta AI', raw: raw.slice(0, 300) }), { status: 500, headers });
  }
};
