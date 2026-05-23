"""
Convert PNG slides from sett01-{day}/ to carousel-{NNN}/slide-NN.jpg
matching publish_carousel.py expected naming.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[3] / 'public' / 'contenuti-social' / 'immagini-caroselli'

# Mapping: day source -> carousel destination id
MAP = {
    'sett01-lun': 101,
    'sett01-mar': 102,
    'sett01-mer': 103,
    'sett01-gio': 104,
    'sett01-ven': 105,
    'sett01-sab': 106,
    'sett01-dom': 107,
}

for src_name, cid in MAP.items():
    src_dir = ROOT / src_name
    dst_dir = ROOT / f'carosello-{cid:03d}'
    dst_dir.mkdir(exist_ok=True)
    pngs = sorted(src_dir.glob('*.png'))
    for png in pngs:
        idx = int(png.stem)
        out = dst_dir / f'slide-{idx:02d}.jpg'
        img = Image.open(png).convert('RGB')
        img.save(out, 'JPEG', quality=92, optimize=True)
        kb = out.stat().st_size // 1024
        print(f'  OK {dst_dir.name}/slide-{idx:02d}.jpg ({kb}KB)')

print('\nDone.')
