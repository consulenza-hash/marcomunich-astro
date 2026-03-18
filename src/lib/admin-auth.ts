/**
 * admin-auth.ts
 * Helper condiviso per autenticare le richieste admin.
 * Password in env var ADMIN_PASSWORD.
 */

import { createHash } from 'crypto';

const COOKIE_NAME = 'pp_admin';
const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 ore

export function getExpectedAdminToken(): string {
  const pw = process.env.ADMIN_PASSWORD || 'admin';
  return createHash('sha256').update('ppadmin2025:' + pw).digest('hex').slice(0, 40);
}

export function isAdminRequest(request: Request): boolean {
  const cookies = request.headers.get('cookie') || '';
  const m = cookies.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  return !!m && decodeURIComponent(m[1]) === getExpectedAdminToken();
}

export function buildAdminCookie(value: string): string {
  return [
    `${COOKIE_NAME}=${encodeURIComponent(value)}`,
    `Max-Age=${COOKIE_MAX_AGE}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    ...(process.env.NODE_ENV === 'production' ? ['Secure'] : []),
  ].join('; ');
}

export function clearAdminCookie(): string {
  return `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict`;
}
