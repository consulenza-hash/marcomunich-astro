#!/usr/bin/env python3
"""
build_schedule.py

Parses carousel markdown files and generates scripts/schedule.json with one
entry per carousel, containing title, caption, slide count, publish date, and
pubblication status. The resulting JSON is consumed by publish_carousel.py
which handles the actual Instagram Graph API publishing.

Schedule policy:
- 1 carosello per day
- Starting from 2026-04-06 at 09:30 Europe/Rome (CEST, UTC+2)
- Skip nothing, every day consecutively for 52 days

Run this once (or after editing markdown) to rebuild schedule.json. Existing
published statuses are preserved on rebuild.
"""

import json
import os
import re
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
CONTENT_DIR = PROJECT_ROOT / "contenuti-social"
SCHEDULE_PATH = PROJECT_ROOT / "scripts" / "schedule.json"

MD_FILES = [
    "archivio-caroselli.md",
    "mese-2-caroselli.md",
    "mese-3.md",
    "mese-4.md",
    "mese-5.md",
    "mese-6.md",
]

# Europe/Rome is UTC+2 during CEST (summer, March–October)
ROME_OFFSET = timezone(timedelta(hours=2))
START_DATE = datetime(2026, 4, 6, 9, 30, 0, tzinfo=ROME_OFFSET)

CAROUSEL_RE = re.compile(
    r'### CAROSELLO (\d+)\s*—\s*"([^"]+)"\n([\s\S]*?)(?=\n### CAROSELLO |\n## |\n---\n|\Z)'
)
SLIDE_RE = re.compile(r'- \*\*Slide (\d+):\*\* (.+)')
CAPTION_RE = re.compile(r'- \*\*Caption:\*\* (.+)')


def parse_markdown(filepath: Path):
    content = filepath.read_text(encoding="utf-8")
    carousels = []
    for match in CAROUSEL_RE.finditer(content):
        num = int(match.group(1))
        title = match.group(2).strip()
        body = match.group(3)

        slides = []
        for sm in SLIDE_RE.finditer(body):
            slides.append({"num": int(sm.group(1)), "text": sm.group(2).strip()})

        caption_match = CAPTION_RE.search(body)
        caption = caption_match.group(1).strip() if caption_match else ""

        carousels.append({
            "num": num,
            "title": title,
            "slide_count": len(slides),
            "caption": caption,
        })
    return carousels


def load_all_carousels():
    all_carousels = {}
    for fname in MD_FILES:
        fpath = CONTENT_DIR / fname
        if not fpath.exists():
            print(f"  ! missing: {fname}", file=sys.stderr)
            continue
        parsed = parse_markdown(fpath)
        print(f"  {fname}: {len(parsed)} carousels")
        for c in parsed:
            all_carousels[c["num"]] = c
    return [all_carousels[k] for k in sorted(all_carousels.keys())]


def load_existing_schedule() -> dict:
    """Preserve published status from prior runs."""
    if not SCHEDULE_PATH.exists():
        return {}
    try:
        data = json.loads(SCHEDULE_PATH.read_text(encoding="utf-8"))
        return {entry["id"]: entry for entry in data}
    except (json.JSONDecodeError, KeyError):
        return {}


def build_schedule():
    print("> Parsing markdown files…")
    carousels = load_all_carousels()
    print(f"> Loaded {len(carousels)} carousels\n")

    existing = load_existing_schedule()
    schedule = []

    for i, c in enumerate(carousels):
        publish_dt = START_DATE + timedelta(days=i)
        cid = c["num"]
        prior = existing.get(cid, {})

        entry = {
            "id": cid,
            "title": c["title"],
            "slide_count": c["slide_count"],
            "date": publish_dt.isoformat(),
            "caption": c["caption"],
            "status": prior.get("status", "pending"),
            "published_at": prior.get("published_at"),
            "media_id": prior.get("media_id"),
            "error": prior.get("error"),
        }
        schedule.append(entry)

    SCHEDULE_PATH.parent.mkdir(parents=True, exist_ok=True)
    SCHEDULE_PATH.write_text(
        json.dumps(schedule, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"> Written {SCHEDULE_PATH} ({len(schedule)} entries)")
    print(f"> First publish: {schedule[0]['date']}")
    print(f"> Last publish:  {schedule[-1]['date']}")


if __name__ == "__main__":
    build_schedule()
