# Setup Auto-Deploy: WordPress → GitHub Actions → Netsons

Questa guida configura il deploy automatico: pubblichi un articolo su WordPress,
il sito Astro si ricostruisce e aggiorna entro ~5 minuti.

---

## STEP 1 — GitHub Personal Access Token (PAT)

1. Vai su: https://github.com/settings/tokens/new
2. Impostazioni:
   - **Note**: `marcomunich-deploy`
   - **Expiration**: No expiration (o 1 year)
   - **Scopes**: spunta `repo` (tutto il blocco)
3. Clicca **Generate token**
4. **COPIA IL TOKEN** — lo usi nei prossimi step

---

## STEP 2 — SSH Key: aggiungi la chiave pubblica al server Netsons

1. Accedi a cPanel → **SSH Access** (o "Gestione chiavi SSH")
2. Clicca **Manage SSH Keys** → **Import Key**
3. Nel campo "Public Key", incolla:

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIHr2FLRVrAO4P8U2zrXbV6PyZ4Nn6hWnF1LFwcn0h2FC github-actions@marcomunich.com
```

4. Dai un nome tipo `github-actions`
5. Clicca **Import** e poi **Authorize** sulla chiave appena importata

> In alternativa, via Terminal cPanel:
> ```bash
> echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIHr2FLRVrAO4P8U2zrXbV6PyZ4Nn6hWnF1LFwcn0h2FC github-actions@marcomunich.com" >> ~/.ssh/authorized_keys
> chmod 600 ~/.ssh/authorized_keys
> ```

---

## STEP 3 — Segreti GitHub Actions

Vai su: https://github.com/consulenza-hash/marcomunich-astro/settings/secrets/actions

Aggiungi questi 5 secrets (clicca **New repository secret** per ciascuno):

| Nome | Valore |
|------|--------|
| `DEPLOY_TOKEN` | Il PAT creato nello Step 1 |
| `SSH_HOST` | `hostingweb21.netsons.net` |
| `SSH_USER` | `ldunqbzw` |
| `SSH_PORT` | `22` (o la porta SSH del tuo hosting — verifica in cPanel) |
| `SSH_PRIVATE_KEY` | (vedi sotto) |

Per `SSH_PRIVATE_KEY`, incolla questo testo completo incluse le righe `-----BEGIN` e `-----END`:

```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACB69hS0VawDuD/FNs6121ej8meDZ+oVpxdSxcHJ9IdhQgAAAKggdN5CIHTe
QgAAAAtzc2gtZWQyNTUxOQAAACB69hS0VawDuD/FNs6121ej8meDZ+oVpxdSxcHJ9IdhQg
AAAEC3g5HZPOvHHUPGoNbM0vV0A3dlHOLWyhakOck6sHxb0Hr2FLRVrAO4P8U2zrXbV6Py
Z4Nn6hWnF1LFwcn0h2FCAAAAHmdpdGh1Yi1hY3Rpb25zQG1hcmNvbXVuaWNoLmNvbQECAw
QFBgc=
-----END OPENSSH PRIVATE KEY-----
```

---

## STEP 4 — WordPress webhook

1. Vai in WP Admin → **Aspetto → Editor file tema** (o usa cPanel File Manager)
2. Apri `functions.php` del tema attivo
3. Incolla il contenuto di `setup/wp-webhook-snippet.php` IN FONDO al file
4. Salva

Poi configura il token:
1. Vai su: `https://marcomunich.com/wp-admin/options.php`
2. Cerca `github_dispatch_token` (usa Ctrl+F)
3. Se non esiste ancora, aggiungilo tramite WP CLI o una volta sola così:
   - WP Admin → Strumenti → Terminal (se disponibile)
   - Oppure aggiungi temporaneamente in functions.php:
     ```php
     add_option('github_dispatch_token', 'IL_TUO_PAT_QUI');
     ```
   - Poi rimuovi quella riga dopo il primo salvataggio

---

## STEP 5 — Test manuale

Una volta configurato tutto, fai un test manuale:

1. Vai su: https://github.com/consulenza-hash/marcomunich-astro/actions
2. Clicca **Build & Deploy** → **Run workflow** → **Run workflow**
3. Osserva l'esecuzione (dura ~5 minuti)
4. Se tutto verde ✅ → il deploy automatico è attivo

---

## Come funziona dopo il setup

```
Pubblichi articolo su WordPress
         ↓
WordPress invia webhook a GitHub API
         ↓
GitHub Actions si avvia (ubuntu runner)
         ↓
npm ci + npm run build (~3-4 minuti)
         ↓
Commit su branch deploy
         ↓
SSH → git reset --hard origin/deploy sul server
         ↓
Sito live aggiornato ✓ (~5 minuti totali)
```
