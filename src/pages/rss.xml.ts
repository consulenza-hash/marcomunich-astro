/**
 * src/pages/rss.xml.ts
 * Feed RSS articoli pubblicati — usato da Make.com per distribuzione social.
 *
 * URL: https://marcomunich.com/rss.xml
 * Include: titolo, descrizione, link, data, immagine (enclosure + media:content)
 * Esclude: articoli con bozza: true
 */
export const prerender = true;

import jsYaml from 'js-yaml';

const SITE = 'https://marcomunich.com';

export async function GET() {
  const rawFiles = import.meta.glob('/src/content/articoli/*/index.mdoc', {
    eager: true,
    as: 'raw',
  }) as Record<string, string>;

  const articles = Object.entries(rawFiles)
    .map(([filePath, content]) => {
      const slug = filePath.match(/\/([^/]+)\/index\.mdoc$/)?.[1] ?? '';
      const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (!fmMatch) return null;

      let fm: Record<string, any> = {};
      try { fm = (jsYaml.load(fmMatch[1]) as any) || {}; } catch { return null; }

      if (fm.bozza === true) return null;
      const dataStr = fm.data instanceof Date ? fm.data.toISOString().slice(0, 10) : (fm.data ? String(fm.data) : '');
      if (dataStr && new Date(dataStr + 'T12:00:00') > new Date()) return null;

      return {
        slug,
        titolo:     String(fm.titolo     || slug),
        descrizione:String(fm.descrizione || ''),
        data:       fm.data ? new Date(String(fm.data)) : new Date(0),
        immagine:   fm.immagine ? `${SITE}/images/articoli/${fm.immagine}` : null,
      };
    })
    .filter((a): a is NonNullable<typeof a> => a !== null)
    .sort((a, b) => b.data.getTime() - a.data.getTime())
    .slice(0, 50);

  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const items = articles.map(a => {
    const imgTags = a.immagine ? `
      <enclosure url="${a.immagine}" type="image/jpeg" length="0"/>
      <media:content url="${a.immagine}" medium="image"/>` : '';
    return `
    <item>
      <title><![CDATA[${a.titolo}]]></title>
      <link>${SITE}/${a.slug}/</link>
      <guid isPermaLink="true">${SITE}/${a.slug}/</guid>
      <description><![CDATA[${a.descrizione}]]></description>
      <pubDate>${a.data.toUTCString()}</pubDate>${imgTags}
    </item>`;
  }).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Marco Munich — Articoli</title>
    <link>${SITE}/blog/</link>
    <description>Personal branding olistico, marketing autentico e presenza online per coach, counselor e operatori olistici.</description>
    <language>it</language>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
