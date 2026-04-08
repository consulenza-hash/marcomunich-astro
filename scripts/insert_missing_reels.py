import re

with open(r'D:\marcomunich.com\public\contenuti-social\reels\script-reel-parlati.md', 'r', encoding='utf-8') as f:
    content = f.read()

missing = {
    17: """## REEL 17 — Nessuno legge i tuoi contenuti. Ecco perche.

Parlo con una counselor la settimana scorsa, ha trecento follower, pubblica due volte a settimana da sei mesi, e mi dice che i suoi post prendono tipo quattro like, tutti di sua cugina. Poi mi mostra un post. Gia dal titolo capisco il problema.

Scriveva per tutti. Quella frase che inizia con "se sei una persona che vuole migliorarsi e crescere nella vita" non parla a nessuno, perche parla a un'astrazione. Il lettore legge la prima riga e pensa: non e per me, e va avanti.

Il motivo per cui i tuoi contenuti non vengono letti non e che pubblichi poco, o che l'algoritmo ti penalizza, o che il mercato e saturo. Il motivo e che non hai deciso chi stai cercando. Hai scritto per un pubblico immaginario fatto di tutti, e tutti e sinonimo di nessuno.

Pensa alla persona piu specifica che hai seguito di recente. Un professionista che parla esattamente alla situazione in cui ti trovavi in quel momento, e tu hai pensato: questo ha vissuto quello che sto vivendo io. Quella sensazione non nasce dal caso. Nasce da qualcuno che ha scelto di parlare a una persona precisa, con un problema preciso, in un momento preciso della sua vita.

Quando scrivi il prossimo contenuto, metti un nome e cognome immaginari nella testa. Sara, quarantadue anni, counselor da tre anni, ha appena aperto la partita IVA, non sa come farsi trovare online senza sembrare una venditrice porta a porta. Scrivi per Sara. Solo per lei.

Succede una cosa strana: le persone che non si chiamano Sara, che hanno quarantotto anni invece di quarantadue, che fanno le coach invece delle counselor, ti scrivono in privato dicendo che sembra che tu stia parlando esattamente a loro. La specificita attrae, il generico respinge.

Questa settimana rileggi l'ultimo post che hai pubblicato e chiediti: chi e esattamente la persona a cui stavo scrivendo? Se non riesci a rispondere in meno di trenta secondi, hai trovato il problema.

---""",
    18: """## REEL 18 — Scrivi per una sola persona.

L'altro giorno ho riletto un post che avevo scritto due anni fa, uno di quelli che all'epoca mi sembrava potente, e mi sono vergognato un po'. Era pieno di "chiunque voglia", "tutti coloro che cercano", "ogni professionista del benessere". Frasi che sembrano inclusive e invece sono solo vaghe.

Scrivere per una sola persona e una scelta che fa paura perche sembra che tu stia escludendo tutti gli altri. Hai investito anni a formarti, hai competenze trasversali, puoi aiutare persone in situazioni diverse, e l'idea di restringere il discorso a un solo profilo ti sembra uno spreco. Ti capisco. Ho pensato la stessa cosa.

Pero considera questo: l'ultima volta che hai comprato qualcosa online, cosa ti ha convinto? Una scheda prodotto con diciotto caratteristiche e quattro categorie di utilizzo, oppure una descrizione che sembrava scritta da qualcuno che sapeva esattamente come e la tua mattina, il tuo problema specifico, il momento in cui hai deciso che basta cosi?

La persona che scrive per tutti suona come un curriculum. La persona che scrive per una sola persona suona come qualcuno che ti ha incontrato per strada e ti ha detto la cosa esatta che stavi cercando.

La tecnica concreta e questa. Prima di aprire il documento o l'app dove scrivi, passa trenta secondi a visualizzare una persona reale. Qualcuno che hai gia seguito, o un cliente che hai gia avuto, o un professionista che conosci e che sta attraversando la situazione su cui vuoi scrivere. Vedi la sua faccia, pensa alla sua settimana, immagina cosa sta cercando quella mattina sul telefono. Poi scrivi come se stessi mandando un messaggio vocale a quella persona sola.

Questa settimana prendi il prossimo contenuto che hai in programma e scrivi in cima, prima del testo, il nome della persona per cui lo stai scrivendo. Anche se e un nome inventato. Poi scrivi. La differenza nel risultato finale ti sorprendera.

---""",
    19: """## REEL 19 — Hai davvero bisogno di quella certificazione?

Un coach con cui parlo regolarmente mi ha detto una cosa che continua a girarmi in testa. Era il quarto corso in tre anni. Il suo profilo Instagram aveva quattordici post, l'ultimo risaliva a otto mesi prima.

Conosco bene questa sensazione perche ci sono passato. La formazione da una certezza che il mercato non da. In aula sei valutato, superi gli esami, ricevi un pezzo di carta che dice che sei pronto. Online non c'e nessuno che ti dice sei pronto, e allora si torna a cercare quella rassicurazione nel prossimo corso.

La domanda che vale la pena farti non e "ho abbastanza certificazioni?" ma "a cosa mi serve questa specifica formazione in questo momento della mia carriera?" Perche una certificazione che riempie un vuoto di competenze reali e un investimento. Una certificazione che riempie un vuoto di fiducia in te stesso e solo una forma di ritardo costosa.

I clienti non ti scelgono per il numero di sigle dopo il nome. Ti scelgono perche leggono un tuo contenuto, o sentono un tuo episodio, o qualcuno li manda da te, e in quel contatto capiscono che sai di cosa stai parlando e che capisci la loro situazione. Questo non viene da un attestato, viene dalla coerenza nel comunicare nel tempo.

Se stai pensando a un nuovo corso, fai questa verifica prima di iscriverti. Scrivi su un foglio l'ultima cosa concreta che non sai fare con i tuoi clienti attuali, o con i clienti che vorresti avere. Se il corso risponde esattamente a quella cosa, vai. Se invece stai cercando il corso nella speranza di sentirti piu pronto a iniziare, inizia adesso con quello che hai, e poi valuta cosa ti manca davvero dopo i primi sei mesi.

---""",
    20: """## REEL 20 — Pubblicare senza pubblico e la mossa piu intelligente.

Quando ho iniziato a pubblicare contenuti sul personal branding per counselor avevo centoventisette follower. Centoventisette, di cui una sessantina erano persone che conoscevo nella vita reale. Ogni post prendeva sei, sette interazioni. Per mesi ho parlato in una stanza quasi vuota.

Quella fase li, quella che sembra un fallimento mentre la stai vivendo, e in realta il periodo piu prezioso di tutta la costruzione di una presenza online. Per un motivo preciso: stai sviluppando una voce senza la pressione di un pubblico che ti osserva.

Quando pubblichi con ventimila follower, ogni contenuto ha un peso. Ti chiedi cosa penseranno, se il post e all'altezza degli altri, se stai deludendo chi ti segue. Con centoventisette follower non hai quella pressione. Puoi sperimentare, puoi cambiare registro, puoi capire cosa ti viene naturale dire e cosa invece stai forzando. Puoi fare gli errori che ti insegnano piu di qualsiasi corso, senza conseguenze reali.

I professionisti che oggi hanno un pubblico coinvolto hanno tutti attraversato questa fase. La differenza tra chi ce l'ha fatta e chi ha smesso non era il talento, non era il budget per i video. Era la capacita di continuare a pubblicare anche quando i numeri non si muovevano, perche avevano capito che stavano costruendo qualcosa per il lungo termine.

Ogni post che scrivi adesso, anche se lo legge solo tua sorella, e un mattone. Allena il muscolo, affina il messaggio, costruisce l'archivio. Quando il pubblico arrivera, e arrivera se continui, trovera qualcuno che sa gia cosa sta facendo.

La settimana prossima pubblica qualcosa che normalmente avresti rimandato perche non sei ancora pronto. Fallo adesso, con il pubblico piccolo che hai. Questo e il momento giusto per farlo.

---""",
    39: """## REEL 39 — La Gen Z sta lasciando Instagram.

Ho letto tre articoli questo mese che dicevano tutti la stessa cosa: la Gen Z abbandona Instagram, i giovani vanno su TikTok e BeReal e Lemon8, Instagram e per i millennial. E ogni volta vedevo nei commenti dei counselor la stessa reazione: devo cambiare piattaforma? Devo imparare TikTok?

Prima di rispondere a questa domanda vale la pena chiedersi un'altra cosa: i tuoi clienti ideali sono davvero Gen Z?

Un counselor che lavora con adulti in transizione professionale, o con coppie in crisi, o con professionisti che cercano equilibrio tra lavoro e vita privata, ha clienti ideali dai trentacinque ai cinquantacinque anni. Questa fascia e ancora su Instagram, ci passa ancora parecchio tempo, e risponde ancora ai contenuti che risolvono problemi reali.

Inseguire la piattaforma del momento perche un articolo dice che e li che va il pubblico generico e come aprire uno studio di counseling a Milano perche hai letto che Milano ha piu abitanti di Treviso, anche se tutti i tuoi clienti sono di Treviso.

La domanda giusta da farti non e dove va il pubblico in generale, ma dove passa il tempo la persona specifica che vuoi raggiungere. E poi, prima ancora di cambiare piattaforma, chiederti se stai gia usando bene quella dove sei adesso.

Buona parte dei professionisti che mi dicono che Instagram non funziona per loro pubblica contenuti generici una volta ogni due settimane, non ha mai fatto una storia con domande, non risponde ai commenti, e non ha mai provato a collaborare con qualcuno del suo stesso settore. Instagram funziona poco per loro, ma il problema non e Instagram.

Questa settimana, invece di aprire un nuovo account su una nuova piattaforma, prova a pubblicare su quella che hai gia tre volte invece di una. Poi guarda cosa succede nei trenta giorni successivi.

---""",
    40: """## REEL 40 — Quando la spiritualita diventa un copione.

Una coach che seguo da qualche mese ha smesso di piacermi gradualmente, e ho impiegato un po' a capire perche. I suoi contenuti erano tecnicamente buoni, il valore c'era, le informazioni erano corrette. Poi un giorno ho riletto tre suoi post di fila e ho visto la struttura: ogni post iniziava con una citazione sul risveglio o sulla coscienza, aveva nel mezzo un concetto di crescita personale, e finiva con una domanda del tipo sei pronto a diventare la versione piu alta di te stesso?

Era un template. Un copione spirituale che si ripeteva identico cambiando solo le parole di superficie.

Il problema non era la spiritualita in se. Il problema era che la spiritualita era diventata un codice di comunicazione, un modo per sembrare profondi senza dire nulla di verificabile. Espandi la tua coscienza. Vivi in allineamento. Connettiti con la tua essenza. Frasi che suonano bene e non significano nulla di preciso per chi le legge.

Quando un counselor o un coach usa questo linguaggio in modo sistematico, ottiene l'effetto opposto a quello che vuole. Chi e gia nel settore olistico ci passa sopra perche lo sente ovunque. Chi e fuori dal settore olistico si sente escluso, come se stesse leggendo un testo scritto per una tribu di cui non fa parte.

Il linguaggio spirituale funziona quando e ancorato a qualcosa di concreto e vissuto. Mi sono alzato lunedi mattina con una nausea allo stomaco prima di una call con un cliente difficile, e in quel momento ho capito qualcosa sul confine tra cura e dipendenza: questo racconta qualcosa di reale. Ho imparato ad allinearmi con la mia frequenza piu alta: questo non racconta nulla.

La prossima volta che scrivi un contenuto con un concetto spirituale, fermati e scrivi subito dopo: ovvero, in pratica, questo significa che. Poi finisci la frase con qualcosa che tuo nonno capirebbe. Se non riesci a finirla, riscrivi il concetto finche ci riesci.

---"""
}

for reel_num, script in sorted(missing.items()):
    for candidate in range(reel_num + 1, 65):
        marker = '\n## REEL ' + str(candidate) + ' '
        if marker in content:
            idx = content.index(marker)
            content = content[:idx] + '\n\n' + script + '\n' + content[idx:]
            break

found = [int(m) for m in re.findall(r'## REEL (\d+)', content)]
still_missing = [i for i in range(1, 61) if i not in found]

with open(r'D:\marcomunich.com\public\contenuti-social\reels\script-reel-parlati.md', 'w', encoding='utf-8') as f:
    f.write(content)

print(f'Totale: {len(found)} reel')
print(f'Mancanti: {still_missing}')
