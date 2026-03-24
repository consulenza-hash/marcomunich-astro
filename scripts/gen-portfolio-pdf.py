from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, KeepTogether
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas as canvasmod
import os

# Fonts — use Arial which fully supports Italian accents on Windows
pdfmetrics.registerFont(TTFont('Inter', 'C:/Windows/Fonts/arial.ttf'))
pdfmetrics.registerFont(TTFont('Inter-Bold', 'C:/Windows/Fonts/arialbd.ttf'))
pdfmetrics.registerFont(TTFont('Mono', 'C:/Windows/Fonts/consola.ttf'))
pdfmetrics.registerFont(TTFont('Mono-Bold', 'C:/Windows/Fonts/consolab.ttf'))

output = r'D:\marcomunich.com\public\downloads\marco-munich-dev-portfolio.pdf'
os.makedirs(os.path.dirname(output), exist_ok=True)
w, h = A4

# Colors
bg = HexColor('#0a0e1a')
blue = '#3b82f6'
blue_light = '#60a5fa'
indigo = '#818cf8'
white_hex = '#f1f5f9'
muted_hex = '#94a3b8'
card_hex = '#111827'
border_hex = '#1e293b'

# Styles
s_section = ParagraphStyle('Section', fontName='Mono', fontSize=9, textColor=HexColor(blue), spaceAfter=4)
s_h1 = ParagraphStyle('H1', fontName='Inter-Bold', fontSize=26, textColor=HexColor(white_hex), spaceAfter=8, leading=32)
s_h2 = ParagraphStyle('H2', fontName='Inter-Bold', fontSize=18, textColor=HexColor(white_hex), spaceAfter=6, leading=24)
s_h3 = ParagraphStyle('H3', fontName='Inter-Bold', fontSize=13, textColor=HexColor(white_hex), spaceAfter=4, leading=17)
s_body = ParagraphStyle('Body', fontName='Inter', fontSize=9.5, textColor=HexColor(muted_hex), spaceAfter=8, leading=14)
s_body_white = ParagraphStyle('BodyW', fontName='Inter', fontSize=9.5, textColor=HexColor(white_hex), spaceAfter=8, leading=14)
s_small = ParagraphStyle('Small', fontName='Inter', fontSize=8, textColor=HexColor(muted_hex), spaceAfter=4, leading=11)
s_blue = ParagraphStyle('Blue', fontName='Inter-Bold', fontSize=10, textColor=HexColor(blue), spaceAfter=2, leading=13)
s_blue_light = ParagraphStyle('BlueL', fontName='Inter', fontSize=9, textColor=HexColor(blue_light), spaceAfter=3, leading=12)
s_mono = ParagraphStyle('Mono', fontName='Mono', fontSize=8, textColor=HexColor(muted_hex), spaceAfter=2)
s_price = ParagraphStyle('Price', fontName='Inter-Bold', fontSize=18, textColor=HexColor(blue_light), spaceAfter=4, leading=22)
s_cover_big = ParagraphStyle('CoverBig', fontName='Inter-Bold', fontSize=38, textColor=HexColor(white_hex), leading=46)
s_cover_blue = ParagraphStyle('CoverBlue', fontName='Inter-Bold', fontSize=38, textColor=HexColor(blue), leading=46)
s_question = ParagraphStyle('Question', fontName='Inter-Bold', fontSize=10.5, textColor=HexColor(white_hex), spaceAfter=4, leading=14)
s_answer = ParagraphStyle('Answer', fontName='Inter', fontSize=9, textColor=HexColor(muted_hex), spaceAfter=14, leading=13)
s_center = ParagraphStyle('Center', fontName='Inter', fontSize=11, textColor=HexColor(muted_hex), alignment=TA_CENTER, spaceAfter=8, leading=15)
s_center_big = ParagraphStyle('CenterBig', fontName='Inter-Bold', fontSize=30, textColor=HexColor(white_hex), alignment=TA_CENTER, spaceAfter=8, leading=36)

def bg_page(canvas, doc):
    canvas.setFillColor(HexColor('#0a0e1a'))
    canvas.rect(0, 0, w, h, fill=1, stroke=0)

doc = SimpleDocTemplate(output, pagesize=A4,
    leftMargin=50, rightMargin=50, topMargin=50, bottomMargin=50)

