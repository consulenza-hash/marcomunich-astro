# Task Board

## Today (Sabato 30/05 mattina)
- [ ] 🎨 **Render 35 slide sett-02** — bloccante per cron Lun 02/06 (id 201-207 in schedule). Riusare pipeline aggiornata (font grandi già nel template). Creare HTML sett-02 + render script + convert. **PRIMA PRIORITÀ**.
- [ ] 🔒 **PENTEST-HIGH-1** — Aggiungere flag `Secure` a cookie `stats_auth` (AdminGuard.astro:62 + 7 admin pages) e `admin_auth` (admin-auth.ts:30) — bloccato 35 gg (regola permanente)
- [ ] 🔒 **PENTEST-HIGH-2** — Cookie `stats_auth` senza `HttpOnly` — migrare auth client-side a server-side per consentire HttpOnly
- [ ] **Verificare cron Sab 11:00** → 107 "Sito generico vs Marco Munich" recap deve partire automatico

## This Week
- [ ] 🔒 **PENTEST-MED-3** — CSP rimuovere `unsafe-inline` (.htaccess:11) → nonce-based scripts
- [ ] 🔒 **SEC-022** — Ghost v5.130 update → >=5.130.6 — richiede SSH manuale
- [ ] 🔒 **/sec-review** completo (overdue 35 gg da 24/04)
- [ ] **YouTube Postiz** — Marco: salva redirect URI + genera secret in GCP → io configuro Railway + test
- [ ] **Enable YouTube Data API v3** in GCP project round-pilot-488012-t5
- [ ] Google Cloud Project ID per Veo API (video generation) — richiede input Marco
- [ ] Aggiornare GitHub Secret STATS_PASSWORD → verificare login admin live — richiede azione su GitHub
- [ ] SEO: 27 articoli senza schema_faq (GEO-008) — fix non banale 2-3h
- [ ] OG image dedicata 1200×630 (attuale è 330×330 portrait, sub-ottimale per social cards)

## Backlog
- [ ] Riscrittura 182 Reel (lazy, prima di registrazione) — 36 violazioni stile attuali
- [ ] Redesign privacy-policy, cookie-policy
- [ ] Redesign template articolo [slug].astro
- [ ] Social proof / testimonianze (sezione homepage)
- [ ] Continuare bozza "Content Marketing Olistico"
- [ ] Test 2 foto pilot con Imagen 4 per calibrare stile fotografico
- [ ] Wikidata entry — da creare manualmente (20 min)
- [ ] P.IVA in privacy policy — da commercialista
- [ ] Funnel Prompt Pack — 100+ click ads, 0 acquisti, da verificare
- [ ] Fix workflow `publish-daily.yml` — non committa schedule.json post-publish (spawn task pendente)

## Done (052926 — Friday cleared)
- [x] Carosello 106 ripubblicato con font ingranditi ✅
- [x] design-guardian Spot Check tipografia → CSS fix applicato a template (retroattivo) ✅
- [x] Audit SEO/GEO marcomunich.com ✅
- [x] og:image fix (404 → 200, og-image.jpg → og/marco-munich.png) ✅
- [x] JSON-LD dual positioning (knowsAbout + hasOccupation array) ✅
- [x] llms.txt riscritto da scratch (dual positioning + @marcomunich.dev) ✅
- [x] **llms-full.txt creato — chiude GEO-004 carried forward da settimane** ✅
- [x] .gitignore fix exception per llms*.txt + robots.txt ✅
- [x] Sett-01 caroselli 101-106 tutti pubblicati su @marcomunich.dev ✅
- [x] Sett-02 "Farsi trovare oggi" piano + schedule + caption + alt_texts (id 201-207) ✅

<!-- Done storico archiviato 052926 — entries 042026, 042126, 042326, 042426, 042726, 042826, 042926, 050126, 050226, 050426 rimosse per pulizia Friday. -->
