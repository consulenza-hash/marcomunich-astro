---
title: "Sito web lento: quanto ti costa in clienti persi e visibilità Google"
description: "Un sito che carica in 4 secondi invece di 1 può perdere fino al 80% dei visitatori mobile. Google penalizza i siti lenti. I motori AI li ignorano. Ecco i numeri e cosa fare."
date: "2026-03-24"
tags: ["Performance", "Web", "Conversioni"]
readTime: "5 min"
---

Google ha pubblicato un dato che vale la pena stampare e attaccare al muro: ogni secondo di ritardo nel caricamento di una pagina mobile riduce le conversioni del 20%. È il risultato dell'analisi su milioni di sessioni reali. Se il tuo sito impiega 4 secondi a caricarsi, stai perdendo circa il 60% delle persone che ci arrivano prima ancora che vedano cosa vendi.

## Perché i siti lenti esistono ancora?

![Sito web lento: quanto costa in clienti persi](/images/dev-blog/sito-web-lento.png)

La causa più comune è tecnica ma evitabile: siti costruiti su WordPress con dieci plugin attivi, immagini da 3MB non compresse, JavaScript che blocca il rendering, hosting condiviso con risorse limitate.

Ogni plugin aggiunto a WordPress carica CSS e JavaScript aggiuntivi. Ogni immagine non ottimizzata occupa banda. Ogni script di terze parti (chat, analitici, pixel di tracciamento) rallenta il caricamento della pagina prima che l'utente veda qualcosa. Il risultato è un sito che funziona bene sul computer dell'agenzia che l'ha costruito, con connessione veloce e cache del browser piena, e male sul telefono di un nuovo visitatore con una connessione 4G normale.

## Come Google misura la velocità?

Google usa i Core Web Vitals come segnale di ranking diretto. I tre parametri principali sono:

**LCP (Largest Contentful Paint).** Quanto tempo passa prima che il contenuto principale della pagina sia visibile. Google considera buono meno di 2,5 secondi. Sopra i 4 secondi, il sito viene classificato come lento.

**INP (Interaction to Next Paint).** Quanto aspetta l'utente tra il click su un elemento e la risposta del browser. Rilevante per siti con molto JavaScript.

**CLS (Cumulative Layout Shift).** Quanto si muovono gli elementi della pagina mentre carica. Gli annunci che appaiono e spostano il testo, i font che cambiano le dimensioni dei titoli: tutto contribuisce a un punteggio negativo.

Un sito con Core Web Vitals nella zona rossa viene penalizzato nel ranking rispetto a siti concorrenti con contenuto simile ma tempi di caricamento migliori.

## Perché i siti statici caricano più velocemente?

La differenza di performance più netta è tra siti statici e siti dinamici generati a runtime. Un sito WordPress, ogni volta che un visitatore apre una pagina, fa una query al database, assembla l'HTML, applica i template e esegue i plugin, tutto questo prima di inviare qualcosa al browser. Anche con un buon hosting, questo processo richiede centinaia di millisecondi.

Un sito statico, con HTML pre-generato al momento del deploy, risponde in 20-50ms perché il file esiste già sul server. Per la maggior parte dei siti aziendali (vetrina, landing page, portfolio, blog) non c'è nessuna ragione tecnica per usare un'architettura dinamica: i siti statici moderni gestiscono aggiornamenti di contenuto tramite CMS visuale, ma servono pagine pre-generate a velocità molto superiori.

## Come incide la velocità sulla visibilità AI?

I motori AI crawlano i siti per costruire la loro base di conoscenza. I bot AI hanno un budget di crawling limitato e lo usano su siti che rispondono velocemente. Un sito che impiega 4 secondi a rispondere viene visitato con frequenza molto inferiore rispetto a uno che risponde in 200ms, il che significa che i contenuti vengono indicizzati più lentamente e in alcuni casi non vengono indicizzati affatto.

## Cosa cambia con un sito ben costruito?

I siti che realizzo con Astro ottengono punteggi Lighthouse tra 95 e 100 su performance anche senza ottimizzazioni post-lancio, perché l'architettura di default è già corretta. Le immagini vengono ottimizzate automaticamente in formato WebP, il JavaScript viene caricato solo dove necessario, il CSS non blocca il rendering e l'hosting su CDN distribuita garantisce tempi di risposta bassi da qualsiasi posizione geografica.

Se vuoi vedere come si posiziona il tuo sito attuale, puoi testarlo su PageSpeed Insights (pagespeed.web.dev): è gratuito e restituisce i Core Web Vitals reali dei tuoi visitatori negli ultimi 28 giorni. Se il punteggio è sotto 70, vale la pena parlarne. [Contattami qui](/dev/contatti).

## FAQ

**Q: Qual è il punteggio PageSpeed minimo accettabile?**
A: Google considera buoni i punteggi sopra 90. Tra 50 e 89 c'è margine di miglioramento. Sotto 50, il sito ha problemi di performance che incidono sul ranking e sul tasso di abbandono degli utenti mobile.

**Q: Un sito WordPress può raggiungere punteggi alti su PageSpeed?**
A: Sì, con un tema leggero, pochi plugin e un hosting ottimizzato. Raggiungere 90+ su WordPress richiede però configurazione continua e attenzione a ogni plugin aggiunto. Un sito statico parte già a 95+ senza ottimizzazioni specifiche.

**Q: Quanto incide la velocità sul tasso di conversione?**
A: Secondo i dati Google, ogni secondo di ritardo riduce le conversioni del 20%. Un sito che passa da 4 secondi a 1 secondo può vedere un aumento delle conversioni del 30-50%, a parità di traffico e contenuto.

**Q: Il mio hosting influisce sulla velocità del sito?**
A: Molto. Un hosting condiviso economico può aggiungere 500ms-2 secondi solo per il Time to First Byte (TTFB). Un sito statico su CDN (Cloudflare Pages, Netlify) ha TTFB sotto i 50ms da qualsiasi posizione geografica.
