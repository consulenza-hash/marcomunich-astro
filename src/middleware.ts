import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (ctx, next) => {
  const url = ctx.url;
  const response = await next();

  // Inietta floating button 📊 in tutte le pagine /keystatic/*
  if (url.pathname.startsWith('/keystatic')) {
    const ct = response.headers.get('content-type') ?? '';
    if (!ct.includes('text/html')) return response;
    const html = await response.text();
    const scripts = `<script src="/admin-stats-btn.js"></script><script src="/admin-ai-btn.js"></script>`;
    const patched = html.includes('</body>')
      ? html.replace('</body>', `${scripts}</body>`)
      : html + scripts;
    return new Response(patched, { status: response.status, headers: response.headers });
  }

  return response;
});
