import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'public', 'contenuti-social', 'mockup-mm-style');

const colors = ['#e85d00', '#3b82f6'];

let slides = '';
for (const accent of colors) {
  slides += `
<section class="slide" data-id="sig-${accent.slice(1)}" style="background:${accent}">
  <div style="position:absolute;top:110px;left:100px;width:72px;height:5px;background:#0d0d0d"></div>
  <div style="padding:110px 100px;height:100%;display:flex;flex-direction:column;justify-content:space-between">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:32px">
      <span style="font-family:'Inter',sans-serif;font-size:20px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:rgba(13,13,13,0.55)">Segui per altri</span>
      <span style="font-family:'Inter',sans-serif;font-size:20px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:rgba(13,13,13,0.55)"><span style="color:#0d0d0d;font-weight:800">08</span> / 08</span>
    </div>
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center">
      <div style="font-family:'Inter',sans-serif;font-size:22px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#0d0d0d;margin-bottom:36px">Per coach, counselor &amp; operatori olistici</div>
      <div style="font-family:'Inter',sans-serif;font-size:148px;font-weight:900;line-height:0.88;letter-spacing:-0.045em;color:#0d0d0d">Marco<br>Munich</div>
      <div style="margin-top:44px;display:flex;flex-direction:column;gap:26px;max-width:860px">
        <div>
          <div style="font-family:'Inter',sans-serif;font-size:17px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:#0d0d0d;margin-bottom:10px;padding-bottom:8px;border-bottom:2px solid rgba(13,13,13,0.25)">Consulenza 1-a-1</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <div style="display:flex;align-items:baseline;gap:18px;font-family:'Inter',sans-serif;font-size:26px;font-weight:700;color:#0d0d0d;line-height:1.3"><span style="font-weight:400;font-size:20px;color:rgba(13,13,13,0.55);min-width:38px">01</span><span>Personal Branding Olistico</span></div>
            <div style="display:flex;align-items:baseline;gap:18px;font-family:'Inter',sans-serif;font-size:26px;font-weight:700;color:#0d0d0d;line-height:1.3"><span style="font-weight:400;font-size:20px;color:rgba(13,13,13,0.55);min-width:38px">02</span><span>Sviluppo Siti Web</span></div>
          </div>
        </div>
        <div>
          <div style="font-family:'Inter',sans-serif;font-size:17px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:#0d0d0d;margin-bottom:10px;padding-bottom:8px;border-bottom:2px solid rgba(13,13,13,0.25)">Percorsi Online</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <div style="display:flex;align-items:baseline;gap:18px;font-family:'Inter',sans-serif;font-size:26px;font-weight:700;color:#0d0d0d;line-height:1.3"><span style="font-weight:400;font-size:20px;color:rgba(13,13,13,0.55);min-width:38px">03</span><span>Metterci la faccia online</span></div>
            <div style="display:flex;align-items:baseline;gap:18px;font-family:'Inter',sans-serif;font-size:26px;font-weight:700;color:#0d0d0d;line-height:1.3"><span style="font-weight:400;font-size:20px;color:rgba(13,13,13,0.55);min-width:38px">04</span><span>Creazione del Messaggio Autentico</span></div>
            <div style="display:flex;align-items:baseline;gap:18px;font-family:'Inter',sans-serif;font-size:26px;font-weight:700;color:#0d0d0d;line-height:1.3"><span style="font-weight:400;font-size:20px;color:rgba(13,13,13,0.55);min-width:38px">05</span><span>Creazione Video Autentici</span></div>
            <div style="display:flex;align-items:baseline;gap:18px;font-family:'Inter',sans-serif;font-size:26px;font-weight:700;color:#0d0d0d;line-height:1.3"><span style="font-weight:400;font-size:20px;color:rgba(13,13,13,0.55);min-width:38px">06</span><span>Lavorare Senza Sito Web</span></div>
          </div>
        </div>
      </div>
      <div style="font-family:'Inter',sans-serif;font-size:22px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#0d0d0d;margin-top:36px;padding-top:24px;border-top:3px solid #0d0d0d;max-width:860px">→ marcomunich.com · @marcomunich.dev</div>
    </div>
    <div></div>
  </div>
</section>`;
}

const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#555}
body{display:flex;flex-direction:column;align-items:center;gap:32px;padding:32px}
.slide{width:1080px;height:1350px;position:relative;overflow:hidden}
</style></head><body>
${slides}
</body></html>`;

const tmpHtml = path.join(OUT, '_sig.html');
fs.writeFileSync(tmpHtml, html);
const browser = await chromium.launch();
const page = await browser.newPage({viewport:{width:1080,height:1350},deviceScaleFactor:1});
await page.goto('file:///' + tmpHtml.replace(/\\/g, '/'));
await page.evaluate(() => document.fonts.ready);
await new Promise(r => setTimeout(r, 1000));

const allSlides = await page.$$('.slide');
for (const s of allSlides) {
  const id = await s.getAttribute('data-id');
  await s.screenshot({path: path.join(OUT, `${id}.png`)});
  console.log(`  ${id}.png`);
}
await browser.close();
fs.unlinkSync(tmpHtml);
console.log('Done');
