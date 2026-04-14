/**
 * update-ghost-webhook.mjs
 * Aggiorna il target_url del webhook Ghost per il relay CF Worker.
 *
 * Uso:
 *   node scripts/update-ghost-webhook.mjs --url https://ghost-relay.ACCOUNT.workers.dev
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const envPath = path.join(ROOT, '.env.local');
const env = {};
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  });
}

const GHOST_URL           = env.GHOST_URL           ?? 'https://cms.marcomunich.com';
const GHOST_ADMIN_API_KEY = env.GHOST_ADMIN_API_KEY ?? '';
const WEBHOOK_ID          = '69de1e6d6e1eba673878732d';

const urlArg = process.argv.includes('--url')
  ? process.argv[process.argv.indexOf('--url') + 1]
  : null;

if (!urlArg) {
  console.error('❌ Specificare --url https://ghost-relay.ACCOUNT.workers.dev');
  process.exit(1);
}

async function makeJWT() {
  const { createHmac } = await import('crypto');
  const [id, secret] = GHOST_ADMIN_API_KEY.split(':');
  const now = Math.floor(Date.now() / 1000);
  const header  = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT', kid: id })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ iat: now, exp: now + 300, aud: '/admin/' })).toString('base64url');
  const sig     = createHmac('sha256', Buffer.from(secret, 'hex')).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${sig}`;
}

const token = await makeJWT();

const res = await fetch(`${GHOST_URL}/ghost/api/admin/webhooks/${WEBHOOK_ID}/`, {
  method: 'PUT',
  headers: {
    Authorization: `Ghost ${token}`,
    'Content-Type': 'application/json',
    'Accept-Version': 'v5.130',
  },
  body: JSON.stringify({
    webhooks: [{ id: WEBHOOK_ID, target_url: urlArg }],
  }),
});

const json = await res.json();
if (!res.ok) {
  console.error('❌ Errore:', json.errors?.[0]?.message);
  process.exit(1);
}

console.log(`✅ Webhook aggiornato → ${json.webhooks[0].target_url}`);
