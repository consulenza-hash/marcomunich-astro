"""
Inserisce i 3 hook di apertura in ogni reel dello script-reel-parlati.md
"""
import re

SCRIPTS_FILE = "public/contenuti-social/reels/script-reel-parlati.md"
HOOKS_FILE = "public/contenuti-social/reels/hook-reel-3x.md"

# --- Leggi hook ---
with open(HOOKS_FILE, encoding="utf-8") as f:
    hooks_raw = f.read()

# Estrai hook per ogni reel
# Pattern: ## REEL XX — Titolo\n\n**A.** "..."\n**B.** "..."\n**C.** "..."
hooks_map = {}
reel_blocks = re.split(r'\n---\n', hooks_raw)
for block in reel_blocks:
    m_reel = re.search(r'## REEL (\d+)', block)
    if not m_reel:
        continue
    num = int(m_reel.group(1))

    a = re.search(r'\*\*A\.\*\*\s+"([^"]+)"', block)
    b = re.search(r'\*\*B\.\*\*\s+"([^"]+)"', block)
    c = re.search(r'\*\*C\.\*\*\s+"([^"]+)"', block)

    if a and b and c:
        hooks_map[num] = (a.group(1), b.group(1), c.group(1))

print(f"Hook estratti: {len(hooks_map)} reel")

# --- Leggi script ---
with open(SCRIPTS_FILE, encoding="utf-8") as f:
    scripts_raw = f.read()

# Inserisci hook dopo ogni header ## REEL XX
def replace_reel_header(match):
    header = match.group(0)
    num_match = re.search(r'## REEL (\d+)', header)
    if not num_match:
        return header
    num = int(num_match.group(1))
    if num not in hooks_map:
        print(f"  ⚠ Nessun hook per REEL {num:02d}")
        return header
    a, b, c = hooks_map[num]
    hook_block = (
        f"{header}\n\n"
        f"> **Hook A:** \"{a}\"\n"
        f"> **Hook B:** \"{b}\"\n"
        f"> **Hook C:** \"{c}\"\n"
    )
    return hook_block

# Sostituisci ogni header
result = re.sub(r'^## REEL \d+.*$', replace_reel_header, scripts_raw, flags=re.MULTILINE)

# Scrivi file
with open(SCRIPTS_FILE, "w", encoding="utf-8") as f:
    f.write(result)

print(f"File aggiornato: {SCRIPTS_FILE}")

# Verifica
found = len(re.findall(r'Hook A:', result))
print(f"Hook inseriti: {found}/60")
