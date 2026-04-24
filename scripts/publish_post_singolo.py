#!/usr/bin/env python3
"""
publish_post_singolo.py

Pubblica il prossimo post singolo (immagine + caption) su Instagram
via Instagram Graph API.

Env vars (da .env.instagram):
    META_ACCESS_TOKEN     Long-lived Instagram user access token
    INSTAGRAM_USER_ID     ID numerico account Instagram Business/Creator

File:
    public/contenuti-social/post-singoli/post-singoli.md   testi + caption
    .claude/post-singoli-status.json                       tracking pubblicati

Flags:
    --dry-run       Simula senza chiamare l'API
    --force-id N    Pubblica post N ignorando lo stato
    --list          Mostra lista e stato, poi esce
"""

import argparse
import json
import os
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

PROJECT_ROOT = Path(__file__).resolve().parent.parent
POSTS_MD = PROJECT_ROOT / "public" / "contenuti-social" / "post-singoli" / "post-singoli.md"
STATUS_FILE = PROJECT_ROOT / ".claude" / "post-singoli-status.json"
IG_API = "https://graph.instagram.com/v22.0"
POSTS_BASE_URL = (
    "https://raw.githubusercontent.com/consulenza-hash/marcomunich-astro/main"
    "/public/contenuti-social/immagini-post-singoli"
)


def parse_posts(md_path: Path) -> list:
    text = md_path.read_text(encoding="utf-8")
    posts = []
    blocks = re.split(r"(?=### POST \d+)", text)
    for block in blocks:
        m = re.match(r"### POST (\d+)", block)
        if not m:
            continue
        num = int(m.group(1))
        overlay_m = re.search(r"\*\*Overlay:\*\*\s*(.+)", block)
        caption_m = re.search(r"\*\*Caption:\*\*\s*\n([\s\S]+?)(?=\n### POST|\Z)", block)
        posts.append({
            "num": num,
            "overlay": overlay_m.group(1).strip() if overlay_m else f"Post {num}",
            "caption": caption_m.group(1).strip() if caption_m else "",
            "image_url": f"{POSTS_BASE_URL}/post-{num:02d}.png",
        })
    return posts


def load_status() -> dict:
    if STATUS_FILE.exists():
        return json.loads(STATUS_FILE.read_text())
    return {"published": [], "failed": []}


def save_status(status: dict):
    STATUS_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATUS_FILE.write_text(json.dumps(status, indent=2, ensure_ascii=False))


def check_url(url: str, retries: int = 5, delay: int = 10) -> bool:
    """Verifica che l'URL esista E che l'immagine sia almeno 1KB (non vuota/corrotta)."""
    import urllib.request
    MIN_IMAGE_BYTES = 1024  # < 1KB = immagine vuota o placeholder
    for attempt in range(1, retries + 1):
        try:
            req = urllib.request.Request(url, method="GET")
            with urllib.request.urlopen(req, timeout=15) as r:
                if r.status != 200:
                    raise RuntimeError(f"HTTP {r.status}")
                data = r.read(MIN_IMAGE_BYTES + 1)
                if len(data) < MIN_IMAGE_BYTES:
                    raise RuntimeError(f"Immagine troppo piccola ({len(data)} byte) — file vuoto o corrotto")
                return True
        except Exception as e:
            print(f"  URL check {attempt}/{retries}: {e}")
        if attempt < retries:
            time.sleep(delay)
    return False


