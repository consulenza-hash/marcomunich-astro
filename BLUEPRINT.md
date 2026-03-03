# BLUEPRINT — Migrazione marcomunich.com → Astro.js + Netlify
**Aggiornato:** 2026-03-03
**Stato globale:** ✅ Deploy live, contenuti verificati identici al WP originale

---

## RESUME PROMPT (copia-incolla per riprendere su qualsiasi AI)

```
Sto migrando marcomunich.com da WordPress+Thrive Architect a un sito statico Astro.js 5
hostato su Netlify. Il progetto è a D:\marcomunich.com su Windows.
Repo GitHub: consulenza-hash/marcomunich-astro
Netlify URL: https://celebrated-haupia-4abb01.netlify.app (deploy automatico da main)
WP backend (headless): https://marcomunich.com (ancora online come CMS)

Il sito è LIVE e tutte le pagine principali sono verificate ok.
Leggi il file BLUEPRINT.md nella root del progetto per lo stato completo e i prossimi passi.
Inizia sempre leggendo BLUEPRINT.md prima di fare qualsiasi cosa.
```

---

## INFRASTRUTTURA

| Elemento | Valore |
|----------|--------|
| Repo GitHub | `consulenza-hash/marcomunich-astro` |
| Branch deploy | `main` (auto-deploy su push) |
| Netlify URL | `https://celebrated-haupia-4abb01.netlify.app` |
| Dominio target | `marcomunich.com` (da configurare su Netlify) |
| WordPress backend | `https://marcomunich.com` (headless CMS) |
| WP REST API | `https://marcomunich.com/wp-json/wp/v2/` |
| Registrar/Host | Netsons (DNS da aggiornare per puntare a Netlify) |
| Framework | Astro.js 5, `output: 'static'` |
| Node | v18+ richiesto |
| Cartella progetto | `D:\marcomunich.com` |

---

## STATO PAGINE (verificato 2026-03-03)

| URL Netlify | Sorgente WP | Stato | Note |
|-------------|-------------|-------|------|
| `/` | WP API homepage | ✅ LIVE OK | Hero, foto, CTA, ultime notizie |
| `/servizi/` | Thrive HTML estratto | ✅ LIVE OK | 1 servizio: "I miei Percorsi Online" |
| `/chi-sono/` | Thrive HTML estratto | ✅ LIVE OK | Foto Marco, bio completa |
| `/inizia-da-qui/` | Thrive HTML estratto (slug: risorse) | ✅ LIVE OK | Landing page con audio e CTA |
| `/video/` | WP API slug: video | ✅ LIVE OK | Video Marketing Olistico |
| `/blog/` | WP API posts | ✅ LIVE OK | 201 articoli — identici a WP |
| `/blog/[slug]/` | WP API singolo post | ✅ LIVE OK | Testo completo, immagini da WP CDN |
| `/categoria/[slug]/` | WP API tassonomia | ✅ da verificare | Route creata, non testata |

---

## ARCHITETTURA DEL CODICE

```
src/
├── layouts/
│   └── BaseLayout.astro      # Layout base con header/footer/nav
├── pages/
│   ├── index.astro            # Homepage (WP API)
│   ├── servizi.astro          # Thrive HTML inline + CSS estratto
│   ├── chi-sono.astro         # Thrive HTML inline + CSS estratto
│   ├── inizia-da-qui.astro    # Thrive landing HTML inline + CSS estratto
│   ├── video.astro            # WP API slug "video"
│   ├── blog/
│   │   ├── index.astro        # Lista articoli paginata
│   │   └── [slug].astro       # Singolo articolo
│   └── categoria/
│       └── [slug].astro       # Archivio categoria
├── lib/
│   └── wordpress.ts           # Helper WP REST API
└── components/
    └── ...

public/
└── thrive/
    ├── servizi.css            # CSS estratto da WP (21k)
    ├── chi-sono.css           # CSS estratto da WP (26k)
    └── risorse.css            # CSS estratto da WP landing (151k)
```

---

## PROBLEMA RISOLTO: Thrive Architect

