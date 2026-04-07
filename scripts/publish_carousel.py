#!/usr/bin/env python3
"""
publish_carousel.py

Publishes the next pending carousel from schedule.json to Instagram via the
Instagram Graph API (Instagram Login flow — `graph.instagram.com`).

This flow posts ONLY to Instagram, not Facebook. The account is a Creator
or Business Instagram account connected through Meta Developer's
"Instagram API with Instagram Login" product.

Environment variables required:
    META_ACCESS_TOKEN     Long-lived Instagram user access token with
                          instagram_business_content_publish scope
    INSTAGRAM_USER_ID     The Instagram user ID as returned by
                          GET https://graph.instagram.com/me
                          (NOT the Facebook-side IG Business Account ID)
    CAROUSELS_BASE_URL    Public base URL where images are hosted,
                          e.g. https://www.marcomunich.com/contenuti-social/immagini-caroselli

Flags:
    --dry-run       Simulate the publish flow without calling the API
    --force-id N    Publish carousel with id N ignoring schedule date
    --list          Show schedule status and exit

Exit codes:
    0   Published successfully OR nothing to publish (normal cron run)
    1   Error during publish (cron will retry tomorrow)
    2   Configuration error (missing env vars etc.)

Instagram Graph API reference:
    https://developers.facebook.com/docs/instagram-api/guides/content-publishing
"""

import argparse
import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

# Force UTF-8 on stdout/stderr for Windows terminal compatibility
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

requests = None  # lazy import — only needed when actually publishing


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

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SCHEDULE_PATH = PROJECT_ROOT / "scripts" / "schedule.json"

# Instagram Login flow uses an unversioned graph.instagram.com base URL.
# This endpoint posts only to Instagram (no Facebook crosspost).
GRAPH_API_BASE = "https://graph.instagram.com"


def load_config(allow_missing=False):
    """Read required env vars and fail fast if any missing (unless allow_missing).

    Accepts both INSTAGRAM_USER_ID (preferred, new name) and the legacy
    INSTAGRAM_BUSINESS_ACCOUNT_ID for backwards compatibility with existing
    GitHub Secrets. The numeric value to use is the one returned by
    `GET https://graph.instagram.com/me` when the Instagram Login flow is
    active.
    """
    ig_user = (
        os.environ.get("INSTAGRAM_USER_ID")
        or os.environ.get("INSTAGRAM_BUSINESS_ACCOUNT_ID")
    )
    config = {
        "access_token": os.environ.get("META_ACCESS_TOKEN"),
        "ig_user_id": ig_user,
        "base_url": os.environ.get(
            "CAROUSELS_BASE_URL",
            "https://www.marcomunich.com/contenuti-social/immagini-caroselli",
        ).rstrip("/"),
    }
    missing = [k for k in ("access_token", "ig_user_id") if not config[k]]
    if missing and not allow_missing:
        readable = {"access_token": "META_ACCESS_TOKEN", "ig_user_id": "INSTAGRAM_USER_ID"}
        print(f"ERROR: missing env vars: {', '.join(readable[k] for k in missing)}",
              file=sys.stderr)
        sys.exit(2)
    # Fill dummy values when missing in permissive mode (used only for dry-run)
    if allow_missing:
        config["access_token"] = config["access_token"] or "DRYRUN_TOKEN"
        config["ig_user_id"] = config["ig_user_id"] or "DRYRUN_IG_USER_ID"
    return config


def load_schedule():
    return json.loads(SCHEDULE_PATH.read_text(encoding="utf-8"))


def save_schedule(schedule):
    SCHEDULE_PATH.write_text(
        json.dumps(schedule, indent=2, ensure_ascii=False), encoding="utf-8"
    )


def find_next_due(schedule, now=None):
    """Return the first pending entry whose date is <= now, or None."""
    if now is None:
        now = datetime.now(timezone.utc)
    for entry in schedule:
        if entry["status"] != "pending":
            continue
        entry_date = datetime.fromisoformat(entry["date"])
        if entry_date <= now:
            return entry
    return None


