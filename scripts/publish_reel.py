#!/usr/bin/env python3
"""
publish_reel.py

Pubblica il prossimo Reel su Instagram via Graph API.
Video: public/contenuti-social/video-reels/reel-NN.mp4
Caption: public/contenuti-social/video-reels/caption-reel-NN.txt

Env vars:
    META_ACCESS_TOKEN     Long-lived Instagram user access token
    INSTAGRAM_USER_ID     ID numerico account Instagram Business/Creator
    REELS_BASE_URL        URL base CDN (default: Cloudflare Pages)

Flags:
    --dry-run       Simula senza chiamare l'API
    --force-id N    Pubblica reel N ignorando lo stato
    --list          Mostra lista e stato, poi esce
"""

import argparse
import json
import os
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

PROJECT_ROOT = Path(__file__).resolve().parent.parent
REELS_DIR    = PROJECT_ROOT / "public" / "contenuti-social" / "video-reels"
STATUS_FILE  = PROJECT_ROOT / ".claude" / "reels-status.json"
IG_API       = "https://graph.instagram.com/v22.0"
DEFAULT_BASE = "https://marcomunich.com/contenuti-social/video-reels"
TOTAL_REELS  = 60


def get_caption(num: int) -> str:
    path = REELS_DIR / f"caption-reel-{num:02d}.txt"
    return path.read_text(encoding="utf-8").strip() if path.exists() else ""


def load_status() -> dict:
    if STATUS_FILE.exists():
        return json.loads(STATUS_FILE.read_text(encoding="utf-8"))
    return {"published": [], "failed": []}


def save_status(status: dict):
    STATUS_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATUS_FILE.write_text(json.dumps(status, indent=2, ensure_ascii=False))


def api_post(endpoint: str, data: dict) -> dict:
    url     = f"{IG_API}{endpoint}"
    payload = urllib.parse.urlencode(data).encode()
    req     = urllib.request.Request(url, data=payload, method="POST")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read())


def check_url(url: str, retries: int = 5, delay: int = 10) -> bool:
    for attempt in range(1, retries + 1):
        try:
            req = urllib.request.Request(url, method="HEAD")
            with urllib.request.urlopen(req, timeout=30) as r:
                if r.status < 400:
                    return True
        except Exception as e:
            print(f"  URL check {attempt}/{retries}: {e}")
        if attempt < retries:
            time.sleep(delay)
    return False


def wait_for_container(token: str, container_id: str, max_wait: int = 150) -> bool:
    """Attende status_code=FINISHED sul container video (polling ogni 10s)."""
    url = f"{IG_API}/{container_id}?fields=status_code&access_token={token}"
    waited = 0
    while waited < max_wait:
        time.sleep(10)
        waited += 10
        with urllib.request.urlopen(url, timeout=30) as r:
            data = json.loads(r.read())
        status = data.get("status_code", "")
        print(f"  Container status: {status} ({waited}s)")
        if status == "FINISHED":
            return True
        if status == "ERROR":
            raise RuntimeError(f"Container processing failed: {data}")
    return False


def publish_reel(token: str, user_id: str, video_url: str, caption: str, dry_run: bool) -> str:
    print(f"  Video URL: {video_url}")
    if dry_run:
        print("  [DRY-RUN] Step 1: crea container — skip")
        print("  [DRY-RUN] Step 2: attendi elaborazione — skip")
        print("  [DRY-RUN] Step 3: pubblica — skip")
        return "DRY_RUN_OK"

    # Step 1: crea container Reel
    print("  Step 1: creazione container Reel...")
    resp1 = api_post(f"/{user_id}/media", {
        "media_type":    "REELS",
        "video_url":     video_url,
        "caption":       caption,
        "share_to_feed": "true",
        "access_token":  token,
    })
    container_id = resp1.get("id")
    if not container_id:
        raise RuntimeError(f"No container id: {resp1}")
    print(f"  Container: {container_id}")

    # Step 2: attendi elaborazione video
    print("  Step 2: attesa elaborazione video...")
    if not wait_for_container(token, container_id):
        raise RuntimeError("Timeout: container non FINISHED entro 150s")

    # Step 3: pubblica
    print("  Step 3: pubblicazione...")
    resp3 = api_post(f"/{user_id}/media_publish", {
        "creation_id":  container_id,
        "access_token": token,
    })
    media_id = resp3.get("id")
    if not media_id:
        raise RuntimeError(f"No media id: {resp3}")
    return media_id


def load_env():
    for env_f in [PROJECT_ROOT / ".env.instagram", PROJECT_ROOT / ".env"]:
        if env_f.exists():
            for line in env_f.read_text().splitlines():
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip())


def main():
    load_env()
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run",  action="store_true")
    parser.add_argument("--force-id", type=int, metavar="N")
    parser.add_argument("--list",     action="store_true")
    args = parser.parse_args()

    token    = os.environ.get("META_ACCESS_TOKEN", "")
    user_id  = os.environ.get("INSTAGRAM_USER_ID", "")
    base_url = os.environ.get("REELS_BASE_URL", DEFAULT_BASE).rstrip("/")

    if not args.dry_run and (not token or not user_id):
        print("ERROR: META_ACCESS_TOKEN e INSTAGRAM_USER_ID richiesti", file=sys.stderr)
        sys.exit(2)

    status    = load_status()
    published = {r["num"] for r in status.get("published", [])}

    if args.list:
        pending = TOTAL_REELS - len(published)
        print(f"Reels: {TOTAL_REELS} totali | {len(published)} pubblicati | {pending} in coda\n")
        for n in range(1, TOTAL_REELS + 1):
            icon    = "✓" if n in published else "·"
            preview = get_caption(n)[:55]
            print(f"  {icon} [{n:02d}] {preview}...")
        return

    # Scegli il reel da pubblicare
    if args.force_id:
        target_num = args.force_id
    else:
        pending_nums = [n for n in range(1, TOTAL_REELS + 1) if n not in published]
        if not pending_nums:
            print("Tutti i 60 reels sono già stati pubblicati.")
            sys.exit(0)
        target_num = pending_nums[0]

    caption   = get_caption(target_num)
    video_url = f"{base_url}/reel-{target_num:02d}.mp4"

    if not caption:
        print(f"ERROR: caption mancante per reel {target_num:02d}", file=sys.stderr)
        sys.exit(1)

    print(f"\nReel {target_num:02d} — {caption[:60]}...")
    print(f"Caption: {len(caption)} caratteri")

    if not args.dry_run:
        print("\nVerifica URL video...")
        if not check_url(video_url):
            print(f"ERROR: video non raggiungibile: {video_url}")
            sys.exit(1)
        print("  OK")

    try:
        media_id = publish_reel(token, user_id, video_url, caption, args.dry_run)
        print(f"\n✓ Reel {target_num:02d} pubblicato! Media ID: {media_id}")
        if not args.dry_run:
            status.setdefault("published", []).append({
                "num":          target_num,
                "media_id":     media_id,
                "published_at": datetime.now(timezone.utc).isoformat(),
            })
            save_status(status)
    except Exception as e:
        print(f"\n✗ Errore: {e}")
        status.setdefault("failed", []).append({
            "num":          target_num,
            "error":        str(e),
            "attempted_at": datetime.now(timezone.utc).isoformat(),
        })
        save_status(status)
        sys.exit(1)


if __name__ == "__main__":
    main()
