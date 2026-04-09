#!/usr/bin/env python3
"""
make_opinion_reels.py

Genera reel "opinion template": video Marco (loopato) + testo overlay grande + no audio.

Input config:  public/contenuti-social/video-reels/opinions.json
Input clips:   public/contenuti-social/video-reels/IMG_XXXX.MOV
Output reels:  public/contenuti-social/video-reels/reel-NN.mp4

Usage:
    python scripts/make_opinion_reels.py               # processa tutti
    python scripts/make_opinion_reels.py --reel 61     # solo reel 61
    python scripts/make_opinion_reels.py --preview 61  # preview con ffplay (no salva)
"""

import argparse
import json
import os
import subprocess
import sys
import textwrap
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
REELS_DIR    = PROJECT_ROOT / "public" / "contenuti-social" / "video-reels"
OPINIONS_CFG = REELS_DIR / "opinions.json"

TARGET_W     = 1080
TARGET_H     = 1920
DURATION     = 18        # secondi output
FONT_SIZE    = 72        # testo principale
MAX_CHARS    = 22        # caratteri per riga prima di andare a capo

# Colori overlay (FFMPEG BGRA hex)
OVERLAY_BG   = "black@0.55"   # rettangolo semitrasparente dietro il testo
TEXT_COLOR   = "white"
SHADOW_COLOR = "black@0.8"


def wrap_text(text: str, max_chars: int = MAX_CHARS) -> str:
    """Spezza il testo in righe brevi per l'overlay."""
    words = text.split()
    lines = []
    current = []
    length = 0
    for word in words:
        if length + len(word) + (1 if current else 0) > max_chars and current:
            lines.append(" ".join(current))
            current = [word]
            length = len(word)
        else:
            current.append(word)
            length += len(word) + (1 if len(current) > 1 else 0)
    if current:
        lines.append(" ".join(current))
    return r"\n".join(lines)


def build_ffmpeg_cmd(clip_path: Path, output_path: Path, text: str, preview: bool = False) -> list:
    wrapped = wrap_text(text)
    n_lines = wrapped.count(r"\n") + 1
    line_h   = FONT_SIZE + 16
    box_h    = n_lines * line_h + 80
    box_y    = (TARGET_H - box_h) // 2

    # Trova un font disponibile su Windows/Linux
    font_candidates = [
        r"C\:/Windows/Fonts/arialbd.ttf",    # Windows Arial Bold
        r"C\:/Windows/Fonts/arial.ttf",       # Windows Arial
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    ]
    font_path = None
    for f in font_candidates:
        real = f.replace(r"C\:", "C:").replace("\\", "/")
        if Path(real).exists():
            font_path = f
            break
    if not font_path:
        print("WARNING: nessun font trovato, uso font default FFmpeg", file=sys.stderr)
        font_path = ""

    # Filter graph:
    # 1. scala clip a 1080x1920 (pad se necessario)
    # 2. loop fino a DURATION secondi
    # 3. rettangolo scuro dietro il testo
    # 4. drawtext centrato
    font_arg = f":fontfile={font_path}" if font_path else ""

    vf = (
        f"scale={TARGET_W}:{TARGET_H}:force_original_aspect_ratio=decrease,"
        f"pad={TARGET_W}:{TARGET_H}:(ow-iw)/2:(oh-ih)/2:black,"
        f"loop=loop=-1:size=999:start=0,trim=duration={DURATION},setpts=PTS-STARTPTS,"
        f"drawbox=x=0:y={box_y}:w={TARGET_W}:h={box_h}:color={OVERLAY_BG}:t=fill,"
        f"drawtext=text='{wrapped}'"
        f":x=(w-text_w)/2:y=(h-text_h)/2"
        f":fontsize={FONT_SIZE}"
        f"{font_arg}"
        f":fontcolor={TEXT_COLOR}"
        f":shadowcolor={SHADOW_COLOR}:shadowx=3:shadowy=3"
        f":line_spacing=8"
    )

    if preview:
        return [
            "ffplay", "-hide_banner",
            "-vf", vf,
            "-an",
            "-loop", "0",
            str(clip_path),
        ]

    return [
        "ffmpeg", "-hide_banner", "-y",
        "-i", str(clip_path),
        "-vf", vf,
        "-an",                              # rimuovi audio originale
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        "-pix_fmt", "yuv420p",
        "-t", str(DURATION),
        "-movflags", "+faststart",
        str(output_path),
    ]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--reel",    type=int, help="Processa solo questo numero reel")
    parser.add_argument("--preview", type=int, help="Anteprima ffplay per questo numero reel")
    args = parser.parse_args()

    if not OPINIONS_CFG.exists():
        print(f"ERROR: {OPINIONS_CFG} non trovato", file=sys.stderr)
        sys.exit(1)

    opinions = json.loads(OPINIONS_CFG.read_text(encoding="utf-8"))

    target_num = args.reel or args.preview
    if target_num:
        opinions = [o for o in opinions if o["reel_num"] == target_num]
        if not opinions:
            print(f"ERROR: reel {target_num} non trovato in opinions.json", file=sys.stderr)
            sys.exit(1)

    for op in opinions:
        num       = op["reel_num"]
        clip_path = REELS_DIR / op["clip"]
        out_path  = REELS_DIR / f"reel-{num:02d}.mp4"
        text      = op["text"].strip()

        if not clip_path.exists():
            print(f"  SKIP reel-{num:02d}: clip non trovato ({clip_path.name})")
            continue

        if "INSERIRE" in text:
            print(f"  SKIP reel-{num:02d}: testo non ancora inserito in opinions.json")
            continue

        print(f"\nReel {num:02d} — {text[:60]}...")

        preview = bool(args.preview)
        cmd = build_ffmpeg_cmd(clip_path, out_path, text, preview=preview)

        print(f"  CMD: {' '.join(cmd[:4])} ...")
        result = subprocess.run(cmd)
        if result.returncode != 0 and not preview:
            print(f"  ERRORE FFmpeg per reel-{num:02d}", file=sys.stderr)
        elif not preview:
            print(f"  ✓ Salvato: {out_path.name}")


if __name__ == "__main__":
    main()
