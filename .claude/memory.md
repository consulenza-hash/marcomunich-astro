# Memory

## Now
- **PRESTAZIONI SITO** (040926) — redirect apex→www aggiunto (.htaccess), ora marcomunich.com passa per CF Pages CDN. Immagini compresse -162MB. /siti-web-showcase/ live.
- **Email contatti aggiornata**: consulenza@marcomunich.com (era ciao@)
- **CF Pages env vars** — ⚠️ Marco deve ancora aggiungere ADMIN_PASSWORD_HASH + ADMIN_SESSION_TOKEN su CF Pages Settings
- **Pipeline IG Graph API OPERATIVA** — C01 pubblicato, stories + reels workflow attivi
- **WIP libro**: "Content Marketing Olistico" — bozza in `content-marketing-olistico-bozza.md`

## Project
- **Nome**: marcomunich-astro — sito di Marco Munich, consulente Personal Branding Olistico
- **Location**: Vicenza, Italia
- **Obiettivo**: acquisire clienti per consulenze e siti web €2.500+

## Stack
- Astro 6.1.4 SSG + Tailwind CSS (design system v2, token in `src/styles/global.css`)
- @anthropic-ai/sdk (generatore AI articoli)
- Deploy: push main → GitHub Actions → **Cloudflare Pages**
- PHP APIs (checkout Stripe, etc.) → rimangono su Netsons via FTP

## Key Files
- Config: `astro.config.mjs`, `tailwind.config.mjs`
- Stili: `src/styles/global.css` · Middleware: `src/middleware.ts`
- Contenuto: `src/content/articoli/` (253 articoli .mdoc — 52 nuovi dal piano 6 mesi)
- Admin auth: `src/components/AdminGuard.astro` + `functions/admin/verify.js` + `functions/_middleware.js`
- Admin: `genera.astro`, `articoli.astro`, `clienti.astro`, `social-piano.astro`
- Portfolio: `src/pages/portfolio/` (13 demo) · `public/images/portfolio/` (61 img)
- Dev: `src/pages/dev/` (6 pagine + case study)
- Content Machine: `.claude/business-dna/` + `.claude/agents/art-director.md` + `scripts/telegram-webhook-server.mjs`

## Pagine principali
index, chi-sono, servizi, risorse, contatti, libri, cmfo-lezione1/2,
metterci-la-faccia-online, creazione-messaggio-autentico, creazione-video-autentici,
lavorare-senzasito, [slug].astro, blog/, categoria/, tag/, admin/, 404

## Design System v2 (legacy — pagine vecchie)
- Font: Bricolage Grotesque (display) · Cormorant (serif) · Syne (sans)
- --gold #C58A37 → solo tipografia italic, MAI bottoni
- --black #0A0A0A → CTA · --ink #1C1C1C → card · --paper #F2EFE9 → sezioni chiare

## Design System MM (nuovo — tutte le pagine principali)
- Font: Inter 900/700/400/300 — utility class `.mm-page`, `.mm-h1/h2/h3`, `.mm-btn-*`
- --mm-black #0d0d0d · --mm-orange #e85d00 · --mm-white #fff
- Sezioni: `.mm-section-dark` (nero) · `.mm-section-light` (bianco)
- Floating pill nav con clock live · Footer dark 3 colonne
- Photo hero: `/og/marco-munich.png` (B&W portrait)
- WhatsApp: sempre #25D366

## Regole di lavoro Claude
- **PRIORITÀ ASSOLUTA: /sec-review non si rimanda MAI.** Se è nella task board, si fa PRIMA di qualsiasi altro task.
- Browser: solo Playwright (mai mcp__Claude_in_Chrome__)
- Codice: MAI Read file interi · .astro → Grep content+context · .js/.ts → jcodemunch
- Read solo con offset+limit mirati
- Commit solo se richiesto esplicitamente
- Deploy: UN SOLO push alla fine del blocco di lavoro, mai push multipli
- Copy italiano: no "non X ma Y", no triplette, no emdash, no meta-frasi, ritmo disteso

## Open Threads
- **⚠️ CF Pages env vars** — Marco deve aggiungere ADMIN_PASSWORD_HASH + ADMIN_SESSION_TOKEN in CF Pages Settings → Environment Variables → Production (vedi Daily Note 040726)
- **Token IG rotation** — scade intorno al 04/06/2026. Rigenera da Meta dev console, aggiorna secret `META_ACCESS_TOKEN`
- **Legal/GEO fix** (10 item) — vedi Daily Note 040126 per lista completa
- **Wikidata entry** — da creare manualmente (20 min, nessun codice)
- **P.IVA in privacy policy** — da commercialista
- Icone social /risorse: non visibili Safari mobile (SVG inline, irrisolto)
- Stripe webhook test mode failing (non impatta live)
- LinkedIn API 403 — person URN non autorizzato
- Batch rewrite: 1 solo commit per tutti gli articoli (API Trees/Commits)
- 100+ click ads, 0 acquisti Prompt Pack — funnel da verificare
- SEO: 27 articoli senza schema_faq (GEO-008)
- `/llms-full.txt` mancante (GEO-004)
- `admin-panel.astro` (root level) non ha AdminGuard — da valutare

## Blockers
- Nessuno
