---
description: Build a complete client website from scratch — audience research, copy, design, code, full pre-delivery audit
argument-hint: "[client info: sector, audience, offer, tone — or leave blank to be guided]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Agent
  - Glob
  - Grep
  - Bash(npx:*, node:*, mkdir:*)
  - WebFetch
  - WebSearch
  - mcp__exa__web_search_exa
  - mcp__exa__web_search_advanced_exa
  - mcp__exa__crawling_exa
  - mcp__jcodemunch__get_file_outline
  - mcp__jcodemunch__get_file_tree
  - mcp__context7__query-docs
  - mcp__context7__resolve-library-id
  - mcp__playwright__browser_navigate
  - mcp__playwright__browser_screenshot
  - mcp__playwright__browser_evaluate
  - mcp__playwright__browser_network_requests
---

Workflow completo per costruire un sito client da zero. Ogni step alimenta il successivo — nessun passaggio manuale richiesto. Si ferma solo dopo il design brief per approvazione visiva prima di costruire.

---

## Step 0: Raccolta info cliente

Se l'argomento contiene info sufficienti, estrai:
- **Settore**: cosa fa il cliente
- **Audience**: chi sono i clienti del cliente
- **Offerta principale**: cosa vende o comunica
- **Tono brand**: 3 aggettivi che descrivono la personalità
- **Obiettivo sito**: lead gen / e-commerce / brochure / SaaS / portfolio
- **Riferimenti visivi**: stili o siti che apprezza (se disponibili)
- **Lingua e mercato**: italiano / internazionale / locale

Se le info sono insufficienti, fai queste domande in un unico messaggio — non una alla volta:
```
Per costruire il sito ho bisogno di capire:
1. Settore e cosa offre il cliente
2. A chi si rivolge (chi è il cliente ideale)
3. Obiettivo principale del sito (vendere / generare lead / presentare / informare)
4. Tono brand (es: professionale, amichevole, premium, tecnico)
5. Ci sono siti che apprezza come riferimento?
```

---

## Step 1: Audience Research

Usa Exa per capire chi è il target e cosa cerca online.

```
mcp__exa__web_search_exa: "[settore] target audience pain points [anno corrente]"
mcp__exa__web_search_exa: "[settore] customer problems [anno corrente]" site:reddit.com
mcp__exa__web_search_exa: "[settore] best websites [anno corrente]" site:awwwards.com
mcp__exa__web_search_exa: "[settore] competitors [mercato]"
```

Estrai:
- **Pain point principali** del target (cosa li tiene svegli la notte)
- **Linguaggio che usano** per descrivere i loro problemi
- **Cosa cercano** quando cercano soluzioni come quelle del cliente
- **3 competitor principali** e come si posizionano

Output: **Audience Brief** (max 1 pagina) con pain point, linguaggio, gap competitor.

---

## Step 2: Copy Brief

Leggi `.claude/skills/market-copy.md` e genera il copy strutturato per ogni pagina del sito basandoti sull'Audience Brief dello Step 1.

Produci per ogni pagina chiave (homepage + 2-3 pagine rilevanti per il tipo di sito):
- Headline principale (H1) — 3 varianti
- Subheadline
- Value proposition (Jobs-to-be-Done)
- CTA principale — testo esatto del bottone
- 3 punti chiave (benefici, non feature)
- Social proof placeholder (cosa raccogliere dal cliente)

Salva in `COPY-BRIEF.md`.

---

## Step 3: Design Brief

Invoca design-guardian in Full Brief Mode con tutto il contesto accumulato:

```
Agent(design-guardian): Full Brief Mode.

Cliente: [info Step 0]
Audience: [pain point e linguaggio da Step 1]
Competitor analizzati: [lista da Step 1]
Copy pronto: sì — vedi COPY-BRIEF.md

Produci:
1. Structural style + Aesthetic style + Typography + Interactions
2. Palette completa con hex e contrasti WCAG verificati
3. Emotional target — la sensazione precisa che il visitatore deve avere nei primi 5 secondi
4. Anti-patterns specifici per questo settore/brand
5. Component hierarchy — cosa costruire per primo

Tieni conto dei competitor identificati: non assomigliare a nessuno di loro.
```

**⏸ PAUSA — Approvazione design brief**

Mostra il design brief all'utente e chiedi:
```
Design brief pronto. Prima di costruire:
✅ Approvato — procedo con lo sviluppo
🔄 Modifica [cosa] — poi procedo
```

