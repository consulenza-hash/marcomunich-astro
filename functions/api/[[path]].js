/**
 * Cloudflare Pages Function — proxy trasparente per /api/*
 *
 * SEC-017 FIX: Verifica mm_admin_auth prima di inoltrare qualsiasi richiesta.
 * Il cookie mm_admin_auth viene confrontato con ADMIN_SESSION_TOKEN (CF env var).
 * Il cookie viene rimosso dagli header inoltrati a Netsons per non esporre il token.
 *
 * Ogni richiesta a https://marcomunich.com/api/... viene inoltrata
 * al server Netsons (89.40.173.242) con Host: marcomunich.com.
 */
export async function onRequest(context) {
  const { request, env } = context;

  // ── Auth gate (SEC-017) ────────────────────────────────────────────────────
  const cookieHeader = request.headers.get('Cookie') || '';
  const cookieParts  = cookieHeader.split(';').map(c => c.trim());
  const authMatch    = cookieParts.find(c => c.startsWith('mm_admin_auth='));
  const token        = authMatch ? authMatch.slice('mm_admin_auth='.length) : '';

  if (!env.ADMIN_SESSION_TOKEN || token !== env.ADMIN_SESSION_TOKEN) {
    return new Response(JSON.stringify({ error: 'Non autorizzato' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ── Build proxy request ────────────────────────────────────────────────────
  const url       = new URL(request.url);
  const targetUrl = 'http://89.40.173.242' + url.pathname + url.search;

  const headers = new Headers(request.headers);
  headers.set('Host', 'marcomunich.com');

  // Strip mm_admin_auth from forwarded cookies — no need to expose CF token to PHP
  const filteredCookies = cookieParts
    .filter(c => !c.startsWith('mm_admin_auth='))
    .join('; ');
  if (filteredCookies) {
    headers.set('Cookie', filteredCookies);
  } else {
    headers.delete('Cookie');
  }

  const proxyRequest = new Request(targetUrl, {
    method: request.method,
    headers,
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
    redirect: 'follow',
  });

  try {
    const response = await fetch(proxyRequest);
    return new Response(response.body, {
      status:     response.status,
      statusText: response.statusText,
      headers:    response.headers,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'API proxy error', detail: String(err) }), {
      status:  502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
