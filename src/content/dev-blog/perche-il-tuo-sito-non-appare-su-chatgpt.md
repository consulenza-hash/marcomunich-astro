---
title: "Perché il tuo sito non appare quando qualcuno chiede a ChatGPT"
description: "ChatGPT, Perplexity e Google AI Overview rispondono alle domande dei tuoi potenziali clienti. Se il tuo sito non è strutturato per i motori AI, sei invisibile. Ecco cosa manca e come correggere."
date: "2026-03-10"
tags: ["GEO", "AI", "Visibilità"]
readTime: "6 min"
---

Qualcuno scrive "migliore agenzia web a Milano" su ChatGPT. Oppure chiede a Perplexity "chi costruisce siti per ristoranti in Italia". I motori AI rispondono citando nomi specifici, ma probabilmente non il tuo. La ragione è quasi sempre tecnica e si corregge con interventi precisi sul sito.

## Come i motori AI scelgono cosa citare?

![Perché il sito non appare su ChatGPT](/images/dev-blog/perche-non-appare-chatgpt.png)

ChatGPT, Perplexity, Google AI e gli altri motori AI costruiscono risposte partendo da ciò che riescono a capire con certezza di ogni sito. Tre domande che un motore AI si pone ogni volta che incontra un sito:

**Chi sei?** Se il sito non dichiara esplicitamente chi è l'azienda, cosa fa, dove opera e per chi lavora, il modello AI non può includerti in una risposta precisa. Una pagina "Chi siamo" con frasi vaghe tipo "siamo appassionati del nostro lavoro" non dà informazioni concrete da citare.

**Sei affidabile?** I motori AI cercano dati strutturati: un blocco di codice invisibile ai visitatori, inserito nel sito, che dichiara nome dell'azienda, tipo di attività, area geografica e servizi in un formato che le macchine leggono direttamente. Senza questi dati, il sito esiste per Google ma rimane opaco per i modelli AI.

**Sei accessibile ai robot?** Ogni sito ha un file di configurazione che dice ai robot di Google e di altri servizi cosa possono visitare. Alcuni siti bloccano accidentalmente i robot AI. Se i robot di ChatGPT, Perplexity o Google AI non riescono a leggere il tuo sito, non possono citarlo.

## Il problema del file di presentazione per i robot AI

Da circa un anno è emersa una convenzione: aggiungere al sito un file di testo semplice che funziona come un biglietto da visita per i motori AI. Dice chi sei, cosa fai, quali sono le pagine più importanti del sito e quali fatti su di te sono verificati.

La maggior parte dei siti italiani non ce l'ha. Questo significa che i motori AI devono ricostruire il profilo dell'azienda leggendo il codice del sito, con tutti gli errori di interpretazione che ne conseguono. Un file di presentazione ben fatto riduce questo margine di errore: il modello legge i fatti direttamente, invece di doverli dedurre da testo di marketing generico.

## Cosa manca nei siti costruiti qualche anno fa

Un sito costruito nel 2020 per essere trovato su Google spesso non è pronto per l'era AI. Le differenze principali:

**Dati strutturati insufficienti.** Il codice di un sito medio dichiara il nome dell'azienda e poco altro. Non specifica le zone geografiche servite, i settori in cui lavora, le lingue parlate, i profili verificati su altri siti come LinkedIn o Google Business. Meno informazioni ci sono, meno spesso il sito viene citato.

**Contenuti troppo generici.** I motori AI preferiscono pagine con affermazioni concrete: prezzi, tempi di risposta, anni di attività, risultati misurabili. Il testo vago — "soluzioni su misura per ogni esigenza" — non genera citazioni perché non c'è nulla di preciso da riportare.

**Informazioni incoerenti tra i vari profili online.** Google usa i link da altri siti come segnale di autorità. I motori AI usano la coerenza tra le informazioni nei diversi posti dove compare il nome dell'azienda: sito, Google Business, LinkedIn, directory di settore. Se i dati non coincidono, il modello diventa incerto e tende a citare altri.

## Cosa si fa concretamente

I siti che costruisco includono già queste ottimizzazioni di default:

- Il file di configurazione impostato per permettere ai robot AI di visitare tutto il sito
- Il file di presentazione per i motori AI con dichiarazione completa di chi sei e cosa fai
- I dati strutturati nel codice con tutte le informazioni rilevanti: settori, zone servite, profili verificati
- Contenuti scritti con una densità informativa sufficiente per essere citati come fonte affidabile

Nei prossimi anni, una quota crescente di traffico qualificato arriverà dai motori AI. Chi ottimizza adesso parte avvantaggiato, perché i modelli AI tendono a citare le stesse fonti nel tempo una volta che le riconoscono come affidabili. Se vuoi sapere come appare il tuo sito attuale ai motori AI, posso fare un'analisi e dirti cosa manca. [Scrivimi qui](/dev/contatti).

## FAQ

**Q: Come faccio a sapere se i robot AI riescono a visitare il mio sito?**
A: Vai su `tuosito.it/robots.txt` nel browser. Se trovi scritto qualcosa che blocca GPTBot o PerplexityBot, i robot AI non riescono a leggere il tuo sito. Se non sai interpretare quello che vedi, mandamelo e ti dico in un minuto cosa c'è.

**Q: Cosa sono i dati strutturati e dove si mettono?**
A: Sono un blocco di codice nel sito che dichiara le informazioni sull'azienda in un formato che le macchine leggono direttamente, senza dover interpretare il testo della pagina. Si inserisce automaticamente ogni volta che qualcuno visita il sito ed è invisibile ai visitatori.

**Q: Il mio sito WordPress ce li ha?**
A: Spesso sì, tramite plugin SEO come Yoast o Rank Math, ma in versione minima. Il problema è che questi plugin generano informazioni di base e si fermano lì. Per una visibilità completa nei motori AI serve molto di più: zone servite, settori di competenza, link ai profili verificati.

**Q: Quanti siti italiani sono già ottimizzati per i motori AI?**
A: Una percentuale molto bassa. Chi lo fa adesso ha un vantaggio diretto rispetto ai concorrenti nella stessa zona o settore, perché i modelli AI ci mettono tempo ad aggiornare le loro preferenze.
