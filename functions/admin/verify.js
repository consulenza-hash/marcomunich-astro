/**
 * Cloudflare Pages Function — POST /admin/verify
 * Verifica la password admin server-side. Il hash non è mai nel sorgente pubblico.
 *
 * Env vars richieste (CF Pages Settings → Environment Variables):
 *   ADMIN_PASSWORD_HASH  = SHA-256 hex della password (es. echo -n "password" | shasum -a 256)
 *   ADMIN_SESSION_TOKEN  = token casuale 64 char hex (generato con: python3 -c "import secrets; print(secrets.token_hex(32))")
 */
export async function onRequestPost(context) {
  const { request, env } = context;

  let password = '';
  try {
    const body = await request.json();
    password = body.password || '';
  } catch {
    return new Response(JSON.stringify({ ok: false }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!password || !env.ADMIN_PASSWORD_HASH || !env.ADMIN_SESSION_TOKEN) {
    return new Response(JSON.stringify({ ok: false }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Hash the submitted password
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(password));
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  if (hashHex !== env.ADMIN_PASSWORD_HASH) {
    return new Response(JSON.stringify({ ok: false }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Correct password — set two cookies:
  // 1. mm_admin_auth: HttpOnly, Secure — real auth token (CF middleware checks this)
  // 2. mm_admin_ui: non-HttpOnly — overlay hide signal for AdminGuard JS
  const token = env.ADMIN_SESSION_TOKEN;
  const cookieBase = `; Path=/admin; Max-Age=2592000; SameSite=Strict; Secure`;

  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': [
        `mm_admin_auth=${token}${cookieBase}; HttpOnly`,
        `mm_admin_ui=1${cookieBase}`,
      ].join(', '),
    },
  });
}
