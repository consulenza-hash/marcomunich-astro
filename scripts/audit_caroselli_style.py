#!/usr/bin/env python3
"""
audit_caroselli_style.py

Scorre tutti i file markdown dei caroselli e segnala ogni violazione delle
regole di stile italiane del progetto:

1. Strutture "non X ma Y" e varianti (definizione per negazione)
2. Triplette (tre elementi separati da virgola o punto e virgola)
3. Meta-frasi ("è importante", "è chiaro", "è la parte più forte", ecc.)
4. Em-dash nel testo
5. Astratti non supportati ("consapevolezza", "lucidità", "profondo", ecc.)
6. Ritmo telegrafico (più di 2 punti in 2 righe di testo)
7. "non è X. È Y" (forma con punto invece di virgola)
8. "X, non Y" (forma inversa)

Output: ogni violazione con file, carosello, slide, frase incriminata,
regola violata.
"""

import re
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

PROJECT_ROOT = Path(__file__).resolve().parent.parent
FILES = [
    PROJECT_ROOT / "contenuti-social" / "archivio-caroselli.md",
    PROJECT_ROOT / "contenuti-social" / "mese-2-caroselli.md",
    PROJECT_ROOT / "contenuti-social" / "mese-3.md",
    PROJECT_ROOT / "contenuti-social" / "mese-4.md",
    PROJECT_ROOT / "contenuti-social" / "mese-5.md",
    PROJECT_ROOT / "contenuti-social" / "mese-6.md",
]

# ──────────────────────────────────────────────────────────────────────────
# Rules
# ──────────────────────────────────────────────────────────────────────────

# 1. "non X ma Y" in tutte le forme
NON_X_MA_Y_PATTERNS = [
    # "non è X, è Y" / "non è X. È Y" (punto)
    (r"\bnon\s+(?:è|era|sarà|sono|erano|saranno|sarebbe|è\s+più|è\s+mai|sei|siete|siamo)\s+[^.,;]{1,80}[.,;]\s*(?:è|era|sarà|sono|erano|saranno|sarebbe|è\s+più|sei|siamo)\b", "non è X, è Y"),
    # "non è X ma Y"
    (r"\bnon\s+è\s+[^,.;]{1,80}\s+ma\s+\b", "non è X ma Y"),
    # "X, non Y" - inversione (es. "è un segnale, non un difetto")
    (r"\b(?:è|sono|era|erano|sarà|saranno)\s+[^,.;]{1,60},\s+non\s+[a-zàèéìòù]", "X, non Y (inversione)"),
    # "non si tratta di X, si tratta di Y"
    (r"\bnon\s+si\s+tratta\s+di\s+[^,.;]{1,60}[,.]\s*si\s+tratta\s+di\b", "non si tratta di X, si tratta di Y"),
    # "non parliamo di X, parliamo di Y"
    (r"\bnon\s+(?:parliamo|parlo|parla|parlano)\s+di\s+[^,.;]{1,60}[,.]\s*(?:parliamo|parlo|parla|parlano)\s+di\b", "non parliamo di X, parliamo di Y"),
    # "non sto dicendo X, sto dicendo Y"
    (r"\bnon\s+sto\s+dicendo\s+[^,.;]{1,80}[,.]\s*sto\s+dicendo\b", "non sto dicendo X, sto dicendo Y"),
    # "non serve X, serve Y"
    (r"\bnon\s+serve\s+[^,.;]{1,60}[,.]\s*serve\b", "non serve X, serve Y"),
    # "il punto non è X, il punto è Y"
    (r"\bil\s+punto\s+non\s+è\s+[^,.;]{1,60}[,.]\s*il\s+punto\s+è\b", "il punto non è X, il punto è Y"),
    # "non è una questione di X, è una questione di Y"
    (r"\bnon\s+è\s+una\s+questione\s+di\s+[^,.;]{1,60}[,.]\s*è\s+una\s+questione\s+di\b", "non è una questione di X, è una questione di Y"),
    # "non vuole X, vuole Y"
    (r"\bnon\s+(?:vuole|vogliono|voglio|vuoi|volete|vogliamo)\s+[^,.;]{1,80}[,.]\s*(?:vuole|vogliono|voglio|vuoi|volete|vogliamo)\b", "non vuole X, vuole Y"),
    # "non cerca X, cerca Y"
    (r"\bnon\s+(?:cerca|cercano|cerco|cerchi|cercate|cerchiamo)\s+[^,.;]{1,80}[,.]\s*(?:cerca|cercano|cerco|cerchi|cercate|cerchiamo)\b", "non cerca X, cerca Y"),
    # "non fa X, fa Y"
    (r"\bnon\s+(?:fa|fanno|faccio|fai|fate|facciamo)\s+[^,.;]{1,80}[,.]\s*(?:fa|fanno|faccio|fai|fate|facciamo)\b", "non fa X, fa Y"),
    # "non è colpa di X, è Y"
    (r"\bnon\s+è\s+colpa\s+di\s+[^,.;]{1,60}[,.]\s*(?:è|sono)\b", "non è colpa di X, è Y"),
    # "X non Y" come opposizione diretta (es. "dà, non chiede")
    (r"\b(?:dà|chiede|include|esclude|aiuta|consuma|costruisce|distrugge|attira|respinge)\s+,?\s*non\s+(?:dà|chiede|include|esclude|aiuta|consuma|costruisce|distrugge|attira|respinge)\b", "verbo non verbo opposizione"),
]


