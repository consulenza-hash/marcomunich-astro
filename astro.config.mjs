import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://astro.build/config
export default defineConfig({
  // Sito in produzione
  site: 'https://marcomunich.com',

  // Genera sito statico puro (nessun JS lato client di default)
  output: 'static',

  integrations: [
    tailwind(),
    sitemap(),
  ],

  // Alias per import più puliti
  vite: {
    resolve: {
      alias: {
        '@components': path.resolve(__dirname, 'src/components'),
        '@layouts':    path.resolve(__dirname, 'src/layouts'),
        '@lib':        path.resolve(__dirname, 'src/lib'),
        '@styles':     path.resolve(__dirname, 'src/styles'),
      },
    },
  },
});
