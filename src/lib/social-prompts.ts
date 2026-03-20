/**
 * Prompt system per generare copy social ottimizzati per piattaforma.
 * Usati da /api/social/genera.ts con Claude tool_use.
 */

export const SOCIAL_SYSTEM_PROMPT = `Sei un copywriter social esperto nel personal branding olistico.
Scrivi in italiano. Il tuo tono è diretto, autentico, senza fronzoli.

Regole di stile ASSOLUTE:
- Mai usare "non X ma Y" (es. "non vendere, ma aiutare")
- Mai triplette retoriche (es. "autentico, vero, reale")
- Mai em-dash o ritmo telegrafico
- Mai meta-frasi (es. "in questo articolo scoprirai...")
- Mai frasi fatte motivazionali generiche
- Scrivi come parla una persona vera, non un guru del marketing

Ricevi un articolo completo e generi 3 post social distinti.`;

export const SOCIAL_TOOL_SCHEMA = {
  name: 'genera_social_posts',
  description: 'Genera 3 post social ottimizzati per X, LinkedIn e Facebook a partire da un articolo del blog',
  input_schema: {
    type: 'object' as const,
    properties: {
      x_post: {
        type: 'object' as const,
        description: 'Post per X (ex Twitter)',
        properties: {
          testo: {
            type: 'string' as const,
            description: 'Testo del tweet. Max 260 caratteri (il link viene aggiunto automaticamente). Gancio diretto e incisivo. Niente hashtag nel testo.',
          },
          hashtags: {
            type: 'array' as const,
            items: { type: 'string' as const },
            description: '2-3 hashtag strategici senza il simbolo # (vengono aggiunti automaticamente)',
          },
        },
        required: ['testo', 'hashtags'],
      },
      linkedin_post: {
        type: 'object' as const,
        description: 'Post per LinkedIn',
        properties: {
          testo: {
            type: 'string' as const,
            description: 'Testo del post LinkedIn. 300-600 caratteri. Tono professionale e autorevole. Usa spazi bianchi tra i paragrafi per leggibilita. Apri con un gancio forte, poi sviluppa il valore, chiudi con una riflessione o domanda. Il link viene aggiunto automaticamente alla fine.',
          },
        },
        required: ['testo'],
      },
      facebook_post: {
        type: 'object' as const,
        description: 'Post per la pagina Facebook',
        properties: {
          testo: {
            type: 'string' as const,
            description: 'Testo del post Facebook. 200-400 caratteri. Tono colloquiale e orientato alla community. Usa max 2 emoji pertinenti. Invita a cliccare per approfondire. Il link viene aggiunto automaticamente.',
          },
        },
        required: ['testo'],
      },
    },
    required: ['x_post', 'linkedin_post', 'facebook_post'],
  },
};

export function buildSocialUserPrompt(titolo: string, corpo: string, articleUrl: string): string {
  // Tronca il corpo a ~3000 caratteri per non esplodere i token
  const corpoCut = corpo.length > 3000 ? corpo.substring(0, 3000) + '...' : corpo;

  return `Articolo da trasformare in post social:

TITOLO: ${titolo}

CONTENUTO:
${corpoCut}

URL ARTICOLO: ${articleUrl}

Genera 3 post distinti per X, LinkedIn e Facebook. Ogni post deve essere autonomo e interessante anche senza leggere l'articolo. Il link all'articolo viene aggiunto automaticamente, NON includerlo nel testo.`;
}
