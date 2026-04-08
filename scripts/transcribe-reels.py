"""
Scarica l'audio dei reel Instagram e trascrive con Whisper.
Aggiorna contenuti-social/swipe-file.md con le trascrizioni.

Usage: python3 scripts/transcribe-reels.py
"""

import os
import re
import sys
import tempfile
import yt_dlp
import whisper

SWIPE_FILE = "public/contenuti-social/swipe-file.md"
AUDIO_DIR = tempfile.mkdtemp(prefix="reels_audio_")

# Solo reel (non post statici)
REEL_URLS = [
    "https://www.instagram.com/reel/DUlK3BJDFKQ/",
    "https://www.instagram.com/reel/DU_4ohODqeB/",
    "https://www.instagram.com/reel/DVNAIKZCZhi/",
    "https://www.instagram.com/reel/DTneoInkdmG/",
    "https://www.instagram.com/reel/DVMGTpFjUu0/",
    "https://www.instagram.com/reel/DVUVhWcDfVA/",
    "https://www.instagram.com/reel/DVZpiP8jEyE/",
    "https://www.instagram.com/reel/DVjyLlLjeIM/",
    "https://www.instagram.com/reel/DVhRMHzEh-h/",
    "https://www.instagram.com/reel/DVNSccIjWnQ/",
    "https://www.instagram.com/reel/DVSkKKCjmHo/",
    "https://www.instagram.com/reel/DVSKF1WEk85/",
    "https://www.instagram.com/reel/DVrTT5FjdCk/",
    "https://www.instagram.com/reel/DWHhMboCQIp/",
    "https://www.instagram.com/reel/DWHe0jUD8M7/",
    "https://www.instagram.com/reel/DWMNRQTjiNN/",
    "https://www.instagram.com/reel/DWHkP32kX9w/",
    "https://www.instagram.com/reel/DWRnz7_EYLS/",
    "https://www.instagram.com/reel/DWTtRizjj9V/",
    "https://www.instagram.com/reel/DWRXImHDiXf/",
    "https://www.instagram.com/reel/DWXW2DSEsEl/",
    "https://www.instagram.com/reel/DWHubPOk7Zp/",
    "https://www.instagram.com/reel/DWjobc6DMwB/",
    "https://www.instagram.com/reel/DWooSQkkQe2/",
    "https://www.instagram.com/reel/DSkgqLHjX7A/",
    "https://www.instagram.com/reel/DWpvEFADcFo/",
    "https://www.instagram.com/reel/DWjEeGKDD_m/",
    "https://www.instagram.com/reel/DV826O8iabh/",
]


def reel_id(url):
    m = re.search(r'/reel/([A-Za-z0-9_-]+)', url)
    return m.group(1) if m else url.split('/')[-2]


def download_audio(url, out_dir):
    rid = reel_id(url)
    out_path = os.path.join(out_dir, f"{rid}.%(ext)s")
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': out_path,
        'quiet': True,
        'no_warnings': True,
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '64',
        }],
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
        final = os.path.join(out_dir, f"{rid}.mp3")
        return final if os.path.exists(final) else None
    except Exception as e:
        print(f"  DOWNLOAD ERRORE: {e}")
        return None


def transcribe(audio_path, model):
    try:
        result = model.transcribe(audio_path, fp16=False)
        return result["text"].strip()
    except Exception as e:
        return f"[ERRORE TRASCRIZIONE: {e}]"


def update_swipe_file(transcriptions):
    with open(SWIPE_FILE, 'r', encoding='utf-8') as f:
        content = f.read()

    for url, text in transcriptions.items():
        rid = reel_id(url)
        # Find the block for this reel in the swipe file and append transcript
        pattern = rf'(\*\*URL:\*\* https://www\.instagram\.com/[^/]+/reel/{re.escape(rid)}/[^\n]*\n)'
        replacement = rf'\1**Trascrizione:** {text}\n'
        new_content = re.sub(pattern, replacement, content)
        if new_content != content:
            content = new_content
        else:
            # Try alternate URL format
            pattern2 = rf'(\*\*URL:\*\* [^\n]*{re.escape(rid)}[^\n]*\n)'
            content = re.sub(pattern2, rf'\1**Trascrizione:** {text}\n', content)

    with open(SWIPE_FILE, 'w', encoding='utf-8') as f:
        f.write(content)


def main():
    print(f"Carico modello Whisper (base)...")
    model = whisper.load_model("base")
    print(f"Modello caricato. Avvio trascrizione di {len(REEL_URLS)} reel.\n")

    transcriptions = {}
    for i, url in enumerate(REEL_URLS, 1):
        rid = reel_id(url)
        print(f"[{i}/{len(REEL_URLS)}] {rid}")

        print(f"  Scarico audio...")
        audio = download_audio(url, AUDIO_DIR)
        if not audio:
            print(f"  SKIP — download fallito")
            continue

        size_kb = os.path.getsize(audio) // 1024
        print(f"  Audio: {size_kb}KB — Trascrivo...")
        text = transcribe(audio, model)
        transcriptions[url] = text
        print(f"  >> {text[:100]}{'...' if len(text) > 100 else ''}")

        # Pulizia file audio
        try:
            os.remove(audio)
        except:
            pass

    print(f"\nAggiorno {SWIPE_FILE}...")
    update_swipe_file(transcriptions)
    print(f"✅ Fatto. {len(transcriptions)}/{len(REEL_URLS)} reel trascritti.")


if __name__ == "__main__":
    main()
