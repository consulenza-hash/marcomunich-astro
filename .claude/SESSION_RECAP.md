# Session Recap — marcomunich.com

> Aggiornato: 2026-03-05

---

## Progetto

**marcomunich.com** — Sito Astro v5 (SSG) che sostituisce WordPress, deployato su hosting cPanel condiviso.

- **Branch `main`**: codice sorgente Astro (`src/`, `public/`, ecc.)
- **Branch `deploy`**: file statici buildati (HTML a root level, serviti direttamente da Apache)
- **Deploy manuale**: sul server cPanel, dal terminale: `cd ~/marcomunich.com && git fetch origin deploy && git checkout origin/deploy -- .`

---

## Cosa è stato fatto (in ordine cronologico)

### 1. Fix deploy iniziale
- **Problema**: `<LocationMatch>` nel `.htaccess` non permesso su hosting condiviso → sostituito con `<FilesMatch>`
- **Problema**: dopo il deploy il sito non aveva stili → doppia causa:
  - `Options +FollowSymLinks` bloccato sul server → semplificato a `Options -Indexes`
  - WordPress `index.php` servito al posto di Astro `index.html` → fix: `DirectoryIndex index.html`
- **Fix**: aggiunto `DirectoryIndex index.html` in `.htaccess`

### 2. Homepage — bottone articoli
- Testo bottone cambiato: "Carica altri articoli..." → **"Vai agli articoli"**
- File: `src/pages/index.astro`

### 3. Blog — categoria "Uncategorized"
- `getPrimaryCategory()` in `src/lib/wordpress.js` ora skippa "uncategorized" e restituisce la prima categoria reale
- Fix: `.find(t => t.slug !== 'uncategorized') ?? terms[0]`

### 4. Pagina `creazione-video-autentici.astro`
- Riscritta da zero come pagina Astro pulita (tema rosso `#DC2626`, sfondo `#0D0404`)
- Struttura identica a `corso-come-parlare-in-video.astro`
- Deployata sul branch deploy

### 5. Pagina `creazione-messaggio-autentico.astro` (tre modifiche)

#### a) Cambio URL
- Vecchio: `/corso-copywriting-persone-autentiche/`
- Nuovo: `/creazione-messaggio-autentico/`
- File rinominato: `corso-copywriting-persone-autentiche.astro` → `creazione-messaggio-autentico.astro`
- `currentPath` aggiornato nel file

#### b) Video lezione introduttiva
- Video aggiornato da `_83q4eUXmCo` a `rRAJz-LydLo?list=PLKgzAWOyM8xuq8wC6UBXhqze9Odan9JhM`
- Aggiornati: iframe embed + bottone hero "Guarda la lezione gratuita" + link testuale nella sezione finale

#### c) Riorganizzazione sezioni
- Sezione **"È tempo di rivedere il modo in cui ci promuoviamo online."** spostata in fondo alla pagina (era tra "È ideale per te se" e i prezzi)
- Sezione **testimonianze** rimossa
- Struttura finale: Hero → Fare chiarezza → Ti risuona → Argomenti → Video gratuita → A quali professionisti → Chi sono → È ideale per te se → **Prezzi** → **È tempo di rivedere...**

#### d) Aggiornamenti correlati
- `percorsi-online.astro`: link aggiornato al nuovo slug
- `risorse.astro`: link aggiornato al nuovo slug
- `public/.htaccess`: rimossa vecchia redirect `/creazione-messaggio-autentico/ → /percorsi-online/`, aggiunta nuova redirect `301 /corso-copywriting-persone-autentiche/ → /creazione-messaggio-autentico/`

### 6. Setup git sul server (primo deploy)
- `~/marcomunich.com` sul server non era un git repo → `git init` + `git remote add origin`
- Autenticazione via token GitHub embed nell'URL
- Primo `git checkout origin/deploy -- .` eseguito correttamente

### 7. Fix `DirectoryIndex index.html` nel source
- Aggiunto `DirectoryIndex index.html` in `public/.htaccess` (riga 2) così non si perde nei build futuri
- Commesso e pushato su entrambi i branch (`main` + `deploy`)

---

## Stato attuale

| Cosa | Stato |
|------|-------|
| `/creazione-messaggio-autentico/` | ✅ Funziona (solo finestra anonima, browser normale ha cache 301) |
| Redirect `/corso-copywriting-persone-autentiche/` → nuovo slug | ✅ Funziona |
| percorsi-online.astro e risorse.astro link aggiornati | ✅ |
| **Homepage** | ❌ **Ancora rotta** (probabilmente index.php WP ancora prioritario) |

---

## Problema aperto: Homepage rotta

