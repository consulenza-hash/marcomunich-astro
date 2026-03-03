# Stato Migrazione marcomunich.com → Astro + Netlify

**Aggiornato:** 2026-03-03
**Progetto:** Migrazione WordPress+Thrive → Astro.js statico su Netlify

---

## Infrastruttura

| Cosa | Dove |
|---|---|
| Codice sorgente locale | `D:\marcomunich.com` |
| GitHub repo | `https://github.com/consulenza-hash/marcomunich-astro` |
| Netlify (live) | `https://celebrated-haupia-4abb01.netlify.app` |
| WordPress (backend CMS) | `https://marcomunich.com` (hosting Netsons) |
| Deploy | Automatico: ogni `git push` su `main` → Netlify rebuild |

---

## Pagine — Stato attuale

| Pagina | URL | Stato | Note |
|---|---|---|---|
| Homepage | `/` | ✅ OK | Funziona |
| Blog | `/blog/` | ✅ OK | Articoli caricati dal WP REST API |
| Articoli | `/[slug]/` | ✅ OK | ~200 articoli statici |
| Video | `/video/` | ✅ OK | Gallery YouTube da WP |
| Categorie | `/categoria/[slug]/` | ✅ OK | 6 categorie |
| Chi sono | `/chi-sono/` | ⚠️ DA VERIFICARE | HTML Thrive embedded, non testato visivamente |
| Servizi | `/servizi/` | ❌ ROTTO | Vedi problema sotto |
| Inizia da qui | `/inizia-da-qui/` | ✅ PROBABILMENTE OK | HTML Thrive pulito embedded |

---

## Problema Principale: Servizi

### Causa
Il file `src/pages/servizi.astro` contiene HTML estratto da WordPress con tag
`<br-bold>`, `<br-fixation>`, `<br-span>`, `<br-edge>` ovunque nel testo.

Questi tag vengono iniettati dall'**estensione browser "Bionic Reading"** attiva
al momento del download. NON sono parte del WordPress originale.

### Effetto
- Il testo è illeggibile / mal formattato
- La colonna sinistra dei servizi è VUOTA (solo un content box vuoto)
- Mostra solo "I miei Percorsi Online" invece dell'elenco completo servizi

### Fix necessario
Ri-scaricare la pagina `/servizi/` da WP **senza** l'estensione Bionic Reading attiva:

```bash
# Dal terminale nella directory del progetto
curl -s "https://marcomunich.com/servizi/" -o temp_servizi.html

# Poi ri-eseguire l'estrazione (vedi script sotto)
python scripts/extract_thrive.py
```

### Script di estrazione (da creare in scripts/)
```python
import re, sys

def find_div_end(html, start_pos):
    i = start_pos
    depth = 0
    while i < len(html):
        if html[i:i+4] == '<div':
            depth += 1
        elif html[i:i+6] == '</div>':
            depth -= 1
            if depth == 0:
                return i + 6
        i += 1
    return len(html)

def extract_page(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()

    # Verifica assenza tag Bionic Reading
    if '<br-bold>' in html:
        print("ATTENZIONE: HTML contaminato da estensione Bionic Reading!")
        print("Disabilita l'estensione e ri-scarica la pagina.")
        return None, None

    # CSS: page-specific + global variables + default styles
    needed = ['tcb-style-base-page-', 'tve_global_variables', 'thrive-default-styles']
    css_parts = []
    for css_id in needed:
        for bid, bcss in re.findall(
            rf'<style[^>]*id="({re.escape(css_id)}[^"]*)"[^>]*>(.*?)</style>',
            html, re.DOTALL
        ):
            css_parts.append(f'/* === {bid} === */\n{bcss.strip()}')
    for bcss in re.findall(r'<style class="tve_custom_style"[^>]*>(.*?)</style>', html, re.DOTALL):
        css_parts.append(f'/* === custom === */\n{bcss.strip()}')

    # Contenuto tra div#thrive-header e div#thrive-footer
    header_pos = html.find('id="thrive-header"')
    div_start = html.rfind('<div', 0, header_pos)
    header_end = find_div_end(html, div_start)

    footer_pos = html.find('id="thrive-footer"')
    footer_div_start = html.rfind('<div', 0, footer_pos)

    content = html[header_end:footer_div_start].strip()
    content = re.sub(r'^</div>\s*', '', content)

    return '\n\n'.join(css_parts), content

# Uso:
# css, content = extract_page('temp_servizi.html')
# with open('public/thrive/servizi.css', 'w', encoding='utf-8') as f: f.write(css)
# with open('public/thrive/servizi.html', 'w', encoding='utf-8') as f: f.write(content)
```