**Problema:** `content.rendered` via WP REST API restituisce solo JSON config Thrive (`__CONFIG_group_edit__`), non HTML renderizzato.

**Soluzione applicata:**
1. Download HTML renderizzato via `curl https://marcomunich.com/[slug]/`
2. Estrazione CSS page-specific (`tcb-style-base-page-*`, `tve_global_variables`, `thrive-default-styles`)
3. Estrazione contenuto tra `<div id="thrive-header">` e `<div id="thrive-footer">` con contatore nidificazione div
4. Strip tag Bionic Reading (`<br-bold>`, `<br-fixation>`, `<br-span>`, `<br-edge>`) che erano presenti nel DB WordPress
5. CSS salvato in `public/thrive/`, HTML inline in `<Fragment set:html={...}>` nell'Astro page

**Script di estrazione** (se necessario rifare):
```python
# Salva come extract_thrive.py ed esegui con:
# python extract_thrive.py https://marcomunich.com/[slug]/ output-page.astro public/thrive/output.css

import sys, re

def find_div_end(html, start_pos):
    i, depth = start_pos, 0
    while i < len(html):
        if html[i:i+4] == '<div': depth += 1
        elif html[i:i+6] == '</div>':
            depth -= 1
            if depth == 0: return i + 6
        i += 1
    return len(html)

def strip_bionic(text):
    text = re.sub(r'<br-fixation[^>]*>(.*?)</br-fixation>', r'\1', text, flags=re.DOTALL)
    for tag in ['br-bold', 'br-span', 'br-edge']:
        text = re.sub(rf'<{tag}[^>]*>', '', text)
        text = re.sub(rf'</{tag}>', '', text)
    text = re.sub(r'<br-[a-z][^>]*>', '', text)
    text = re.sub(r'</br-[a-z][^>]*>', '', text)
    return text

with open('page.html', 'r', encoding='utf-8') as f:
    html = f.read()

# CSS
needed = ['tcb-style-base-page-', 'tve_global_variables', 'thrive-default-styles']
css_parts = []
for css_id in needed:
    for bid, bcss in re.findall(rf'<style[^>]*id="({re.escape(css_id)}[^"]*)"[^>]*>(.*?)</style>', html, re.DOTALL):
        css_parts.append(f'/* === {bid} === */\n{bcss.strip()}')

# Content
header_pos = html.find('id="thrive-header"')
div_start = html.rfind('<div', 0, header_pos)
header_end = find_div_end(html, div_start)
footer_pos = html.find('id="thrive-footer"')
footer_div_start = html.rfind('<div', 0, footer_pos)
content = strip_bionic(html[header_end:footer_div_start].strip())
```

---

## PROSSIMI PASSI (in ordine di priorità)

### 1. 🔴 URGENTE — Configurare dominio `marcomunich.com` su Netlify
**Cosa fare:**

**A) Su Netlify** (netlify.com → Site → Domain management):
- Clicca "Add a domain" → inserisci `marcomunich.com`
- Nota i valori DNS che Netlify fornisce

**B) Su Netsons** (pannello DNS del registrar):
Aggiungi questi record (mantenendo i record MX per email):
```
A     @     75.2.60.5
CNAME www   celebrated-haupia-4abb01.netlify.app
```
Oppure cambia i nameserver con quelli Netlify (opzione più semplice ma toglie controllo DNS).

**C) Su Netlify** — dopo che il DNS si propaga (fino a 48h):
- Attiva "Force HTTPS" nella sezione Domain management

---

### 2. 🟡 IMPORTANTE — Scaricare file MP3 MeMentor prima che WP vada offline
I file audio degli articoli (WP plugin "MeMentor") sono hostati su WP e andranno persi quando WP verrà disattivato.

**Pattern URL:** `https://marcomunich.com/wp-content/uploads/mementor/mementor-{post_id}-it.mp3`