**Sintomo**: la homepage (`https://marcomunich.com/`) mostra ancora WordPress o è rotta.

**Causa probabile**: nonostante `DirectoryIndex index.html` nel `.htaccess`, Apache potrebbe ancora servire `index.php` di WordPress. Possibili cause:
1. `Options +FollowSymLinks` causa 500 sul server (già risolto in passato rimuovendolo — potrebbe essere tornato nel source)
2. Il `DirectoryIndex` nel `.htaccess` non ha abbastanza priorità rispetto alla config del server
3. WordPress `index.php` nella root ancora presente

**Da fare per fixare la homepage**:
1. Verificare sul server: `ls ~/marcomunich.com/index.*` — vedere se ci sono sia `index.html` che `index.php`
2. Verificare: `cat ~/marcomunich.com/.htaccess | head -5` — controllare che `DirectoryIndex index.html` sia presente
3. Se `Options +FollowSymLinks` causa problemi, cambiarlo in `Options -Indexes` (solo) nel source e rideplorare
4. Come fix definitivo alternativo: rinominare o eliminare `index.php` dalla root del server (ma attenzione ai file WP)

---

## Workflow deploy (da usare ogni volta)

```bash
# Sul PC locale (branch main):
npm run build
cp dist/FILE_MODIFICATO /tmp/file-temp

# Switch a deploy:
git stash
git checkout deploy
cp /tmp/file-temp ./DESTINAZIONE
git add FILE
git commit -m "Descrizione"
git push origin deploy
git checkout main
git stash pop

# Sul server cPanel (terminale):
cd ~/marcomunich.com && git fetch origin deploy && git checkout origin/deploy -- .
```

**Note critiche**:
- Buildare SEMPRE su `main`, mai su `deploy` (deploy branch non ha `package.json`)
- Salvare i file in `/tmp/` PRIMA di `git stash` / switch a deploy
- `git checkout origin/deploy -- .` non elimina file non tracciati (WordPress files rimangono)

---

## File chiave

| File | Note |
|------|-------|
| `public/.htaccess` | Source htaccess — viene copiato in `dist/` durante il build |
| `src/lib/wordpress.js` | `getPrimaryCategory()` skippa "uncategorized" |
| `src/pages/creazione-messaggio-autentico.astro` | Pagina corso (era `corso-copywriting-persone-autentiche.astro`) |
| `src/pages/creazione-video-autentici.astro` | Pagina corso video (tema rosso, riscritta) |
| `src/pages/percorsi-online.astro` | Link aggiornato al nuovo slug |
| `src/pages/risorse.astro` | Link aggiornato al nuovo slug |
| `.claude/launch.json` | Dev server: `cmd.exe /c npm run dev` sulla porta 4321 |

---

## Prompt di resume per la prossima sessione

```
Stiamo lavorando su marcomunich.com — un sito Astro v5 (SSG) che sostituisce WordPress,
deployato su hosting cPanel condiviso con git a due branch: `main` (sorgente) e `deploy`
(file statici buildati a root level).

Nella sessione precedente abbiamo completato:
1. Fix .htaccess (LocationMatch → FilesMatch, DirectoryIndex index.html)
2. Homepage bottone: "Carica altri articoli" → "Vai agli articoli"
3. Blog: getPrimaryCategory() skippa "uncategorized"
4. creazione-video-autentici.astro: riscritta come pagina Astro clean (tema rosso)
5. corso-copywriting-persone-autentiche.astro → rinominato creazione-messaggio-autentico.astro
   - Nuovo URL: /creazione-messaggio-autentico/
   - Video lezione aggiornato: rRAJz-LydLo?list=PLKgzAWOyM8xuq8wC6UBXhqze9Odan9JhM
   - Sezione "È tempo di rivedere..." spostata in fondo (dopo i prezzi)
   - Testimonianze rimosse
   - percorsi-online.astro e risorse.astro link aggiornati
6. DirectoryIndex index.html aggiunto a public/.htaccess
7. Setup git sul server (~/marcomunich.com): git init + remote + primo deploy

PROBLEMA APERTO: la homepage è ancora rotta.
- Sintomo: mostra WordPress invece di Astro (o 500)
- .htaccess ha DirectoryIndex index.html ma sembra non bastare
- Da indagare: Options +FollowSymLinks potrebbe essere bloccato sul server,
  oppure index.php di WordPress nella root prende la precedenza
- File recap completo: .claude/SESSION_RECAP.md

Deploy command (server): cd ~/marcomunich.com && git fetch origin deploy && git checkout origin/deploy -- .
Remote: https://github.com/consulenza-hash/marcomunich-astro.git
```
