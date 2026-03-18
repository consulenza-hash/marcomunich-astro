/**
 * prompt-pack-auth.ts
 * Token storage: GitHub Gist privato (GITHUB_TOKEN + PP_GIST_ID nel .env)
 * Semplice, zero dipendenze extra, perfetto per volumi <10k vendite.
 */

export interface AccessTokenData {
  email: string;
  name: string;
  createdAt: string;
  stripeSessionId: string;
  stripeReceiptUrl: string | null;
}

const COOKIE_NAME = 'pp_access';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 anno

// ── Gist KV ──────────────────────────────────────────────────────────────────

async function gistFetch(method: 'GET' | 'PATCH', body?: object): Promise<Record<string, any>> {
  const GITHUB_TOKEN = import.meta.env.GITHUB_TOKEN;
  const GIST_ID = import.meta.env.PP_GIST_ID;
  if (!GITHUB_TOKEN || !GIST_ID) throw new Error('GITHUB_TOKEN o PP_GIST_ID non configurati');

  const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    method,
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) throw new Error(`GitHub Gist API error: ${res.status}`);
  return res.json();
}

async function readTokenStore(): Promise<Record<string, any>> {
  const gist = await gistFetch('GET');
  const raw = gist.files?.['tokens.json']?.content || '{}';
  try { return JSON.parse(raw); } catch { return {}; }
}

async function writeTokenStore(data: Record<string, any>): Promise<void> {
  await gistFetch('PATCH', {
    files: { 'tokens.json': { content: JSON.stringify(data, null, 2) } },
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Salva un token di accesso nel Gist store */
export async function createAccessToken(token: string, data: AccessTokenData): Promise<void> {
  const store = await readTokenStore();
  store[`token:${token}`] = data;
  store[`email:${data.email.toLowerCase()}`] = token;
  store[`session:${data.stripeSessionId}`] = token; // idempotency key
  await writeTokenStore(store);
}

/** Controlla se una sessione Stripe è già stata processata (anti-replay webhook) */
export async function hasProcessedSession(stripeSessionId: string): Promise<boolean> {
  try {
    const store = await readTokenStore();
    return !!store[`session:${stripeSessionId}`];
  } catch {
    return false;
  }
}

/** Valida un token e ritorna i dati utente, o null se invalido */
export async function validateToken(token: string): Promise<AccessTokenData | null> {
  if (!token || token.length < 10) return null;
  try {
    const store = await readTokenStore();
    const data = store[`token:${token}`];
    return data ?? null;
  } catch {
    return null;
  }
}

// ── Cookie helpers ────────────────────────────────────────────────────────────

/** Legge il token dal cookie della request */
export function getTokenFromCookie(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/** Legge il token dal query param ?token= */
export function getTokenFromUrl(url: URL): string | null {
  return url.searchParams.get('token') || null;
}

/** Costruisce il Set-Cookie header per impostare il cookie di accesso */
export function buildAccessCookie(token: string): string {
  return [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    `Max-Age=${COOKIE_MAX_AGE}`,
    'Path=/prompt-pack',
    'HttpOnly',
    'SameSite=Lax',
    ...(import.meta.env.PROD ? ['Secure'] : []),
  ].join('; ');
}

/** Costruisce il Set-Cookie header per cancellare il cookie */
export function clearAccessCookie(): string {
  return `${COOKIE_NAME}=; Max-Age=0; Path=/prompt-pack; HttpOnly; SameSite=Lax`;
}

/** Dev bypass: se PROMPT_PACK_DEV_BYPASS=true, non controlla il token */
export function isDevBypass(): boolean {
  return import.meta.env.DEV && import.meta.env.PROMPT_PACK_DEV_BYPASS === 'true';
}
