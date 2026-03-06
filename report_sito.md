# Report Tecnico — marcomunich.com
**Periodo:** 5–6 Marzo 2026
**Stack:** Astro v5 SSG · WordPress headless · Apache cPanel · Cloudflare CDN · GitHub (branch `main` + `deploy`)

---

## Obiettivo

Mantenere e migliorare il sito **marcomunich.com**, un'architettura ibrida in cui:
- **Astro** genera pagine statiche a build time (branch `main` = sorgente, branch `deploy` = HTML buildato)
- **WordPress** gira in background come headless CMS (REST API)
- **cPanel Netsons** ospita entrambi nella stessa `~/public_html/`
- **Cloudflare** (free plan) fa da CDN e proxy davanti al server

---

## Sessione 1 — 5 Marzo 2026

### Problema principale: `/video/` mostrava `[embedyt]` grezzo

**Sintomo:** la pagina `marcomunich.com/video/` mostrava il testo letterale `[embedyt]https://...` invece della gallery YouTube EPYT.

**Causa root identificata:** nel file `.htaccess` del server era presente questa riga:

```apache
RewriteRule ^wp-json(/.*)?$ - [L]
```

Il `-` come azione Apache **blocca il rewriting ma non instrada la richiesta** — quindi Apache cercava un file fisico `wp-json/` che non esiste, restituendo 404. Astro durante la build fetcha `https://marcomunich.com/wp-json/wp/v2/pages?slug=video` per ottenere il contenuto renderizzato da WordPress (incluso il processamento dello shortcode `[embedyt]` da parte del plugin WP YouTube Lyte). Con la chiamata che falliva, il div del contenuto rimaneva vuoto o con il raw shortcode.

**Fix applicato:**
```apache
# PRIMA (rotto)
RewriteRule ^wp-json(/.*)?$ - [L]

# DOPO (corretto)
RewriteRule ^wp-json(/.*)?$ /index.php [L]
```

**Ulteriori fix in `.htaccess`:**
- `DirectoryIndex index.html index.php` (aggiunto `index.php` — senza di esso wp-admin non trovava `index.php` di WordPress)
- Redirect aggiornati: `/come-posso-aiutarti-2/ → /servizi/`, `/sessione-introduttiva/ → /servizi/`
- Rimosso redirect `/servizi/ → /percorsi-online/` (non più necessario)

**Numero di build Astro necessarie:** 3
- Build 1: raccolta dati per il fix `.htaccess`
- Build 2: risultato parziale (1 occorrenza residua di `[embedyt]` — probabile cache Cloudflare)
- Build 3: output corretto (6× `epyt-gallery`, 0× `[embedyt]`)

**Deploy:** via cPanel terminal con `git fetch origin && git checkout origin/deploy -- video/index.html` (aggiornamento selettivo, non full reset).

---

## Sessione 2 — 6 Marzo 2026

### 1. Rimozione sezione Video

**Decisione:** abbandonare la sezione `/video/` del sito.

**File modificati:**
| File | Modifica |
|------|----------|
| `src/pages/video.astro` | **Eliminato** |
| `src/components/Header.astro` | Rimossa voce "Video" da `navItems` (da 5 a 4 voci) |
| `public/.htaccess` | Aggiunto `Redirect 301 /video/ /blog/` |

---

### 2. Fix pagine `cmfo-lezione1` e `cmfo-lezione2` (404)

**Problema:** le URL `marcomunich.com/cmfo-lezione1/` e `marcomunich.com/cmfo-lezione2/` restituivano 404.

**Causa:** sono pagine WordPress costruite con **Thrive Architect**. Il contenuto vero è nei metadati custom di Thrive, non nel campo `content.rendered` della REST API (che restituiva solo 212 caratteri). La route dinamica `[slug].astro` genera solo i **post** WordPress (non le **pagine**), quindi Astro non le aveva mai buildate come file statici.

**Fix:** regole `.htaccess` che intercettano queste URL prima della normale logica di routing e le inoltrano direttamente a `index.php` di WordPress:

```apache
RewriteRule ^cmfo-lezione1/?$ /index.php [L,QSA]
RewriteRule ^cmfo-lezione2/?$ /index.php [L,QSA]
```

---

### 3. Fix bottone "Chi sono" in `/risorse/` (dimensione errata)

**Problema:** il bottone "Chi sono" appariva più piccolo rispetto ai bottoni "Ascoltami su Spotify" e "Blog" nella stessa sezione.

**Causa:** in una sessione precedente era stato aggiunto un CSS override in `risorse.astro` per risolvere un presunto problema di "inglobamento del video":

```css
:global(a[href="/chi-sono/"]) {
  display: block !important;
  position: relative !important;
  overflow: hidden !important;
  z-index: 1 !important;
}
```

Analizzando l'HTML generato da Thrive Architect, si è verificato che la struttura era già corretta: l'anchor `/chi-sono/` si chiude **prima** del video YouTube, non lo ingloba. Il CSS override era quindi inutile e causava la differenza di dimensione alterando il comportamento di layout del box Thrive.