---

## File Chiave

### Pagine Astro
```
src/pages/
├── index.astro              # Homepage (fetches WP REST API)
├── [slug].astro             # Template articoli (200+ posts)
├── blog/index.astro         # Lista articoli
├── video.astro              # Gallery YouTube
├── chi-sono.astro           # Bio (Thrive HTML embedded + CSS)
├── servizi.astro            # ❌ DA RIFARE (contaminato da Bionic Reading)
├── inizia-da-qui.astro      # Risorse (Thrive HTML embedded + CSS)
└── categoria/[slug].astro   # Archivi categoria
```

### CSS Thrive estratti (in public/thrive/)
```
public/thrive/
├── servizi.css      # ✅ OK (CSS estratto correttamente)
├── chi-sono.css     # ✅ OK
└── risorse.css      # ✅ OK (151k - landing page)
```

### Config
```
netlify.toml         # Build config (npm run build, publish: dist)
public/_redirects    # 301/302 redirect da vecchi URL
.gitignore
```

### Libreria WordPress
```
src/lib/wordpress.ts   # Funzioni: getAllPosts(), getPageBySlug(), ecc.
src/layouts/BaseLayout.astro  # Ha <slot name="head" /> per CSS extra
```

---

## Come funzionano le pagine Thrive

Le pagine costruite con Thrive Architect (servizi, chi-sono, inizia-da-qui)
NON usano il WP REST API perché `content.rendered` è vuoto per Thrive.

**Soluzione adottata:** HTML statico estratto dalla pagina WP renderizzata.

Struttura di ogni pagina Thrive in Astro:
```astro
---
import BaseLayout from '@layouts/BaseLayout.astro';
---

<BaseLayout title="..." currentPath="/servizi/">
  <link slot="head" rel="stylesheet" href="/thrive/servizi.css" />
  <div class="thrive-page-wrap">
    <Fragment set:html={`...HTML Thrive estratto...`} />
  </div>
</BaseLayout>

<style>
  .thrive-page-wrap { overflow-x: hidden; }
</style>
```

---

## Prossimi Passi (in ordine di priorità)

1. **[URGENTE] Rifare servizi.astro**
   - Disabilitare estensione Bionic Reading nel browser
   - `curl -s "https://marcomunich.com/servizi/" -o temp_servizi.html`
   - Estrarre contenuto con lo script sopra
   - Aggiornare `src/pages/servizi.astro`
   - `git add -p && git commit -m "Fix pagina servizi" && git push`

2. **Verificare chi-sono.astro**
   - Controllare visivamente `https://celebrated-haupia-4abb01.netlify.app/chi-sono/`

3. **Configurare dominio marcomunich.com su Netlify**
   - Netlify → Domain management → Add custom domain
   - Aggiornare i DNS su Netsons (CNAME o A record verso Netlify)
   - SSL automatico Netlify

4. **Scaricare MP3 audio prima che WP vada offline**
   - Pattern URL: `https://marcomunich.com/wp-content/uploads/text-to-speech-tts/mementor-{ID}-it.mp3`
   - Salvare in `public/audio/` rinominando in `{slug}.mp3`
   - Aggiornare `[slug].astro` per usare `/audio/{slug}.mp3` invece dell'URL WP

---

## Architettura (headless)

```
Netlify CDN (frontend)
  ├── Astro build statico (generato a build time)
  ├── WP REST API chiamato solo durante npm run build
  └── Immagini: ancora su Optimole/WP (CDN già ottimizzato)

WordPress su Netsons (backend - TEMPORANEO)
  ├── Serve solo dati via REST API durante il build
  └── Può essere spento quando tutto il contenuto è migrato
```

**IMPORTANTE:** Ogni `git push` su main → Netlify chiama WP API per rebuilddare.
Se WP è offline o lento → build fallisce. Fare rebuild di mattina presto.

---

## Note tecniche

- **SEO:** Rank Math non espone dati via REST API standard → fallback su title+excerpt (funzionale)
- **Audio TTS:** MeMentor genera MP3 a `mementor-{post_id}-it.mp3`. Player HTML5 con auto-hide se file non esiste.
- **Thrive CSS:** Non ci sono link CSS esterni — tutto è inline. Includere solo il CSS page-specific + tve_global_variables + thrive-default-styles (NON il CSS del simbolo header da 103k).
- **Bionic Reading:** Estensione Chrome che inietta tag `<br-bold>`, `<br-fixation>` nel DOM. Disabilitarla prima di fare curl o aprire DevTools.
