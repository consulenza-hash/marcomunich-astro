"""
Render all week carousels from week-carousels-v2.html.
Outputs to public/contenuti-social/immagini-caroselli/sett01-{day}/ for hosting.
"""
import asyncio, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
PROJECT = HERE.parents[2]
sys.path.insert(0, str(PROJECT))

from playwright.async_api import async_playwright

HTML_PATH = HERE / 'week-carousels-v2.html'
OUT_ROOT = PROJECT / 'public' / 'contenuti-social' / 'immagini-caroselli'

# Day -> list of slide IDs in HTML
WEEK = {
    'sett01-mar': ['mar-01','mar-02','mar-03','mar-04','mar-05'],
    'sett01-mer': ['mer-01','mer-02','mer-03','mer-04'],
    'sett01-gio': ['gio-01','gio-02','gio-03','gio-04','gio-05','gio-06'],
    'sett01-ven': ['ven-01','ven-02','ven-03','ven-04'],
    'sett01-sab': ['sab-01','sab-02','sab-03','sab-04','sab-05'],
    'sett01-dom': ['dom-01','dom-02','dom-03'],
}

async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch()
        ctx = await browser.new_context(viewport={'width': 1080, 'height': 1350}, device_scale_factor=2)
        page = await ctx.new_page()
        url = 'file:///' + str(HTML_PATH).replace('\\', '/')
        await page.goto(url, wait_until='networkidle')
        await page.evaluate("document.fonts.ready")
        await page.wait_for_timeout(800)

        for day_dir, slide_ids in WEEK.items():
            out_dir = OUT_ROOT / day_dir
            out_dir.mkdir(parents=True, exist_ok=True)
            for i, sid in enumerate(slide_ids, start=1):
                el = await page.query_selector(f'#{sid}')
                if not el:
                    print(f'  MISS {sid}'); continue
                out_path = out_dir / f'{i:02d}.png'
                await el.screenshot(path=str(out_path), omit_background=False)
                kb = out_path.stat().st_size // 1024
                print(f'  OK {day_dir}/{i:02d}.png ({kb}KB)')

        await browser.close()
    print(f'\nDone. Output root: {OUT_ROOT}')

if __name__ == '__main__':
    asyncio.run(main())