Non proseguire finché l'utente non conferma.

---

## Step 4: Build

Con copy approvato e design brief approvato, costruisci il sito.

**Struttura file:**
```
/
├── index.html (o struttura framework se specificato)
├── css/
│   └── style.css
├── js/
│   └── main.js
└── assets/
    └── (placeholder per immagini)
```

**Regole di build:**
- Applica esattamente la palette, i font, e le interazioni del design brief
- Usa il copy da COPY-BRIEF.md — non inventare testo
- Mobile-first, breakpoint a 768px e 1440px
- Tutti i link placeholder sono `#` con commento `<!-- TODO: url reale -->`
- Immagini: usa placeholder con dimensioni corrette e commento `<!-- TODO: immagine reale -->`
- Nessun framework CSS di default (Bootstrap, etc.) a meno che non specificato nel brief

Dopo il build, screenshot della homepage:
```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto('file://' + process.cwd() + '/index.html');
  await p.screenshot({ path: '.claude/scripts/screenshots/preview-desktop.png', fullPage: false });
  await p.setViewportSize({ width: 375, height: 812 });
  await p.screenshot({ path: '.claude/scripts/screenshots/preview-mobile.png', fullPage: false });
  await b.close();
})();
"
```

Mostra gli screenshot all'utente per una prima verifica visiva.

---

## Step 5: Pre-delivery Audit (automatico)

Esegui tutti i guardian in sequenza:

```
Agent(security-guardian): Full Review. Sito appena costruito.
Stack: HTML/CSS/JS vanilla (o [framework]).
Scope: tutti i file prodotti nel Step 4.
Checklist completa A-N. Verdict richiesto.

Agent(performance-guardian): Full Review.
Analisi statica — nessun URL live disponibile ancora.
Controlla: immagini, font loading, script defer, bundle size, caching headers.
Verdict richiesto.

Agent(legal-guardian): Full Review.
Tipo sito: [tipo da Step 0].
Mercato: [italiano/internazionale].
Controlla: cookie banner necessario? Privacy policy? T&C? Diritto di recesso?
Verdict richiesto.

Agent(geo-guardian): Full Review.
Controlla: meta tags, JSON-LD Organization, robots.txt, sitemap placeholder, llms.txt.
Verdict richiesto.

Agent(marketing-guardian): Quick Scan.
Verifica che il copy prodotto sia coerente con il brief e l'audience research.
Controlla: headline, CTA, value proposition, social proof placeholder.
Verdict richiesto.
```

Applica automaticamente tutti i fix CRITICAL e HIGH senza chiedere conferma.
Per i fix MEDIUM chiedi: "Ho trovato [N] issues medium. Le applico tutte?"

---

## Step 6: Output finale

Crea `WEBSITE-BRIEF.md` con tutto il contesto del progetto:

```markdown
# Website Brief — [Nome Cliente]
Data: [data]

## Cliente
[info Step 0]

## Audience
[pain point e linguaggio da Step 1]

## Competitor
[lista con gap identificati]

## Copy
→ Vedi COPY-BRIEF.md

## Design System
- Struttura: [scelta]
- Stile: [scelta]
- Palette: [hex principali]
- Font: [heading / body]
- Emotional target: [frase]

## Audit Pre-delivery
- Security: [verdict]
- Performance: [verdict]
- Legal: [verdict]
- GEO: [verdict]
- Marketing: [verdict]

## TODO per il cliente
- [ ] Sostituire immagini placeholder
- [ ] Aggiungere testi definitivi dove segnato [TESTO REALE]
- [ ] Configurare form di contatto (endpoint)
- [ ] Acquistare dominio e configurare hosting
- [ ] Raccogliere e inserire social proof (testimonianze, loghi clienti)
```

Stampa all'utente:
```
─────────────────────────────────────────
WEBSITE PRONTO — [Nome Cliente]
─────────────────────────────────────────
Audience research: ✅
Copy: ✅ (COPY-BRIEF.md)
Design: ✅ [stile scelto]
Build: ✅ [N file prodotti]

Security:    [verdict]
Performance: [verdict]
Legal:       [verdict]
GEO:         [verdict]
Marketing:   [verdict]

TODO cliente: [N] items → WEBSITE-BRIEF.md
─────────────────────────────────────────
```
