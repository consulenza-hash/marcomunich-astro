/**
 * Cloudflare Pages Function — proxy trasparente per /api/*
 *
 * Ogni richiesta a https://marcomunich.com/api/... viene inoltrata
 * direttamente al server Netsons (89.40.173.242) con Host: marcomunich.com.
 * Il cookie stats_auth viene passato trasparentemente.
 */
export async function onRequest(context) {
  const { request } = context;

  const url = new URL(request.url);
  const targetUrl = 'http://89.40.173.242' + url.pathname + url.search;

  // Build headers — forward everything tranne Host (lo sovrascriviamo)
  const headers = new Headers(request.headers);
  headers.set('Host', 'marcomunich.com');

  const proxyRequest = new Request(targetUrl, {
    method: request.method,
    headers,
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
    redirect: 'follow',
  });

  try {
    const response = await fetch(proxyRequest);
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'API proxy error', detail: String(err) }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
