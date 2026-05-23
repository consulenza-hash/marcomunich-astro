const { chromium } = require('../node_modules/playwright');
const fs = require('fs');
const path = require('path');

const BRAVE_PATH = 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe';
const BRAVE_PROFILE = process.env.LOCALAPPDATA + '\\BraveSoftware\\Brave-Browser\\User Data';

(async () => {
  console.log('Opening Brave with existing session...');
  const ctx = await chromium.launchPersistentContext(BRAVE_PROFILE, {
    executablePath: BRAVE_PATH,
    headless: false,
    args: ['--no-sandbox'],
  });

  const page = await ctx.newPage();
  await page.goto('https://www.instagram.com/marcomunich.dev/reels/', { waitUntil: 'networkidle', timeout: 30000 });

  console.log('Page loaded. Scrolling to load reels...');

  const reelUrls = new Set();

  // Scroll and collect reel links
  for (let i = 0; i < 20; i++) {
    // Extract all reel links visible
    const links = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href*="/reel/"]'));
      return anchors.map(a => a.href).filter(h => h.includes('/reel/'));
    });

    links.forEach(l => reelUrls.add(l.split('?')[0]));
    console.log(`Scroll ${i+1}: found ${reelUrls.size} reels so far`);

    // Scroll down
    await page.evaluate(() => window.scrollBy(0, 1200));
    await page.waitForTimeout(2000);

    if (i > 3 && links.length === 0) break;
  }

  const urls = Array.from(reelUrls);
  console.log(`\nTotal reels found: ${urls.length}`);

  fs.writeFileSync('tmp_marco/reel_urls.json', JSON.stringify(urls, null, 2));
  console.log('Saved to tmp_marco/reel_urls.json');

  await ctx.close();
})();
