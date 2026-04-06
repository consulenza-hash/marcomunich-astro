import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'public', 'contenuti-social', 'immagini-caroselli', 'carosello-01');

function imgB64(name) {
  const p = path.join(OUT, name);
  if (!fs.existsSync(p)) return '';
  return 'data:image/png;base64,' + fs.readFileSync(p).toString('base64');
}

const imgCover = imgB64('img-cover.png');
const imgS3 = imgB64('img-s3.png');
const imgS6 = imgB64('img-s6.png');

// C01 slides dal markdown
const slides = [
  { type: 'cover', text: '5 segnali che il tuo sito potrebbe essere di chiunque' },
  { type: 'text', text: 'Nella bio c\'è scritto "ti accompagno in un percorso di crescita personale" e la stessa frase è sul sito di altri duemila professionisti del tuo settore.', hl: '"ti accompagno in un percorso di crescita personale"' },
  { type: 'img', text: 'Le foto sono stock. Mani che si toccano sopra un tramonto, pietre impilate sulla spiaggia. Nessuna immagine tua, del tuo studio, del tuo modo di lavorare.', img: imgS3, hl: 'Nessuna immagine tua' },
  { type: 'text', text: 'La pagina "chi sono" inizia con la lista delle certificazioni invece che con il motivo per cui fai questo lavoro.', hl: 'lista delle certificazioni' },
  { type: 'text', text: 'Se prendi il testo del tuo sito e lo metti su quello di un collega, nessuno se ne accorge.', hl: 'nessuno se ne accorge' },
  { type: 'img', text: 'Chi ti cerca online e arriva sul tuo sito non riesce a capire cosa ti distingue da tutti gli altri che offrono la stessa cosa.', img: imgS6, hl: 'cosa ti distingue' },
  { type: 'text', text: 'Il tuo sito deve suonare come la tua voce quando sei seduto davanti a un cliente e gli spieghi cosa fai. Se quella voce manca, le persone giuste passano oltre.', hl: 'tua voce' },
  { type: 'sig' },
];

function escHtml(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function highlightText(text, hl) {
  if (!hl) return `<span style="font-family:'Instrument Serif',serif;font-style:italic">${escHtml(text)}</span>`;
  const idx = text.indexOf(hl);
  if (idx === -1) return `<span style="font-family:'Instrument Serif',serif;font-style:italic">${escHtml(text)}</span>`;
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + hl.length);
  const after = text.slice(idx + hl.length);
  return `<span style="font-family:'Instrument Serif',serif;font-style:italic">${escHtml(before)}</span><span style="font-family:'Instrument Serif',serif;font-weight:700;font-style:normal;color:#1a1410;background:linear-gradient(180deg,transparent 60%,rgba(232,93,0,0.15) 60%,rgba(232,93,0,0.15) 90%,transparent 90%);padding:0 4px">${escHtml(match)}</span><span style="font-family:'Instrument Serif',serif;font-style:italic">${escHtml(after)}</span>`;
}

let slidesHtml = '';
const total = slides.length;
const accent = '#e85d00';

