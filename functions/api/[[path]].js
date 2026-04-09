/**
 * Cloudflare Pages Function — proxy trasparente per /api/*
 *
 * Ogni richiesta a https://marcomunich.com/api/... viene inoltrata
 * a https://api.marcomunich.com/api/... su Netsons.
 * Il frontend non sa nulla del cambio — usa ancora URL relativi /api/...
 *
 * Env var: NETSONS_API_ORIGIN (default: https://api.marcomunich.com)
 */
export async function onRequest(context) {
  const { request, env } = context;
  const origin = env.NETSONS_API_ORIGIN || 'https://api.marcomunich.com';

  const url = new URL(request.url);
  const targetUrl = origin + url.pathname + url.search;

  // Clone la request verso Netsons
  const proxyRequest = new Request(targetUrl, {
    method: request.method,
    headers: request.headers,
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
    redirect: 'follow',
  });

  try {
    const response = await fetch(proxyRequest);
    // Copia la response con gli header CORS già impostati da _config.php
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
