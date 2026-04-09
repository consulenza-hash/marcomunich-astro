#!/usr/bin/env python3
"""
publish_story.py

Publishes Instagram Stories via the Instagram Graph API.

Two story types:
  --article {slug}     Publish article promo story with link sticker to the article
  --product            Publish daily product rotation story (rotates through 6 services)
  --product-id N       Publish specific product story (0-5)

Environment variables required:
    META_ACCESS_TOKEN    Long-lived Instagram user access token
    INSTAGRAM_USER_ID    Instagram user ID (from GET graph.instagram.com/me)
    STORIES_BASE_URL     Public base URL for story images
                         Default: https://marcomunich-com.pages.dev/contenuti-social/immagini-storie

Flags:
    --dry-run            Simulate without calling the API

Exit codes:
    0   Published successfully or nothing to publish
    1   Publish error
    2   Configuration error

Instagram API reference:
    https://developers.facebook.com/docs/instagram-api/guides/content-publishing#stories
"""

import argparse
import os
import sys
import time
from datetime import date, datetime, timezone
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

requests = None

GRAPH_API_BASE = "https://graph.instagram.com"
SITE_URL = "https://marcomunich.com"

# 6 products/services in rotation — day_of_year % 6 → index
PRODUCTS = [
    {
        "id": 0,
        "name": "Personal Branding Olistico",
        "url": f"{SITE_URL}/servizi/",
        "image": "storia-prodotto-00.png",
    },
    {
        "id": 1,
        "name": "Sviluppo Siti Web",
        "url": f"{SITE_URL}/sviluppo-siti-web/",
        "image": "storia-prodotto-01.png",
    },
    {
        "id": 2,
        "name": "Metterci la Faccia Online",
        "url": f"{SITE_URL}/metterci-la-faccia-online/",
        "image": "storia-prodotto-02.png",
    },
    {
        "id": 3,
        "name": "Creazione del Messaggio Autentico",
        "url": f"{SITE_URL}/creazione-messaggio-autentico/",
        "image": "storia-prodotto-03.png",
    },
    {
        "id": 4,
        "name": "Creazione Video Autentici",
        "url": f"{SITE_URL}/creazione-video-autentici/",
        "image": "storia-prodotto-04.png",
    },
    {
        "id": 5,
        "name": "Lavorare Senza Sito Web",
        "url": f"{SITE_URL}/lavorare-senzasito/",
        "image": "storia-prodotto-05.png",
    },
]


def _require_requests():
    global requests
    if requests is None:
        try:
            import requests as _req
            requests = _req
        except ImportError:
            print("ERROR: 'requests' package not installed. Run: pip install requests",
                  file=sys.stderr)
            sys.exit(2)


def load_config(allow_missing=False):
    ig_user = (
        os.environ.get("INSTAGRAM_USER_ID")
        or os.environ.get("INSTAGRAM_BUSINESS_ACCOUNT_ID")
    )
    config = {
        "access_token": os.environ.get("META_ACCESS_TOKEN"),
        "ig_user_id": ig_user,
        "base_url": os.environ.get(
            "STORIES_BASE_URL",
            "https://marcomunich-com.pages.dev/contenuti-social/immagini-storie",
        ).rstrip("/"),
    }
    missing = [k for k in ("access_token", "ig_user_id") if not config[k]]
    if missing and not allow_missing:
        readable = {"access_token": "META_ACCESS_TOKEN", "ig_user_id": "INSTAGRAM_USER_ID"}
        print(f"ERROR: missing env vars: {', '.join(readable[k] for k in missing)}",
              file=sys.stderr)
        sys.exit(2)
    if allow_missing:
        config["access_token"] = config["access_token"] or "DRYRUN_TOKEN"
        config["ig_user_id"] = config["ig_user_id"] or "DRYRUN_IG_USER_ID"
    return config


def verify_image_url(url, retries=5, wait=60):
    """Verify the image URL is accessible before calling Instagram API."""
    for attempt in range(1, retries + 1):
        try:
            r = requests.get(url, timeout=20, stream=True)
            chunk = b""
            for data in r.iter_content(chunk_size=4096):
                chunk += data
                if len(chunk) >= 10000:
                    break
            r.close()
            if r.status_code == 200 and len(chunk) >= 10000:
                return True
        except Exception:
            pass
        if attempt < retries:
            print(f"  Image not accessible (attempt {attempt}/{retries}), waiting {wait}s...")
            time.sleep(wait)
    return False


