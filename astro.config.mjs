import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import keystatic from '@keystatic/astro';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://astro.build/config
export default defineConfig({
  // Sito in produzione
  site: 'https://marcomunich.com',

  // Static con server routes per Keystatic (Astro 5)
  output: 'static',
  adapter: vercel(),

  integrations: [
    tailwind(),
    sitemap(),
    keystatic(),
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