def detect_semantic_trampoline(text):
    """Rileva il pattern semantico 'nego prima, affermo dopo' anche quando
    la forma letterale sfugge alle regex. Cerca frasi del tipo:

      "X non viene da A. Viene da B"
      "X non riguarda A. Riguarda B"
      "La difficoltà non arriva da A. Arriva da B"
      "Non si tratta di A. Si tratta di B"
      "La fatica non nasce da A. Nasce da B"
      "Non è colpa di X. È Y"

    Euristica: divido il testo in frasi, per ogni coppia di frasi consecutive
    verifico se la prima contiene una negazione (non + verbo) e la seconda
    ripete lo stesso verbo (o un verbo semanticamente affermativo) senza
    negazione. Se c'è eco del soggetto o del verbo, è trampolino.

    Ritorna lista di tuple (frase_nega, frase_afferma) che violano.
    """
    # Split in frasi sulla punteggiatura forte
    sentences = re.split(r'(?<=[.!?])\s+', text)
    violations = []

    # Verbi "affermativi" che segnalano ripresa positiva dopo negazione
    affirm_verbs = [
        'è', 'sono', 'era', 'erano', 'sarà', 'saranno', 'sarebbe',
        'viene', 'vengono', 'veniva', 'venivano', 'verrà', 'verranno',
        'arriva', 'arrivano', 'arrivava', 'arrivavano', 'arriverà',
        'riguarda', 'riguardano', 'riguardava', 'riguardavano',
        'nasce', 'nascono', 'nasceva', 'nascevano',
        'dipende', 'dipendono', 'dipendeva', 'dipendevano',
        'serve', 'servono', 'serviva', 'servivano',
        'va', 'vanno', 'andava', 'andavano',
        'si\\s+tratta',
        'ha\\s+a\\s+che\\s+fare',
    ]
    verb_alt = '|'.join(affirm_verbs)

    # Pattern di "ripresa" all'inizio di una frase affermativa.
    # Esempi: "Viene dal ...", "Riguarda il ...", "È un segnale di ..."
    repris_pattern = re.compile(
        r'^\s*(?:' + verb_alt + r')\b',
        re.IGNORECASE
    )

    # Pattern di negazione semantica nella frase precedente.
    # Cerca: "non" seguito entro 8 parole da uno dei verbi affermativi.
    nega_pattern = re.compile(
        r'\bnon\s+(?:\w+\s+){0,8}?(?:' + verb_alt + r')\b',
        re.IGNORECASE
    )

    for i in range(len(sentences) - 1):
        curr = sentences[i].strip()
        nxt = sentences[i + 1].strip()
        if len(curr) < 10 or len(nxt) < 10:
            continue
        # La frase corrente contiene negazione con verbo affermativo?
        if nega_pattern.search(curr):
            # La successiva inizia con ripresa affermativa dello stesso tipo di verbo?
            if repris_pattern.match(nxt):
                violations.append((curr[:100], nxt[:100]))
            # Alternativa: la successiva inizia con "Arriva", "Viene", "È",
            # "Riguarda" senza soggetto esplicito (ripresa implicita del soggetto
            # della frase precedente) — anche senza match con repris_pattern, se
            # la sequenza di apertura è un verbo nudo.
            else:
                first_word_match = re.match(r'^\s*([A-Z]?[a-zàèéìòù]+)', nxt)
                if first_word_match:
                    first = first_word_match.group(1).lower()
                    if first in ('arriva', 'viene', 'è', 'riguarda', 'nasce', 'dipende',
                                 'serve', 'va', 'sta', 'sono', 'diventa', 'resta',
                                 'rappresenta', 'corrisponde', 'funziona'):
                        violations.append((curr[:100], nxt[:100]))

    return violations

