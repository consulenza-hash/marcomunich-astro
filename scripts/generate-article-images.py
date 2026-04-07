"""
generate-article-images.py
Genera immagini hero 16:9 con Gemini per ogni articolo.
Output: public/images/articoli/{slug}.jpg
1200x675 editorial photography, horizontal 16:9

Usage:
  python generate-article-images.py           # all 52 articles
  python generate-article-images.py 1 10      # articles 1-10
  python generate-article-images.py sito-web-counselor-coach-generico  # single slug
"""
import requests, base64, json, re, time, sys, os
from pathlib import Path

KEY = os.environ.get('IMAGEN_API_KEY', '')
if not KEY:
    env_file = Path(__file__).resolve().parent.parent / '.env.imagen'
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            if line.startswith('IMAGEN_API_KEY='):
                KEY = line.split('=', 1)[1].strip()
if not KEY:
    print('ERROR: IMAGEN_API_KEY not set. Set env var or create .env.imagen')
    sys.exit(1)

MODEL = os.environ.get('IMAGEN_MODEL', 'gemini-3.1-flash-image-preview')
URL = f'https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={KEY}'
PROJECT_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = PROJECT_ROOT / 'public' / 'images' / 'articoli'

# Each prompt: editorial photography 16:9, no text, warm tones, realistic
ARTICLE_PROMPTS = {
    'sito-web-counselor-coach-generico': 'Laptop on a desk showing a generic website template, several identical browser windows open side by side, overhead editorial photography, warm desk lamp light, shallow depth of field, 16:9 horizontal',
    'counselor-comunica-come-venditore-corsi': 'Smartphone screen showing a bold countdown timer and urgent purchase button, placed on a calm therapy office desk with a notebook and pen, contrast between urgency and calm, editorial photography 16:9 horizontal',
    'autenticita-calcolata-si-sente': 'Two identical coffee mugs on a table, one genuine ceramic handmade with imperfections, one perfect mass-produced copy, close-up editorial still life, warm side lighting, 16:9 horizontal',
    'piu-sai-meno-ti-capiscono-counselor': 'Stack of thick professional textbooks and academic journals next to a blank simple notepad and pen, warm desk light, editorial overhead photography, 16:9 horizontal',
    'visibilita-riconoscibilita-professionista-olistico': 'Crowded city street seen from above, one person standing still while everyone else is blurred with movement, urban aerial editorial photography, natural daylight, 16:9 horizontal',
    'bisogno-riconoscimento-prima-della-soluzione': 'Person sitting across from an empty chair in a minimal consultation room, warm afternoon window light, sense of waiting and presence, editorial interior photography, 16:9 horizontal',
    'persona-jung-profilo-instagram': 'Phone screen showing a polished Instagram profile grid next to a raw handwritten personal journal, warm desk light, editorial still life overhead, 16:9 horizontal',
    'scrivere-per-farsi-trovare-ai-counselor': 'Laptop open with a blank document, a single lit desk lamp in a dark room, cursor blinking on white page, editorial moody photography, 16:9 horizontal',
    'problema-cliente-non-servizio-counselor': 'Open hands holding a small crumpled note with writing, warm side light, empathetic close-up, no face visible, editorial photography, 16:9 horizontal',
    'voce-autentica-professionista-olistico': 'Vintage microphone on a wooden desk surrounded by handwritten notes, warm studio light, editorial still life photography, 16:9 horizontal',
    'profili-coach-si-assomigliano': 'Multiple identical headshot frames arranged in a grid on a white wall, minimal photography studio, editorial overhead, 16:9 horizontal',
    'cliente-sbagliato-dice-chi-sei': 'Two chairs facing each other in a consultation room, one occupied and one empty, concept of choice and fit, warm window light, editorial interior, 16:9 horizontal',
    'instagram-vetrina-newsletter-salotto': 'Split scene: one half a bright polished storefront window display, other half a warm intimate living room with armchairs, editorial diptych photography, 16:9 horizontal',
    'contenuto-che-non-oseresti-pubblicare': 'Hand hovering over a laptop keyboard, hesitating before hitting send, dramatic warm side light, close-up editorial photography, 16:9 horizontal',
    'pagina-chi-sono-scritta-al-contrario': 'Paper CV printed out, upside down on a desk, surrounded by personal photos and handwritten notes, editorial overhead shot, warm light, 16:9 horizontal',
    'tempo-scrivere-qualita-contenuti': 'Old analog clock on a desk next to a notebook with a single handwritten sentence, warm morning light, editorial still life, 16:9 horizontal',
    'prezzo-ultima-cosa-da-decidere': 'Blank price tag hanging on a door handle in a minimal therapy office, warm natural light, editorial photography, 16:9 horizontal',
    'prezzo-basso-danni-counselor': 'Euro coins stacked small next to a professional notebook with a crossed out low number, editorial desk photography, warm light, 16:9 horizontal',
    'prima-chiamata-conoscitiva-counselor': 'Smartphone on a desk with an incoming call screen visible, notepad and pen ready beside it, editorial overhead photography, warm light, 16:9 horizontal',
    'contratto-professionista-olistico': 'Unsigned professional document on a desk with a pen resting across it, minimal clean composition, editorial photography, warm side light, 16:9 horizontal',
    'cancellazioni-ultimo-minuto-clinico': 'Paper calendar on a wall with an appointment crossed out in pencil, warm office light, editorial close-up photography, 16:9 horizontal',
    'clienti-sbagliati-cercavi-senza-saperlo': 'Crossed paths at an intersection photographed from above, some people turning away, editorial urban photography, natural daylight, 16:9 horizontal',
    'disponibilita-infinita-paura-counselor': 'Phone with many notification bubbles on a desk late at night, screen glow in dark room, exhausted atmosphere, editorial photography, 16:9 horizontal',
    'cliente-concluso-torna-nel-tempo': 'Empty consultation chair in a warm therapy room, door slightly ajar in background, sense of return and passage of time, editorial interior, 16:9 horizontal',
    'caso-cliente-confidenziale-utile': 'Anonymized clinical notes on a desk, names blurred, thoughtful desk lamp light, editorial still life overhead, 16:9 horizontal',
    'principio-dopo-la-scena': 'Open notebook with a detailed narrative paragraph, pen resting beside it, warm focused desk light, editorial close-up photography, 16:9 horizontal',
    'errore-professionale-costruisce-fiducia': 'Crumpled paper being carefully smoothed out on a desk, concept of repair and honesty, warm editorial photography, 16:9 horizontal',
    'due-settimane-distanza-pubblicare': 'Draft document with handwritten editing marks, red pen on paper, time gap metaphor, editorial desk photography, warm light, 16:9 horizontal',
    'vulnerabilita-da-e-quella-che-chiede': 'Two hands reaching toward each other across a table, one open palm up, editorial close-up photography, warm side light, 16:9 horizontal',
    'un-cliente-in-testa-mentre-scrivi': 'Person writing in a notebook, a framed photo or small sticky note beside them, warm desk lamp, editorial photography, 16:9 horizontal',
    'frase-che-solo-tu-potresti-scrivere': 'Handwritten single sentence on a blank white page, unique handwriting, warm side light, editorial close-up photography, 16:9 horizontal',
    'critica-utile-crescita-professionale': 'Professional feedback written on paper with underlines and notes in margin, open on a desk, editorial photography, warm light, 16:9 horizontal',
    'domande-clienti-sono-gia-contenuto': 'Notebook with handwritten questions in various client handwriting styles, concept of collected wisdom, editorial overhead, warm light, 16:9 horizontal',
    'prima-frase-articolo-counselor': 'Laptop screen showing the beginning of a text document, only the first line written, cursor blinking, editorial moody photography, 16:9 horizontal',
    'titolo-metaforico-non-funziona': 'Open book with an abstract metaphorical title page next to a simple direct notecard, editorial comparison photography, warm desk light, 16:9 horizontal',
    'primo-articolo-deve-esistere': 'Blank new blog page on a laptop screen, empty and ready, morning light on a clean desk, editorial photography, 16:9 horizontal',
    'paure-bloccano-scrivere-online': 'Laptop keyboard photographed from the side, hands hovering above it in hesitation, dark warm moody light, editorial photography, 16:9 horizontal',
    'un-tema-solo-approfondito-anni': 'Single deep root of a tree emerging from soil, concept of depth over breadth, editorial nature close-up photography, soft natural light, 16:9 horizontal',
    'parole-clienti-contenuti-autentici': 'Audio recording device on a desk next to a transcribed notebook, concept of listening and documentation, editorial still life, warm light, 16:9 horizontal',
    'newsletter-luogo-privato-counselor': 'Intimate desk corner with a warm reading lamp, closed laptop, personal mug, concept of private written correspondence, editorial photography, 16:9 horizontal',
    'un-canale-solo-trappola': 'Multiple open social media tabs on a laptop screen creating visual overwhelm, editorial tech photography, blue screen glow, 16:9 horizontal',
    'pianificare-contenuti-decisione-giornaliera': 'Weekly planner open on a desk with one item highlighted, simple and clear, editorial overhead photography, warm morning light, 16:9 horizontal',
    'batch-contenuti-protezione-energia': 'Organized stack of completed notebooks and folders on a desk, concept of batched completed work, editorial overhead photography, warm light, 16:9 horizontal',
    'ripetere-concetti-importanti-servizio': 'Same sentence written three times in a notebook with increasing clarity and confidence, editorial close-up photography, warm desk light, 16:9 horizontal',
    'metriche-sbagliate-follower-like': 'Smartphone showing follower count next to an empty appointment book, the contrast between numbers and real clients, editorial still life, warm light, 16:9 horizontal',
    'community-coltivare-lentamente': 'Small plant being watered by hand, soil visible in a clay pot on a windowsill, slow growth concept, editorial close-up photography, natural light, 16:9 horizontal',
    'newsletter-vende-troppo-smette-letta': 'Phone showing unsubscribed email notification, concept of overdone selling, editorial photography, warm desk side light, 16:9 horizontal',
    'burnout-contenuti-segnale': 'Crumpled drafts of posts and articles scattered around a laptop, person overwhelmed, only hands visible, editorial photography, warm light, 16:9 horizontal',
    'sistema-contenuti-automatico': 'Clean organized dashboard on a monitor with scheduled content calendar visible, minimal home office, editorial photography, 16:9 horizontal',
    'dire-no-lavoro-professionista': 'Professional writing a clear "No" on a document, calm composed atmosphere, editorial close-up photography, warm desk light, 16:9 horizontal',
    'pensare-anni-contenuti-counselor': 'Long path through a forest stretching to a distant horizon, concept of long-term vision, editorial landscape photography, natural light, 16:9 horizontal',
    'cosa-resta-costruisci-senza-vedere': 'Hands shaping clay on a wheel, concept of building without seeing the final result, editorial close-up photography, warm workshop light, 16:9 horizontal',
}

