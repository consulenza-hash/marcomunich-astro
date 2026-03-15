// Ping IndexNow after deploy to notify Bing of sitemap
const KEY = 'marcomunich2024indexnow';
const SITE = 'https://marcomunich.com';
const URLS = [
  `${SITE}/`,
  `${SITE}/blog/`,
  `${SITE}/chi-sono/`,
  `${SITE}/servizi/`,
  `${SITE}/risorse/`,
  `${SITE}/percorsi-online/`,
];

const body = JSON.stringify({ host: 'marcomunich.com', key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList: URLS });
const r = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: {'Content-Type':'application/json'}, body });
console.log('IndexNow response:', r.status, await r.text());
