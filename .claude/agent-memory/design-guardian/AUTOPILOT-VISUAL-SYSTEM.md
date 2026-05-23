# Autopilot Visual System — Marco Munich Social

Sistema template per 420 pezzi/mese. Estende Y2K Chrome al social.
Documento machine-readable: ogni sezione è strutturata come spec, non come prosa.

---

## 1. PILLARS — COLOR ASSIGNMENT

| Pillar | Colore accento | Hex | Gradient display |
|---|---|---|---|
| Siti web / Sviluppo | Cyan | `#00e5ff` | `linear-gradient(180deg, #00e5ff 0%, #b8faff 35%, #007a99 70%)` |
| AI / Automazione | Magenta | `#ff2d92` | `linear-gradient(180deg, #ff2d92 0%, #ffe2f0 30%, #8a3aff 70%)` |
| Posizionamento / Brand | Violet | `#8a3aff` | `linear-gradient(180deg, #8a3aff 0%, #d4b8ff 35%, #4a0066 70%)` |

Regola: ogni contenuto appartiene a un solo pillar. L'accento cromatico determina il pillar a colpo d'occhio.

---

## 2. TEMPLATE LIST — 8 TEMPLATE TOTALI

### T1 — Post Quadrato Statement
- **Formato**: 1080×1080 (Instagram post, Facebook post, LinkedIn post)
- **Layout**: Background `#0a0512` + blob mesh sfocato in angolo. Testo centrato verticale. Headline Inter 900 grande (64–80px). Subtitle JetBrains Mono 24px sotto. Logo pill in basso a destra.
- **Zona accento**: blob mesh angolo in alto a sinistra, colore del pillar, blur 120px, opacity 0.45
- **Padding**: 72px tutti i lati
- **Hierarchy**: NUMERO/STAT (chrome gradient, 120px) > Headline (bianco, 64px) > Subtext (rgba f0e9ff 0.75, 28px) > Pill bottom-right (JetBrains Mono, 14px)

### T2 — Post Quadrato Lista
- **Formato**: 1080×1080
- **Layout**: Header section-title stile ps4-section__title (JetBrains Mono, letterspacing 0.2em, colore accento, border-bottom). Lista 3-5 voci con `//` o `→` prefix in accento. Footer: handle + pill stato.
- **Padding**: 72px
- **Usato per**: "5 errori che...", "3 cose che...", checklist rapide

### T3 — Carosello Slide (serie)
- **Formato**: 1080×1350 (4:5 — massima reach Instagram)
- **Slide 1 — Hook**: Headline Inter 900 (80px), blob accento full-size sfocato, terminal pill con testo breve in JetBrains Mono, nessun testo oltre headline + 1 riga subtitle
- **Slide 2–N — Contenuto**: Layout asimmetrico. Numero slide in chrome gradient (120px, opacity 0.12) come watermark sfondo. Testo principale Inter 600 (36px). Dettaglio/esempio in terminal window ps4-window (JetBrains Mono, bordo rgba accento 0.3)
- **Slide finale — CTA**: Replica layout Slide 1 ma con CTA button style ps4-btn--chrome + handle + URL
- **Padding**: 80px
- **Slide count per pillar**: 6 slide (1 hook + 4 contenuto + 1 CTA), 8 slide (1 hook + 6 contenuto + 1 CTA)

### T4 — Storia / Reel Cover
- **Formato**: 1080×1920 (9:16)
- **Layout**: Safe zone testo: margine 120px top, 180px bottom (per UI Instagram). Testo principale nella fascia centrale 800px. Blob mesh accento in alto, secondo blob complementare in basso (opacità ridotta 0.25). Headline Inter 900 (72px). Un dato/numero in chrome gradient (200px) come elemento hero se disponibile.
- **Padding zona testo**: 80px laterali
- **Usato per**: cover reel, storia testuale, annunci, quote

### T5 — Document Post / LinkedIn Carousel
- **Formato**: 1080×1350 (prima slide cover) + 1080×1080 (slide interne) — esportato come PDF multi-pagina
- **Layout cover**: Logo top-left in JetBrains Mono. Titolo Inter 900 (72px). Categoria pill accento. Sfondo come T1.
- **Layout interno**: Numero pagina top-right in accento (JetBrains Mono 14px). Titolo sezione (Inter 700, 42px). Corpo testo (Inter 400, 28px, line-height 1.6). Max 80 parole per slide interna.
- **Slide count**: 5–10 slide, ultima sempre CTA

### T6 — Reel / Short Frame (video overlay)
- **Formato**: 1080×1920 — overlay grafico su video
- **Layout**: Lower-third JetBrains Mono su background `rgba(10,5,18,0.85)`. Titolo Inter 900 top (se talking-head: testo sotto il viso). Status pill live in accento. Non coprire il viso: safe zone verticale 240–1500px.
- **Elementi fissi**: logo pill top-right, lower-third bottom 200px da bordo inferiore

### T7 — Community / Engagement Post
- **Formato**: 1080×1080
- **Layout**: Domanda aperta Inter 900 (64px) centrata. Background con pattern minimal (grid puntinata rgba f0e9ff 0.04, 40px spacing). Nessun blob — solo sfondo piatto. CTA testuale in JetBrains Mono sotto la domanda. Accento cromatico solo sulla domanda o su un simbolo (?, !, →).
- **Scopo**: sondaggi, domande alla community, "commenta con X"

### T8 — Quote / Testimonial
- **Formato**: 1080×1080
- **Layout**: Virgolette decorative Inter 900 in accento (200px, opacity 0.15) come watermark. Testo citazione Inter 400 italic (36px, max 3 righe). Attribuzione JetBrains Mono 20px sotto con `//` prefix. Linea accento verticale a sinistra (4px width, 60px height, colore pillar).

