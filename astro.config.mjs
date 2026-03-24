import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
// import keystatic from '@keystatic/astro';
// import react from '@astrojs/react';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://astro.build/config
export default defineConfig({
  // Sito in produzione
  site: 'https://marcomunich.com',

  // Output completamente statico — no adapter, no SSR
  // Le API sono in PHP nella cartella /api/ su Netsons
  output: 'static',

  integrations: [
    tailwind(),
    sitemap(),
  ],

  vite: {
    plugins: [{
      name: 'inject-admin-btn',
      transformIndexHtml: (html) =>
        html.replace('</head>', '<script src="/admin-stats-btn.js"></script></head>'),
    }],
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
