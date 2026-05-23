# Handoff Prompt — Piano Editoriale Social Instagram @marcomunich.dev

## Chi è Marco Munich
Consulente di Personal Branding Olistico a Vicenza. Lavora con counselor, coach e operatori olistici. 7 anni di esperienza. Sito: marcomunich.com. Profilo IG: @marcomunich.dev.

## Stato attuale del piano editoriale

### 52 Caroselli Instagram
- **Testi**: 52 caroselli completi in markdown, 0 violazioni stile, varietà aperture garantita
- **File testi**: `contenuti-social/archivio-caroselli.md` (C01-C08), `mese-2-caroselli.md` (C09-C16), `mese-3.md` (C17-C24), `mese-4.md` (C25-C32), `mese-5.md` (C33-C40), `mese-6.md` (C41-C52)
- **Grafiche**: nuovo design approvato (vedi sotto), C01 pubblicato con nuovo design
- **Pipeline automatica**: GitHub Actions cron pubblica 1 carosello/giorno alle 09:30 CEST via Instagram Graph API
- **Schedule**: `scripts/schedule.json` — 52 entry con date, caption, slide_texts, alt_texts
- **C01 già pubblicato** con nuovo design (06/04/2026)
- **C13, C40, C47 da riscrivere** — contenevano la newsletter come tema centrale, Marco non ci crede. Servono 3 temi nuovi.

### Design approvato per i caroselli (DEFINITIVO)

| Tipo slide | Stile |
|---|---|
| **Cover (slide 1)** | Foto evocativa generata con Imagen 4 (9:16) + titolo Inter 900 bold (bastoni) bianco sovrapposto in basso + barra colore accento 6px in fondo |
| **Body testo (slide 2,4,5,7)** | Sfondo crema #F5F0E8 + sidebar colore accento 8px a sinistra + Instrument Serif italic per il testo + parole chiave in Instrument Serif bold con highlight arancione leggero + numero ghost Instrument Serif italic grande in alto a destra |
| **Body immagine (slide 3,6)** | Foto evocativa Imagen 4 + overlay gradiente scuro dal basso + testo Inter 500 bianco sovrapposto in basso + barra colore accento 6px |
| **Signature (slide 8)** | Sfondo pieno colore accento del carosello + testo nero Inter 900 "Marco Munich" + servizi numerati + CTA "marcomunich.com · @marcomunich.dev" — identico allo stile legacy |

**Palette rotante (6 colori):** #e85d00 (arancione), #3b82f6 (azzurro), #22c55e (verde), #fbbf24 (giallo), #06b6d4 (ciano), #a855f7 (viola)

**Font:** Inter (bastoni, per cover e slide immagine) + Instrument Serif (con grazie, italic per body testo, bold per highlight)

### Foto Imagen 4
- API: `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict`
- Key: in `.env.imagen` (locale, gitignored) o env var `IMAGEN_API_KEY`
- Formato: 9:16 verticale
- Per ogni carosello servono 3 foto evocative (cover, slide 3, slide 6) legate al tema
- C01-C20 hanno le foto generate, C21-C52 da generare (quota giornaliera esaurita il 06/04)
- Script: `scripts/generate-carousel-images.py`
- Output: `public/contenuti-social/immagini-caroselli/carosello-XX/img-cover.png, img-s3.png, img-s6.png`

### Renderer
- Script: `scripts/render-caroselli-v2.mjs` (Playwright, genera PNG 1080×1350)
- Conversione JPEG: `scripts/convert_slides_to_jpeg.py` (Pillow, quality 92)
- Output: `public/contenuti-social/immagini-caroselli/carosello-XX/slide-NN.png + .jpg`

### Pipeline di pubblicazione
- **Script**: `scripts/publish_carousel.py` — legge schedule.json, pubblica il prossimo carosello "pending" via Instagram Graph API
- **Workflow**: `.github/workflows/publish-carousel-daily.yml` — cron giornaliero 07:30 UTC (09:30 CEST)
- **Token IG**: `META_ACCESS_TOKEN` nei GitHub Secrets + in `.env.instagram` locale. Scade ~05/06/2026 (60gg). Rigenerare da Meta Dev Console → app marcomunich-social → Instagram → API setup → Genera token
- **User ID**: `INSTAGRAM_USER_ID` = 25745812921764074
- **IMPORTANTE**: le slide devono essere accessibili via URL pubblico. Il deploy FTP su Netsons è lento e non sovrascrive file con lo stesso nome. Workaround: caricare via GitHub API e usare raw.githubusercontent.com come URL

### 182 Reel
- Testi in: `contenuti-social/archivio-reels.md` (1-60), `mese-3.md` (61-90), `mese-4.md` (91-120), `mese-5.md` (121-150), `mese-6.md` (151-182)
- **36 violazioni stile** (scritti prima delle regole estese) — da riscrivere prima di registrare
- Non in pipeline automatica (Marco li registra a camera)

