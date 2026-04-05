#!/usr/bin/env python3
"""
convert_slides_to_jpeg.py

Converts all carousel slide PNGs to JPEG side-by-side, keeping originals
intact. Instagram Graph API requires JPEG format (PNG is rejected with
error code 9004).

Scans: public/contenuti-social/immagini-caroselli/carosello-*/slide-*.png
Writes: the same path with .jpg extension, quality 92, subsampling 4:2:0.

Safe to re-run: existing .jpg files are overwritten (idempotent).
"""

from pathlib import Path
import sys
from PIL import Image

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SLIDES_ROOT = PROJECT_ROOT / "public" / "contenuti-social" / "immagini-caroselli"

def convert_all() -> tuple[int, int, list[str]]:
    """Walk all slide PNGs and produce JPEG siblings.

    Returns (converted_count, skipped_count, errors).
    """
    if not SLIDES_ROOT.exists():
        print(f"ERROR: slides root not found: {SLIDES_ROOT}", file=sys.stderr)
        return (0, 0, ["slides root missing"])

    converted = 0
    skipped = 0
    errors: list[str] = []

    pngs = sorted(SLIDES_ROOT.glob("carosello-*/slide-*.png"))
    print(f"Found {len(pngs)} PNG slides under {SLIDES_ROOT.relative_to(PROJECT_ROOT)}")

    for png_path in pngs:
        jpg_path = png_path.with_suffix(".jpg")
        try:
            with Image.open(png_path) as img:
                # Convert RGBA/P to RGB (JPEG does not support alpha)
                if img.mode in ("RGBA", "LA", "P"):
                    bg = Image.new("RGB", img.size, (255, 255, 255))
                    if img.mode == "P":
                        img = img.convert("RGBA")
                    bg.paste(img, mask=img.split()[-1] if img.mode == "RGBA" else None)
                    out = bg
                elif img.mode != "RGB":
                    out = img.convert("RGB")
                else:
                    out = img
                out.save(
                    jpg_path,
                    format="JPEG",
                    quality=92,
                    optimize=True,
                    progressive=True,
                    subsampling=0,  # 4:4:4 for cleanest text rendering
                )
            converted += 1
        except Exception as e:
            errors.append(f"{png_path.relative_to(PROJECT_ROOT)}: {e}")

    print(f"Converted: {converted}")
    print(f"Skipped:   {skipped}")
    if errors:
        print(f"Errors:    {len(errors)}")
        for err in errors[:5]:
            print(f"  - {err}")
    return (converted, skipped, errors)


if __name__ == "__main__":
    conv, skip, errs = convert_all()
    sys.exit(0 if not errs else 1)
