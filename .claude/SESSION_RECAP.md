# Session Recap — marcomunich.com

> Aggiornato: 2026-03-05

---

## Progetto

**marcomunich.com** — Sito Astro v5 (SSG) che sostituisce WordPress, deployato su cPanel condiviso (Netsons).

- **Branch `main`**: codice sorgente Astro (`src/`, `public/`, ecc.)
- **Branch `deploy`**: file statici buildati (HTML a root level, serviti da Apache)
- **Document Root sul server**: `~/public_html/` ← CRITICO, non `~/marcomunich.com/`
- **WordPress**: rimane come headless CMS (REST API), accessibile su wp-admin e wp-json
- **Cloudflare**: proxy attivo davanti al sito (free plan), una sola regola custom: blocca traffico Cina

---

## Workflow deploy (usare SEMPRE questo)

```bash
# 1. Sul PC locale, buildare SEMPRE su main:
npm run build

# 2. Salvare i file buildati in /tmp PRIMA di cambiare branch:
cp dist/.htaccess /tmp/htaccess-temp
# (o altri file modificati)

# 3. Passare a deploy e fare commit:
git checkout -- .claude/settings.local.json   # evita blocco checkout
git checkout deploy
cp /tmp/htaccess-temp .htaccess
git add .
git commit -m "Descrizione [deploy]"
git push origin deploy
git checkout main
git push origin main   # pushare main se ci sono commit

# 4. Sul server cPanel (terminale xterm.js):
cd ~/public_html && git fetch origin deploy && git checkout origin/deploy -- .htaccess
# oppure per più file:
git checkout origin/deploy -- .htaccess percorsi-online/index.html ...
```

**Note critiche**:
- Buildare SEMPRE su `main` (deploy branch non ha `src/` né `package.json`)
- `.claude/settings.local.json` viene sempre modificato → fare `git checkout -- .claude/settings.local.json` prima di switch
- xterm.js cPanel: usare tool `computer` → `type` (non JavaScript events)
- `git checkout origin/deploy -- .` non elimina file non tracciati (WordPress rimane)

---

## Stato attuale pagine

| URL | Stato |
|-----|-------|
| `/` — Homepage | ✅ Astro |
| `/percorsi-online/` (Servizi) | ✅ Cards colorate, headings aggiornati |
| `/creare-prodotti-gratuiti/` | ✅ Tema arancione, link YouTube |
| `/video/` | ❌ Mostra shortcode grezzo `[embedyt]` |
| `wp-admin/` | ✅ Funziona (302 → login) |
| `wp-login.php` | ✅ Funziona (200) |

---

## `.htaccess` attuale (`public/.htaccess`)

```apache
Options -Indexes
DirectoryIndex index.html index.php

# Security Headers
<IfModule mod_headers.c>
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Cache lunga per asset con hash
<FilesMatch "\.(js|css|woff2|...)$"> ... </FilesMatch>

# Redirects (301/302 vari)
Redirect 301 /servizi/ /percorsi-online/
# ... altri redirect ...

# RewriteEngine
RewriteEngine On
RewriteBase /
RewriteRule ^$ index.html [L]

# Eccezioni WordPress — IMPORTANTE
RewriteRule ^wp-admin(/.*)?$ - [L]
RewriteRule ^wp-login\.php$ - [L]
RewriteRule ^wp-content(/.*)?$ - [L]
RewriteRule ^wp-includes(/.*)?$ - [L]
RewriteRule ^xmlrpc\.php$ - [L]
RewriteRule ^wp-json(/.*)?$ - [L]
RewriteRule ^wp-cron\.php$ - [L]

# Trailing slash per pagine Astro
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_FILENAME} -d [OR]
RewriteCond %{DOCUMENT_ROOT}%{REQUEST_URI}/index.html -f
RewriteRule ^(.+[^/])$ /$1/ [R=301,L]

ErrorDocument 404 /404.html
```

