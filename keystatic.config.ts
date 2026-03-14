import { config, collection, fields } from '@keystatic/core';

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
        contenuto: fields.markdoc({ label: 'Contenuto' }),
      },
    }),
  },
});
