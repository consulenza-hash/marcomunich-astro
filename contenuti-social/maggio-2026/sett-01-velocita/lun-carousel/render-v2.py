"""
Render carousel-v2 slides to PNG via Playwright.
Reads carousel-v2.html (8 sections), captures each section as 1080x1350 PNG.
Output to output-v2/ (does NOT overwrite v1 output).
"""
import asyncio
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[3]))

from playwright.async_api import async_playwright

HTML_PATH = HERE / 'carousel-v2.html'
OUT_DIR = HERE / 'output-v2'
OUT_DIR.mkdir(exist_ok=True)

SLIDES = [f'slide-{i:02d}' for i in range(1, 9)]

async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch()
        context = await browser.new_context(viewport={'width': 1080, 'height': 1350}, device_scale_factor=2)
        page = await context.new_page()

        url = 'file:///' + str(HTML_PATH).replace('\\', '/')
        await page.goto(url, wait_until='networkidle')
        await page.evaluate("document.fonts.ready")
        await page.wait_for_timeout(800)

        for slide_id in SLIDES:
            element = await page.query_selector(f'#{slide_id}')
            if not element:
                print(f'  MISS {slide_id}')
                continue
            out_path = OUT_DIR / f'{slide_id}.png'
            await element.screenshot(path=str(out_path), omit_background=False)
            size_kb = out_path.stat().st_size // 1024
            print(f'  OK {slide_id}.png ({size_kb}KB)')

        await browser.close()
    print(f'\nDone. Output in: {OUT_DIR}')

if __name__ == '__main__':
    asyncio.run(main())