# 2. Meta-frasi
META_PHRASES = [
    r"\bè\s+importante\b",
    r"\bè\s+chiaro\s+che\b",
    r"\bè\s+la\s+parte\s+più\s+forte\b",
    r"\bè\s+giusto\s+partire\s+da\b",
    r"\bè\s+fondamentale\b",
    r"\bè\s+essenziale\b",
    r"\bè\s+cruciale\b",
    r"\bè\s+basilare\b",
]

# 3. Em-dash (U+2014)
EM_DASH = "—"

# 4. Triplette: pattern "A, B, C" dove A/B/C sono brevi e non seguiti da altra virgola
# Rilevo sequenze di tre aggettivi/nomi separati da virgole, dove il terzo finisce
# con punto/punto-e-virgola e non è seguito da "e" (che indicherebbe una lista più lunga).
# Euristica: "parola[a-zàèéìòù]+, parola[a-zàèéìòù]+, parola[a-zàèéìòù]+[.;]" con elementi brevi.
TRIPLETTA_PATTERN = r"\b([a-zàèéìòù]{3,20}),\s+([a-zàèéìòù]{3,20}),\s+([a-zàèéìòù]{3,20})\b(?!\s*,)(?!\s+e\s)"

# 5. Astratti non supportati - segnalo solo, l'utente decide
ASTRATTI = [
    r"\bconsapevolezza\b",
    r"\blucidità\b",
    r"\bprofondo\b",
    r"\bprofonda\b",
    r"\bresponsabilità\b",
    r"\bnel\s+rispetto\b",
]

# 6. Ritmo telegrafico: più di 2 punti in 2 righe di testo
def count_telegraphic(text):
    """Ritorna True se in uno span di ~200 char ci sono più di 3 punti."""
    sentences = re.split(r'[.!?]+\s+', text)
    # Se ci sono più di 3 frasi brevi (<40 char) consecutive, è telegrafico
    short_count = 0
    for s in sentences:
        if len(s.strip()) < 40 and len(s.strip()) > 5:
            short_count += 1
            if short_count >= 3:
                return True
        else:
            short_count = 0
    return False


def extract_slides(content):
    """Estrae tutte le slide e le caption dai caroselli nel file."""
    results = []
    carousel_re = re.compile(
        r'^### CAROSELLO (\d+)\s*—\s*"([^"]+)"',
        re.MULTILINE
    )
    slide_re = re.compile(r'^- \*\*Slide (\d+):\*\* (.+?)$', re.MULTILINE)
    caption_re = re.compile(r'^- \*\*Caption:\*\* (.+?)$', re.MULTILINE)

    matches = list(carousel_re.finditer(content))
    for i, m in enumerate(matches):
        start = m.end()
        end = matches[i+1].start() if i+1 < len(matches) else len(content)
        block = content[start:end]
        cid = int(m.group(1))
        title = m.group(2)
        # slides
        for sm in slide_re.finditer(block):
            slide_num = int(sm.group(1))
            text = sm.group(2).strip()
            results.append({
                'carousel': cid,
                'title': title,
                'slide': slide_num,
                'type': 'slide',
                'text': text,
            })
        # caption
        cap = caption_re.search(block)
        if cap:
            results.append({
                'carousel': cid,
                'title': title,
                'slide': 'CAP',
                'type': 'caption',
                'text': cap.group(1).strip(),
            })
    return results


