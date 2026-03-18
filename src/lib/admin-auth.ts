/**
 * admin-auth.ts
 * Autenticazione admin per le pagine e API dell'area admin.
 * Usa un cookie `admin_auth` con valore = ADMIN_PASSWORD.
 */

const COOKIE_NAME = 'admin_auth';

/** Ritorna la password admin attesa dall'env */
export function getExpectedAdminToken(): string {
  return (import.meta.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || '') as string;
}

/** Verifica che la request provenga dall'admin (cookie o header Authorization) */
export function isAdminRequest(request: Request): boolean {
  const adminPw = getExpectedAdminToken();
  if (!adminPw) return false;

  // Check Authorization header: Bearer <password>
  const authHeader = request.headers.get('authorization') || '';
  if (authHeader === `Bearer ${adminPw}`) return true;

  // Check cookie
  const cookie = request.headers.get('cookie') || '';
  return cookie.includes(`${COOKIE_NAME}=${adminPw}`);
}

/** Crea l'header Set-Cookie per il login admin */
export function buildAdminCookie(token: string): string {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`;
}

/** Crea l'header Set-Cookie per il logout admin */
export function clearAdminCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