def create_story_container(ig_user_id, access_token, image_url, dry_run=False):
    """POST /{ig-user-id}/media with media_type=STORIES.
    NOTE: link stickers are NOT supported via Content Publishing API for standard accounts.
    Links must be added manually after publishing.
    """
    if dry_run:
        print(f"    [dry-run] would create story container: {image_url}")
        return "dryrun-container"

    url = f"{GRAPH_API_BASE}/{ig_user_id}/media"
    payload = {
        "media_type": "STORIES",
        "image_url": image_url,
        "access_token": access_token,
    }

    r = requests.post(url, data=payload, timeout=60)
    if not r.ok:
        print(f"  Instagram API error {r.status_code}: {r.text}", file=sys.stderr)
    r.raise_for_status()
    return r.json()["id"]


def wait_for_container(ig_user_id, access_token, container_id, timeout=90, dry_run=False):
    if dry_run:
        return "FINISHED"
    url = f"{GRAPH_API_BASE}/{container_id}"
    start = time.time()
    while time.time() - start < timeout:
        r = requests.get(url, params={
            "fields": "status_code,status",
            "access_token": access_token,
        }, timeout=30)
        r.raise_for_status()
        data = r.json()
        code = data.get("status_code", "IN_PROGRESS")
        if code == "FINISHED":
            return "FINISHED"
        if code in ("ERROR", "EXPIRED"):
            raise RuntimeError(f"Container {container_id} failed: {data}")
        time.sleep(5)
    raise TimeoutError(f"Container {container_id} not ready after {timeout}s")


def publish_container(ig_user_id, access_token, container_id, dry_run=False):
    if dry_run:
        print(f"    [dry-run] would publish container {container_id}")
        return "dryrun-media-id"
    url = f"{GRAPH_API_BASE}/{ig_user_id}/media_publish"
    payload = {"creation_id": container_id, "access_token": access_token}
    r = requests.post(url, data=payload, timeout=60)
    r.raise_for_status()
    return r.json()["id"]


def publish_story(image_url, label, config, dry_run=False):
    """Full publish flow: verify → create → wait → publish."""
    print(f"> Publishing story: {label}")
    print(f"  Image: {image_url}")

    if not dry_run:
        print("  Verifying image URL...")
        if not verify_image_url(image_url):
            raise RuntimeError(f"Image not accessible after retries: {image_url}")
        print("  ✓ Image accessible")

    container_id = create_story_container(
        config["ig_user_id"], config["access_token"],
        image_url, dry_run=dry_run
    )
    print(f"  container_id: {container_id}")

    if not dry_run:
        print("  Waiting for container...")
        wait_for_container(config["ig_user_id"], config["access_token"], container_id)

    media_id = publish_container(
        config["ig_user_id"], config["access_token"], container_id, dry_run=dry_run
    )
    print(f"  ✓ Published! media_id: {media_id}")
    return media_id


def main():
    parser = argparse.ArgumentParser(description="Publish Instagram Stories")
    parser.add_argument("--article", metavar="SLUG",
                        help="Publish article promo story for the given article slug")
    parser.add_argument("--product", action="store_true",
                        help="Publish daily product rotation story")
    parser.add_argument("--product-id", type=int, metavar="N",
                        help="Publish specific product story (0-5)")
    parser.add_argument("--dry-run", action="store_true",
                        help="Simulate without calling API")
    args = parser.parse_args()

    if not any([args.article, args.product, args.product_id is not None]):
        parser.print_help()
        return 2

    if not args.dry_run:
        _require_requests()

    config = load_config(allow_missing=args.dry_run)

    if args.article:
        slug = args.article.strip("/")
        image_url = f"{config['base_url']}/storia-{slug}.png"
        label = f"Articolo: {slug}"
        publish_story(image_url, label, config, dry_run=args.dry_run)

    elif args.product or args.product_id is not None:
        if args.product_id is not None:
            idx = args.product_id % len(PRODUCTS)
        else:
            # Rotate by day of year
            idx = date.today().timetuple().tm_yday % len(PRODUCTS)

        product = PRODUCTS[idx]
        image_url = f"{config['base_url']}/{product['image']}"
        label = f"Prodotto [{idx}]: {product['name']}"
        publish_story(image_url, label, config, dry_run=args.dry_run)

    return 0


if __name__ == "__main__":
    sys.exit(main())
