/**
 * CF Pages Function — proxy pubblico per i Reel video
 * Serves /contenuti-social/video-reels/*.mp4 da Netsons via HTTP interno
 * NO auth — file pubblici per l'API Instagram Graph
 */
export async function onRequest(context) {
  const url = new URL(context.request.url);

  // Sicurezza: solo file .mp4 denominati reel-NN
  if (!/\/reel-\d+\.mp4$/.test(url.pathname)) {
    return new Response('Not Found', { status: 404 });
  }

  const target = 'http://89.40.173.242' + url.pathname;

  try {
    const upstream = await fetch(target, {
      headers: { Host: 'marcomunich.com' },
    });

    if (!upstream.ok) {
      return new Response('Video non trovato', { status: upstream.status });
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        'Content-Type':  'video/mp4',
        'Cache-Control': 'public, max-age=604800',
        'Accept-Ranges': 'bytes',
      },
    });
  } catch (err) {
    return new Response('Proxy error: ' + err.message, { status: 502 });
  }
}