for (let i = 0; i < slides.length; i++) {
  const s = slides[i];
  const num = String(i + 1).padStart(2, '0');
  const counter = `${num} / ${String(total).padStart(2, '0')}`;

  if (s.type === 'cover') {
    slidesHtml += `
<section class="slide" data-id="s${num}">
  <div style="position:absolute;inset:0;background-image:url('${imgCover}');background-size:cover;background-position:center"></div>
  <div style="position:absolute;inset:0;z-index:1;background:linear-gradient(180deg,rgba(0,0,0,0.35) 0%,rgba(0,0,0,0.1) 30%,rgba(0,0,0,0.15) 55%,rgba(0,0,0,0.75) 100%)"></div>
  <div style="position:absolute;top:70px;left:80px;right:80px;z-index:3;display:flex;justify-content:space-between">
    <span class="chip">Marco Munich</span>
    <span class="chip">${counter}</span>
  </div>
  <div style="position:relative;z-index:2;padding:80px;height:100%;display:flex;flex-direction:column;justify-content:flex-end">
    <div style="font-family:'Inter',sans-serif;font-size:108px;font-weight:900;line-height:1.0;color:#fff;letter-spacing:-0.04em;text-shadow:0 4px 60px rgba(0,0,0,0.6);margin-bottom:30px;max-width:900px">${escHtml(s.text)}</div>
    <div style="font-family:'Inter',sans-serif;font-size:15px;font-weight:400;color:rgba(255,255,255,0.45);letter-spacing:0.1em;text-transform:uppercase;margin-top:10px">→ Scorri per scoprirli</div>
  </div>
  <div style="position:absolute;bottom:0;left:0;right:0;height:6px;background:${accent};z-index:3"></div>
</section>`;
  } else if (s.type === 'text') {
    slidesHtml += `
<section class="slide" data-id="s${num}" style="background:#F5F0E8">
  <div style="position:absolute;top:0;left:0;bottom:0;width:8px;background:${accent}"></div>
  <div style="position:absolute;top:70px;left:80px;right:80px;display:flex;justify-content:space-between;align-items:center">
    <span style="font-family:'Inter',sans-serif;font-size:14px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:${accent}">Segnale ${num}</span>
    <span style="font-family:'Inter',sans-serif;font-size:14px;font-weight:500;color:rgba(26,20,16,0.3);letter-spacing:0.1em">${counter}</span>
  </div>
  <div style="position:absolute;top:30px;right:60px;font-family:'Instrument Serif',serif;font-size:280px;font-weight:400;color:rgba(0,0,0,0.04);line-height:0.7;font-style:italic">${i}</div>
  <div style="position:absolute;top:160px;left:80px;right:80px;bottom:80px;display:flex;align-items:center">
    <div style="font-size:50px;font-weight:400;line-height:1.45;color:#2a2218;max-width:820px">${highlightText(s.text, s.hl)}</div>
  </div>
</section>`;
  } else if (s.type === 'img') {
    slidesHtml += `
<section class="slide" data-id="s${num}">
  <div style="position:absolute;inset:0;background-image:url('${s.img}');background-size:cover;background-position:center"></div>
  <div style="position:absolute;inset:0;z-index:1;background:linear-gradient(180deg,rgba(0,0,0,0.2) 0%,rgba(0,0,0,0.05) 30%,rgba(0,0,0,0.1) 50%,rgba(0,0,0,0.7) 100%)"></div>
  <div style="position:absolute;top:70px;left:80px;right:80px;z-index:3;display:flex;justify-content:space-between">
    <span class="chip">Segnale ${num}</span>
    <span class="chip">${counter}</span>
  </div>
  <div style="position:relative;z-index:2;padding:80px;height:100%;display:flex;flex-direction:column;justify-content:flex-end">
    <div style="font-family:'Inter',sans-serif;font-size:38px;font-weight:500;line-height:1.45;color:rgba(255,255,255,0.9);text-shadow:0 2px 30px rgba(0,0,0,0.5);max-width:820px">${escHtml(s.text)}</div>
  </div>
  <div style="position:absolute;bottom:0;left:0;right:0;height:6px;background:${accent};z-index:3"></div>
</section>`;
  } else if (s.type === 'sig') {
    slidesHtml += `
<section class="slide" data-id="s${num}" style="background:${accent}">
  <div style="position:absolute;top:110px;left:100px;width:72px;height:5px;background:#0d0d0d"></div>
  <div style="padding:110px 100px;height:100%;display:flex;flex-direction:column;justify-content:space-between">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:32px">
      <span style="font-family:'Inter',sans-serif;font-size:20px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:rgba(13,13,13,0.55)">Segui per altri</span>
      <span style="font-family:'Inter',sans-serif;font-size:20px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:rgba(13,13,13,0.55)"><span style="color:#0d0d0d;font-weight:800">${num}</span> / ${String(total).padStart(2,'0')}</span>
    </div>
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center">
      <div style="font-family:'Inter',sans-serif;font-size:22px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#0d0d0d;margin-bottom:36px">Per coach, counselor &amp; operatori olistici</div>
      <div style="font-family:'Inter',sans-serif;font-size:148px;font-weight:900;line-height:0.88;letter-spacing:-0.045em;color:#0d0d0d">Marco<br>Munich</div>
      <div style="margin-top:44px;display:flex;flex-direction:column;gap:26px;max-width:860px">
        <div>
          <div style="font-family:'Inter',sans-serif;font-size:17px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:#0d0d0d;margin-bottom:10px;padding-bottom:8px;border-bottom:2px solid rgba(13,13,13,0.25)">Consulenza 1-a-1</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <div class="svc"><span class="sn">01</span><span>Personal Branding Olistico</span></div>
            <div class="svc"><span class="sn">02</span><span>Sviluppo Siti Web</span></div>
          </div>
        </div>
        <div>
          <div style="font-family:'Inter',sans-serif;font-size:17px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:#0d0d0d;margin-bottom:10px;padding-bottom:8px;border-bottom:2px solid rgba(13,13,13,0.25)">Percorsi Online</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <div class="svc"><span class="sn">03</span><span>Metterci la faccia online</span></div>
            <div class="svc"><span class="sn">04</span><span>Creazione del Messaggio Autentico</span></div>
            <div class="svc"><span class="sn">05</span><span>Creazione Video Autentici</span></div>
            <div class="svc"><span class="sn">06</span><span>Lavorare Senza Sito Web</span></div>
          </div>
        </div>
      </div>
      <div style="font-family:'Inter',sans-serif;font-size:22px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#0d0d0d;margin-top:36px;padding-top:24px;border-top:3px solid #0d0d0d;max-width:860px">→ marcomunich.com · @marcomunich1983</div>
    </div>
    <div></div>
  </div>
</section>`;
  }
}