---

## 3. REGOLE DI COERENZA

### MAI cambiare (invarianti di brand)
- Background base: `#0a0512` — nessuna variante chiara, nessun bianco, nessun grigio neutro
- Font display: Inter 900 — mai sostituire con altro font per headline
- Font mono/accents: JetBrains Mono — tutti i dati tecnici, label, pill, handle, CTA testuali
- Palette: solo `#ff2d92`, `#00e5ff`, `#8a3aff`, `#f0e9ff` — zero colori esterni
- Blob mesh: sempre sfocato (blur 80–150px), mai nitido o geometrico
- Logo/handle: sempre presente, sempre JetBrains Mono, sempre in posizione fissa per formato

### PUO' variare (flessibilità)
- Direzione gradient (180deg, 135deg, 90deg) — adattare all'equilibrio della slide
- Accento cromatico — cambia per pillar
- Posizione del blob mesh — alto/basso/centro in base al layout
- Numero di elementi decorativi — da zero (T7) a massimo 2 blob + 1 terminal window
- Peso testo — Inter 700 accettabile per corpi brevi se 900 pesa troppo a piccole dimensioni

---

## 4. FORMULA TESTO PER FORMATO

**T1 — Statement 1080×1080**
```
[NUMERO/DATO in chrome gradient] — opzionale
[HEADLINE: max 8 parole, Inter 900]
[SUBTITLE: max 15 parole, JetBrains Mono, opacity 0.75]
[PILL: @marcomunich.dev · marcomunich.com]
```

**T2 — Lista 1080×1080**
```
[SEZIONE TITLE: // TITOLO LISTA — JetBrains Mono caps]
[VOCE 1]: → Testo (max 6 parole)
[VOCE 2]: → Testo
[VOCE N]: → Testo (max 5 voci)
[FOOTER: handle + CTA 1 riga]
```

**T3 — Carosello 6 slide**
```
Slide 1: Hook — domanda o affermazione provocatoria (max 10 parole)
Slide 2: Problema — cosa non funziona, perché esiste il problema
Slide 3: Insight 1 — primo punto concreto con dato o esempio
Slide 4: Insight 2 — secondo punto concreto
Slide 5: Insight 3 — terzo punto + terminal window con snippet/dato
Slide 6: CTA — cosa fare adesso + handle + link
```

**T3 — Carosello 8 slide**
```
Slide 1: Hook
Slide 2: Contesto / problema
Slide 3–6: Insight (uno per slide, max 40 parole + elemento visivo)
Slide 7: Recap rapido (lista 3 punti JetBrains Mono)
Slide 8: CTA
```

**T4 — Storia 1080×1920**
```
[DATO/NUMERO — chrome gradient, hero element]
[HEADLINE: max 6 parole]
[SUBTEXT: 1 riga, max 12 parole]
[SWIPE UP / LINK IN BIO — JetBrains Mono, pill]
```

**T5 — Document LinkedIn (5–10 slide)**
```
Slide 1: Cover — titolo + categoria pill
Slide 2: Problema o scenario di partenza
Slide 3–N-1: Contenuto (una sezione per slide, max 80 parole)
Slide finale: CTA + handle + "Salva per dopo"
```

**T6 — Reel overlay**
```
Lower-third: [// TITOLO BREVE — max 5 parole]
Pill status: [● LIVE] o [● TUTORIAL] o [● CASO STUDIO]
```

**T7 — Community**
```
[DOMANDA: 1 frase, finisce con "?" — Inter 900, centrata]
[ISTRUZIONE: "Commenta con X" o "Salva se..." — JetBrains Mono]
```

**T8 — Quote**
```
[CITAZIONE: max 25 parole, Inter 400 italic]
// [Fonte o contesto — JetBrains Mono]
```

---

## 5. ANTI-PATTERN — BLOCCARE IN GENERAZIONE

- Background chiaro, bianco o grigio neutro — **proibito**
- Colori fuori palette (`#0000ff`, `#28a745`, Bootstrap defaults) — **proibito**
- Font diversi da Inter e JetBrains Mono — **proibito**
- Foto stock (persone con sorriso finto, handshake, ufficio generico) — **proibito**
- Blob mesh nitidi o con bordi definiti — deve essere sempre blur alto
- Gradients pastello o colori desaturati — **proibito**
- CTA con bottone Bootstrap-style (bordo arrotondato, padding standard, colore piatto) — usare solo ps4-btn--chrome (gradient bianco su dark) o testo JetBrains Mono con prefix `[ ]`
- Testo su background chiaro — contrasto minimo 4.5:1 su `#0a0512`, non derogare
- Slide di carosello con più di 60 parole di testo (escluso T5 document)
- Logo o handle assenti — ogni template deve avere identificazione brand

---

## 6. MAPPING VELOCE FORMATO → TEMPLATE

| Piattaforma | Tipo contenuto | Template |
|---|---|---|
| Instagram | Post feed | T1 o T2 |
| Instagram | Carosello | T3 (1080×1350) |
| Instagram | Storia | T4 |
| Instagram | Reel | T6 (overlay) |
| Facebook | Post | T1 o T2 |
| Facebook | Carosello | T3 |
| LinkedIn | Post testo-immagine | T1 o T2 |
| LinkedIn | Document/carousel | T5 |
| TikTok | Video | T6 (overlay) |
| YouTube | Short | T6 (overlay) |
| YouTube | Community post | T7 |
| Tutti | Quote/testimonial | T8 |
