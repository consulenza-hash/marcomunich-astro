#!/usr/bin/env node
/**
 * Mockup C01 con mix: slide immagine + slide testo
 * Layout: cover(img) - body2(text) - body3(img) - body4(text) - body5(text) - body6(img) - body7(text) - sig
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'public', 'contenuti-social', 'mockup-mm-style');

// Convert images to base64 for embedding
function imgToBase64(name) {
  const p = path.join(OUT, name);
  if (!fs.existsSync(p)) return '';
  return 'data:image/png;base64,' + fs.readFileSync(p).toString('base64');
}

const imgCover = imgToBase64('img-cover.png');
const imgSlide3 = imgToBase64('img-slide3.png');
const imgSlide6 = imgToBase64('img-slide6.png');

const html = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: #555; }
body { display: flex; flex-direction: column; align-items: center; gap: 32px; padding: 32px; }
.slide { width: 1080px; height: 1350px; position: relative; overflow: hidden; }

/* ─── SLIDE CON IMMAGINE ─── */
.img-slide .img-bg {
  position: absolute; inset: 0; z-index: 0;
  background-size: cover; background-position: center;
}
.img-slide .img-overlay {
  position: absolute; inset: 0; z-index: 1;
  background: linear-gradient(180deg,
    rgba(0,0,0,0.3) 0%,
    rgba(0,0,0,0.1) 30%,
    rgba(0,0,0,0.15) 60%,
    rgba(0,0,0,0.7) 100%
  );
}
.img-slide .img-content {
  position: relative; z-index: 2;
  padding: 80px 80px;
  height: 100%;
  display: flex; flex-direction: column; justify-content: flex-end;
}
.img-slide .img-meta {
  position: absolute; top: 70px; left: 80px; right: 80px; z-index: 3;
  display: flex; justify-content: space-between; align-items: center;
}
.img-slide .img-chip {
  font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 500;
  color: rgba(255,255,255,0.7); letter-spacing: 0.12em; text-transform: uppercase;
  background: rgba(0,0,0,0.3); backdrop-filter: blur(10px);
  padding: 10px 20px; border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.1);
}
.img-slide .img-title {
  font-family: 'Instrument Serif', serif; font-size: 92px; font-weight: 400;
  line-height: 1.05; color: #fff; font-style: italic;
  text-shadow: 0 2px 40px rgba(0,0,0,0.5);
  margin-bottom: 30px;
  max-width: 850px;
}
.img-slide .img-body-text {
  font-family: 'Inter', sans-serif; font-size: 38px; font-weight: 400;
  line-height: 1.5; color: rgba(255,255,255,0.9);
  text-shadow: 0 1px 20px rgba(0,0,0,0.4);
  max-width: 820px;
}
.img-slide .img-body-text strong {
  font-weight: 700; color: #fff;
}
.img-slide .img-hint {
  font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 400;
  color: rgba(255,255,255,0.45); letter-spacing: 0.1em; text-transform: uppercase;
  margin-top: 30px;
}
.img-slide .img-bar {
  position: absolute; bottom: 0; left: 0; right: 0; height: 6px;
  background: #e85d00; z-index: 3;
}

/* ─── SLIDE TESTO SU CREMA ─── */
.txt-slide {
  background: #F5F0E8;
  font-family: 'Inter', sans-serif;
}
.txt-slide .txt-sidebar {
  position: absolute; top: 0; left: 0; bottom: 0; width: 8px;
  background: #e85d00;
}
.txt-slide .txt-meta {
  position: absolute; top: 70px; left: 80px; right: 80px;
  display: flex; justify-content: space-between; align-items: center;
}
.txt-slide .txt-label {
  font-size: 14px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase;
  color: #e85d00;
}
.txt-slide .txt-count {
  font-size: 14px; font-weight: 500; color: rgba(26,20,16,0.3);
  letter-spacing: 0.1em;
}
.txt-slide .txt-idx {
  position: absolute; top: 30px; right: 60px;
  font-family: 'Instrument Serif', serif; font-size: 280px; font-weight: 400;
  color: rgba(0,0,0,0.04); line-height: 0.7; font-style: italic;
}
.txt-slide .txt-content {
  position: absolute; top: 160px; left: 80px; right: 80px; bottom: 80px;
  display: flex; align-items: center;
}
.txt-slide .txt-body {
  font-family: 'Instrument Serif', serif; font-size: 50px; font-weight: 400;
  line-height: 1.45; color: #2a2218; font-style: italic;
  max-width: 820px;
}
.txt-slide .txt-body strong {
  font-style: normal; font-weight: 700; color: #1a1410;
  background: linear-gradient(180deg, transparent 60%, rgba(232,93,0,0.15) 60%, rgba(232,93,0,0.15) 90%, transparent 90%);
  padding: 0 4px;
}