story = []

# ═══════════════════════════════════════
# PAGE 1 — COVER
# ═══════════════════════════════════════
story.append(Spacer(1, 40))
story.append(Paragraph('MARCO MUNICH', ParagraphStyle('CoverName', fontName='Mono-Bold', fontSize=13, textColor=HexColor(blue))))
story.append(Paragraph('DEV', ParagraphStyle('CoverSub', fontName='Mono', fontSize=10, textColor=HexColor(muted_hex), spaceAfter=60)))
story.append(Spacer(1, 100))
story.append(Paragraph('Sviluppo siti web', s_cover_big))
story.append(Paragraph('con intelligenza', s_cover_big))
story.append(Paragraph('artificiale.', s_cover_blue))
story.append(Spacer(1, 40))
story.append(Paragraph('marcomunich.com/dev', s_body))
story.append(Paragraph('consulenza@marcomunich.com', s_body))
story.append(Spacer(1, 40))
story.append(Paragraph('Portfolio Deck 2026', s_mono))
story.append(PageBreak())

# ═══════════════════════════════════════
# PAGE 2 — PROFILO PROFESSIONALE
# ═══════════════════════════════════════
story.append(Paragraph('02 / CHI SONO', s_section))
story.append(Paragraph('Marco Munich', s_h1))

story.append(Paragraph(
    'Costruisco siti web professionali guidando l\'intelligenza artificiale con un metodo '
    'chiamato vibe coding. Il mio percorso parte da anni di lavoro nella consulenza per il '
    'personal branding, dove ho affiancato coach, counselor e operatori olistici nella costruzione '
    'della loro presenza online. Quella esperienza mi ha insegnato qualcosa che la maggior parte '
    'degli sviluppatori web non sa: come pensa il cliente, cosa lo blocca, quale linguaggio '
    'capisce e di cosa ha bisogno prima ancora che lo chieda.',
    s_body))

story.append(Paragraph(
    'Quando ho iniziato a costruire siti web con l\'AI, ho portato con me quella comprensione '
    'del mondo del cliente e l\'ho combinata con la capacit\u00e0 tecnica di realizzare qualsiasi '
    'progetto web. Il risultato \u00e8 un approccio in cui il cliente parla con una persona che '
    'capisce sia il suo business sia la tecnologia, senza dover tradurre le proprie idee in gergo '
    'tecnico.',
    s_body))

story.append(Spacer(1, 14))
story.append(Paragraph('Progetti realizzati', s_h2))

progetti_reali = [
    ('marcomunich.com', 'Il mio sito personale: 200+ articoli, pannello admin con generatore AI, '
     'CRM clienti, integrazione Stripe per vendita Prompt Pack, social posting automatico, '
     'SEO ottimizzato con schema FAQ su ogni articolo. Migrato da WordPress ad Astro.'),
    ('valentinarussobg5.com', 'Sito completo per una professionista del settore olistico. '
     'CMS Grav con editor AI integrato, generazione metadati SEO in batch, dashboard analytics '
     'con Google Analytics 4 e Search Console, sistema di invio email, knowledge base per i prompt AI.'),
    ('13 demo navigabili', 'Portfolio di mockup professionali che coprono e-commerce, piattaforme corsi '
     'con login e dashboard studente, B&B con prenotazioni, SaaS dashboard, ristoranti, immobiliare, '
     'portfolio creativi e landing page. Ogni demo \u00e8 un sito completo e funzionante.'),
]

for name, desc in progetti_reali:
    story.append(Paragraph(name, s_blue))
    story.append(Paragraph(desc, s_body))

story.append(Spacer(1, 14))
story.append(Paragraph('Competenze tecniche', s_h2))

competenze = [
    ('Sviluppo web', 'HTML, CSS, JavaScript, Astro, Tailwind CSS, PHP, Node.js'),
    ('AI e automazione', 'Claude Code, Claudify, Anthropic API, prompt engineering, batch processing'),
    ('CMS e contenuti', 'Astro Content Collections, Grav CMS, Keystatic, Markdoc'),
    ('E-commerce', 'Stripe Checkout, webhook, gestione prodotti e coupon'),
    ('SEO', 'Schema.org, JSON-LD, sitemap, meta ottimizzati, Google Search Console, AEO/GEO'),
    ('Deploy e hosting', 'GitHub Actions, FTP deploy, Netsons, configurazione domini e SSL'),
    ('API e integrazioni', 'GitHub API, Facebook Graph API, LinkedIn API, Stripe API, Resend'),
    ('Sicurezza', 'OWASP Top 10, Semgrep, GDPR compliance, cookie consent, HTTPS'),
]

