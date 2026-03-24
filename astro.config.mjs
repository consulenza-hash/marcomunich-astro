import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
// import keystatic from '@keystatic/astro';
// import react from '@astrojs/react';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://astro.build/config
export default defineConfig({
  // Sito in produzione
  site: 'https://marcomunich.com',

  // Static con Vercel adapter: le pagine con prerender=false diventano serverless functions
  output: 'static',
  adapter: vercel(),

  // Necessario per form POST SSR (es. /admin/statistiche login)
  security: { checkOrigin: false },

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
