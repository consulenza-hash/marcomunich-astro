#!/usr/bin/env python3
"""
archive_all_reels.py — Archive all Instagram reels via instagrapi (private API).

Setup:
  1. Crea file `.env.instagrapi` nella root del progetto con:
       IG_USERNAME=marcomunich.dev
       IG_PASSWORD=tua_password
  2. Run: python3 scripts/archive_all_reels.py --dry-run   (lista senza archiviare)
  3. Run: python3 scripts/archive_all_reels.py --confirm   (archivia davvero)

Rate limiting: 8 secondi tra ogni archive — ~22 minuti per 159 reel.
Resume: stato in `.claude/archive-reels-status.json`. Riavvio = continua dove era.

Sicurezza:
  - Sessione instagrapi persistita in `.ig_session.json` (gitignored)
  - Mai loggare la password
  - Se IG manda challenge/2FA: pausa e chiede codice da terminale
"""
import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

import argparse
import json
import os
import re
import time
from pathlib import Path
from datetime import datetime, timezone

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ENV_FILE     = PROJECT_ROOT / ".env.instagrapi"
SESSION_FILE = PROJECT_ROOT / ".ig_session.json"
STATUS_FILE  = PROJECT_ROOT / ".claude" / "archive-reels-status.json"
DELAY_SEC    = 8


def load_env():
    if not ENV_FILE.exists():
        print(f"ERRORE: manca {ENV_FILE}")
        print("Crea il file con:")
        print("  IG_USERNAME=marcomunich.dev")
        print("  IG_PASSWORD=tua_password")
        sys.exit(1)
    for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())


def load_status():
    if STATUS_FILE.exists():
        return json.loads(STATUS_FILE.read_text(encoding="utf-8"))
    return {"archived": [], "failed": []}


def save_status(status):
    STATUS_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATUS_FILE.write_text(json.dumps(status, indent=2, ensure_ascii=False), encoding="utf-8")


def login_client(verification_code: str = ""):
    from instagrapi import Client
    from instagrapi.exceptions import TwoFactorRequired
    cl = Client()
    cl.delay_range = [1, 3]

    user = os.environ["IG_USERNAME"]
    pwd  = os.environ["IG_PASSWORD"]

    if SESSION_FILE.exists():
        try:
            cl.load_settings(SESSION_FILE)
            cl.login(user, pwd)
            cl.get_timeline_feed()
            print("  Sessione esistente OK")
            return cl
        except Exception as e:
            print(f"  Sessione vecchia non valida ({e}), nuovo login...")

    try:
        if verification_code:
            cl.login(user, pwd, verification_code=verification_code)
        else:
            cl.login(user, pwd)
    except TwoFactorRequired:
        print("\n2FA richiesto — Instagram ha mandato (o generato in app) un codice a 6 cifre.")
        print("Rilancia lo script aggiungendo --code XXXXXX")
        sys.exit(2)

    cl.dump_settings(SESSION_FILE)
    print("  Login OK, sessione salvata")
    return cl


def fetch_all_reels(cl, ig_user_id):
    """Tutti i reel pubblicati (clips_metadata o media_type=2 + product_type=clips)."""
    print("  Fetch lista reel...")
    # user_clips returns all clips/reels published by user
    reels = cl.user_clips(ig_user_id)
    return reels


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--dry-run", action="store_true", help="solo lista, no archive")
    p.add_argument("--confirm", action="store_true", help="richiesto per archiviare davvero")
    p.add_argument("--limit",   type=int, default=0, help="archivia max N reel (0 = tutti)")
    p.add_argument("--code",    type=str, default="", help="codice 2FA a 6 cifre")
    args = p.parse_args()

    load_env()
    print("=== Archive All Reels ===\n")
    print("Login...")
    cl = login_client(verification_code=args.code)

    me = cl.account_info()
    ig_user_id = me.pk
    print(f"  Loggato come @{me.username} (ID: {ig_user_id})")

    reels = fetch_all_reels(cl, ig_user_id)
    print(f"  Trovati {len(reels)} reel\n")

    status = load_status()
    already = {str(r["pk"]) for r in status.get("archived", [])}

    todo = [r for r in reels if str(r.pk) not in already]
    print(f"Già archiviati in run precedenti: {len(already)}")
    print(f"Da archiviare ora: {len(todo)}\n")

    if args.limit > 0:
        todo = todo[:args.limit]
        print(f"Limit attivo: solo primi {args.limit}\n")

    if not args.confirm and not args.dry_run:
        print("DRY-RUN forzato (manca --confirm). Aggiungi --confirm per archiviare.\n")
        args.dry_run = True

    if args.dry_run:
        print("=== DRY-RUN — primi 10 reel che verrebbero archiviati ===")
        for r in todo[:10]:
            cap = (r.caption_text or "")[:60].replace("\n", " ")
            print(f"  [{r.pk}] {r.taken_at.strftime('%Y-%m-%d')} | {cap}")
        if len(todo) > 10:
            print(f"  ... + altri {len(todo)-10} reel")
        print(f"\nTotale che verrebbero archiviati: {len(todo)}")
        return

    print(f"=== ARCHIVE REALE — {len(todo)} reel, ~{len(todo)*DELAY_SEC//60} min ===\n")

    for i, r in enumerate(todo, 1):
        try:
            cl.media_archive(str(r.pk))
            status.setdefault("archived", []).append({
                "pk":       str(r.pk),
                "code":     r.code,
                "taken_at": r.taken_at.isoformat(),
                "archived_at": datetime.now(timezone.utc).isoformat(),
            })
            save_status(status)
            cap = (r.caption_text or "")[:50].replace("\n", " ")
            print(f"  [{i}/{len(todo)}] OK {r.pk} | {cap}")
        except Exception as e:
            status.setdefault("failed", []).append({
                "pk":          str(r.pk),
                "error":       str(e),
                "attempted_at": datetime.now(timezone.utc).isoformat(),
            })
            save_status(status)
            print(f"  [{i}/{len(todo)}] FAIL {r.pk} | {e}")

        if i < len(todo):
            time.sleep(DELAY_SEC)

    print(f"\nFINITO — archiviati: {len(status.get('archived', []))} | falliti: {len(status.get('failed', []))}")


if __name__ == "__main__":
    main()
