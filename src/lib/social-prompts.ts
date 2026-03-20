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

// ─── Piano Editoriale ─────────────────────────────────────────────────────

export const EDITORIAL_PLAN_SYSTEM_PROMPT = `Sei un content strategist esperto nel personal branding olistico.
Scrivi in italiano. Il tuo tono è diretto, autentico, senza fronzoli.

Regole di stile ASSOLUTE:
- Mai usare "non X ma Y" (es. "non vendere, ma aiutare")
- Mai triplette retoriche (es. "autentico, vero, reale")
- Mai em-dash o ritmo telegrafico
- Mai meta-frasi (es. "in questo articolo scoprirai...")
- Mai frasi fatte motivazionali generiche
- Scrivi come parla una persona vera, non un guru del marketing

Ricevi un articolo completo e crei un piano editoriale di 5 contenuti social diversi,
distribuiti nell'arco della settimana. Ogni contenuto deve poter vivere da solo,
senza bisogno di leggere l'articolo.

I 5 contenuti devono essere:
1. POST CON TITOLO (giorno 1): il titolo dell'articolo come grafica + copy che presenta l'articolo
2. CITAZIONE 1 (giorno 2): una frase potente estrapolata o rielaborata dall'articolo
3. INSIGHT (giorno 3): un concetto chiave rielaborato in modo originale
4. CITAZIONE 2 (giorno 4): un'altra frase forte, diversa dalla prima
5. DOMANDA (giorno 5): una domanda provocatoria ispirata all'articolo per generare engagement

Per ogni contenuto genera il testo per la grafica E i copy per tutte le piattaforme.`;

export const EDITORIAL_PLAN_TOOL_SCHEMA = {
  name: 'genera_piano_editoriale',
  description: 'Genera un piano editoriale di 5 contenuti social da un articolo del blog',
  input_schema: {
    type: 'object' as const,
    properties: {
      piano: {
        type: 'array' as const,
        description: 'Array di 5 contenuti per il piano editoriale settimanale',
        items: {
          type: 'object' as const,
          properties: {
            giorno: { type: 'number' as const, description: 'Numero del giorno (1-5)' },
            tipo: {
              type: 'string' as const,
              enum: ['immagine_titolo', 'citazione', 'insight', 'domanda'],
              description: 'Tipo di contenuto',
            },
            testo_grafica: {
              type: 'string' as const,
              description: 'Testo da mostrare nella grafica (max 200 caratteri per citazioni/insight/domande, titolo completo per immagine_titolo)',
            },
            x_post: {
              type: 'string' as const,
              description: 'Copy per X/Twitter. Max 260 caratteri. Gancio diretto e incisivo.',
            },
            linkedin_post: {
              type: 'string' as const,
              description: 'Copy per LinkedIn. 300-600 caratteri. Tono professionale, spazi tra paragrafi.',
            },
            facebook_post: {
              type: 'string' as const,
              description: 'Copy per Facebook. 200-400 caratteri. Colloquiale, max 2 emoji.',
            },
            instagram_caption: {
              type: 'string' as const,
              description: 'Caption per Instagram Story. 100-200 caratteri. Diretto e coinvolgente.',
            },
          },
          required: ['giorno', 'tipo', 'testo_grafica', 'x_post', 'linkedin_post', 'facebook_post', 'instagram_caption'],
        },
      },
    },
    required: ['piano'],
  },
};

export function buildEditorialPlanUserPrompt(titolo: string, corpo: string, articleUrl: string): string {
  const corpoCut = corpo.length > 4000 ? corpo.substring(0, 4000) + '...' : corpo;
  return `Articolo da trasformare in piano editoriale social:

TITOLO: ${titolo}

CONTENUTO:
${corpoCut}

URL ARTICOLO: ${articleUrl}

Genera 5 contenuti diversi per la settimana. Per ogni contenuto:
- testo_grafica: il testo che apparira nella grafica (breve, potente, max 200 char per citazioni)
- Copy specifici per X, LinkedIn, Facebook e Instagram
- Il link all'articolo viene aggiunto automaticamente, NON includerlo nei copy
- Giorno 1 deve essere tipo "immagine_titolo" con il titolo dell'articolo come testo_grafica`;
}

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
