# Setup Instagram API — Guida per Marco

Questa è la parte del lavoro che solo tu puoi fare, perché richiede le tue credenziali. Tempo stimato: **30-45 minuti**.

Quando finisci e salvi il token come GitHub Secret, l'automazione è pronta e il **Carosello 1 partirà automaticamente il 6 aprile alle 9:30**.

---

## Cosa abbiamo già pronto

- ✅ 432 PNG dei 52 caroselli renderizzate in `public/contenuti-social/immagini-caroselli/`
- ✅ Pushate su main → Netsons le ha deployate → sono live a `https://www.marcomunich.com/contenuti-social/immagini-caroselli/carosello-XX/slide-NN.png`
- ✅ `scripts/publish_carousel.py` — script Python che pubblica via Instagram Graph API
- ✅ `scripts/schedule.json` — 52 caroselli schedulati dal 6 aprile al 27 maggio 2026, uno al giorno alle 9:30
- ✅ `.github/workflows/publish-carousel-daily.yml` — workflow che ogni giorno alle 09:30 CEST chiama lo script

## Cosa manca

- ❌ App Meta Developer con permesso `instagram_content_publish`
- ❌ Access token con i permessi corretti
- ❌ Instagram Business Account ID
- ❌ GitHub Secrets `META_ACCESS_TOKEN` e `INSTAGRAM_BUSINESS_ACCOUNT_ID`

---

## Passo 1 — Verifica prerequisiti

Prima di iniziare, conferma che valgano queste 2 cose (dovrebbero, le abbiamo già verificate):

- [ ] `@marcomunich1983` è un account **Business** o **Creator** (non Personal)
- [ ] È collegato alla Pagina Facebook **Personal Branding Olistico**

Se manca qualcosa vai nell'app Instagram → Impostazioni → Account → Tipo di account → Business/Creator.

## Passo 2 — Crea l'app Meta Developer

1. Vai su **https://developers.facebook.com/apps/**
2. Clicca **"Create App"** (in alto a destra)
3. Scegli tipo: **"Business"**
4. **App name**: `Marcomunich Carousel Publisher`
5. **Contact email**: la tua email
6. **Business Account**: seleziona quello esistente (se ti chiede di crearne uno nuovo, fallo con nome "Marco Munich Personal Branding")
7. Clicca **Create App**. Ti chiederà la password Facebook per conferma.

## Passo 3 — Aggiungi i prodotti Instagram e Facebook Login

Dentro l'app appena creata:

1. Nella dashboard dell'app, nella sezione "Add products to your app", scorri fino a:
   - **Instagram** → clicca **Set up**
   - **Facebook Login for Business** → clicca **Set up**

2. Nel menu sinistro, sotto Instagram, dovresti vedere "Instagram API setup with Instagram login" o simile — **noi NON lo usiamo**, vogliamo invece "**Instagram API setup with Facebook login**" (è la versione Business/Creator).

3. Se non vedi l'opzione giusta, vai in **App Settings → Basic** e aggiungi "**Instagram Graph API**" come prodotto separato.

## Passo 4 — Collega la Pagina Facebook

1. Nel menu sinistro → Instagram → **API setup with Facebook login**
2. Sezione "**1. Generate access tokens**":
   - Clicca **Add or remove Pages**
   - Seleziona **Personal Branding Olistico**
   - Conferma permessi (clicca Continue/Continua)

## Passo 5 — Genera l'access token (short-lived)

1. Vai su **Graph API Explorer**: https://developers.facebook.com/tools/explorer/
2. In alto a destra, menu dropdown **Meta App** → seleziona "Marcomunich Carousel Publisher"
3. **User or Page** → scegli "**Get Page Access Token**" → seleziona "**Personal Branding Olistico**"
4. Clicca su "**Permissions**" e aggiungi tutti questi scope:
   - `pages_show_list`
   - `pages_read_engagement`
   - `instagram_basic`
   - `instagram_content_publish`
   - `business_management`
5. Clicca **Generate Access Token** → autorizza nella popup → copia il token che appare nel campo "Access Token".

⚠️ Questo è un token **short-lived** (scade in 1 ora). Dobbiamo convertirlo in long-lived subito.

## Passo 6 — Converti in long-lived token (60 giorni)

Apri un terminale ed esegui questo comando, sostituendo `SHORT_TOKEN`, `APP_ID`, `APP_SECRET` con i tuoi valori:

```bash
curl -s "https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=APP_ID&client_secret=APP_SECRET&fb_exchange_token=SHORT_TOKEN"
```

- **APP_ID** e **APP_SECRET** li trovi in Meta Developer Portal → App Settings → Basic
- **SHORT_TOKEN** è quello del Passo 5

La risposta sarà un JSON tipo:
```json
{"access_token":"EAAxxxxxxx...","token_type":"bearer","expires_in":5183944}
```

Quell'`access_token` è il **long-lived token** (valido ~60 giorni). **Questo è il token che ti serve.**

Per estendere a "never expires" devi prima convertirlo in Page access token:

```bash
curl -s "https://graph.facebook.com/v21.0/me/accounts?access_token=LONG_LIVED_USER_TOKEN"
```

Troverai l'array `data` con la pagina Personal Branding Olistico e il suo `access_token` — **quello è il Page token a scadenza lunga**, di fatto permanente finché non revochi i permessi. Usa questo.

