import { defineConfig, envField } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import keystatic from '@keystatic/astro';
import react from '@astrojs/react';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://astro.build/config
export default defineConfig({
  // Sito in produzione
  site: 'https://marcomunich.com',

  // Static (default Astro 5): supporta prerender=false su singole pagine (ex "hybrid")
  output: 'static',
  adapter: vercel(),

  // Disabilita CSRF check per le pagine SSR (es. /admin/statistiche login form)
  security: { checkOrigin: false },

  // Inietta floating button statistiche su pagine Keystatic
  vite: {
    plugins: [{
      name: 'inject-admin-btn',
      transformIndexHtml: (html) =>
        html.replace('</head>', '<script src="/admin-stats-btn.js"></script></head>'),
    }],
  },

  integrations: [
    tailwind(),
    sitemap(),
    react(),
    keystatic(),
  ],

  // Variabili d'ambiente server-side (lette a runtime, non inlined da Vite)
  env: {
    schema: {
      GITHUB_TOKEN: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },

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
