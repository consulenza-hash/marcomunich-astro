/**
 * Cloudflare Pages Middleware — protegge tutte le rotte /admin/*
 * Env var richiesta: ADMIN_SESSION_TOKEN
 *
 * Se il cookie mm_admin_auth non corrisponde al token, la pagina viene
 * comunque servita ma AdminGuard.astro mostra l'overlay (doppia protezione).
 * Per una protezione hard (HTTP 403 senza HTML), cambia il return in fondo.
 */
export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  if (!url.pathname.startsWith('/admin')) {
    return next();
  }

  // Lascia passare la route verify (è il login endpoint stesso)
  if (url.pathname === '/admin/verify') {
    return next();
  }

  const cookie = request.headers.get('Cookie') || '';
  const authToken = cookie.match(/mm_admin_auth=([^;]+)/)?.[1];

  if (env.ADMIN_SESSION_TOKEN && authToken === env.ADMIN_SESSION_TOKEN) {
    return next();
  }

  // Token mancante o errato — serve la pagina statica (AdminGuard mostrerà l'overlay)
  // Per blocco hard: return new Response('Unauthorized', { status: 401 });
  return next();
}
