#!/usr/bin/env python3
"""
publish_daily.py

Pubblica ogni giorno: 1 carosello + 1 post singolo + 1 reel su Instagram.
Eseguito automaticamente dal workflow GitHub Actions.

Ordine:
  1. publish_carousel.py     — carosello del giorno da schedule.json
  2. publish_post_singolo.py — prossimo post singolo pending
  3. publish_reel.py         — prossimo reel pending

Flags:
  --dry-run    Passa --dry-run a tutti gli script
  --list       Mostra stato di tutte e tre le code
"""

import argparse
import subprocess
import sys
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parent


def run(script: str, extra_args: list) -> int:
    cmd = [sys.executable, str(SCRIPTS / script)] + extra_args
    result = subprocess.run(cmd)
    return result.returncode


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--list", action="store_true")
    args = parser.parse_args()

    extra = []
    if args.dry_run:
        extra.append("--dry-run")
    if args.list:
        extra.append("--list")
    if not args.dry_run and not args.list:
        extra.append("--confirm")  # safety gate richiede --confirm; publish_daily è la conferma

    print("=" * 60)
    print("CAROSELLO")
    print("=" * 60)
    rc1 = run("publish_carousel.py", extra)

    print()
    print("=" * 60)
    print("POST SINGOLO")
    print("=" * 60)
    rc2 = run("publish_post_singolo.py", extra)

    print()
    print("=" * 60)
    print("REEL")
    print("=" * 60)
    rc3 = run("publish_reel.py", extra)

    if rc1 != 0 or rc2 != 0 or rc3 != 0:
        print(f"\nERRORI: carousel={rc1}, post_singolo={rc2}, reel={rc3}")
        sys.exit(1)

    print("\nPubblicazione giornaliera completata (carosello + post + reel).")


if __name__ == "__main__":
    main()