### 52 Post singoli
- **8/52 scritti** in `contenuti-social/post-singoli.md`
- Formato: immagine fotografica 1080×1350 con overlay scuro + frase forte + caption mini-articolo 300-500 parole (max 2200 char IG)
- Affiancati ai caroselli (1 post singolo per ogni carosello, stesso giorno)
- Da completare: 44 testi + 52 immagini + render + integrazione schedule

## Regole di stile italiano (OBBLIGATORIE per tutti i contenuti)

1. **Mai "non X ma Y"** e varianti (13 pattern, incluse forme con punto "X non viene da A. Viene da B"). Se serve contrasto, usare congiunzioni: più che, anziché, invece di, piuttosto che, al posto di
2. **Varietà aperture**: nessuna formula ripetuta in 2+ pezzi consecutivi. Ruotare attivamente 10 registri (scena concreta, affermazione diretta, osservazione temporale, domanda implicita, dettaglio sensoriale, numero concreto, esperienza lettore, contrasto interno, scelta, nome di situazione)
3. **Scene concrete**, mai concetti astratti senza dettaglio visibile
4. **Niente triplette** (tre aggettivi/verbi/stati consecutivi)
5. **Niente meta-frasi** ("è importante", "è chiaro che", "è fondamentale")
6. **Ritmo disteso**: ogni pensiero 3-4 righe, frasi collegate, max 2 punti ogni 2 righe
7. **Zero difesa preventiva** ("so che sembra strano ma...")
8. **Chiusure concrete**, mai da comunicato stampa
9. **Niente em-dash** (—) nel copy. Usare virgole, punti, middle dot (·)
10. **Auto-controllo**: se una strategia di riscrittura diventa il nuovo pattern, cambiarla

**Audit automatico**: `python scripts/audit_caroselli_style.py` — rileva tutte le violazioni inclusi i trampolini semantici cross-frase

## Posizioni editoriali di Marco (NON NEGOZIABILI)

- **Newsletter**: Marco non ci crede al 100%. Non va spinta come pilastro. OK come opzione avanzata per chi ha già un pubblico consolidato. Il messaggio forte è: costanza nel pubblicare, costruire nel tempo, farsi trovare.
- **Contenuto**: Marco non scrive niente personalmente. L'AI genera tutto dai suoi 7 anni di contenuti e dalla sua voce. Ma il contenuto deve suonare come lui, non come AI.
- **Storie personali inventate**: zero. Solo riferimenti a clienti reali (anonimizzati) e situazioni vere.
- **Focus ossessivo**: vendere siti web ad alto costo (€2.500+) e consulenze di Personal Branding Olistico.

## Problemi noti e workaround

| Problema | Workaround |
|---|---|
| Deploy FTP Netsons non sovrascrive file con stesso nome | Caricare slide via GitHub API → usare raw.githubusercontent.com come URL per IG API |
| Quota Imagen 4 giornaliera (~60 immagini) | Generare in batch, aspettare reset quota (mezzanotte Pacific) |
| Token IG scade ogni 60gg | Rigenerare da Meta Dev Console, aggiornare GitHub Secret + .env.instagram |
| Instagram API rifiuta PNG | Convertire sempre in JPEG prima di pubblicare |
| CRLF nei file markdown rompe il parser JS | Normalizzare a LF prima del render |

## File chiave

| File | Scopo |
|---|---|
| `scripts/schedule.json` | Schedule pubblicazione 52 caroselli |
| `scripts/publish_carousel.py` | Pubblica carosello via IG Graph API |
| `scripts/render-caroselli-v2.mjs` | Renderer nuovo design (Playwright) |
| `scripts/render-c01-test.mjs` | Template C01 con font corretto (usare come riferimento) |
| `scripts/generate-carousel-images.py` | Generatore foto Imagen 4 |
| `scripts/convert_slides_to_jpeg.py` | PNG → JPEG quality 92 |
| `scripts/audit_caroselli_style.py` | Audit stile italiano |
| `.env.instagram` | Token IG + User ID (locale) |
| `.meta-app-info` | App ID, IG User ID, App Secret |
| `CLAUDE.md` | Regole di stile complete |

## Cosa resta da fare

1. **Generare foto Imagen C21-C52** (96 immagini, ~30 min quando quota resetta)
2. **Render completo 52 caroselli** con nuovo design + JPEG + deploy
3. **Riscrivere C13, C40, C47** con temi nuovi (no newsletter)
4. **Fix testo troppo piccolo**: quando il testo è lungo, spezzare su più slide (9-10 invece di 8) anziché rimpicciolire il font
5. **44 post singoli** (P09-P52) + render + integrazione schedule
6. **Riscrittura 182 Reel** (36 violazioni stile)
7. **Fix sicurezza**: AdminGuard.astro ha hash password nel sorgente pubblico (bypassabile), cookie senza Secure flag, localStorage token esposto
8. **Risolvere deploy FTP**: migrare publish_carousel.py a usare sempre raw.githubusercontent.com come URL fonte, oppure migrare hosting a Cloudflare Pages
