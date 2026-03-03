/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      // ── Palette colori di marcomunich.com ──────────────────────────────
      colors: {
        brand: {
          black:    '#0A0A0A',   // testo principale
          white:    '#FFFFFF',
          gray:     '#858585',   // H1 in articolo
          darkbg:   '#1E1E1F',   // sezioni scure
          border:   '#E5E5E5',
        },
      },

      // ── Font: unico per tutto il sito ─────────────────────────────────
      fontFamily: {
        sans: ['"Host Grotesk"', 'system-ui', 'sans-serif'],
      },

      // ── Scale tipografica fedele all'originale ──────────────────────────
      fontSize: {
        'body':  ['16px', { lineHeight: '1.7' }],
        'h1':    ['40px', { lineHeight: '1.2', fontWeight: '800' }],
        'h2':    ['28px', { lineHeight: '1.3', fontWeight: '400' }],
        'h3':    ['22px', { lineHeight: '1.4' }],
      },

      // ── Larghezza massima contenuto ────────────────────────────────────
      maxWidth: {
        'content': '780px',   // colonna articolo
        'site':    '1200px',  // wrapper sito
      },
    },
  },
  plugins: [],
};
