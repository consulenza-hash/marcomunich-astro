#!/usr/bin/env python3
"""
generate-reels-pexels.py

Genera 60 reel MP4 (1080x1920, ~15s) con clip Pexels gratuiti + overlay grafico.
Pipeline: Pexels API → scarica clip → overlay Playwright → FFmpeg compose → MP4

Uso:
  python generate-reels-pexels.py           # tutti i 60
  python generate-reels-pexels.py 2 10      # reel 2-10
  python generate-reels-pexels.py --reel 4  # singolo
  python generate-reels-pexels.py --force   # rigenera anche se esiste

Output: public/contenuti-social/video-reels/reel-NN.mp4
Costo: 0€
"""

import argparse, json, os, re, subprocess, sys, time, urllib.request, urllib.parse
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

PROJECT_ROOT = Path(__file__).resolve().parent.parent
REELS_MD  = PROJECT_ROOT / "public" / "contenuti-social" / "reels" / "archivio-reels.md"
OUT_DIR   = PROJECT_ROOT / "public" / "contenuti-social" / "video-reels"
ENV_FILE  = PROJECT_ROOT / ".env.pexels"
PEXELS_API = "https://api.pexels.com/videos/search"
PALETTE = ["#e85d00","#3b82f6","#22c55e","#fbbf24","#06b6d4","#a855f7"]

# ── Query Pexels per ogni reel (contestualizzate al tema) ─────────────────────

PEXELS_QUERIES = {
    1:  "caucasian woman frustrated laptop website",
    2:  "caucasian man waiting hesitating desk notebook",
    3:  "caucasian woman checking phone social media",
    4:  "caucasian man writing numbers notebook coffee",
    5:  "caucasian woman typing laptop technology",
    6:  "caucasian man writing journal contemplative",
    7:  "caucasian woman phone message delete hesitating",
    8:  "caucasian man uncomfortable laptop desk",
    9:  "caucasian woman writing paper desk morning",
    10: "caucasian man sticky notes planning wall",
    11: "caucasian woman scrolling phone concerned",
    12: "caucasian man laptop mindful calm desk",
    13: "caucasian woman overwhelmed calendar desk",
    14: "caucasian man writing focused desk window",
    15: "caucasian woman typing laptop focused",
    16: "caucasian man deleting rewriting laptop",
    17: "caucasian woman analytics screen thinking",
    18: "caucasian man writing letter handwriting desk",
    19: "caucasian woman bookshelf reading desk",
    20: "caucasian man laptop calm publishing",
    21: "caucasian woman blank screen writing blocked",
    22: "caucasian man scrolling phone frustrated",
    23: "caucasian woman two screens writing",
    24: "caucasian man notes desk reflection",
    25: "caucasian woman confident typing laptop",
    26: "caucasian man laptop editing writing",
    27: "caucasian woman reviewing text screen",
    28: "caucasian man phone video recording casual",
    29: "caucasian woman camera recording home",
    30: "caucasian man reading laptop desk",
    31: "caucasian woman coffee shop laptop notebook",
    32: "caucasian man whiteboard planning",
    33: "caucasian woman reading phone smiling",
    34: "caucasian man coffee desk morning quiet",
    35: "caucasian woman video call laptop professional",
    36: "caucasian man walking forest thinking",
    37: "caucasian woman simplifying document laptop",
    38: "caucasian man laptop excited screen",
    39: "caucasian woman sticky notes window light",
    40: "caucasian man focused writing desk",
    41: "caucasian woman laptop nervous publish",
    42: "caucasian man website laptop simplifying",
    43: "caucasian woman phone reading smiling",
    44: "caucasian man phone walking apartment",
    45: "caucasian woman laptop analysis screen",
    46: "caucasian man writing bold opinion laptop",
    47: "caucasian woman portfolio presentation laptop",
    48: "caucasian man window city view thinking",
    49: "caucasian woman laptop marking notes",
    50: "caucasian man focused document writing",
    51: "caucasian woman notepad writing morning",
    52: "caucasian man coffee mug talking relaxed",
    53: "caucasian woman website analytics laptop",
    54: "caucasian man content ideas list notepad",
    55: "caucasian woman writing email newsletter laptop",
    56: "caucasian man presentation practice laptop",
    57: "caucasian woman notebook skills planning",
    58: "caucasian man client notes desk",
    59: "caucasian woman phone video answering",
    60: "caucasian man writing satisfied desk lamp",
}

# ── Env loader ────────────────────────────────────────────────────────────────