def api_post(endpoint: str, data: dict) -> dict:
    import urllib.request, urllib.parse
    url = f"{IG_API}{endpoint}"
    payload = urllib.parse.urlencode(data).encode()
    req = urllib.request.Request(url, data=payload, method="POST")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def publish(token: str, user_id: str, image_url: str, caption: str, dry_run: bool) -> str:
    print(f"  Image URL: {image_url}")
    if dry_run:
        print("  [DRY-RUN] Step 1: create container — skip")
        print("  [DRY-RUN] Step 2: publish — skip")
        return "DRY_RUN_OK"

    print("  Step 1: creating media container...")
    resp1 = api_post(f"/{user_id}/media", {
        "image_url": image_url,
        "caption": caption,
        "access_token": token,
    })
    creation_id = resp1.get("id")
    if not creation_id:
        raise RuntimeError(f"No container id: {resp1}")
    print(f"  Container: {creation_id}")
    time.sleep(4)

    print("  Step 2: publishing...")
    resp2 = api_post(f"/{user_id}/media_publish", {
        "creation_id": creation_id,
        "access_token": token,
    })
    media_id = resp2.get("id")
    if not media_id:
        raise RuntimeError(f"No media id: {resp2}")
    return media_id


def load_env():
    env_file = PROJECT_ROOT / ".env.instagram"
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())


def main():
    load_env()
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--force-id", type=int, metavar="N")
    parser.add_argument("--list", action="store_true")
    parser.add_argument("--confirm", action="store_true", help="Required to actually publish (safety gate)")
    args = parser.parse_args()

    token = os.environ.get("META_ACCESS_TOKEN", "")
    user_id = os.environ.get("INSTAGRAM_USER_ID", "")

    if not args.dry_run and (not token or not user_id):
        print("ERROR: META_ACCESS_TOKEN e INSTAGRAM_USER_ID richiesti", file=sys.stderr)
        sys.exit(2)

    posts = parse_posts(POSTS_MD)
    status = load_status()
    published = {p["num"] for p in status.get("published", [])}

    if args.list:
        print(f"Total: {len(posts)} | Published: {len(published)} | Pending: {len(posts)-len(published)}\n")
        for p in posts:
            icon = "✓" if p["num"] in published else "·"
            print(f"  {icon} [{p['num']:02d}] {p['overlay'][:60]}")
        return

    target = next((p for p in posts if p["num"] == args.force_id), None) if args.force_id \
        else next((p for p in posts if p["num"] not in published), None)

    if not target:
        print("Nessun post da pubblicare." if not args.force_id else f"Post {args.force_id} non trovato.")
        sys.exit(0)

    # Safety gate: blocca se caption vuota
    if not target["caption"]:
        print(f"\n❌ CAPTION MANCANTE — post {target['num']:02d} non pubblicato.")
        print(f"   Overlay: {target['overlay']}")
        print(f"   Aggiungi la caption in post-singoli.md prima di pubblicare.")
        sys.exit(1)

    # Safety gate: --confirm required for any real publish operation
    if not args.dry_run and not args.confirm:
        print(f"\n⚠️  SAFETY GATE — pubblicazione bloccata")
        print(f"   Post:    [{target['num']:02d}] {target['overlay']}")
        print(f"   Caption: {target['caption'][:80]}...")
        print(f"\n   Aggiungi --confirm per pubblicare davvero.")
        sys.exit(0)

    print(f"\nPubblicazione POST {target['num']:02d} — {target['overlay']}")
    print(f"Caption ({len(target['caption'])} char): {target['caption'][:100]}...")

    if not args.dry_run:
        print("\nVerifica URL immagine...")
        if not check_url(target["image_url"]):
            print(f"ERROR: immagine non raggiungibile: {target['image_url']}")
            sys.exit(1)
        print("  OK")

    try:
        media_id = publish(token, user_id, target["image_url"], target["caption"], args.dry_run)
        print(f"\n✓ Pubblicato! Media ID: {media_id}")
        if not args.dry_run:
            status.setdefault("published", []).append({
                "num": target["num"],
                "overlay": target["overlay"],
                "media_id": media_id,
                "published_at": datetime.now(timezone.utc).isoformat(),
            })
            save_status(status)
    except Exception as e:
        print(f"\n✗ Errore: {e}")
        status.setdefault("failed", []).append({
            "num": target["num"],
            "error": str(e),
            "attempted_at": datetime.now(timezone.utc).isoformat(),
        })
        save_status(status)
        sys.exit(1)


if __name__ == "__main__":
    main()
