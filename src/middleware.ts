import { defineMiddleware } from 'astro:middleware';
import { ADMIN_PASSWORD } from 'astro:env/server';

const COOKIE_NAME = 'mm_admin_session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 10; // 10 anni — nessuna scadenza pratica

function isValidSession(cookie: string | undefined): boolean {
  if (!ADMIN_PASSWORD || !cookie) return false;
  return cookie === ADMIN_PASSWORD;
}

export const onRequest = defineMiddleware(async (ctx, next) => {
  const url = ctx.url;

  // Rotte pubbliche: login e API auth non richiedono sessione
  const isLoginPage = url.pathname === '/admin/login';
  const isAuthApi = url.pathname === '/api/admin-auth';

  // Proteggi tutte le rotte /admin/* (tranne login)
  if (url.pathname.startsWith('/admin') && !isLoginPage && !isAuthApi) {
    // In sviluppo locale senza ADMIN_PASSWORD configurata, lascia passare
    if (!ADMIN_PASSWORD) {
      // noop — continua normalmente
    } else {
      const session = ctx.cookies.get(COOKIE_NAME)?.value;
      const valid = isValidSession(session);
      if (!valid) {
        const redirect = encodeURIComponent(url.pathname);
        return new Response(null, {
          status: 302,
          headers: {
            Location: `/admin/login?next=${redirect}`,
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        });
      }
    }

  }

  const response = await next();

  // Inietta floating button 📊 in tutte le pagine /keystatic/*
  if (url.pathname.startsWith('/keystatic')) {
    const html = await response.text();
    const scripts = `<script src="/admin-stats-btn.js"></script><script src="/admin-ai-btn.js"></script>`;
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

export { hashPassword, COOKIE_NAME, COOKIE_MAX_AGE };