def audit_text(text):
    """Ritorna lista di (rule_name, matched_snippet) per ogni violazione trovata."""
    violations = []

    for pattern, name in NON_X_MA_Y_PATTERNS:
        for m in re.finditer(pattern, text, re.IGNORECASE):
            violations.append((f"1-NON-X-MA-Y [{name}]", m.group(0)[:120]))

    for pattern in META_PHRASES:
        for m in re.finditer(pattern, text, re.IGNORECASE):
            violations.append(("2-META-FRASE", m.group(0)))

    if EM_DASH in text:
        for m in re.finditer(f"[^@]{re.escape(EM_DASH)}[^@]", text):
            violations.append(("3-EM-DASH", m.group(0)))

    for m in re.finditer(TRIPLETTA_PATTERN, text, re.IGNORECASE):
        violations.append(("4-TRIPLETTA", m.group(0)))

    for pattern in ASTRATTI:
        for m in re.finditer(pattern, text, re.IGNORECASE):
            violations.append(("5-ASTRATTO (review)", m.group(0)))

    if count_telegraphic(text):
        violations.append(("6-TELEGRAFICO", text[:80] + "..."))

    # 7. Semantic trampoline: nego in una frase, affermo nella successiva
    for nega, afferma in detect_semantic_trampoline(text):
        violations.append((
            "7-SEMANTIC-TRAMPOLINE",
            f"{nega[:60]}... | {afferma[:60]}"
        ))

    return violations


def main():
    all_violations = []
    total_items = 0

    for filepath in FILES:
        if not filepath.exists():
            continue
        content = filepath.read_text(encoding="utf-8")
        items = extract_slides(content)
        total_items += len(items)
        for item in items:
            viols = audit_text(item['text'])
            for rule, snippet in viols:
                all_violations.append({
                    'file': filepath.name,
                    'carousel': item['carousel'],
                    'slide': item['slide'],
                    'rule': rule,
                    'snippet': snippet,
                    'full_text': item['text'],
                })

    # Print report
    print(f"=" * 80)
    print(f"AUDIT RESULT")
    print(f"=" * 80)
    print(f"Items scanned: {total_items}")
    print(f"Total violations found: {len(all_violations)}")
    print()

    # Group by carousel
    by_carousel = {}
    for v in all_violations:
        key = v['carousel']
        by_carousel.setdefault(key, []).append(v)

    # Count unique carousels with violations
    print(f"Carousels with violations: {len(by_carousel)}/52")
    print()

    # Count by rule
    by_rule = {}
    for v in all_violations:
        rule = v['rule'].split(' ')[0]
        by_rule[rule] = by_rule.get(rule, 0) + 1
    print("Violations by rule:")
    for rule, count in sorted(by_rule.items(), key=lambda x: -x[1]):
        print(f"  {rule}: {count}")
    print()

    # Detail per carousel
    print(f"=" * 80)
    print(f"DETAIL")
    print(f"=" * 80)
    for cid in sorted(by_carousel.keys()):
        viols = by_carousel[cid]
        print(f"\n── CAROSELLO {cid:02d} ({len(viols)} violations) ──")
        seen_slides = set()
        for v in viols:
            key = (v['slide'], v['rule'])
            if key in seen_slides:
                continue
            seen_slides.add(key)
            print(f"  [{v['slide']}] {v['rule']}")
            print(f"      snippet: {v['snippet']!r}")

    return 0 if not all_violations else 1


if __name__ == "__main__":
    sys.exit(main())