**Fix:** rimosso l'intero blocco CSS override. I tre bottoni condividono ora le stesse regole Thrive CSS (`max-width: 674px`, centrato).

---

## La Sfida di Debugging Più Grande: il Loop della Build/Deploy

### Descrizione del problema

Il deploy delle modifiche ha richiesto **~40 minuti** a causa di un bug strutturale non documentato nel repository: il branch `deploy` aveva la cartella **`dist/` committata per errore** in sessioni precedenti.

### Perché era un problema critico

Il flusso di lavoro prevede:
1. Modifiche su branch `main`
2. `npm run build` → genera `dist/`
3. Switch a branch `deploy`
4. Copia di `dist/*` nella root del branch deploy
5. Commit + push

**Il bug:** ogni volta che si eseguiva `git checkout deploy`, git ripristinava la cartella `dist/` dai file committati sulla branch deploy (versione vecchia). Questo sovrascriveva silenziosamente la `dist/` appena buildata.

### Sintomi osservati

- Il nav nel deploy mostrava ancora `/video/` e `/servizi/` anche dopo 3 build pulite
- `cmp dist/blog/index.html ./blog/index.html` → `IDENTICI` (entrambi con il vecchio contenuto)
- Il comando `grep "percorsi-online" dist/blog/index.html` restituiva 0 risultati anche dopo una build apparentemente corretta

### Sequenza di debug

1. Sospetto iniziale: **cache Astro** (`.astro/`) → rimossa, problema persisteva
2. Sospetto secondario: **build in background** con stato di branch errato → verificato che la build girava su `main` correttamente
3. Scoperta: `git ls-files dist/` sul branch `deploy` → **322+ file tracciati in dist/**
4. Conferma: switching branch ripristinava la vecchia `dist/` sovrascrivendo quella nuova

### Soluzione

```bash
# Rimozione di dist/ dal tracking git su branch deploy
git rm -rf --cached dist/

# Aggiunta a .gitignore sul branch deploy
echo "dist/" >> .gitignore

# Build pulita con cancellazione esplicita di dist/ e cache
rm -rf dist .astro
npm run build

# Copia in staging ESTERNO prima di qualsiasi git checkout
# (evita che git sovrascriva la dist/ al prossimo branch switch)
cp -r dist/ ~/AppData/Local/Temp/marcomunich-deploy-temp/

# Solo a questo punto switch a deploy
git checkout deploy
```

---

## File Creati / Modificati (Sessione 1+2)

### File sorgente (`main` branch)

| File | Operazione | Descrizione |
|------|-----------|-------------|
| `src/pages/video.astro` | **Eliminato** | Pagina video rimossa |
| `src/components/Header.astro` | Modificato | Rimossa voce "Video" dal nav |
| `src/pages/risorse.astro` | Modificato | Rimosso CSS override bottone chi-sono |
| `public/.htaccess` | Modificato | Fix wp-json routing, cmfo rules, video redirect, DirectoryIndex |

### File deploy (`deploy` branch)

| File | Operazione | Descrizione |
|------|-----------|-------------|
| `video/index.html` | **Eliminato** | Non più presente nel sito |
| `.htaccess` (root) | Modificato | Stesse modifiche di `public/.htaccess` |
| `.gitignore` | Creato | Aggiunto `dist/` per evitare tracking accidentale |
| Tutte le 322 pagine HTML | Aggiornate | Nav rebuildata senza "Video" |
| `_astro/*.css` | Aggiornati | Asset CSS con nuovi hash |
| `sitemap-0.xml` | Aggiornato | Rimosso `/video/` dall'indice |

---

## Statistiche

| Metrica | Valore |
|---------|--------|
| Commit totali nel repository | 65 |
| Build Astro eseguite in 48h | 6 |
| Pagine statiche generate per build | 322 |
| Tempo medio per build | ~200s |
| Minuti spesi nel bug dist/ tracking | ~40 min |
| Redirect 301 attivi in `.htaccess` | 22 |

---

## Note Architetturali

### Problema strutturale aperto: pagine Thrive Architect non in Astro

Esistono pagine WordPress costruite con Thrive Architect che non hanno un corrispondente file Astro e non vengono buildate staticamente. Attualmente risolto con regole `.htaccess` specifiche per ciascuna. Se ne aggiungono altre, va aggiunta una regola per ognuna.

Pagine WP note non in Astro:
- `cmfo-lezione1` → regola htaccess ✅
- `cmfo-lezione2` → regola htaccess ✅
- `trovare-clienti-olistico-lezionevideo` → non gestita
- `creare-contenuti-gratuiti-da-uno-spazio-di-aiuto` → non gestita
- `human-design-chi-sei-nel-grande-disegno` → non gestita

### WordPress come headless CMS

WordPress gira sulla stessa `public_html/`. Astro fetcha i contenuti a build time via REST API. Per nuovi articoli o modifiche ai contenuti, è **necessaria una nuova build Astro**. Il sito live è completamente statico — WordPress non viene mai interrogato dagli utenti finali (tranne per le route esplicitamente inoltrate via `.htaccess`).

---

*Report generato il 6 Marzo 2026*