**Script di download:**
```bash
# Ottieni tutti i post ID
curl -s "https://marcomunich.com/wp-json/wp/v2/posts?per_page=100&page=1&_fields=id" | python -c "
import json,sys
ids = [p['id'] for p in json.load(sys.stdin)]
print('\n'.join(map(str,ids)))
"

# Per ogni ID, prova a scaricare l'MP3
# mkdir -p public/audio
# while read id; do
#   curl -s -o "public/audio/mementor-${id}-it.mp3" \
#     "https://marcomunich.com/wp-content/uploads/mementor/mementor-${id}-it.mp3"
# done < post_ids.txt
```

Poi aggiorna `[slug].astro` per usare `/audio/mementor-{id}-it.mp3` invece del WP URL.

---

### 3. 🟡 IMPORTANTE — Immagini WP → hosting autonomo
Le immagini degli articoli puntano ancora al CDN WP (`mlfqwn4vwjlv.i.optimole.com` o `marcomunich.com/wp-content/uploads/`). Se WP va offline, le immagini spariscono.

**Opzioni:**
- a) Mantenere WP online solo per immagini (media CDN)
- b) Scaricare tutte le immagini in `public/images/` e riscrivere i tag `<img>` in build
- c) Usare un CDN esterno (Cloudinary, Bunny CDN)

---

### 4. 🟢 NICE TO HAVE — Redirect da URL WP a URL Astro
Il blog WP era a `/blog-consulenza-marketing/`, ora è a `/blog/`. Aggiungere redirect in `public/_redirects`:
```
/blog-consulenza-marketing/ /blog/ 301
/blog-consulenza-marketing/*  /blog/:splat  301
```

---

### 5. 🟢 NICE TO HAVE — Pagina /percorsi-online/
La pagina è linkata da servizi.astro (`href="https://marcomunich.com/percorsi-online/"`). Valutare se creare una pagina Astro o mantenere il link al WP.

---

## FILE CHIAVE

| File | Descrizione |
|------|-------------|
| `src/pages/servizi.astro` | Pagina servizi con Thrive HTML pulito |
| `src/pages/chi-sono.astro` | Pagina chi sono con Thrive HTML pulito |
| `src/pages/inizia-da-qui.astro` | Landing page risorse con Thrive HTML |
| `src/pages/video.astro` | Pagina video (WP API) |
| `src/pages/blog/index.astro` | Lista blog paginata |
| `src/pages/blog/[slug].astro` | Singolo post |
| `src/lib/wordpress.ts` | Helper fetch WP REST API |
| `src/layouts/BaseLayout.astro` | Layout con `<slot name="head" />` |
| `public/thrive/servizi.css` | CSS Thrive pagina servizi (21k) |
| `public/thrive/chi-sono.css` | CSS Thrive pagina chi sono (26k) |
| `public/thrive/risorse.css` | CSS Thrive landing inizia-da-qui (151k) |
| `public/_redirects` | Redirect Netlify (da creare) |
| `astro.config.mjs` | Config Astro (output: static) |

---

## NOTE TECNICHE IMPORTANTI

- **Astro 5 + static**: tutto fetchato a build-time, nessun SSR
- **WP REST API paginazione**: max 100 post per chiamata, usare `per_page=100&page=N`
- **Thrive Architect**: non usa WP REST API per contenuto, richiede estrazione HTML diretto
- **Bionic Reading**: plugin WP che ha salvato tag custom nel DB — sempre strippare
- **BaseLayout slot**: `<link slot="head" rel="stylesheet" href="/thrive/...">` per CSS page-specific
- **Windows**: usare `python` non `python3`, percorsi con `/d/` in bash
- **Encoding**: sempre `encoding='utf-8'` nei file Python su Windows

---

## COMANDI UTILI

```bash
# Dev server locale
cd /d/marcomunich.com && npm run dev

# Build locale
cd /d/marcomunich.com && npm run build

# Deploy (push = deploy automatico)
cd /d/marcomunich.com && git add -A && git commit -m "msg" && git push origin main

# Check Netlify live
curl -s -o /dev/null -w "%{http_code}" https://celebrated-haupia-4abb01.netlify.app/servizi/

# Re-download pagina Thrive (se WP ancora online)
curl -s "https://marcomunich.com/[slug]/" -o "D:/marcomunich.com/[slug]_raw.html"
```