for area, dettagli in competenze:
    story.append(Paragraph(area, s_blue))
    story.append(Paragraph(dettagli, s_small))

story.append(Spacer(1, 14))
story.append(Paragraph('Background', s_h2))
story.append(Paragraph(
    'Prima di dedicarmi allo sviluppo web, ho lavorato per anni come consulente di personal branding '
    'per professionisti del settore olistico. Ho aiutato decine di coach, counselor e operatori a '
    'costruire la propria presenza online, creare contenuti autentici e trovare il proprio '
    'posizionamento. Questa esperienza mi ha dato una comprensione diretta di cosa serve a un '
    'professionista o a una piccola impresa per comunicare online in modo efficace, e oggi la '
    'applico nella progettazione di ogni sito che costruisco.',
    s_body))

story.append(Spacer(1, 10))
story.append(Paragraph('Vicenza, Italia', s_mono))
story.append(Paragraph('marcomunich.com/dev', s_mono))
story.append(Paragraph('consulenza@marcomunich.com', s_mono))

story.append(PageBreak())

# ═══════════════════════════════════════
# PAGE 3 — SICUREZZA
# ═══════════════════════════════════════
story.append(Paragraph('03 / SICUREZZA', s_section))
story.append(Paragraph('Sicurezza e affidabilità', s_h1))
story.append(Paragraph(
    'La prima domanda che un cliente si pone quando scopre che il sito viene costruito con '
    'l\'aiuto dell\'intelligenza artificiale riguarda la sicurezza. Questa sezione risponde '
    'a quella domanda con fatti concreti e verificabili, perché le rassicurazioni generiche '
    'non servono a nessuno.',
    s_body))
story.append(Spacer(1, 10))

security_items = [
    ('Standard OWASP Top 10',
     'Il codice segue gli standard di sicurezza OWASP Top 10, il riferimento mondiale usato da banche, '
     'assicurazioni e aziende Fortune 500 per la protezione delle applicazioni web. Ogni componente viene '
     'verificato contro queste dieci categorie di vulnerabilità prima della consegna.'),
    ('Verifica automatica in tempo reale',
     'Durante lo sviluppo, il codice passa attraverso strumenti di analisi statica (Semgrep) che identificano '
     'vulnerabilità note, pattern di codice insicuro e dipendenze con problemi di sicurezza conosciuti. '
     'Questo controllo avviene ad ogni modifica, non solo alla fine del progetto.'),
    ('Codice standard e leggibile',
     'Il risultato finale è codice HTML, CSS e JavaScript standard, costruito su framework open source con '
     'milioni di utilizzatori. Qualsiasi sviluppatore qualificato può leggere, comprendere e modificare il codice. '
     'Il sito non dipende da nessuna AI specifica per continuare a funzionare.'),
    ('Aggiornamenti entro 24-48 ore',
     'Quando emerge una vulnerabilità critica che riguarda una tecnologia usata nel tuo progetto, applico '
     'la patch entro 24-48 ore. Il monitoraggio delle vulnerabilità è continuo e automatizzato.'),
    ('Monitoraggio post-consegna',
     'Il primo anno di monitoraggio è incluso nel prezzo. Controllo periodico dello stato del sito, delle '
     'performance e della sicurezza. Se qualcosa si rompe o emerge un problema, intervengo.'),
    ('Il sito è tuo al 100%',
     'Codice sorgente, dominio, hosting, credenziali di accesso: tutto è intestato a te e sotto il tuo '
     'controllo. Se un giorno decidi di cambiare sviluppatore, porti via tutto senza vincoli. Il codice '
     'e su un repository GitHub privato a tuo nome con la cronologia completa di ogni modifica.'),
]

for title, desc in security_items:
    story.append(Paragraph(title, s_blue))
    story.append(Paragraph(desc, s_body))
    story.append(Spacer(1, 4))

story.append(PageBreak())

