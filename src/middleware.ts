import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (ctx, next) => {
  const url = ctx.url;

  // /admin → redirect a /keystatic
  if (url.pathname === '/admin' || url.pathname === '/admin/') {
    return ctx.redirect('/keystatic', 302);
  }

  const response = await next();

  // Inietta floating button 📊 in tutte le pagine /keystatic/*
  if (url.pathname.startsWith('/keystatic')) {
    const html = await response.text();
    const scripts = `<script src="/admin-stats-btn.js"></script><script src="/admin-ai-btn.js"></script>`;
    // Keystatic non ha </body> — appendi alla fine
    const patched = html.includes('</body>')
      ? html.replace('</body>', `${scripts}</body>`)
      : html + scripts;
    return new Response(patched, {
      status: response.status,
      headers: response.headers,
    });
  }

  return response;
});
