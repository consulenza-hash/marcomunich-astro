# Memory

## Now
- **PENTEST HIGH aperti** (050426) — cookie `stats_auth` + `admin_auth` senza flag `Secure`/`HttpOnly`. **Prima priorità prossima sessione code** (regola permanente, bloccato 35 gg).
- **/sec-review OVERDUE** (35 gg da 24/04) — eseguire prima di scrivere codice nuovo.
- **IG sett-01**: 101-106 pubblicati, 107 cron Sab 30/05 11:00 (date allineate).
- **IG sett-02 "Farsi trovare"**: piano + schedule + caption + alt_texts pronti (id 201-207), MANCANO 35 slide JPG da renderizzare → bloccante per Lun 02/06.
- **SEC-022 APERTO** — Ghost v5.130 CVE critici. Richiede SSH: `ghost update`.

## Project
- **Nome**: marcomunich-astro — sito di Marco Munich, consulente Personal Branding Olistico
- **Location**: Vicenza, Italia
- **Obiettivo**: acquisire clienti per consulenze e siti web €2.500+

## Stack
- Astro SSG + Tailwind CSS (design system v2, token in `src/styles/global.css`)
- **Ghost CMS v5.130** su `cms.marcomunich.com` — editor articoli principale
- Ghost Content API Key: `7d68c14ee140db23b05d66c572`
- Ghost Admin API Key: in env var `GHOST_ADMIN_API_KEY` (GH Secret)
- Deploy: push main → GitHub Actions → **Cloudflare Pages**
- PHP APIs (Ghost proxy, auth, stats) → Netsons `89.40.173.242` via CF Pages proxy

## Key Files
- Config: `astro.config.mjs`, `tailwind.config.mjs`
- Ghost client: `src/lib/ghost.ts` (Content API)
- Ghost helpers PHP: `public/api/_ghost.php` (Admin API, JWT, mobiledoc, rebuild)
- PHP APIs: `public/api/lista-articoli.php`, `articolo.php`, `salva-bozza.php`, `pubblica-articolo.php`, `elimina-articolo.php`, `ripristina-articolo.php`, `salva-batch.php`
- CF Proxy: `functions/api/[[path]].js` → `http://89.40.173.242` con Host header
- Admin auth: `src/components/AdminGuard.astro` + `functions/admin/verify.js`
- Admin: `src/pages/admin/index.astro` (hub), `app.html`, `genera.astro`, `riscrivi.astro`
- Stili: `src/styles/global.css` · Middleware: `src/middleware.ts`
- Content Machine: `.claude/business-dna/` + `.claude/agents/art-director.md`

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
- **⚠️ PENTEST 050426** — 2 HIGH: cookie `stats_auth` + `admin_auth` senza flag `Secure`/`HttpOnly`. 4 MEDIUM: CSP `unsafe-inline`, /admin/ in robots.txt, route wp-json residua, Netlify headers.
- **⚠️ SEC-022 APERTO** — Ghost v5.130 CVE critici. Richiede SSH: `ghost update`.
- **⚠️ YouTube Postiz** — GCP OAuth client pronto (ID: 653999554080-...282n). Marco deve: 1) salvare redirect URI Postiz in GCP, 2) generare nuovo secret, 3) darmelo. Poi: enable YouTube Data API v3, add Railway env vars.
- **⚠️ CF Pages env vars** — GHOST_URL + GHOST_ADMIN_API_KEY + GITHUB_TOKEN da aggiungere
- **Token IG rotation** — scade ~062326. Promemoria: ~062026 rigenerare.
- **Legal/GEO fix** (10 item) — vedi Daily Note 040126
- **Daily rebuild workflow failing** — `Daily Rebuild — Publish Scheduled` failure in GH Actions
- **Wikidata entry** — da creare manualmente (20 min)
- **P.IVA in privacy policy** — da commercialista
- 100+ click ads, 0 acquisti Prompt Pack — funnel da verificare
- SEO: 27 articoli senza schema_faq (GEO-008)
- og:image è 330×330 (sub-ottimale per OG card) → da creare dedicata 1200×630
- ~~`/llms-full.txt` mancante (GEO-004)~~ ✅ RESOLVED 052926 (443 righe, 7 sezioni)

## Blockers
- Nessuno