# ═══════════════════════════════════════
# PAGE 4 — DOMANDE FREQUENTI (PAURE)
# ═══════════════════════════════════════
story.append(Paragraph('04 / DOMANDE', s_section))
story.append(Paragraph('Le domande che ti stai facendo', s_h1))
story.append(Paragraph(
    'Queste sono le domande che ricevo più spesso da clienti e aziende che si avvicinano '
    'per la prima volta a un progetto di sviluppo web guidato da intelligenza artificiale.',
    s_body))
story.append(Spacer(1, 10))

faqs = [
    ('Se l\'AI fa un errore nel codice, chi ne risponde?',
     'Io. La responsabilità del prodotto finale è mia. L\'intelligenza artificiale è uno strumento che '
     'utilizzo sotto la mia supervisione diretta, e ogni riga di codice passa attraverso il mio controllo '
     'prima di arrivare in produzione. Se qualcosa non funziona dopo la consegna, lo correggo io, a mie spese, '
     'nei tempi concordati.'),

    ('Come faccio a sapere che il sito è davvero sicuro?',
     'Il codice viene analizzato con gli stessi strumenti che usano le aziende di cybersecurity: scansione '
     'automatica delle vulnerabilità, verifica delle dipendenze, test di sicurezza sugli input utente. '
     'Posso fornirti un report di sicurezza al momento della consegna con i risultati delle scansioni.'),

    ('Il codice generato da AI è di qualità inferiore?',
     'Il codice che produco non è "generato e basta". Viene guidato, rivisto, testato e ottimizzato. '
     'Il risultato è codice pulito, ben strutturato e documentato. La qualità è spesso superiore a '
     'quella del codice scritto interamente a mano perché l\'AI ha accesso a milioni di best practice '
     'e pattern collaudati. Ma la decisione su cosa costruire e come rimane sempre mia.'),

    ('E se tra un anno devo fare modifiche e tu non ci sei?',
     'Il codice è standard. Qualsiasi sviluppatore web competente può leggerlo e modificarlo. '
     'Il repository GitHub contiene tutto il codice sorgente con la documentazione necessaria. '
     'Non c\'e nessun lock-in tecnologico né commerciale. Detto questo, il pacchetto di mantenimento '
     'annuale garantisce che io resti il tuo riferimento tecnico nel tempo.'),

    ('Come gestisci i dati sensibili dei miei clienti?',
     'I dati personali vengono trattati secondo il GDPR. Il sito include cookie policy e privacy policy '
     'conformi, sistema di consenso per i cookie, e cifratura SSL/TLS per tutte le comunicazioni. '
     'Se il progetto prevede un\'area riservata o un e-commerce, i dati sensibili vengono gestiti '
     'da piattaforme certificate (Stripe per i pagamenti, per esempio) e mai salvati sul server.'),

    ('Cosa succede se il sito va giu?',
     'L\'hosting che utilizzo (Netsons, con server in Italia) garantisce un uptime del 99.9%. '
     'In caso di problemi, ricevo una notifica e intervengo. I backup automatici permettono di '
     'ripristinare il sito in pochi minuti in caso di guasto. Nel primo anno questo monitoraggio '
     'e incluso nel prezzo.'),

    ('Perché dovrei scegliere te invece di un\'agenzia?',
     'Con un\'agenzia parli con un commerciale, il progetto passa tra tre persone diverse e i tempi '
     'si allungano. Con me parli direttamente con chi costruisce il sito. Questo significa decisioni '
     'rapide, comunicazione diretta, e un costo sensibilmente inferiore a parità di risultato. '
     'Il mio metodo di lavoro mi permette di consegnare in tempi che un\'agenzia tradizionale '
     'raggiungerebbe solo con un team dedicato.'),
]

for q, a in faqs:
    story.append(Paragraph(q, s_question))
    story.append(Paragraph(a, s_answer))

story.append(PageBreak())

# ═══════════════════════════════════════
# PAGE 5 — CLAUDIFY / STACK
# ═══════════════════════════════════════
story.append(Paragraph('05 / STACK TECNOLOGICO', s_section))
story.append(Paragraph('L\'ambiente di sviluppo', s_h1))

story.append(Paragraph(
    'Il mio ambiente di sviluppo si basa su Claude Code, il sistema di programmazione assistita '
    'di Anthropic, potenziato da Claudify (claudify.tech): un sistema operativo per lo sviluppo '
    'web che trasforma l\'AI da assistente generico a strumento professionale strutturato.',
    s_body))