**Chiavi di questa config**:
- `DirectoryIndex index.html index.php` → `index.html` prioritario (Astro), ma `index.php` disponibile come fallback per wp-admin e altre directory WP
- Le regole `RewriteRule ^wp-admin` ecc. lasciano passare WordPress prima che il motore Astro intervenga
- Senza `index.php` nel DirectoryIndex, `wp-admin/` dava 403 (Apache cercava solo index.html, non trovava, e con -Indexes restituiva 403)

---

## Fix eseguiti in questa sessione (2026-03-05)

### wp-admin 403 — causa e fix
- **Sintomo**: `https://marcomunich.com/wp-admin/` dava 403 Forbidden
- **Diagnosi**: `curl https://marcomunich.com/wp-admin/index.php` → 302 (funzionava!); solo la directory `/wp-admin/` dava 403
- **Causa**: `DirectoryIndex index.html` da solo → Apache cercava `wp-admin/index.html`, non trovava, con `Options -Indexes` restituiva 403 invece di fallback su `index.php`
- **Fix**: cambiato `DirectoryIndex index.html` → `DirectoryIndex index.html index.php`
- **Aggiunto anche**: eccezioni RewriteEngine per tutti i path WordPress (wp-admin, wp-login, wp-content, ecc.)

### Cloudflare — verificato non blocca wp-admin
- Nessuna regola WAF che blocca wp-admin
- Solo 1 regola custom attiva: blocca traffico dalla Cina

---

## Problema aperto: `/video/` mostra shortcode grezzo

**Sintomo**: la pagina `/video/` mostra il testo letterale:
```
[embedyt] https://www.youtube.com/embed?listType=playlist&list=UUh9LH2mnDSJ2l3jfDVsGSIA&layout=gallery[/embedyt]
```

**Causa**: il plugin WordPress che elabora il shortcode `[embedyt]` non è installato. Astro fetcha `content.rendered` dalla WP REST API, ma WP restituisce il shortcode grezzo perché il plugin non è attivo.

**Plugin da installare**: **EPYT — Easy YouTube Video Player** di Kevin Weber
- Shortcode: `[embedyt]`
- Il CSS di `src/pages/video.astro` è già costruito per i suoi output (`.epyt-gallery`, `.epyt-gallery-thumb`, ecc.)
- **Link installazione**: `https://marcomunich.com/wp-admin/plugin-install.php?s=Easy+YouTube+Video+Player&tab=search`

**Steps per fixare**:
1. Accedere a `https://marcomunich.com/wp-admin/` → Plugins → Aggiungi nuovo
2. Cercare "Easy YouTube Video Player" di Kevin Weber
3. Installare e attivare
4. Rebuild Astro: `npm run build`
5. Deploy su server

**Alternativa senza plugin** (opzione B): riscrivere `video.astro` come pagina indipendente che fetcha direttamente dalla YouTube Data API v3 — stessa visual della galleria EPYT ma zero dipendenza da WP/plugin.

---

## File chiave

| File | Note |
|------|-------|
| `public/.htaccess` | Htaccess sorgente — copiato in `dist/` al build |
| `src/pages/video.astro` | Pagina video — dipende da EPYT per shortcode [embedyt] |
| `src/pages/percorsi-online.astro` | Servizi con cards colorate per corso |
| `src/pages/creare-prodotti-gratuiti.astro` | Landing arancione, link YouTube video lezione |
| `src/pages/creazione-messaggio-autentico.astro` | Ex corso-copywriting, tema viola #5551D3 |
| `src/pages/creazione-video-autentici.astro` | Tema rosso #DC2626 |
| `src/components/Header.astro` | Nav: Servizi punta a /percorsi-online/ |
| `src/lib/wordpress.js` | getPrimaryCategory() skippa "uncategorized" |
| `.claude/launch.json` | Dev server: porta 4321 |

---

## Credenziali / accessi noti

- **cPanel**: `https://hostingweb21.netsons.net:2083/` (terminale disponibile)
- **GitHub repo**: `https://github.com/consulenza-hash/marcomunich-astro.git`
- **WordPress REST API**: `https://marcomunich.com/wp-json/wp/v2/`
- **YouTube Channel ID**: `UCh9LH2mnDSJ2l3jfDVsGSIA`
- **Cloudflare account**: Consulenza@marcomunich.com (free plan)
