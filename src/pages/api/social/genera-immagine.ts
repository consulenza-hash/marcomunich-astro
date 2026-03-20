import type { APIRoute } from 'astro';
import { quoteTemplate, titleOverlayTemplate } from '../../../lib/social-image-templates';

export const prerender = false;

// Cache font buffers across warm invocations
let fontRegular: ArrayBuffer | null = null;
let fontBold: ArrayBuffer | null = null;

async function loadFonts(siteUrl: string) {
  if (!fontRegular) {
    const r = await fetch(`${siteUrl}/fonts/HostGrotesk-Regular.ttf`);
    fontRegular = await r.arrayBuffer();
  }
  if (!fontBold) {
    const r = await fetch(`${siteUrl}/fonts/HostGrotesk-Bold.ttf`);
    fontBold = await r.arrayBuffer();
  }
  return { fontRegular, fontBold };
}

export const POST: APIRoute = async ({ request }) => {
  const headers = { 'Content-Type': 'application/json' };

  // Auth
  const cookie = request.headers.get('cookie') ?? '';
  const rawAuth = cookie.split(';').find(c => c.trim().startsWith('stats_auth='))?.split('=')[1]?.trim() ?? '';
  const statsAuth = decodeURIComponent(rawAuth);
  const expectedPwd = (import.meta.env.STATS_PASSWORD || 'stats2024').trim();
  if (statsAuth !== expectedPwd) {
    return new Response(JSON.stringify({ error: 'Non autorizzato' }), { status: 401, headers });
  }

  let body: { tipo: string; testo: string; slug: string; autore?: string };
  try { body = await request.json(); }
  catch { return new Response(JSON.stringify({ error: 'JSON non valido' }), { status: 400, headers }); }

  const { tipo, testo, slug, autore } = body;
  if (!tipo || !testo || !slug) {
    return new Response(JSON.stringify({ error: 'tipo, testo e slug obbligatori' }), { status: 400, headers });
  }

  const siteUrl = (import.meta.env.SITE_URL || 'https://marcomunich.com').trim();

  try {
    // Load fonts
    const fonts = await loadFonts(siteUrl);

    // Import satori dynamically
    const satori = (await import('satori')).default;
    const sharp = (await import('sharp')).default;

    // Build template
    const articleUrl = `marcomunich.com/${slug}`;
    let template: any;
    if (tipo === 'citazione') {
      template = quoteTemplate({ testo, autore, siteUrl: articleUrl });
    } else {
      template = titleOverlayTemplate({ titolo: testo, siteUrl: articleUrl });
    }

    // Render SVG
    const svg = await satori(template, {
      width: 1080,
      height: 1920,
      fonts: [
        { name: 'Host Grotesk', data: fonts.fontRegular!, weight: 400, style: 'normal' as const },
        { name: 'Host Grotesk', data: fonts.fontBold!, weight: 700, style: 'normal' as const },
      ],
    });

    // Convert to PNG
    const pngBuffer = await sharp(Buffer.from(svg)).png({ quality: 90 }).toBuffer();

    // Try Vercel Blob upload
    const blobToken = (import.meta.env.BLOB_READ_WRITE_TOKEN || '').trim();
    if (blobToken) {
      const { put } = await import('@vercel/blob');
      const timestamp = Date.now();
      const blob = await put(`social/${slug}/${timestamp}-${tipo}.png`, pngBuffer, {
        access: 'public',
        contentType: 'image/png',
        token: blobToken,
      });
      return new Response(JSON.stringify({
        success: true,
        url: blob.url,
        pathname: blob.pathname,
      }), { headers });
    }

    // Fallback: return image as base64 data URL
    const b64 = pngBuffer.toString('base64');
    return new Response(JSON.stringify({
      success: true,
      url: `data:image/png;base64,${b64}`,
      pathname: null,
    }), { headers });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: `Errore generazione: ${err.message}` }), { status: 500, headers });
  }
};
