import re
with open('src/pages/prompt-pack/accesso.astro', encoding='utf-8') as f:
    content = f.read()
matches = re.findall(r'\{n:(\d+),\s*text:`([^`]+)`\}', content, re.DOTALL)
for n, text in matches:
    print(f'--- #{n} ---')
    print(text.strip())
    print()