def load_env():
    for env_f in [ENV_FILE, PROJECT_ROOT / ".env.imagen"]:
        if env_f.exists():
            for line in env_f.read_text().splitlines():
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip())

# ── Hooks parser ──────────────────────────────────────────────────────────────

def parse_hooks(md_path: Path) -> dict:
    text = md_path.read_text(encoding="utf-8")
    hooks = {}
    for m in re.finditer(r"\*\*REEL (\d+)\*\*[\s\S]*?\*\*Hook:\*\*\s*(.+)", text):
        hooks[int(m.group(1))] = m.group(2).strip()
    return hooks

# ── Pexels API ────────────────────────────────────────────────────────────────

def pexels_search(api_key: str, query: str) -> dict | None:
    """Cerca video su Pexels, prioritizza portrait HD."""
    params = urllib.parse.urlencode({
        "query": query,
        "per_page": 10,
        "orientation": "portrait",
    })
    url = f"{PEXELS_API}?{params}"
    req = urllib.request.Request(url)
    req.add_header("Authorization", api_key)
    req.add_header("User-Agent", "Mozilla/5.0")
    with urllib.request.urlopen(req, timeout=20) as r:
        data = json.loads(r.read())
    videos = data.get("videos", [])
    if not videos:
        # Retry senza orientation filter
        params2 = urllib.parse.urlencode({"query": query, "per_page": 10})
        url2 = f"{PEXELS_API}?{params2}"
        req2 = urllib.request.Request(url2)
        req2.add_header("Authorization", api_key)
        req2.add_header("User-Agent", "Mozilla/5.0")
        with urllib.request.urlopen(req2, timeout=20) as r:
            data = json.loads(r.read())
        videos = data.get("videos", [])
    if not videos:
        return None
    return videos[0]  # primo risultato


def pexels_download(video: dict, dest: Path):
    """Scarica il file MP4 HD migliore dal risultato Pexels."""
    files = video.get("video_files", [])
    # Preferisce HD portrait, poi qualsiasi HD, poi SD
    def score(f):
        w, h = f.get("width", 0), f.get("height", 0)
        portrait_bonus = 100 if h > w else 0
        return w * h + portrait_bonus * 100000
    files_sorted = sorted(files, key=score, reverse=True)
    best = files_sorted[0]
    url = best["link"]
    req = urllib.request.Request(url)
    req.add_header("User-Agent", "Mozilla/5.0")
    with urllib.request.urlopen(req, timeout=120) as r:
        dest.write_bytes(r.read())
    print(f"    Clip: {best.get('width')}x{best.get('height')} {dest.stat().st_size//1024}KB")

# ── Overlay PNG via Node.js + Playwright ─────────────────────────────────────

OVERLAY_SCRIPT = r"""
const { chromium } = require('playwright');
const fs = require('fs');

const [hook, accentColor, outPath] = process.argv.slice(2);
const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
body{width:1080px;height:1920px;overflow:hidden;background:transparent;font-family:'Inter',-apple-system,sans-serif;}
.grad-text{position:absolute;left:0;right:0;top:1100px;height:440px;background:linear-gradient(to bottom,transparent 0%,rgba(0,0,0,0.76) 30%,rgba(0,0,0,0.76) 70%,transparent 100%);}
.badge{position:absolute;top:280px;left:60px;background:${accentColor};color:#fff;font-size:22px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;padding:8px 20px;border-radius:4px;}
.handle{position:absolute;top:288px;right:200px;color:rgba(255,255,255,0.55);font-size:22px;font-weight:600;letter-spacing:0.06em;}
.content{position:absolute;top:1270px;left:60px;right:190px;}
.hook{font-size:68px;font-weight:900;line-height:1.1;color:#ffffff;letter-spacing:-0.02em;margin-bottom:32px;}
.cta{font-size:30px;font-weight:700;color:rgba(255,255,255,0.75);letter-spacing:0.04em;display:flex;align-items:center;gap:12px;}
.arrow{font-size:36px;color:${accentColor};}
</style></head>
<body>
  <div class="grad-text"></div>
  <div class="badge">marcomunich.com</div>
  <div class="handle">@marcomunich</div>
  <div class="content">
    <div class="hook">${esc(hook)}</div>
    <div class="cta"><span class="arrow">&#8595;</span> Leggi in descrizione</div>
  </div>
</body></html>`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1080, height: 1920 });
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.screenshot({ path: outPath, fullPage: false, omitBackground: true });
  await browser.close();
})();
"""