/* ─── SIGNATURE ─── */
.sig-slide {
  background: #0d0d0d;
}
.sig-slide .sig-content {
  padding: 90px;
  height: 100%;
  display: flex; flex-direction: column; justify-content: space-between;
}
.sig-slide .sig-top {
  display: flex; justify-content: space-between; align-items: flex-start;
}
.sig-slide .sig-tag {
  font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 600;
  letter-spacing: 0.18em; text-transform: uppercase; color: #e85d00;
}
.sig-slide .sig-count {
  font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 500;
  color: rgba(255,255,255,0.3); letter-spacing: 0.1em;
}
.sig-slide .sig-center {
  flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 40px;
}
.sig-slide .sig-name {
  font-family: 'Instrument Serif', serif; font-size: 150px; font-weight: 400;
  line-height: 0.92; color: #fff; font-style: italic;
}
.sig-slide .sig-bar { height: 4px; width: 100px; background: #e85d00; }
.sig-slide .sig-services {
  display: flex; flex-wrap: wrap; gap: 12px;
}
.sig-slide .sig-pill {
  font-family: 'Inter', sans-serif; font-size: 16px; font-weight: 400;
  color: rgba(255,255,255,0.5);
  border: 1px solid rgba(255,255,255,0.1); padding: 12px 22px; border-radius: 100px;
}
.sig-slide .sig-cta {
  font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 500;
  color: rgba(255,255,255,0.3); letter-spacing: 0.1em;
  border-top: 1px solid rgba(255,255,255,0.08); padding-top: 20px;
}
.sig-slide .sig-bottom-bar {
  position: absolute; bottom: 0; left: 0; right: 0; height: 6px;
  background: #e85d00;
}
</style>
</head>
<body>

<!-- SLIDE 1: COVER con immagine -->
<section class="slide img-slide" data-id="mix-01">
  <div class="img-bg" style="background-image:url('${imgCover}')"></div>
  <div class="img-overlay"></div>
  <div class="img-meta">
    <span class="img-chip">Marco Munich</span>
    <span class="img-chip">01 / 08</span>
  </div>
  <div class="img-content">
    <div class="img-title">Il tuo sito potrebbe essere di chiunque.</div>
    <div class="img-hint">→ 5 segnali per riconoscerlo</div>
  </div>
  <div class="img-bar"></div>
</section>

<!-- SLIDE 2: TESTO su crema -->
<section class="slide txt-slide" data-id="mix-02">
  <div class="txt-sidebar"></div>
  <div class="txt-meta">
    <span class="txt-label">Segnale 01</span>
    <span class="txt-count">02 / 08</span>
  </div>
  <div class="txt-idx">1</div>
  <div class="txt-content">
    <div class="txt-body">Nella bio c'è scritto <strong>"ti accompagno in un percorso di crescita personale"</strong> e la stessa frase è sul sito di altri duemila professionisti del tuo settore.</div>
  </div>
</section>

<!-- SLIDE 3: IMMAGINE -->
<section class="slide img-slide" data-id="mix-03">
  <div class="img-bg" style="background-image:url('${imgSlide3}')"></div>
  <div class="img-overlay"></div>
  <div class="img-meta">
    <span class="img-chip">Segnale 02</span>
    <span class="img-chip">03 / 08</span>
  </div>
  <div class="img-content">
    <div class="img-body-text">Le foto sono stock. Mani che si toccano, tramonti, pietre impilate. <strong>Nessuna immagine tua</strong>, del tuo studio, del tuo modo di lavorare.</div>
  </div>
  <div class="img-bar"></div>
</section>

<!-- SLIDE 4: TESTO -->
<section class="slide txt-slide" data-id="mix-04">
  <div class="txt-sidebar"></div>
  <div class="txt-meta">
    <span class="txt-label">Segnale 03</span>
    <span class="txt-count">04 / 08</span>
  </div>
  <div class="txt-idx">3</div>
  <div class="txt-content">
    <div class="txt-body">La pagina "chi sono" inizia con la <strong>lista delle certificazioni</strong> invece che con il motivo per cui fai questo lavoro.</div>
  </div>
</section>

<!-- SLIDE 5: TESTO -->
<section class="slide txt-slide" data-id="mix-05">
  <div class="txt-sidebar"></div>
  <div class="txt-meta">
    <span class="txt-label">Segnale 04</span>
    <span class="txt-count">05 / 08</span>
  </div>
  <div class="txt-idx">4</div>
  <div class="txt-content">
    <div class="txt-body">Se prendi il testo del tuo sito e lo metti su quello di un collega, <strong>nessuno se ne accorge.</strong></div>
  </div>
</section>

<!-- SLIDE 6: IMMAGINE -->
<section class="slide img-slide" data-id="mix-06">
  <div class="img-bg" style="background-image:url('${imgSlide6}')"></div>
  <div class="img-overlay"></div>
  <div class="img-meta">
    <span class="txt-label" style="color:#fff;background:rgba(0,0,0,0.3);backdrop-filter:blur(10px);padding:10px 20px;border-radius:6px;border:1px solid rgba(255,255,255,0.1);font-family:'Inter',sans-serif;font-size:14px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase">Segnale 05</span>
    <span class="img-chip">06 / 08</span>
  </div>
  <div class="img-content">
    <div class="img-body-text">Chi ti cerca online e arriva sul tuo sito non riesce a capire <strong>cosa ti distingue</strong> da tutti gli altri che offrono la stessa cosa.</div>
  </div>
  <div class="img-bar"></div>
</section>

<!-- SLIDE 7: TESTO conclusione -->
<section class="slide txt-slide" data-id="mix-07">
  <div class="txt-sidebar"></div>
  <div class="txt-meta">
    <span class="txt-label">La lezione</span>
    <span class="txt-count">07 / 08</span>
  </div>
  <div class="txt-content">
    <div class="txt-body">Il tuo sito deve suonare come la <strong>tua voce</strong> quando sei seduto davanti a un cliente e gli spieghi cosa fai. Se quella voce manca, le persone giuste passano oltre.</div>
  </div>
</section>

<!-- SLIDE 8: SIGNATURE -->
<section class="slide sig-slide" data-id="mix-08">
  <div class="sig-content">
    <div class="sig-top">
      <span class="sig-tag">Per coach, counselor & operatori olistici</span>
      <span class="sig-count">08 / 08</span>
    </div>
    <div class="sig-center">
      <div class="sig-name">Marco<br>Munich</div>
      <div class="sig-bar"></div>
      <div class="sig-services">
        <span class="sig-pill">Personal Branding</span>
        <span class="sig-pill">Siti Web</span>
        <span class="sig-pill">Metterci la faccia</span>
        <span class="sig-pill">Messaggio Autentico</span>
        <span class="sig-pill">Video Autentici</span>
        <span class="sig-pill">Lavorare Senza Sito</span>
      </div>
    </div>
    <div class="sig-cta">marcomunich.com · @marcomunich.dev</div>
  </div>
  <div class="sig-bottom-bar"></div>
</section>

</body>
</html>`;

const tmpHtml = path.join(OUT, '_mixed.html');
fs.writeFileSync(tmpHtml, html);
console.log('> HTML written');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
await page.goto('file:///' + tmpHtml.replace(/\\/g, '/'));
await page.evaluate(() => document.fonts.ready);
await new Promise(r => setTimeout(r, 2000));

const slides = await page.$$('.slide');
let count = 0;
for (const slide of slides) {
  const id = await slide.getAttribute('data-id');
  await slide.screenshot({ path: path.join(OUT, `${id}.png`) });
  count++;
  console.log(`  ${count}/${slides.length} ${id}.png`);
}
await browser.close();
fs.unlinkSync(tmpHtml);
console.log(`> Done: ${count} slides`);
