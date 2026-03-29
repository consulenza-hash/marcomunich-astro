---
title: "Perché il tuo sito non appare quando qualcuno chiede a ChatGPT"
description: "ChatGPT, Perplexity e Google AI Overview rispondono alle domande dei tuoi potenziali clienti. Se il tuo sito non è strutturato per i motori AI, sei invisibile. Ecco cosa manca e come correggere."
date: "2026-03-10"
tags: ["GEO", "AI", "Visibilità"]
readTime: "6 min"
---

Qualcuno scrive "migliore agenzia web a Milano" su ChatGPT. Oppure chiede a Perplexity "chi costruisce siti per ristoranti in Italia". I motori AI rispondono citando siti web specifici — ma probabilmente non il tuo.

Questo non è un problema di fortuna. È una questione tecnica risolvibile.

## Come i motori AI scelgono cosa citare

ChatGPT, Perplexity, Google AI Overview e gli altri LLM non funzionano come Google classico. Non guardano solo i backlink o la keyword density. Costruiscono risposte partendo da ciò che riescono a capire in modo affidabile di ogni sito.

Tre domande che un motore AI si pone ogni volta che incontra un sito:

**Chi sei?** Se il sito non dichiara esplicitamente chi è l'azienda, cosa fa, dove opera e per chi lavora — il modello AI non può includerti in una risposta precisa. Una pagina "Chi siamo" con frasi vaghe non basta.

**Sei affidabile?** I motori AI cercano dati strutturati: JSON-LD nel codice HTML che dichiara nome, tipo di attività, area geografica, servizi. Senza questi dati, il sito esiste per Google ma è opaco per i modelli linguistici.

**Vuoi essere crawlato?** Alcuni siti bloccano accidentalmente i bot AI nel file `robots.txt`. GPTBot di OpenAI, ClaudeBot di Anthropic, PerplexityBot — se sono bloccati, il modello AI non ha mai letto il tuo sito e non può citarlo.

## Il problema del file llms.txt

Da circa un anno esiste una convenzione emergente: il file `llms.txt`, da inserire nella root del sito. È un documento in testo semplice che dice ai modelli AI chi sei, cosa fai, quali sono le pagine più importanti del tuo sito e quali fatti su di te sono verificati.

La maggior parte dei siti web italiani non ce l'ha. Questo significa che i motori AI devono ricostruire il profilo dell'azienda partendo dal codice HTML — con tutti gli errori di interpretazione che ne conseguono.

Un file `llms.txt` ben fatto riduce il margine di errore. Il modello legge i fatti dichiarati direttamente, invece di inferirli da testo di marketing generico.

## Cosa manca nei siti web standard

Un sito costruito nel 2020 per essere trovato su Google spesso non è ottimizzato per l'era AI. Le differenze principali:

**Dati strutturati insufficienti.** Il JSON-LD di un sito medio dichiara il nome dell'azienda e poco altro. Non specifica le aree geografiche servite, i settori in cui lavora, le lingue parlate, i profili verificati su altri siti (LinkedIn, Google Business, Wikidata).

**Contenuti generici.** I motori AI privilegiano pagine con affermazioni concrete e verificabili: prezzi, tempi di risposta, anni di attività, risultati misurabili. Il testo vago — "soluzioni su misura per ogni esigenza" — non genera citazioni.

**Nessun segnale di autorità per i bot AI.** Google usa i backlink come segnale di autorità. I modelli AI usano la coerenza delle informazioni tra le diverse fonti dove compare il nome dell'azienda: sito, Google Business, LinkedIn, directory di settore. Se i dati non coincidono, il modello diventa incerto e cita altri.

## Cosa si fa concretamente

I siti che costruisco includono già queste ottimizzazioni di default:

- `robots.txt` configurato per permettere il crawling di tutti i principali bot AI
- `llms.txt` con dichiarazione completa dell'identità dell'azienda
- JSON-LD con `Organization` o `Person` schema arricchito: `knowsAbout`, `areaServed`, `sameAs` verso i profili verificati
- Contenuti scritti con una densità informativa sufficiente per essere citati come fonte affidabile

Non si tratta di un lavoro opzionale. Nei prossimi due anni, una quota crescente di traffico qualificato arriverà dai motori AI piuttosto che da Google classico. Chi si posiziona adesso parte avvantaggiato rispetto a chi interverrà più tardi.

Se vuoi sapere come appare il tuo sito attuale ai motori AI, posso fare un'analisi e dirti cosa manca. [Scrivimi qui](/dev/contatti).
