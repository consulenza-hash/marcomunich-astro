# Resume Prompt — marcomunich.com

Incolla questo all'inizio di una nuova sessione per portare Claude Code subito al contesto.

---

## Contesto progetto

Sei Claude Code che lavora sul sito **marcomunich.com** di Marco Munich, consulente di Personal Branding Olistico residente a **Vicenza**.

**Stack**: Astro 5 (output: server, adapter: @astrojs/vercel) + Tailwind CSS + @astrojs/react
**Working dir**: `D:\marcomunich.com`
**Repo GitHub**: `consulenza-hash/marcomunich-astro` (privato)
**Deploy**: `npx vercel deploy --prod` (NON pushare commit ripetuti — limite 100 deploy/24h su Hobby)

---

## Regole di lavoro — SEMPRE ATTIVE

- **Browser**: usa SOLO Playwright (mai `mcp__Claude_in_Chrome__*`)
- **Lettura codice**: MAI `Read` su file interi per esplorare
  - `.astro` → `Grep` con `output_mode: content` + `context`
  - `.js`/`.ts` → `jcodemunch` (`search_symbols`, `get_symbol`, `get_file_outline`)
  - `Read` solo con `offset`+`limit` mirati su sezioni specifiche
- **Screenshot**: sempre da localhost:4321 con Playwright, non dal live
- **Commit**: solo quando richiesto esplicitamente

---

## Design System v2

**Font** (caricati via `src/styles/global.css`):
- `--display`: Bricolage Grotesque (titoli hero, 800)
- `--serif`: Cormorant (italic gold, claim)
- `--sans`: Syne (body, nav)

**Colori**:
- `--gold: #C58A37` — solo tipografia (Cormorant italic, numeri filigrana, label uppercase)
- `--black: #0A0A0A` — bottoni CTA su tutte le pagine interne
- `--ink: #1C1C1C` — sfondi sezioni card
- `--paper: #F2EFE9` — sfondi sezioni chiare

**Colori per-corso** (su risorse, servizi, landing):
- Metterci la Faccia Online → `#D4840A` (ambra)
- Creazione Messaggio Autentico → `#5551D3` (indigo)
- Creazione Video Autentici → `#C0292A` (rosso)
- Lavorare Senza Sito Web → `#1A7A4E` (teal)

**Bottoni CTA**: `background: var(--black); color: #fff` — NON oro, NON verde (tranne WhatsApp: `#25D366`)

---

## Struttura pagine chiave

```
src/pages/
  index.astro              ← homepage v2
  chi-sono.astro           ← storia v2
  servizi.astro            ← servizi + percorsi (ha sostituito percorsi-online)
  risorse.astro            ← hub risorse con step per-corso colorati
  contatti.astro           ← v2
  libri.astro              ← v2
  cmfo-lezione1.astro      ← lezione 1 CMFO (v2)
  cmfo-lezione2.astro      ← lezione 2 CMFO (v2, CTA → /creazione-messaggio-autentico/)
  metterci-la-faccia-online.astro
  creazione-messaggio-autentico.astro
  creazione-video-autentici.astro
  lavorare-senzasito.astro
  admin/genera.astro       ← generatore AI articoli
  api/genera-json.ts       ← backend streaming con tool_use Claude
```

`/percorsi-online/` → eliminata, redirect 308 a `/servizi/`

---

## Generatore AI articoli (`/admin/genera`)

- Seleziona articolo esistente → AI riscrive → bottone "Applica a [articolo]" → salva GitHub → apre Keystatic
- Usa `tool_choice: { type: 'tool', name: 'salva_articolo' }` per JSON sempre valido
- Streaming via `input_json_delta` events
- Campo `bozza` NON va nel frontmatter (non è nel schema Keystatic)

---

## Analytics

- GA4: `G-24JGZFXFEP` + `G-354107331` — Consent Mode v2
- Facebook Pixel: `1254522452438928` — solo con consenso
- Consenso: `localStorage` key `mm_cookie_consent`, valori `'all'` | `'necessary'`, 365gg

---

## TODO pendenti (priorità)

1. **Colori per-corso su `/servizi/`** — card corsi con ambra/indigo/rosso/teal (come risorse)
2. **Importare 201 articoli WordPress** → `src/content/articoli/` (vuota)
3. **"Edita con AI" floating button** dentro pagine Keystatic articoli (via middleware Astro)
4. **Icone social mobile** su `/risorse/` hero — opacity troppo bassa
5. **Redesign** `privacy-policy.astro`, `cookie-policy.astro`, `[slug].astro` (template articolo)