def render_overlay(hook: str, accent: str, out_path: Path):
    script_path = PROJECT_ROOT / "scripts" / "_overlay_tmp.cjs"
    script_path.write_text(OVERLAY_SCRIPT, encoding="utf-8")
    try:
        r = subprocess.run(
            ["node", str(script_path), hook, accent, str(out_path)],
            capture_output=True, text=True, timeout=60, cwd=str(PROJECT_ROOT),
        )
        if r.returncode != 0:
            raise RuntimeError(r.stderr)
    finally:
        script_path.unlink(missing_ok=True)

# ── FFmpeg compose ────────────────────────────────────────────────────────────

def ffmpeg_compose(clip: Path, overlay: Path, out: Path):
    fc = (
        "[0:v]"
        "scale=1080:1920:force_original_aspect_ratio=increase,"
        "crop=1080:1920,setsar=1,"
        "loop=loop=3:size=120:start=0,"
        "trim=duration=15,setpts=PTS-STARTPTS"
        "[base];"
        "[1:v]format=yuva420p[ov];"
        "[base][ov]overlay=0:0,format=yuv420p[out]"
    )
    cmd = ["ffmpeg","-y","-i",str(clip),"-i",str(overlay),
           "-filter_complex",fc,"-map","[out]",
           "-c:v","libx264","-pix_fmt","yuv420p","-preset","fast","-crf","20",str(out)]
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    if r.returncode != 0:
        raise RuntimeError(r.stderr[-600:])

# ── Reel singolo ─────────────────────────────────────────────────────────────

def generate_reel(num: int, hook: str, api_key: str, force: bool = False):
    out_file = OUT_DIR / f"reel-{num:02d}.mp4"
    if out_file.exists() and not force:
        print(f"  skip reel {num:02d} (già esiste)")
        return

    accent = PALETTE[(num - 1) % len(PALETTE)]
    query = PEXELS_QUERIES.get(num, "person working desk laptop")

    import tempfile
    with tempfile.TemporaryDirectory() as tmp:
        clip  = Path(tmp) / "clip.mp4"
        overlay = OUT_DIR / f"_overlay_{num:02d}.png"  # salva fuori da tmp!

        # 1. Pexels
        print(f"  [1/3] Pexels search: '{query}'...")
        video = pexels_search(api_key, query)
        if not video:
            raise RuntimeError(f"Nessun video trovato per: {query}")
        pexels_download(video, clip)

        # 2. Overlay
        print(f"  [2/3] Overlay render...")
        render_overlay(hook, accent, overlay)
        if not overlay.exists() or overlay.stat().st_size < 1000:
            raise RuntimeError("Overlay PNG non generato")

        # 3. FFmpeg
        print(f"  [3/3] FFmpeg compose...")
        ffmpeg_compose(clip, overlay, out_file)

    overlay.unlink(missing_ok=True)
    print(f"  OK  reel-{num:02d}.mp4 ({out_file.stat().st_size//1024} KB)")

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    load_env()
    api_key = os.environ.get("PEXELS_API_KEY")
    if not api_key:
        print("ERROR: PEXELS_API_KEY non trovata in .env.pexels", file=sys.stderr)
        sys.exit(1)

    parser = argparse.ArgumentParser()
    parser.add_argument("from_num", nargs="?", type=int, default=1)
    parser.add_argument("to_num",   nargs="?", type=int, default=None)
    parser.add_argument("--reel",  type=int)
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--delay", type=float, default=1.0)
    args = parser.parse_args()

    hooks = parse_hooks(REELS_MD)
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    if args.reel:
        nums = [args.reel]
    else:
        from_n = args.from_num
        to_n   = args.to_num if args.to_num is not None else (args.from_num if args.from_num != 1 else 60)
        nums   = list(range(from_n, to_n + 1))

    print(f"\nGenerazione {len(nums)} reel con Pexels (gratis)...\n")
    ok = 0
    for i, num in enumerate(nums):
        hook = hooks.get(num)
        if not hook:
            print(f"  SKIP reel {num}: hook non trovato")
            continue
        print(f"Reel {num:02d} — {hook[:55]}...")
        try:
            generate_reel(num, hook, api_key, force=args.force)
            ok += 1
        except Exception as e:
            print(f"  ERRORE: {e}")
        if i < len(nums) - 1:
            time.sleep(args.delay)

    print(f"\nDone: {ok}/{len(nums)} → {OUT_DIR}\n")

if __name__ == "__main__":
    main()
