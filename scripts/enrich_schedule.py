#!/usr/bin/env python3
"""
enrich_schedule.py

Parses the markdown archive files (contenuti-social/archivio-caroselli.md,
mese-2-caroselli.md, mese-3..6.md) and enriches scripts/schedule.json with:

- slide_texts: array of strings, one per slide (the text rendered on that slide)
- alt_texts: array of strings, one per slide (accessibility alt text for IG)
- Re-applies correct UTF-8 captions/titles from the markdown sources in case
  the existing schedule.json has mojibake.

Preserves existing id, date, status, published_at, media_id fields.

Run:
    python scripts/enrich_schedule.py              # writes in place
    python scripts/enrich_schedule.py --dry-run    # prints a diff summary only
"""

import argparse
import json
import re
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SCHEDULE_PATH = PROJECT_ROOT / "scripts" / "schedule.json"
ARCHIVE_FILES = [
    PROJECT_ROOT / "contenuti-social" / "archivio-caroselli.md",
    PROJECT_ROOT / "contenuti-social" / "mese-2-caroselli.md",
    PROJECT_ROOT / "contenuti-social" / "mese-3.md",
    PROJECT_ROOT / "contenuti-social" / "mese-4.md",
    PROJECT_ROOT / "contenuti-social" / "mese-5.md",
    PROJECT_ROOT / "contenuti-social" / "mese-6.md",
]

HEADER_RE = re.compile(r'^###\s+CAROSELLO\s+(\d+)\s+—\s+"([^"]+)"', re.MULTILINE)
SLIDE_RE = re.compile(r'^-\s+\*\*Slide\s+(\d+):\*\*\s+(.+?)\s*$', re.MULTILINE)
CAPTION_RE = re.compile(r'^-\s+\*\*Caption:\*\*\s+(.+?)\s*$', re.MULTILINE)


def parse_archive_file(path: Path) -> list[dict]:
    """Extract all carousels from a single markdown archive file."""
    if not path.exists():
        print(f"WARNING: {path} not found, skipping", file=sys.stderr)
        return []
    text = path.read_text(encoding="utf-8")
    carousels = []
    # Find each carousel header, then take text until the next header (or EOF)
    headers = list(HEADER_RE.finditer(text))
    for i, m in enumerate(headers):
        start = m.end()
        end = headers[i + 1].start() if i + 1 < len(headers) else len(text)
        block = text[start:end]
        cid = int(m.group(1))
        title = m.group(2).strip()
        slides = []
        for sm in SLIDE_RE.finditer(block):
            slides.append(sm.group(2).strip())
        caption_m = CAPTION_RE.search(block)
        caption = caption_m.group(1).strip() if caption_m else ""
        carousels.append(
            {
                "id": cid,
                "title": title,
                "slide_texts": slides,
                "caption": caption,
                "source_file": path.name,
            }
        )
    return carousels


def build_alt_texts(title: str, slide_texts: list[str]) -> list[str]:
    """Generate Instagram-friendly alt text for each slide.

    - Slide 1 (cover): describes the visual (dark bg, orange title) + quotes the title
    - Middle slides: short descriptor + the actual slide text (screen-reader friendly)
    - Last slide (signature): describes the closing brand frame
    """
    n = len(slide_texts)
    alts = []
    for i, text in enumerate(slide_texts, start=1):
        if i == 1:
            alts.append(
                f"Slide di copertina del carosello su sfondo nero con titolo in grande: «{text}». "
                f"In basso l'indicazione «scorri per scoprire» e il contatore 01 di {n:02d}."
            )
        elif i == n:
            # Last slide is usually the @marcomunich signature
            alts.append(
                "Slide finale nera con firma: @marcomunich — Personal Branding Olistico. "
                "Chiusura del carosello con invito a seguire il profilo."
            )
        else:
            alts.append(
                f"Slide {i} di {n} del carosello «{title}». Testo: {text}"
            )
    # Hard cap at 1000 chars per IG Graph API
    return [a[:1000] for a in alts]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    # Parse all archive files
    all_parsed = []
    for f in ARCHIVE_FILES:
        all_parsed.extend(parse_archive_file(f))

    # Build a lookup by id
    by_id = {c["id"]: c for c in all_parsed}
    print(f"Parsed {len(all_parsed)} carousels from {len(ARCHIVE_FILES)} files")
    print(f"IDs present: {sorted(by_id.keys())[:10]}... (showing first 10)")

    # Load schedule
    schedule = json.loads(SCHEDULE_PATH.read_text(encoding="utf-8"))
    print(f"Schedule has {len(schedule)} entries")

    # Enrich each schedule entry with the corresponding archive data
    enriched = 0
    missing = []
    for entry in schedule:
        cid = entry["id"]
        parsed = by_id.get(cid)
        if not parsed:
            missing.append(cid)
            continue
        # Always refresh title + caption from the markdown source (authoritative UTF-8)
        entry["title"] = parsed["title"]
        entry["caption"] = parsed["caption"]
        entry["slide_texts"] = parsed["slide_texts"]
        entry["slide_count"] = len(parsed["slide_texts"])
        entry["alt_texts"] = build_alt_texts(parsed["title"], parsed["slide_texts"])
        enriched += 1

    print(f"Enriched {enriched} entries")
    if missing:
        print(f"WARNING: {len(missing)} schedule entries had no matching carousel in archives: {missing}")

    if args.dry_run:
        print("\n--- DRY RUN: sample enriched entry (id=2) ---")
        sample = next((e for e in schedule if e["id"] == 2), None)
        if sample:
            print(json.dumps(sample, ensure_ascii=False, indent=2)[:2000])
        return 0

    SCHEDULE_PATH.write_text(
        json.dumps(schedule, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"\n✓ Wrote enriched schedule to {SCHEDULE_PATH}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