def slide_urls_for(entry, base_url):
    """Build the list of public slide URLs for this carousel.

    Uses .jpg — Instagram Graph API requires JPEG format (PNG is rejected
    with error code 9004 "Only photo or video can be accepted as media type").
    PNG originals are kept on disk side-by-side for future re-rendering.
    """
    cid = str(entry["id"]).zfill(2)
    return [
        f"{base_url}/carosello-{cid}/slide-{str(i).zfill(2)}.jpg"
        for i in range(1, entry["slide_count"] + 1)
    ]


def create_item_container(ig_user_id, access_token, image_url, alt_text=None, dry_run=False):
    """POST /{ig-user-id}/media with is_carousel_item=true, returns creation_id.

    alt_text is optional — accessibility alternative text for the image slide.
    Instagram Graph API v21+ supports alt_text on image carousel items (max 1000 chars).
    """
    if dry_run:
        alt_preview = f" alt={alt_text[:40]!r}…" if alt_text else ""
        print(f"    [dry-run] would create item for {image_url}{alt_preview}")
        return "dryrun-item"
    url = f"{GRAPH_API_BASE}/{ig_user_id}/media"
    payload = {
        "image_url": image_url,
        "is_carousel_item": "true",
        "access_token": access_token,
    }
    if alt_text:
        # Graph API limit: 1000 characters. Trim defensively.
        payload["alt_text"] = alt_text[:1000]
    r = requests.post(url, data=payload, timeout=60)
    if not r.ok:
        print(f"    Instagram API error {r.status_code}: {r.text}", file=sys.stderr)
    r.raise_for_status()
    return r.json()["id"]


def create_carousel_container(ig_user_id, access_token, children_ids, caption, dry_run=False):
    """POST /{ig-user-id}/media with media_type=CAROUSEL, returns container_id."""
    if dry_run:
        print(f"    [dry-run] would create carousel container with {len(children_ids)} children")
        return "dryrun-carousel"
    url = f"{GRAPH_API_BASE}/{ig_user_id}/media"
    payload = {
        "media_type": "CAROUSEL",
        "children": ",".join(children_ids),
        "caption": caption,
        "access_token": access_token,
    }
    r = requests.post(url, data=payload, timeout=60)
    r.raise_for_status()
    return r.json()["id"]


def publish_container(ig_user_id, access_token, container_id, dry_run=False):
    """POST /{ig-user-id}/media_publish, returns media_id (the live post)."""
    if dry_run:
        print(f"    [dry-run] would publish container {container_id}")
        return "dryrun-media-id"
    url = f"{GRAPH_API_BASE}/{ig_user_id}/media_publish"
    payload = {"creation_id": container_id, "access_token": access_token}
    r = requests.post(url, data=payload, timeout=60)
    r.raise_for_status()
    return r.json()["id"]


def wait_for_container_ready(ig_user_id, access_token, container_id, timeout=120, dry_run=False):
    """Poll container status until FINISHED or ERROR."""
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


