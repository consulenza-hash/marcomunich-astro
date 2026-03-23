# Memory

## Now
- Sito live su Vercel (ripristinato adapter @astrojs/vercel dopo downtime)
- Migrazione Netsons SOSPESA: file FTP caricati ma pagine SSR danno 500, serve Node.js runtime
- Migrazione va fatta su branch separato, MAI toccare main durante il lavoro

## Project
- **Nome**: marcomunich-astro — sito di Marco Munich, consulente Personal Branding Olistico
- **Location**: Vicenza, Italia
- **Obiettivo**: acquisire clienti per corsi online e consulenze individuali

## Stack
- Astro 5 SSR + @astrojs/vercel adapter (live), @astrojs/node per migrazione futura
- Tailwind CSS (design system v2 con token custom in src/styles/global.css)
- @astrojs/react (richiesto da Keystatic CMS)
- Keystatic CMS (GitHub storage, repo consulenza-hash/marcomunich-astro)
- @anthropic-ai/sdk (generatore AI articoli)
- Deploy: push main → GitHub Actions → FTP su Netsons (hosting Node.js)
- Deploy attuale temporaneo: ancora Vercel fino a migrazione completa
- Netsons: hosting Node.js, IP 89.40.173.242, FTP con credenziali in GitHub Secrets

## Key Files
- Config: `astro.config.mjs`, `keystatic.config.ts`, `tailwind.config.mjs`, `vercel.json`
- Stili: `src/styles/global.css` (token design system)
- Middleware: `src/middleware.ts`
- Pagine: `src/pages/` (30+ pagine)
- Contenuto: `src/content/articoli/` (201 articoli .mdoc)
- Generatore AI: `src/pages/admin/genera.astro`
- Admin articoli: `src/pages/admin/articoli.astro` (lista con pubblica/elimina/bozza)
- Batch rewrite: `src/pages/admin/batch.astro`
- CRM clienti: `src/pages/admin/clienti.astro` + `src/pages/api/clienti.ts`
- Social: `src/pages/admin/social.astro` + `src/pages/admin/social-piano.astro`
- Micro-sito dev: `src/pages/dev/` (6 pagine + case study)
- Portfolio mockup: `src/pages/portfolio/` (13 demo navigabili)
- Immagini portfolio: `public/images/portfolio/` (61 immagini locali)

## Pagine principali
index, chi-sono, servizi, risorse, contatti, libri, cmfo-lezione1, cmfo-lezione2,
metterci-la-faccia-online, creazione-messaggio-autentico, creazione-video-autentici,
lavorare-senzasito, [slug].astro, blog/, categoria/, tag/, admin/, 404

## Design System v2
- Font: Bricolage Grotesque (display), Cormorant (serif), Syne (sans)
- --gold #C58A37 → solo tipografia italic. MAI sui bottoni
- --black #0A0A0A → bottoni CTA. --ink #1C1C1C → card. --paper #F2EFE9 → sezioni chiare
- Colori per-corso: CMFO #D4840A | CMA #5551D3 | CVA #C0292A | LWSW #1A7A4E
- WhatsApp: sempre #25D366

## Regole di lavoro Claude
- Browser: solo Playwright (mai mcp__Claude_in_Chrome__)
- Codice: MAI Read file interi. .astro → Grep content+context. .js/.ts → jcodemunch
- Read solo con offset+limit mirati
- Commit solo se richiesto esplicitamente
- Deploy: npx vercel --prod (Vercel Pro, deploy illimitati ma crediti build limitati)
- Deploy: fare UN SOLO deploy alla fine di ogni blocco di lavoro, mai deploy multipli
- Copy italiano: no "non X ma Y", no triplette, no emdash, no meta-frasi, ritmo disteso

## Open Threads
- PRIORITÀ 1: Completare migrazione Netsons (Node.js runtime, testare SSR, DNS switch)
- Icone social su /risorse non visibili su Safari mobile (SVG inline con stili forzati, ancora non funziona)
- Stripe webhook test mode failing (non impatta pagamenti live, ma da verificare)
- LinkedIn API 403 — person URN non autorizzato, da risolvere
- Instagram Stories API — da configurare (account business collegato a FB Page)
- Generazione immagini social-piano: font Satori incompatibile con hosting (Segoe UI non su Linux)
- Batch rewrite: refactorare per fare 1 solo commit con tutti gli articoli (API Trees/Commits)
- 100+ click ads ma 0 acquisti Prompt Pack — verificare funnel di conversione
- Redesign privacy-policy, cookie-policy
- Rimuovere @astrojs/react + Keystatic se non serve più
- Prezzi /dev/prezzi: aggiornati a €1.500/€2.500/€4.000+, pagamento 50/50, mantenimento €147/anno
- SEO: 27 articoli aggiornati con seo_title e seo_description mirati per keyword
- Banner Netsons affiliato nella pagina prezzi

## Blockers
- Netsons pagine SSR restituiscono 500 — serve configurare Node.js process manager

## Learnings sessione 21-22/03/2026
- Vercel Pro $20/mese: deploy illimitati MA crediti build hanno limite mensile (non giornaliero)
- Unsplash hotlinking inaffidabile: scaricare sempre le immagini localmente
- pravatar.cc e ui-avatars.com inaffidabili: usare CSS initials o immagini locali
- Safari mobile tiene cache aggressiva anche in incognito: header no-cache in vercel.json aiuta ma non risolve sempre
- buildMdoc: salvare sempre la data originale dell'articolo quando si fa rewrite, non sovrascriverla con oggi
- salva-bozza: aggiungere bozza:true per impedire pubblicazione automatica articoli AI
- Copy italiano: "non X ma Y" è il pattern più frequente da correggere, seguito da emdash e triplette

## Learnings sessione 22-23/03/2026
- Netsons supporta hosting Node.js — stessa architettura di Vercel senza costi extra
- Migrazione Vercel→Netsons: cambiare adapter (@astrojs/node), GitHub Actions FTP, NO riscrittura PHP
- FTP upload node_modules è molto lento (~30+ minuti) — considerare .gitignore e npm install remoto
- GitHub Actions deploy con FTP: servono secrets FTP_HOST, FTP_USER, FTP_PASS
- Astro adapter node: output hybrid, entry point server/entry.mjs
- Pagine SSR su hosting tradizionale: serve PM2 o process manager per tenere Node.js attivo
- SVG con fill="currentColor" non funzionano su Safari mobile in certi contesti: usare fill="#ffffff" inline diretto
- SEO keyword a basso volume ma alta intenzione di acquisto: più valore di keyword ad alto volume generiche
- Coupon Stripe: non posso creare da dashboard (regola sicurezza piattaforma finanziaria)
- Clienti web dev: il cliente non deve mai toccare il CMS, passa sempre dal freelancer per modifiche
