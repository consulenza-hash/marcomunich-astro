/**
 * ghost-relay — Cloudflare Worker
 *
 * Riceve il webhook POST da Ghost (post.published) e triggera
 * un GitHub Actions repository_dispatch sul repo marcomunich-astro.
 *
 * Env vars (impostare con: wrangler secret put GITHUB_TOKEN):
 *   GITHUB_TOKEN    — GitHub PAT con scope repo + workflow
 *   WEBHOOK_SECRET  — stringa segreta condivisa con Ghost (opzionale)
 */

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    // Verifica secret Ghost opzionale
    if (env.WEBHOOK_SECRET) {
      const sig = request.headers.get('X-Ghost-Signature') ?? '';
      if (!sig.includes(env.WEBHOOK_SECRET)) {
        return new Response('Unauthorized', { status: 401 });
      }
    }

    // Triggera GitHub repository_dispatch → deploy.yml reagisce a ghost_post_published
    const res = await fetch(
      'https://api.github.com/repos/consulenza-hash/marcomunich-astro/dispatches',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'User-Agent': 'ghost-relay-worker/1.0',
        },
        body: JSON.stringify({ event_type: 'ghost_post_published' }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error('GitHub dispatch failed:', res.status, err);
      return new Response('GitHub dispatch failed', { status: 502 });
    }

    return new Response('OK', { status: 200 });
  },
};