def publish_entry(entry, config, dry_run=False):
    """Execute the full publish flow for a single schedule entry."""
    cid = entry["id"]
    print(f"> Publishing Carosello {cid}: {entry['title']}")
    print(f"  Date: {entry['date']}")
    print(f"  Slides: {entry['slide_count']}")

    urls = slide_urls_for(entry, config["base_url"])
    alt_texts = entry.get("alt_texts") or []
    print(f"  Base URL: {config['base_url']}")
    if alt_texts:
        print(f"  Alt texts: {len(alt_texts)} provided")
    else:
        print("  Alt texts: none in schedule — slides will publish without accessibility text")

    # Pre-check: verify all slide URLs are accessible before touching Instagram API
    print("  Pre-check: verifying slide URLs are accessible…")
    for attempt in range(1, 6):
        failed = []
        for url in urls:
            try:
                r = requests.head(url, timeout=10, allow_redirects=True)
                if r.status_code != 200 or int(r.headers.get("content-length", 1)) < 10000:
                    failed.append(url)
            except Exception:
                failed.append(url)
        if not failed:
            print(f"  ✓ All {len(urls)} URLs accessible")
            break
        print(f"  Attempt {attempt}/5: {len(failed)} URL(s) not ready, waiting 60s…")
        if attempt == 5:
            raise RuntimeError(
                f"Images not accessible after 5 attempts. CF Pages may still be deploying.\n"
                f"Failed URLs: {failed}"
            )
        time.sleep(60)

    # Step 1: create carousel item containers for each slide
    print("  Step 1/3: creating item containers…")
    child_ids = []
    for i, url in enumerate(urls, 1):
        alt = alt_texts[i - 1] if i - 1 < len(alt_texts) else None
        print(f"    [{i}/{len(urls)}] {url}")
        if alt:
            print(f"        alt: {alt[:70]}{'…' if len(alt) > 70 else ''}")
        child_id = create_item_container(
            config["ig_user_id"],
            config["access_token"],
            url,
            alt_text=alt,
            dry_run=dry_run,
        )
        child_ids.append(child_id)

    # Step 2: create carousel parent container
    print("  Step 2/3: creating carousel parent…")
    container_id = create_carousel_container(
        config["ig_user_id"],
        config["access_token"],
        child_ids,
        entry["caption"],
        dry_run=dry_run,
    )
    print(f"    container_id: {container_id}")

    # Wait for carousel processing before publishing
    print("  Waiting for container to be ready…")
    wait_for_container_ready(
        config["ig_user_id"], config["access_token"], container_id, dry_run=dry_run
    )

    # Step 3: publish
    print("  Step 3/3: publishing…")
    media_id = publish_container(
        config["ig_user_id"], config["access_token"], container_id, dry_run=dry_run
    )
    print(f"  ✓ Published! media_id: {media_id}")
    return media_id


def cmd_list(schedule):
    pending = sum(1 for e in schedule if e["status"] == "pending")
    published = sum(1 for e in schedule if e["status"] == "published")
    failed = sum(1 for e in schedule if e["status"] == "failed")
    print(f"Total: {len(schedule)} | Pending: {pending} | Published: {published} | Failed: {failed}\n")
    now = datetime.now(timezone.utc)
    for e in schedule:
        marker = {"pending": "·", "published": "✓", "failed": "✗"}.get(e["status"], "?")
        due = datetime.fromisoformat(e["date"]) <= now and e["status"] == "pending"
        flag = " ← DUE" if due else ""
        print(f"  {marker} [{str(e['id']).zfill(2)}] {e['date'][:10]} — {e['title'][:60]}{flag}")


def main():
    parser = argparse.ArgumentParser(description="Publish next pending carousel to Instagram")
    parser.add_argument("--dry-run", action="store_true", help="Simulate without calling API")
    parser.add_argument("--force-id", type=int, help="Publish specific carousel id ignoring date")
    parser.add_argument("--list", action="store_true", help="Show schedule status")
    args = parser.parse_args()

    schedule = load_schedule()

    if args.list:
        cmd_list(schedule)
        return 0

    if not args.dry_run:
        _require_requests()
    config = load_config(allow_missing=args.dry_run)

    # Determine which entry to publish
    if args.force_id is not None:
        entry = next((e for e in schedule if e["id"] == args.force_id), None)
        if not entry:
            print(f"ERROR: carousel id {args.force_id} not found", file=sys.stderr)
            return 1
        if entry["status"] == "published":
            print(f"ERROR: carousel {args.force_id} already published on {entry['published_at']}",
                  file=sys.stderr)
            return 1
    else:
        entry = find_next_due(schedule)
        if not entry:
            print("No pending carousel due right now. Nothing to do.")
            return 0

    try:
        media_id = publish_entry(entry, config, dry_run=args.dry_run)
        if not args.dry_run:
            entry["status"] = "published"
            entry["published_at"] = datetime.now(timezone.utc).isoformat()
            entry["media_id"] = media_id
            entry["error"] = None
            save_schedule(schedule)
            print(f"\n> Schedule updated. Carosello {entry['id']} marked as published.")
        return 0
    except Exception as e:
        print(f"\nERROR publishing carosello {entry['id']}: {e}", file=sys.stderr)
        if not args.dry_run:
            entry["status"] = "failed"
            entry["error"] = str(e)
            save_schedule(schedule)
        return 1


if __name__ == "__main__":
    sys.exit(main())
