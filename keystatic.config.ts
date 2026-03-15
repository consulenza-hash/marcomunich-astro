import { config, collection, fields, singleton } from '@keystatic/core';

export default config({
  storage: {
    kind: 'cloud',
  },
  cloud: {
    project: 'marcomunich-com/marcomunich-com',
  },

  collections: {
    articoli: collection({
      label: 'Articoli',
      slugField: 'titolo',
      path: 'src/content/articoli/*/',
      format: { contentField: 'contenuto' },
      schema: {
        titolo: fields.slug({ name: { label: 'Titolo' } }),
        descrizione: fields.text({
          label: 'Descrizione',
          description: 'Appare nei risultati di ricerca e nei social',
          multiline: true,
        }),
        data: fields.date({ label: 'Data pubblicazione' }),
        immagine: fields.image({
          label: 'Immagine di copertina',
          directory: 'public/images/articoli',
          publicPath: '/images/articoli/',
        }),

        // ── SEO / AEO / GEO ───────────────────────────────────────────────
        seo_title: fields.text({
          label: 'SEO Title',
          description: 'Titolo per Google (max 60 caratteri). Se vuoto usa il Titolo.',
        }),
        seo_description: fields.text({
          label: 'Meta Description',
          description: 'Descrizione per Google e social (max 160 caratteri).',
          multiline: true,
        }),
        seo_image: fields.image({
          label: 'Immagine SEO/Social (OG Image)',
          description: 'Per Facebook, LinkedIn, Twitter. Se vuota usa l\'immagine di copertina. Ideale: 1200×630px.',
          directory: 'public/images/seo',
          publicPath: '/images/seo/',
        }),
        seo_noindex: fields.checkbox({
          label: 'Nascondi da Google (noindex)',
          defaultValue: false,
        }),
        canonical_url: fields.url({
          label: 'Canonical URL',
          description: 'Solo se l\'articolo è una copia di un\'altra pagina.',
        }),
        schema_faq: fields.array(
          fields.object({
            domanda: fields.text({ label: 'Domanda' }),
            risposta: fields.text({ label: 'Risposta', multiline: true }),
          }),
          {
            label: 'FAQ (Schema.org — AEO/GEO)',
            description: 'Domande e risposte per Google AI Overviews e featured snippets.',
            itemLabel: (props) => props.fields.domanda.value || 'Nuova FAQ',
          }
        ),

        contenuto: fields.markdoc({ label: 'Contenuto' }),
      },
    }),
  },

  singletons: {
    // ── HOMEPAGE ──────────────────────────────────────────────────────────
    homepage: singleton({
      label: 'Homepage',
      path: 'src/content/singletons/homepage',
      format: { data: 'json' },
      schema: {
        hero_titolo: fields.text({ label: 'Hero — Titolo principale' }),
        hero_sottotitolo: fields.text({ label: 'Hero — Sottotitolo', multiline: true }),
        hero_cta_testo: fields.text({ label: 'Hero — Testo bottone CTA' }),
        hero_cta_url: fields.url({ label: 'Hero — URL bottone CTA' }),
        sezione_chi_sono: fields.text({ label: 'Chi sono — Testo breve', multiline: true }),
      },
    }),

    // ── ARTICOLI AI — quick-link al tag sul sito ──────────────────────────
    articoli_ai: singleton({
      label: '🤖 Articoli AI',
      path: 'src/content/singletons/articoli-ai',
      format: { data: 'json' },
      schema: {
        url: fields.url({
          label: '↗ Vai alla sezione AI sul sito',
          defaultValue: 'https://marcomunich.com/tag/ai/',
        }),
      },
    }),

    // ── IMPOSTAZIONI GLOBALI ───────────────────────────────────────────────
    impostazioni: singleton({
      label: 'Impostazioni sito',
      path: 'src/content/singletons/impostazioni',
      format: { data: 'json' },
      schema: {
        site_name: fields.text({ label: 'Nome sito' }),
        site_description: fields.text({ label: 'Descrizione sito (SEO)', multiline: true }),
        facebook_url: fields.url({ label: 'URL Facebook' }),
        instagram_url: fields.url({ label: 'URL Instagram' }),
        linkedin_url: fields.url({ label: 'URL LinkedIn' }),
        youtube_url: fields.url({ label: 'URL YouTube' }),
        email_contatto: fields.text({ label: 'Email di contatto' }),
      },
    }),
  },
});