## Passo 7 — Trova l'Instagram Business Account ID

```bash
curl -s "https://graph.facebook.com/v21.0/PAGE_ID?fields=instagram_business_account&access_token=PAGE_TOKEN"
```

Sostituisci `PAGE_ID` con l'ID della pagina Personal Branding Olistico (lo vedi nell'URL di Facebook quando sei sulla pagina, oppure nella risposta del comando precedente).

Risposta:
```json
{"instagram_business_account":{"id":"17841401234567890"},"id":"PAGE_ID"}
```

Quel `id` dentro `instagram_business_account` è l'**INSTAGRAM_BUSINESS_ACCOUNT_ID** che ti serve.

## Passo 8 — Salva i due valori come GitHub Secrets

1. Vai sul repo: **https://github.com/consulenza-hash/marcomunich-astro**
2. **Settings** → **Secrets and variables** → **Actions** → **New repository secret**
3. Crea questi due secret:

| Nome | Valore |
|------|--------|
| `META_ACCESS_TOKEN` | Il long-lived Page token del Passo 6 |
| `INSTAGRAM_BUSINESS_ACCOUNT_ID` | L'ID del Passo 7 |

**NON incollarli nella chat con Claude, NON committarli in file.** Vanno solo come Secrets su GitHub.

## Passo 9 — Test in dry-run

Prima di attivare il cron reale, fai un test manuale che simula tutto senza pubblicare nulla:

1. GitHub repo → **Actions** → **Publish Carousel to Instagram** (a sinistra)
2. Clicca **Run workflow** (dropdown a destra)
3. Seleziona branch `main`
4. **Dry-run**: flagga la checkbox
5. **Force id**: lascia vuoto (o metti `1` per forzare il Carosello 1)
6. Clicca **Run workflow**

Osserva i log. Dovresti vedere:
- Parsing schedule ok
- "Would create item for https://www.marcomunich.com/..." per ogni slide
- "Would create carousel container"
- "Would publish container"
- Zero errori

## Passo 10 — Test reale (pubblica il Carosello 1)

Se il dry-run è pulito:

1. Ripeti lo stesso workflow_dispatch ma **senza** il flag dry-run
2. **Force id**: metti `1`
3. Clicca Run

Il workflow farà il publish vero. Tra 30 secondi controlla Instagram `@marcomunich1983` → dovresti vedere il Carosello 1 pubblicato.

Il workflow aggiornerà `schedule.json` marcando il Carosello 1 come "published" e farà commit automatico.

## Passo 11 — Attiva il cron automatico

Niente da fare! Il cron è già attivo dal momento in cui il file `.github/workflows/publish-carousel-daily.yml` è su main. Domani alle 09:30 CEST partirà automaticamente e pubblicherà il Carosello 2. E così via per 51 giorni.

Se hai fatto il test reale al Passo 10 e hai pubblicato il Carosello 1, il cron di domani mattina pubblicherà il Carosello 2 automaticamente (perché il 1 è già marcato come published).

---

## Se qualcosa va storto

**Il workflow fallisce con "missing env vars"**
→ I secret non sono stati salvati correttamente. Ricontrolla Settings → Secrets.

**Il workflow fallisce con "Invalid OAuth access token"**
→ Il token è scaduto o ha permessi sbagliati. Rigenera dal Passo 5.

**Il workflow fallisce con "Invalid image URL"**
→ Le PNG non sono ancora deployate o l'URL base è sbagliato. Verifica che `https://www.marcomunich.com/contenuti-social/immagini-caroselli/carosello-01/slide-01.png` sia raggiungibile dal browser.

**Il token long-lived ha ~60 giorni di durata effettiva**
→ Il Page token è "quasi" permanente ma non infinito. Dopo 60 giorni dovrai rigenerarlo. Il workflow ti avviserà con un errore specifico quando succede. Puoi anche impostarti un promemoria per il 6 giugno 2026.

---

## Domande rapide

**Posso modificare le caption dei caroselli prima che vengano pubblicati?**
Sì. Apri `scripts/schedule.json`, modifica il campo `caption` di quell'entry, committa. Il prossimo workflow lo userà.

**Posso cambiare l'ora di pubblicazione?**
Sì. Modifica il `cron` in `.github/workflows/publish-carousel-daily.yml`. Esempio: `'0 16 * * *'` = ogni giorno alle 18:00 CEST (16:00 UTC).

**Posso saltare un giorno?**
Sì. Modifica il campo `date` di un'entry in `schedule.json` per spostarla in avanti. Le date non devono essere consecutive, lo script pubblica "il prossimo pending con date <= now".

**Posso aggiungere hashtag alla caption?**
Sì, modifica direttamente in `schedule.json` il campo caption. Oppure li aggiungo io in bulk con uno script se mi dici quali.

---

## Sintesi del tuo workflow tipico

Dopo il setup iniziale, il tuo coinvolgimento quotidiano è zero. I caroselli si pubblicano da soli ogni mattina alle 9:30. Tu al massimo:

- **Una volta ogni 2 mesi**: rigeneri il token (quando scade)
- **Ad hoc**: apri `schedule.json` e modifichi caption/date se vuoi
- **Quando vuoi verificare stato**: Actions tab del repo oppure `python scripts/publish_carousel.py --list` in locale

Buon lavoro. 🎯
