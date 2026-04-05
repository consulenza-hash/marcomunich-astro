# Memory

## Now
- **Caroselli riscritti a 0 violazioni stile** (040626) — 52/52 con varietà aperture (max 2x su 52), audit script potenziato con detector trampolino semantico, regole stile italiano estese (10 regole in CLAUDE.md + persistenti). Deploy su main completato.
- **Post singoli — nuovo formato in pilot** (040626) — 8/52 scritti in `contenuti-social/post-singoli.md`, 0 violazioni, sotto 2200 char IG. Mockup visivo palette alternata caldo/freddo in `public/contenuti-social/immagini-post-singoli/`. Da completare: 44 testi + 52 foto Imagen 4 + render finale + integrazione schedule.
- **Pipeline IG Graph API OPERATIVA** (040526) — flow Instagram Login, solo IG, token 60gg, 432 JPEG deployed. Primo cron auto-publish: 07/04 09:30 CEST (C02)
- **Carosello 01** pubblicato manualmente via Meta Business Suite (040526)
- Admin guard: cookie-based · password `B1xAHqEDfYcj0Eii0KlxZA` ✅ (040426)
- 21 articoli bozza su main — visibili solo in /admin/articoli (040426)
- Sito live su **Netsons** via GitHub Actions
- Claudify attivo: 15 agenti, 30 comandi, 9 hook
- ⚠️ 10 fix legal/GEO da applicare (vedi Daily Note 040126)
- **WIP libro**: "Content Marketing Olistico" — bozza in `content-marketing-olistico-bozza.md`, 5 parti/21 cap, scrittura da completare

## Project
- **Nome**: marcomunich-astro — sito di Marco Munich, consulente Personal Branding Olistico
- **Location**: Vicenza, Italia
- **Obiettivo**: acquisire clienti per corsi online e consulenze individuali

## Stack
- Astro 5 SSG + Tailwind CSS (design system v2, token in `src/styles/global.css`)
- @astrojs/react (richiesto da Keystatic CMS) · Keystatic CMS (GitHub storage)
- @anthropic-ai/sdk (generatore AI articoli)
- Deploy: push main → GitHub Actions → Netsons · ⚠️ NON Vercel (cancellato)

## Key Files
- Config: `astro.config.mjs`, `keystatic.config.ts`, `tailwind.config.mjs`
- Stili: `src/styles/global.css` · Middleware: `src/middleware.ts`
- Contenuto: `src/content/articoli/` (201 articoli .mdoc)
- Admin: `genera.astro`, `articoli.astro`, `clienti.astro`, `social-piano.astro`
- Portfolio: `src/pages/portfolio/` (13 demo) · `public/images/portfolio/` (61 img)
- Dev: `src/pages/dev/` (6 pagine + case study)

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
- Browser: solo Playwright (mai mcp__Claude_in_Chrome__)
- Codice: MAI Read file interi · .astro → Grep content+context · .js/.ts → jcodemunch
- Read solo con offset+limit mirati
- Commit solo se richiesto esplicitamente
- Deploy: UN SOLO push alla fine del blocco di lavoro, mai push multipli
- Copy italiano: no "non X ma Y", no triplette, no emdash, no meta-frasi, ritmo disteso

## Open Threads
- **Post singoli batch** — 44 testi (P09-P52) + 52 foto Imagen 4 + render finale + integrazione schedule.json
- **Reel 36 violazioni stile** — 182 Reel scritti prima delle regole estese, da riscrivere lazy quando servono per registrazione (non in pipeline auto)
- **Token IG rotation** — il long-lived dura 60gg, scade intorno al 04/06/2026. Rigenera da Meta dev console e aggiorna secret `META_ACCESS_TOKEN`
- **.meta-app-info** — file locale gitignored con App ID, IG User ID, Instagram App Secret per rotazione token (serve solo in caso di exchange, ma il flow IG Login emette già token 60gg)
- **Legal/GEO fix** (10 item) — vedi Daily Note 040126 per lista completa
- **Wikidata entry** — da creare manualmente (20 min, nessun codice)
- **P.IVA in privacy policy** — da commercialista
- Icone social /risorse: non visibili Safari mobile (SVG inline, irrisolto)
- Stripe webhook test mode failing (non impatta live)
- LinkedIn API 403 — person URN non autorizzato
- Batch rewrite: 1 solo commit per tutti gli articoli (API Trees/Commits)
- 100+ click ads, 0 acquisti Prompt Pack — funnel da verificare
- Redesign privacy-policy, cookie-policy (incluso nel legal fix)
- Rimuovere @astrojs/react + Keystatic se non serve più
- SEO: 27 articoli senza schema_faq (GEO-008)
- `/llms-full.txt` mancante (GEO-004)
- `admin-panel.astro` (root level) non ha AdminGuard — da valutare se rimuoverlo o proteggerlo

## Blockers
- Nessuno