ARTICLE_SLUGS = list(ARTICLE_PROMPTS.keys())

def generate_image(prompt, output_path, retries=2):
    """Generate one image via Gemini API."""
    if output_path.exists() and output_path.stat().st_size > 10000:
        return True  # Already exists, skip

    full_prompt = f'Editorial photography, realistic, no text in image, no watermark, high quality. {prompt}'

    for attempt in range(retries + 1):
        try:
            payload = {
                'contents': [{'parts': [{'text': full_prompt}]}],
                'generationConfig': {'responseModalities': ['image', 'text']}
            }
            r = requests.post(URL, json=payload, timeout=120)
            if r.status_code == 200:
                data = r.json()
                img_b64 = None
                for part in data.get('candidates', [{}])[0].get('content', {}).get('parts', []):
                    if 'inlineData' in part:
                        img_b64 = part['inlineData']['data']
                        break
                if img_b64:
                    output_path.parent.mkdir(parents=True, exist_ok=True)
                    # Save as JPEG
                    raw = base64.b64decode(img_b64)
                    output_path.write_bytes(raw)
                    return True
                else:
                    print(f'    No image in response: {str(data)[:200]}')
            elif r.status_code == 429:
                print(f'    Rate limited, waiting 20s...')
                time.sleep(20)
            else:
                print(f'    Error {r.status_code}: {r.text[:200]}')
                if attempt < retries:
                    time.sleep(3)
        except Exception as e:
            print(f'    Exception: {e}')
            if attempt < retries:
                time.sleep(3)
    return False

