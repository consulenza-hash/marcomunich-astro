"""
generate-carousel-images.py
Genera immagini evocative con Imagen 4 per ogni carosello.
Per ogni carosello: 3 immagini (cover, slide 3, slide 6)
Output: public/contenuti-social/immagini-caroselli/carosello-XX/img-cover.png, img-s3.png, img-s6.png
"""
import requests, base64, json, re, time, sys
from pathlib import Path

KEY = 'AIzaSyCIGp_oxFcpTFMaI45ywFK7dGZJytQkimY'
URL = f'https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key={KEY}'
PROJECT_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_BASE = PROJECT_ROOT / 'public' / 'contenuti-social' / 'immagini-caroselli'

# Prompt map: per ogni carosello, 3 prompt fotografici legati al tema
# Se non specificato, usa prompt generici per il settore
CAROUSEL_PROMPTS = {
    1: {
        'cover': 'Laptop showing a generic corporate website template on screen, photographed from above on dark wooden desk, warm lamp light, editorial photography, vertical 9:16',
        's3': 'Scattered identical white business cards on light marble surface, overhead shot, soft natural light, editorial still life, vertical 9:16',
        's6': 'Empty modern therapy chair in a calm minimal studio with warm window light casting geometric shadows, editorial interior, vertical 9:16',
    },
    2: {
        'cover': 'Smartphone screen showing an aggressive countdown timer ad with red text LAST CHANCE, held by hand over a calm wooden desk with a plant, contrast between urgency and calm, editorial, vertical 9:16',
        's3': 'Close-up of person sitting calmly in therapy session, hands on lap, soft warm light, shallow depth of field, editorial portrait without showing face, vertical 9:16',
        's6': 'Hand writing slowly with pencil on blank paper, warm morning light, peaceful atmosphere, editorial close-up, vertical 9:16',
    },
    3: {
        'cover': 'Social media feed on phone screen showing multiple similar-looking motivational posts, photographed from above, moody lighting, editorial, vertical 9:16',
        's3': 'Authentic messy desk with handwritten notes and coffee stains, real work in progress, warm natural light, editorial overhead shot, vertical 9:16',
        's6': 'Person looking at phone with skeptical expression, only hands and phone visible, soft side lighting, editorial mood, vertical 9:16',
    },
    4: {
        'cover': 'Stack of psychology textbooks next to an open laptop with a blank document, warm desk lamp light, scholarly atmosphere, editorial still life, vertical 9:16',
        's3': 'Close-up of handwritten clinical notes in a professional notebook with a fountain pen, warm tones, shallow depth of field, editorial, vertical 9:16',
        's6': 'Two people in conversation across a table, only hands and coffee cups visible, warm intimate lighting, editorial, vertical 9:16',
    },
    5: {
        'cover': 'Phone screen showing Instagram profile with high follower count, placed on a desk next to an empty appointment book, contrast between online numbers and real business, editorial, vertical 9:16',
        's3': 'Person scrolling through social media feed rapidly, motion blur on screen, only hands visible, moody blue light, editorial, vertical 9:16',
        's6': 'Small intimate workshop with 5 empty chairs in a circle, warm light from window, calm professional space, editorial interior, vertical 9:16',
    },
    6: {
        'cover': 'Person lying awake in bed at night, phone screen glowing in dark room, intimate and vulnerable moment, only silhouette visible, editorial photography, vertical 9:16',
        's3': 'Notebook open to a page with emotional handwriting, tear stain on paper, warm bedside lamp, editorial close-up, vertical 9:16',
        's6': 'Warm cup of tea on a windowsill at dawn, steam rising, peaceful morning light, editorial still life, vertical 9:16',
    },
    7: {
        'cover': 'Antique mirror reflecting a blurred figure, moody chiaroscuro lighting, concept of persona and identity, editorial art photography, vertical 9:16',
        's3': 'Professional outfit hanging on a door next to casual clothes, visual contrast between public and private self, warm natural light, editorial, vertical 9:16',
        's6': 'Two chairs facing each other in a therapy room, one in light one in shadow, concept of authentic connection, editorial interior, vertical 9:16',
    },
    8: {
        'cover': 'ChatGPT conversation on a laptop screen with a search query visible, modern desk setup, blue screen glow in dim room, editorial tech photography, vertical 9:16',
        's3': 'Close-up of hands typing on keyboard with search results reflected in glasses, blue tint, editorial, vertical 9:16',
        's6': 'Stack of printed blog articles next to a laptop showing analytics, warm desk light, concept of content accumulation over time, editorial, vertical 9:16',
    },
}

# Generic fallback prompts for carousels without specific prompts
GENERIC_PROMPTS = {
    'cover': 'Professional coaching workspace with laptop, notebook, and warm coffee, soft natural light from window, editorial overhead shot, warm tones, vertical 9:16',
    's3': 'Close-up of hands writing notes during a professional consultation, warm lighting, editorial photography, vertical 9:16',
    's6': 'Calm professional studio space with a comfortable chair and natural light, warm tones, editorial interior photography, vertical 9:16',
}

def generate_image(prompt, output_path, retries=2):
    """Generate one image via Imagen 4 API."""
    if output_path.exists() and output_path.stat().st_size > 10000:
        return True  # Already exists, skip

    for attempt in range(retries + 1):
        try:
            payload = {
                'instances': [{'prompt': prompt}],
                'parameters': {'sampleCount': 1, 'aspectRatio': '9:16'}
            }
            r = requests.post(URL, json=payload, timeout=90)
            if r.status_code == 200:
                data = r.json()
                img_b64 = data['predictions'][0]['bytesBase64Encoded']
                output_path.parent.mkdir(parents=True, exist_ok=True)
                output_path.write_bytes(base64.b64decode(img_b64))
                return True
            elif r.status_code == 429:
                print(f'    Rate limited, waiting 10s...')
                time.sleep(10)
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
    start_id = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    end_id = int(sys.argv[2]) if len(sys.argv) > 2 else 52

    total = 0
    ok = 0
    for cid in range(start_id, end_id + 1):
        prompts = CAROUSEL_PROMPTS.get(cid, GENERIC_PROMPTS)
        cdir = OUTPUT_BASE / f'carosello-{cid:02d}'

        for slot, key in [('img-cover.png', 'cover'), ('img-s3.png', 's3'), ('img-s6.png', 's6')]:
            prompt = prompts.get(key, GENERIC_PROMPTS[key])
            out_path = cdir / slot
            total += 1

            if out_path.exists() and out_path.stat().st_size > 10000:
                print(f'  C{cid:02d}/{slot} SKIP (exists)')
                ok += 1
                continue

            print(f'  C{cid:02d}/{slot} generating...', end=' ', flush=True)
            if generate_image(prompt, out_path):
                print(f'OK ({out_path.stat().st_size // 1024}KB)')
                ok += 1
            else:
                print('FAILED')

            # Small delay to avoid rate limits
            time.sleep(1)

    print(f'\nDone: {ok}/{total} images generated')

if __name__ == '__main__':
    main()