const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Instrument+Serif:ital,wght@0,400;1,400&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#555}
body{display:flex;flex-direction:column;align-items:center;gap:24px;padding:24px;-webkit-font-smoothing:antialiased}
.slide{width:1080px;height:1350px;position:relative;overflow:hidden}
.chip{font-family:'Inter',sans-serif;font-size:14px;font-weight:500;color:rgba(255,255,255,0.7);letter-spacing:0.12em;text-transform:uppercase;background:rgba(0,0,0,0.3);backdrop-filter:blur(10px);padding:10px 20px;border-radius:6px;border:1px solid rgba(255,255,255,0.1)}
.svc{display:flex;align-items:baseline;gap:18px;font-family:'Inter',sans-serif;font-size:26px;font-weight:700;color:#0d0d0d;line-height:1.3}
.sn{font-weight:400;font-size:20px;color:rgba(13,13,13,0.55);min-width:38px}
</style></head><body>
${slidesHtml}
</body></html>`;

const tmpHtml = path.join(OUT, '_c01-test.html');
fs.writeFileSync(tmpHtml, html);
const browser = await chromium.launch();
const page = await browser.newPage({viewport:{width:1080,height:1350},deviceScaleFactor:1});
await page.goto('file:///' + tmpHtml.replace(/\\/g, '/'), {timeout: 60000});
await page.evaluate(() => document.fonts.ready);
await new Promise(r => setTimeout(r, 1500));

const allSlides = await page.$$('.slide');
for (const slide of allSlides) {
  const id = await slide.getAttribute('data-id');
  await slide.screenshot({path: path.join(OUT, `${id}.png`)});
  console.log(`  ${id}.png`);
}
await browser.close();
fs.unlinkSync(tmpHtml);
console.log('Done: 8 slides');
