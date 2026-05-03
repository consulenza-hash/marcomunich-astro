#!/usr/bin/env python3
"""
gen-single-image.py
Generates one article hero image via Google Imagen 4.

Usage:
  python scripts/gen-single-image.py <slug> "<prompt>"

Output:
  public/images/articoli/<slug>/<slug>.jpg
"""
import sys, os, base64, subprocess, requests
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
KEY_FILE = ROOT / '.env.imagen'

def load_key():
    key = os.environ.get('IMAGEN_API_KEY', '')
    if key:
        return key
    if KEY_FILE.exists():
        for line in KEY_FILE.read_text().splitlines():
            if line.startswith('IMAGEN_API_KEY='):
                return line.split('=', 1)[1].strip()
    return None

def generate(prompt, out_path, key):
    url = f'https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key={key}'
    payload = {
        'instances': [{'prompt': prompt}],
        'parameters': {'sampleCount': 1, 'aspectRatio': '16:9'}
    }
    r = requests.post(url, json=payload, timeout=120)
    if r.status_code != 200:
        print(f'Error {r.status_code}: {r.text[:300]}')
        return False
    data = r.json()
    b64 = data['predictions'][0].get('bytesBase64Encoded')
    if not b64:
        print(f'No image in response: {str(data)[:300]}')
        return False
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_bytes(base64.b64decode(b64))
    print(f'OK — saved {out_path} ({out_path.stat().st_size // 1024}KB)')
    # Auto-add to git to prevent untracked asset 404s in production
    subprocess.run(['git', 'add', str(out_path)], cwd=str(ROOT), capture_output=True)
    return True

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print('Usage: python gen-single-image.py <slug> "<prompt>"')
        sys.exit(1)

    slug = sys.argv[1]
    prompt = sys.argv[2]
    key = load_key()
    if not key:
        print('ERROR: IMAGEN_API_KEY not set. Set env var or create .env.imagen with IMAGEN_API_KEY=...')
        sys.exit(1)

    out = ROOT / 'public' / 'images' / 'articoli' / slug / f'{slug}.jpg'
    if out.exists() and out.stat().st_size > 10000:
        print(f'Already exists ({out.stat().st_size // 1024}KB), skipping.')
        sys.exit(0)

    full_prompt = (
        'Editorial photography, realistic, no text in image, no watermark, '
        'high quality, warm tones, 16:9 horizontal. ' + prompt
    )
    print(f'Generating image for: {slug}')
    ok = generate(full_prompt, out, key)
    sys.exit(0 if ok else 1)
