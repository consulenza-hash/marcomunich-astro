# Changelog — marcomunich.com

## Sessioni AI con Claude Code

---

### Design System v2 — Redesign completo del sito

**Stack**: Astro 5 + Tailwind CSS + @astrojs/react + Vercel adapter

**Design tokens** (in `src/styles/global.css`):
- Font: Bricolage Grotesque (`--display`), Cormorant (`--serif`), Syne (`--sans`)
- Colori: `--gold: #C58A37`, `--black: #0A0A0A`, `--ink: #1C1C1C`, `--paper: #F2EFE9`
- Bottoni CTA: sfondo nero (`--black`) su tutte le pagine interne

**Pagine ridisegnate in v2:**
- `index.astro` — homepage editorial brutalist (hero dark, ticker, card articoli con immagini)
- `chi-sono.astro` — hero dark + 2 colonne + blockquote gold + takeaways 01/02/03
- `servizi.astro` — hero dark + service cards con barra gold + sezione corso + CTA dark
- `contatti.astro` — hero dark + griglia 2 colonne (lista contatti + card WhatsApp)
- `libri.astro` — hero dark + righe editoriali 3 colonne (numero filigrana + cover + contenuto)
- `risorse.astro` — hero dark con avatar + audio player + social + step colorati per-corso + video + delega + quicklinks
- `cmfo-lezione1.astro` — redesign v2
- `cmfo-lezione2.astro` — redesign v2 + CTA consulenza con link a `/creazione-messaggio-autentico/`

**Colori per-corso (su risorse e landing corsi):**
- Metterci la Faccia Online → ambra `#D4840A`
- Creazione Messaggio Autentico → indigo `#5551D3`
- Creazione Video Autentici → rosso `#C0292A`
- Lavorare Senza Sito Web → teal `#1A7A4E`

---

### Struttura pagine

- **Rimossa** `percorsi-online.astro` → redirect 308 a `/servizi/`
- Tutti i link interni a `/percorsi-online/` aggiornati a `/servizi/`
- Fix link "Personal Branding" → `#percorsi` anchor su servizi
- Fix "Milano" → "Vicenza" su homepage (eyebrow + ticker)

---

### CMS Keystatic

- Setup Keystatic con GitHub storage (repo: `consulenza-hash/marcomunich-astro`)
- Dashboard admin su `/keystatic` e `/admin`
- Floating button "Statistiche" iniettato nelle pagine Keystatic via middleware Astro
- Middleware su `/admin` → reindirizza a `/keystatic` e inietta script floating

---

### Generatore AI Articoli (`/admin/genera`)

**Flusso:**
1. Seleziona articolo esistente da dropdown (caricato via GitHub API)
2. Scegli modalità: Riscrivi tutto / Solo testo / Solo metadati
3. Claude riscrive con tool_use (JSON garantito valido, no parsing errors)
4. Bottone "Applica a [nome articolo]" → salva su GitHub → apre Keystatic sull'articolo

**Fix tecnici:**
- Sostituito text streaming → `tool_choice: { type: 'tool', name: 'salva_articolo' }` (risolve errori JSON escaping)
- Streaming via `input_json_delta` events
- Rimosso campo `bozza` dal frontmatter generato (non nel schema Keystatic)
- Rimossi articoli AI di test (`comunicazione-autentica-coach-olistici/`, `come-farsi-conoscere-come-coach/`)

---

### SEO / Analytics

- GA4: `G-24JGZFXFEP` (primario) + `G-354107331` (secondario) con Consent Mode v2
- Facebook Pixel: `1254522452438928` (solo con consenso)
- IndexNow per Bing
- `og:updated_time` + HTML5 semantico
- Sitemap auto-generata con `@astrojs/sitemap`

---

### Deploy

- **Produzione**: `git push origin main` → Vercel auto-deploy (GitHub integration)
- **Fallback**: `npx vercel deploy --prod` (se GitHub integration in cascata/cancella builds)
- **Limite Hobby**: 100 deploy/24h — usare `vercel deploy --prod` direttamente invece di spammare push
- WordPress deploy hook: `https://api.vercel.com/v1/integrations/deploy/prj_kVRUrVBfghaw1Ng51e3UcMKDWBU5/4eEbccdxYr`

---

### TODO / Pendenti

- [ ] Importare 201 articoli WordPress → `src/content/articoli/` (cartella vuota)
- [ ] Icone social su mobile nella hero di `/risorse/` (opacity da aumentare)
- [ ] "Edita con AI" floating button dentro Keystatic articoli (middleware approvato, non implementato)
- [ ] Colori per-corso su `/servizi/` (card corsi con colori ambra/indigo/rosso/teal)
- [ ] Redesign `percorsi-online.astro` eliminata → verificare che tutti i redirect funzionino
- [ ] Redesign `privacy-policy.astro`, `cookie-policy.astro` in v2
- [ ] Template articolo `[slug].astro` in v2