story.append(Spacer(1, 10))

story.append(Paragraph('Cosa fa Claudify', s_h2))
story.append(Paragraph(
    'Claudify aggiunge a Claude Code un livello di organizzazione e controllo qualità che '
    'garantisce risultati consistenti su ogni progetto. Include:',
    s_body))

claudify_features = [
    '1.727 competenze strutturate in 31 categorie (sicurezza, performance, accessibilità, SEO, design)',
    '9 agenti specializzati con memoria persistente che ricordano le decisioni prese nel progetto',
    '21 comandi di automazione che standardizzano il flusso di lavoro',
    '9 verifiche automatiche che controllano il codice prima di ogni rilascio',
    'Base di conoscenza che si aggiorna con ogni progetto completato',
]
for feat in claudify_features:
    story.append(Paragraph(feat, s_blue_light))

story.append(Spacer(1, 16))
story.append(Paragraph('Cosa significa per te', s_h2))
story.append(Paragraph(
    'Significa che il tuo progetto non dipende dall\'ispirazione del momento o dalla giornata '
    'buona dello sviluppatore. Ogni sito passa attraverso gli stessi controlli di qualità, '
    'le stesse verifiche di sicurezza e le stesse ottimizzazioni. Il risultato è prevedibile, '
    'misurabile e replicabile.',
    s_body))
story.append(Paragraph(
    'Le tecnologie che utilizzo sono tutte open source e standard: Astro per il framework, '
    'Tailwind CSS per il design, GitHub per il versioning, Netsons per l\'hosting in Italia. '
    'Il sito che ricevi è fatto con le stesse tecnologie che usano aziende come Stripe, Vercel e Linear.',
    s_body))
story.append(Spacer(1, 16))
story.append(Paragraph('Libertà creativa totale', s_h2))
story.append(Paragraph(
    'Il vantaggio più grande di lavorare con l\'intelligenza artificiale è la libertà di '
    'realizzazione. Quando un cliente ha un\'idea, anche la più ambiziosa in termini creativi '
    'o grafici, il mio ambiente di lavoro mi permette di trasformarla in qualcosa di concreto '
    'in tempi che sarebbero impensabili con lo sviluppo tradizionale. Ogni richiesta diventa '
    'fattibile, ogni esperimento diventa accessibile, ogni revisione costa una frazione del tempo '
    'che costerebbe normalmente.',
    s_body))
story.append(Paragraph(
    'Questo vale anche per le agenzie e i professionisti che vogliono offrire ai propri clienti '
    'soluzioni su misura senza i vincoli dei template predefiniti. Un progetto che prima richiedeva '
    'settimane di lavoro manuale tra design, sviluppo e revisioni oggi può prendere forma in pochi '
    'giorni, con la possibilità di esplorare direzioni creative diverse senza che ogni cambio di '
    'rotta si traduca in costi aggiuntivi proibitivi. L\'idea più insolita del cliente diventa il '
    'punto di partenza, perché gli strumenti che uso mi danno la capacità tecnica di seguire qualsiasi '
    'direzione.',
    s_body))

story.append(Spacer(1, 10))
story.append(Paragraph('claudify.tech', s_mono))

story.append(PageBreak())

# ═══════════════════════════════════════
# PAGE 5 — COME LAVORO
# ═══════════════════════════════════════
story.append(Paragraph('06 / PROCESSO', s_section))
story.append(Paragraph('Come lavoro', s_h1))

