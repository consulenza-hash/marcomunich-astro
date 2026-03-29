---
title: "Sito web lento: quanto ti costa in clienti persi e visibilità Google"
description: "Un sito che carica in 4 secondi invece di 1 può perdere fino al 80% dei visitatori mobile. Google penalizza i siti lenti. I motori AI li ignorano. Ecco i numeri e cosa fare."
date: "2026-03-24"
tags: ["Performance", "Web", "Conversioni"]
readTime: "5 min"
---

Google ha pubblicato un dato che vale la pena stampare e attaccare al muro: ogni secondo di ritardo nel caricamento di una pagina mobile riduce le conversioni del 20%. Non è una stima teorica — è il risultato dell'analisi su milioni di sessioni reali.

Se il tuo sito impiega 4 secondi a caricarsi, stai perdendo circa il 60% delle persone che ci arrivano prima ancora che vedano cosa vendi.

## Perché i siti lenti esistono ancora

La causa più comune è tecnica ma evitabile: siti costruiti su WordPress con dieci plugin attivi, immagini da 3MB non compresse, JavaScript che blocca il rendering, hosting condiviso con risorse limitate.

Ogni plugin aggiunto a WordPress carica CSS e JavaScript aggiuntivi. Ogni immagine non ottimizzata occupa banda. Ogni script di terze parti — chat, analitici, pixel di tracciamento — rallenta il caricamento della pagina prima che l'utente veda qualcosa.

Il risultato è un sito che funziona bene sul computer dell'agenzia che l'ha costruito (connessione veloce, cache del browser piena) e male sul telefono di un nuovo visitatore.

## Come Google misura la velocità

Google usa i Core Web Vitals come segnale di ranking diretto. I tre parametri principali sono:

**LCP — Largest Contentful Paint.** Quanto tempo passa prima che il contenuto principale della pagina sia visibile. Google considera buono meno di 2,5 secondi. Sopra i 4 secondi, il sito viene classificato come lento.

**FID / INP — Input Delay.** Quanto aspetta l'utente tra il click su un elemento e la risposta del browser. Rilevante per siti con molto JavaScript.

**CLS — Cumulative Layout Shift.** Quanto si muovono gli elementi della pagina mentre carica. Gli annunci che appaiono e spostano il testo, i font che cambiano le dimensioni dei titoli — tutto questo contribuisce a un punteggio negativo.

Un sito con Core Web Vitals nella zona rossa viene penalizzato nel ranking rispetto a siti concorrenti con contenuto simile ma tempi di caricamento migliori.

## Il problema dei siti statici vs dinamici

La differenza di performance più netta è tra siti statici e siti dinamici generati a runtime.

Un sito WordPress, ogni volta che un visitatore apre una pagina, fa una query al database, assembla l'HTML, applica i template, esegue i plugin. Tutto questo prima di inviare qualcosa al browser. Anche con un buon hosting, questo processo richiede centinaia di millisecondi.

Un sito statico — HTML pre-generato al momento del deploy — risponde in 20-50ms perché non c'è niente da calcolare: il file esiste già sul server.

Per la maggior parte dei siti aziendali (siti vetrina, landing page, portfolio, blog) non c'è nessuna ragione tecnica per usare un'architettura dinamica. I siti statici moderni gestiscono aggiornamenti di contenuto tramite CMS visuale, ma servono pagine pre-generate a velocità molto superiori.

## L'effetto sulla visibilità AI

I motori AI crawlano i siti per costruire la loro base di conoscenza. Un sito lento viene crawlato meno frequentemente — i bot AI hanno un budget di crawling limitato e lo usano su siti che rispondono velocemente.

Un sito che impiega 4 secondi a rispondere viene visitato dai bot AI con frequenza molto inferiore rispetto a uno che risponde in 200ms. Questo significa che i contenuti pubblicati vengono indicizzati più lentamente — e in alcuni casi non vengono indicizzati affatto.

## Cosa cambia con un sito ben costruito

I siti che realizzo con Astro (framework per siti statici) ottengono punteggi Lighthouse tra 95 e 100 su performance, anche senza ottimizzazioni post-lancio. Non perché faccia qualcosa di speciale — ma perché l'architettura di default è già corretta.

Le immagini vengono ottimizzate automaticamente in formato WebP. Il JavaScript viene caricato solo dove necessario. Il CSS non blocca il rendering. L'hosting su CDN distribuita garantisce tempi di risposta bassi da qualsiasi posizione geografica.

Se vuoi vedere come si posiziona il tuo sito attuale, puoi testarlo su PageSpeed Insights (pagespeed.web.dev) — è gratuito e restituisce i Core Web Vitals reali dei tuoi visitatori negli ultimi 28 giorni. Se il punteggio è sotto 70, vale la pena parlarne. [Contattami qui](/dev/contatti).