def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Support: range (1 10) or single slug
    if len(sys.argv) == 2 and not sys.argv[1].isdigit():
        slugs_to_process = [sys.argv[1]]
    else:
        start = int(sys.argv[1]) - 1 if len(sys.argv) > 1 else 0
        end = int(sys.argv[2]) if len(sys.argv) > 2 else len(ARTICLE_SLUGS)
        slugs_to_process = ARTICLE_SLUGS[start:end]

    print(f'\nGenerating hero images for {len(slugs_to_process)} articles...')

    ok = 0
    skip = 0
    fail = 0

    for slug in slugs_to_process:
        prompt = ARTICLE_PROMPTS.get(slug)
        if not prompt:
            print(f'  {slug}: no prompt defined, skipping')
            continue

        # Try .jpg first (our target), also skip if .png exists
        out_jpg = OUTPUT_DIR / f'{slug}.jpg'
        out_png = OUTPUT_DIR / f'{slug}.png'

        if out_jpg.exists() and out_jpg.stat().st_size > 10000:
            print(f'  {slug}: SKIP (exists {out_jpg.stat().st_size // 1024}KB)')
            skip += 1
            continue
        if out_png.exists() and out_png.stat().st_size > 10000:
            print(f'  {slug}: SKIP (png exists {out_png.stat().st_size // 1024}KB)')
            skip += 1
            continue

        print(f'  {slug}: generating...', end=' ', flush=True)
        # Generate to .jpg path (Gemini returns PNG/JPEG bytes, save as .jpg)
        if generate_image(prompt, out_jpg):
            size_kb = out_jpg.stat().st_size // 1024
            print(f'OK ({size_kb}KB)')
            ok += 1
        else:
            print('FAILED')
            fail += 1

        time.sleep(1.5)  # Small delay between requests

    print(f'\nDone: {ok} generated, {skip} skipped, {fail} failed (total {len(slugs_to_process)})')

if __name__ == '__main__':
    main()