steps = [
    ('1. Ascolto',
     'Parliamo del progetto, degli obiettivi e del pubblico a cui ti rivolgi. Questa conversazione '
     'serve a capire cosa serve davvero e a evitare di costruire qualcosa che non ti rappresenta. '
     'Niente brief di 40 pagine: una videochiamata di 30 minuti e qualche domanda precisa.'),
    ('2. Progettazione',
     'Definisco la struttura del sito, la navigazione e i contenuti principali. Ti mostro un prototipo '
     'navigabile prima di scrivere codice, così puoi validare la direzione e chiedere modifiche quando '
     'il costo di cambiare idea è ancora zero.'),
    ('3. Sviluppo',
     'Costruisco il sito con il metodo vibe coding. Ti mando aggiornamenti regolari con link al sito '
     'in sviluppo così puoi seguire il progresso in tempo reale. Il codice viene versionato su GitHub '
     'e tu hai accesso al repository fin dal primo giorno.'),
    ('4. Revisione',
     'Navighi il sito, lo provi su telefono e computer, mi dici cosa vuoi cambiare. Le revisioni '
     'in questa fase fanno parte del processo e sono incluse nel prezzo. L\'obiettivo e che tu sia '
     'soddisfatto prima di andare online.'),
    ('5. Pubblicazione e supporto',
     'Mettiamo il sito online. Ti faccio una sessione di formazione per capire come funziona tutto. '
     'Dopo la pubblicazione resto disponibile per il primo anno di monitoraggio e supporto. Se hai '
     'bisogno di modifiche o nuove pagine, sono a disposizione con tempistiche rapide.'),
]

for title, desc in steps:
    story.append(Paragraph(title, s_h3))
    story.append(Paragraph(desc, s_body))
    story.append(Spacer(1, 6))

story.append(PageBreak())

# ═══════════════════════════════════════
# PAGE 7b — PROGETTI
# ═══════════════════════════════════════
story.append(Paragraph('07 / PROGETTI', s_section))
story.append(Paragraph('Progetti demo navigabili', s_h1))
story.append(Paragraph(
    'Ogni progetto qui sotto è una demo completa e navigabile. Puoi esplorare ogni pagina, '
    'cliccare i link, vedere le animazioni. Sono tutti visibili su marcomunich.com/dev/portfolio.',
    s_body))
story.append(Spacer(1, 10))

s_link = ParagraphStyle('Link', fontName='Mono', fontSize=8, textColor=HexColor(blue), spaceAfter=14, leading=11)

projects = [
    ('Luxe Noir', 'E-commerce luxury fashion', 'Da EUR 4.000',
     'Shop online con carrello, pagamenti, quick-view prodotti con effetti 3D, galleria fotografica, '
     'newsletter e gestione categorie. Design dark con accenti gold su sfondo nero.',
     'https://marcomunich.com/portfolio/ecommerce'),
    ('La Tua Academy', 'Piattaforma corsi online', 'Da EUR 4.000',
     'Pagina di login e registrazione studenti, dashboard personale con progresso corsi e barre di '
     'avanzamento animate, calendario lezioni, certificati scaricabili. Tre pagine interconnesse che '
     'mostrano il flusso completo dell\'esperienza studente.',
     'https://marcomunich.com/portfolio/corso-online'),
    ('Podere del Sole', 'B&B e Agriturismo', 'Da EUR 2.500',
     'Presentazione camere con galleria, sezione esperienze (degustazioni, passeggiate a cavallo), '
     'recensioni ospiti, mappa e indicazioni, form di prenotazione. Design caldo con toni terra '
     'e effetto parallax.',
     'https://marcomunich.com/portfolio/bed-and-breakfast'),
    ('NebulaDev SaaS', 'Dashboard applicativa', 'Da EUR 4.000',
     'Area utente con sidebar navigazione, grafici analytics animati, tabella attivit\u00e0 in tempo reale, '
     'notifiche, gestione team. Layout a griglia con glassmorphism e accenti indaco.',
     'https://marcomunich.com/portfolio/saas'),
]

for name, type_, price, desc, url in projects:
    story.append(Paragraph(type_.upper(), s_blue))
    story.append(Paragraph(name, s_h2))
    story.append(Paragraph(desc, s_body))
    story.append(Paragraph(price, ParagraphStyle('PriceSmall', fontName='Mono-Bold', fontSize=11, textColor=HexColor(blue_light), spaceAfter=4)))
    story.append(Paragraph('<link href="' + url + '">' + url + '</link>', s_link))

# QR code to portfolio
story.append(Spacer(1, 10))
story.append(Paragraph('Scansiona per vedere tutti i 13 progetti demo:', s_body))

import qrcode
import io
from reportlab.platypus import Image as RLImage

qr = qrcode.QRCode(version=1, box_size=6, border=2)
qr.add_data('https://marcomunich.com/dev/portfolio')
qr.make(fit=True)
qr_img = qr.make_image(fill_color='#3b82f6', back_color='#0a0e1a')
qr_buffer = io.BytesIO()
qr_img.save(qr_buffer, format='PNG')
qr_buffer.seek(0)
story.append(RLImage(qr_buffer, width=80, height=80))

story.append(PageBreak())

# ═══════════════════════════════════════
# PAGE 8 — PACCHETTI
# ═══════════════════════════════════════
story.append(Paragraph('08 / PREZZI', s_section))
story.append(Paragraph('Pacchetti e prezzi', s_h1))
story.append(Paragraph(
    'Tre fasce di prezzo che coprono la maggior parte delle esigenze. '
    'Se il tuo progetto ha requisiti particolari, ne parliamo e ti faccio un preventivo su misura.',
    s_body))
story.append(Spacer(1, 10))

packages = [
    ('Sito Vetrina', 'Da EUR 1.500', [
        'Fino a 5 pagine',
        'Design su misura (nessun template)',
        'Ottimizzazione SEO di base',
        'Responsive per mobile e tablet',
        'Consegna stimata: 7-10 giorni',
    ]),
    ('Sito Professionale', 'Da EUR 2.500', [
        'Fino a 10 pagine',
        'Blog integrato',
        'SEO avanzato (metadati, schema, sitemap)',
        'Form contatti e analytics',
        'Consegna stimata: 14-21 giorni',
    ]),
    ('E-commerce / Custom', 'Da EUR 4.000', [
        'Pagine illimitate',
        'Carrello e pagamenti (Stripe)',
        'Area riservata / login utenti',
        'Integrazioni custom su richiesta',
        'Supporto prioritario',
    ]),
]

for name, price, features in packages:
    story.append(Paragraph(name, s_h3))
    story.append(Paragraph(price, s_price))
    for f in features:
        story.append(Paragraph(f, s_blue_light))
    story.append(Spacer(1, 14))

story.append(Spacer(1, 10))
story.append(Paragraph('Cosa è incluso in tutti i pacchetti', s_h3))
story.append(Paragraph('Hosting e dominio per il primo anno, certificato SSL, sessione di formazione sull\'uso del sito, repository GitHub con codice sorgente completo.', s_body))

story.append(Spacer(1, 8))
story.append(Paragraph('Modalità di pagamento', s_h3))
story.append(Paragraph('50% all\'avvio del progetto, 50% alla consegna del sito approvato.', s_body))

story.append(Spacer(1, 8))
story.append(Paragraph('Dopo il primo anno', s_h3))
story.append(Paragraph(
    'Il pacchetto di mantenimento annuale costa EUR 147 e include: rinnovo hosting, aggiornamenti '
    'di sicurezza, backup, supporto tecnico via email o WhatsApp, e fino a 2 ore di modifiche minori. '
    'Pagine aggiuntive: EUR 150 a pagina. Il mantenimento è facoltativo: se preferisci gestire '
    'il sito in autonomia, il codice è tuo e puoi farlo senza vincoli.',
    s_body))

story.append(PageBreak())

# ═══════════════════════════════════════
# PAGE 9 — CONTATTO
# ═══════════════════════════════════════
story.append(Spacer(1, 100))
story.append(Paragraph('09 / CONTATTO', s_section))
story.append(Spacer(1, 20))
story.append(Paragraph('Parliamo del', s_center_big))
story.append(Paragraph('tuo progetto.', s_center_big))
story.append(Spacer(1, 20))
story.append(Paragraph(
    'Una conversazione per capire cosa ti serve e come posso aiutarti. Senza impegno.',
    s_center))
story.append(Spacer(1, 40))

contacts = [
    ('WEB', 'marcomunich.com/dev'),
    ('EMAIL', 'consulenza@marcomunich.com'),
    ('WHATSAPP', 'Scrivimi direttamente'),
]
for label, value in contacts:
    story.append(Paragraph(label, s_blue))
    story.append(Paragraph(value, s_body_white))
    story.append(Spacer(1, 10))

story.append(Spacer(1, 60))
story.append(Paragraph('Marco Munich Dev Portfolio 2026', s_mono))

# BUILD
doc.build(story, onFirstPage=bg_page, onLaterPages=bg_page)
print(f'PDF created: {output}')
print(f'Size: {os.path.getsize(output) // 1024} KB')
print(f'Pages: 8')
